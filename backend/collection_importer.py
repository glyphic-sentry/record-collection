import os
import json
import time
import requests
from typing import Dict, List
from PIL import Image
from dotenv import load_dotenv

# Directories and files
BASE_DIR = os.path.dirname(__file__)
STATIC_IMAGES_DIR = os.path.join(BASE_DIR, "static", "images")
COLLECTION_FILE = os.path.join(BASE_DIR, "collection.json")
API_BASE = "https://api.discogs.com"

# Load credentials from .env
load_dotenv()
DISCOGS_USER = os.environ["DISCOGS_USER"]
DISCOGS_TOKEN = os.environ["DISCOGS_TOKEN"]

# Ensure the images directory exists
os.makedirs(STATIC_IMAGES_DIR, exist_ok=True)

# Reuse HTTP connections
session = requests.Session()
session.headers.update({
    "User-Agent": "DiscogsCollectorBot/1.0",
    "Authorization": f"Discogs token={DISCOGS_TOKEN}",
})

def download_image(url: str, release_id: int) -> str:
    """Download the cover image and return the filename stored in static/images."""
    if not url:
        return ""
    ext = os.path.splitext(url)[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        ext = ".jpg"
    filename = f"{release_id}{ext}"
    local_path = os.path.join(STATIC_IMAGES_DIR, filename)
    # Download only if the image doesn't already exist locally
    if not os.path.exists(local_path):
        resp = session.get(url, stream=True, timeout=10)
        if resp.status_code == 200:
            with open(local_path, "wb") as f:
                for chunk in resp.iter_content(1024):
                    f.write(chunk)
    return filename

def create_thumbnail(filename: str, size=(256, 256)) -> str:
    """Create a thumbnail for the given image and return its filename."""
    original_path = os.path.join(STATIC_IMAGES_DIR, filename)
    thumb_name = f"thumb_{filename}"
    thumb_path = os.path.join(STATIC_IMAGES_DIR, thumb_name)
    # Generate the thumbnail only if it doesn't already exist
    if not os.path.exists(thumb_path) and os.path.exists(original_path):
        with Image.open(original_path) as img:
            img.thumbnail(size)
            img.save(thumb_path)
    return thumb_name

def fetch_release_details(release_id: int) -> Dict:
    """Fetch release details from the Discogs API."""
    resp = session.get(f"{API_BASE}/releases/{release_id}", timeout=10)
    if resp.status_code == 200:
        return resp.json()
    return {}

def load_existing_ids() -> Dict[int, dict]:
    """Load existing albums from collection.json to avoid unnecessary reprocessing."""
    if os.path.exists(COLLECTION_FILE):
        with open(COLLECTION_FILE) as f:
            data = json.load(f)
        return {album["id"]: album for album in data}
    return {}

def fetch_collection() -> List[dict]:
    """
    Fetch the user's collection, download images, and build album entries.
    Existing albums will be skipped only if they already have a local cover image.
    Otherwise, the album will be re-downloaded to save its cover and thumbnail locally.
    """
    existing = load_existing_ids()
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

            if release_id in existing:
                # Determine whether the existing album already has a local cover image
                current_cover = existing[release_id].get("cover_image", "")
                if current_cover and current_cover.startswith("/images/"):
                    # Skip this album because it already has a local cover image
                    continue
                else:
                    # Remove the old record so we can re-download and update it
                    existing.pop(release_id, None)

            # Download cover image and create thumbnail
            filename = download_image(basic.get("cover_image"), release_id)
            if filename:
                thumb_name = create_thumbnail(filename)
                cover_path = f"/images/{filename}"
                thumb_path = f"/images/{thumb_name}"
            else:
                # If no image is available, set paths to empty strings
                cover_path = ""
                thumb_path = ""

            # Fetch additional details like tracklist from Discogs
            detailed = fetch_release_details(release_id)

            # Build the album object with updated fields
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
                "tracklist": [t["title"] for t in detailed.get("tracklist", [])],
                "date_added": entry.get("date_added"),
            }
            albums.append(album)
            # Respect API rate limits by throttling requests
            time.sleep(1)

        if len(releases) < per_page:
            break
        page += 1

    # Merge existing albums that were not re-downloaded with newly fetched ones
    combined = list(existing.values()) + albums
    # Sort by date added (most recent first)
    return sorted(combined, key=lambda x: x.get("date_added", ""), reverse=True)

def save_collection(albums: List[dict]) -> None:
    """Write the combined album list back to collection.json."""
    with open(COLLECTION_FILE, "w") as f:
        json.dump(albums, f, indent=2)

if __name__ == "__main__":
    albums = fetch_collection()
    save_collection(albums)
    print(f"Saved {len(albums)} albums")
