import os
import json
import time
import requests
from typing import Dict, List
from PIL import Image
from dotenv import load_dotenv

# Directories and files
BASE_DIR = os.path.dirname(__file__)
IMAGES_DIR = os.path.join(BASE_DIR, "images")  # store images here instead of backend/static/images
COLLECTION_FILE = os.path.join(BASE_DIR, "collection.json")
API_BASE = "https://api.discogs.com"

# Load credentials from .env
load_dotenv()
DISCOGS_USER = os.environ["DISCOGS_USER"]
DISCOGS_TOKEN = os.environ["DISCOGS_TOKEN"]

# Ensure images directory exists
os.makedirs(IMAGES_DIR, exist_ok=True)

# Reuse HTTP connections
session = requests.Session()
session.headers.update({
    "User-Agent": "DiscogsCollectorBot/1.0",
    "Authorization": f"Discogs token={DISCOGS_TOKEN}",
})

def download_image(url: str, basename: str) -> str:
    """Download an image and save it under IMAGES_DIR using basename + ext."""
    if not url:
        return ""
    ext = os.path.splitext(url)[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        ext = ".jpg"
    filename = f"{basename}{ext}"
    local_path = os.path.join(IMAGES_DIR, filename)
    if not os.path.exists(local_path):
        try:
            resp = session.get(url, stream=True, timeout=10)
            resp.raise_for_status()
            with open(local_path, "wb") as f:
                for chunk in resp.iter_content(1024):
                    f.write(chunk)
        except requests.RequestException:
            return ""
    return filename

def create_thumbnail(filename: str, size=(256, 256)) -> str:
    """Create a thumbnail for the image and return its filename."""
    if not filename:
        return ""
    original_path = os.path.join(IMAGES_DIR, filename)
    thumb_name = f"thumb_{filename}"
    thumb_path = os.path.join(IMAGES_DIR, thumb_name)
    if not os.path.exists(thumb_path) and os.path.exists(original_path):
        with Image.open(original_path) as img:
            img.thumbnail(size)
            img.save(thumb_path)
    return thumb_name

def fetch_release_details(release_id: int) -> Dict:
    """Fetch full release details from Discogs."""
    try:
        resp = session.get(f"{API_BASE}/releases/{release_id}", timeout=10)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException:
        return {}

def load_existing() -> Dict[int, dict]:
    """Load existing albums keyed by their ID."""
    if os.path.exists(COLLECTION_FILE):
        with open(COLLECTION_FILE) as f:
            albums = json.load(f)
        return {a["id"]: a for a in albums}
    return {}

def local_file_exists(path: str) -> bool:
    """Check if a local image path exists in IMAGES_DIR."""
    if not path or not path.startswith("/images/"):
        return False
    filename = path.split("/")[-1]
    return os.path.exists(os.path.join(IMAGES_DIR, filename))

def fetch_collection() -> List[dict]:
    """
    Fetch the user's collection from Discogs and ensure images exist locally.
    Downloads the first two images for each release (front and back).
    """
    existing = load_existing()
    albums: List[dict] = []
    page = 1
    per_page = 100

    while True:
        url = (
            f"{API_BASE}/users/{DISCOGS_USER}/collection/folders/0/releases?"
            f"page={page}&per_page={per_page}"
        )
        resp = session.get(url, timeout=10)
        if resp.status_code != 200:
            break

        data = resp.json()
        releases = data.get("releases", [])
        if not releases:
            break

        for entry in releases:
            basic = entry.get("basic_information", {})
            release_id = basic.get("id")
            if not release_id:
                continue

            # If album already exists, check if local images exist
            if release_id in existing:
                rec = existing[release_id]
                cover_ok = local_file_exists(rec.get("cover_image", ""))
                back_ok = local_file_exists(rec.get("back_image", ""))
                # Skip only if both images exist
                if cover_ok and back_ok:
                    continue
                else:
                    # Remove outdated entry to refresh
                    existing.pop(release_id, None)

            # Fetch release details to get images and tracklist
            detailed = fetch_release_details(release_id)
            images = detailed.get("images", [])

            # Extract the first two image URLs (front and back)
            image_urls: List[str] = []
            if images:
                for img in images[:2]:
                    url_part = img.get("uri") or img.get("resource_url")
                    if url_part:
                        image_urls.append(url_part)
            else:
                # Fallback to basic cover image if detailed images missing
                ci = basic.get("cover_image")
                if ci:
                    image_urls.append(ci)

            # Download front image
            cover_path = ""
            thumb_path = ""
            if image_urls:
                fname1 = download_image(image_urls[0], f"{release_id}_1")
                thumb1 = create_thumbnail(fname1)
                cover_path = f"/images/{fname1}" if fname1 else ""
                thumb_path = f"/images/{thumb1}" if thumb1 else ""
            # Download back image if available
            back_path = ""
            back_thumb = ""
            if len(image_urls) > 1:
                fname2 = download_image(image_urls[1], f"{release_id}_2")
                thumb2 = create_thumbnail(fname2)
                back_path = f"/images/{fname2}" if fname2 else ""
                back_thumb = f"/images/{thumb2}" if thumb2 else ""

            # Build album object
            album = {
                "id": release_id,
                "title": basic.get("title"),
                "artist": ", ".join(a["name"] for a in basic.get("artists", [])),
                "year": basic.get("year"),
                "label": basic.get("labels", [{}])[0].get("name", ""),
                "format": ", ".join(f["name"] for f in basic.get("formats", [])),
                "genre": basic.get("genres", [""])[0],
                "cover_image": cover_path,
                "thumb": thumb_path,
                "back_image": back_path,
                "back_thumb": back_thumb,
                "tracklist": [t["title"] for t in detailed.get("tracklist", [])],
                "date_added": entry.get("date_added"),
            }
            albums.append(album)
            # Throttle requests to avoid API rate limits
            time.sleep(1)

        if len(releases) < per_page:
            break
        page += 1

    # Merge existing (unchanged) with new/updated albums
    combined = list(existing.values()) + albums
    # Sort by date added, most recent first
    return sorted(combined, key=lambda x: x.get("date_added", ""), reverse=True)

def save_collection(albums: List[dict]) -> None:
    """Save the updated album collection to disk."""
    with open(COLLECTION_FILE, "w") as f:
        json.dump(albums, f, indent=2)

if __name__ == "__main__":
    albums = fetch_collection()
    save_collection(albums)
    print(f"Saved {len(albums)} albums")
