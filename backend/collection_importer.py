# backend/collection_importer.py
import os
import json
import time
import requests
from typing import Dict, List
from PIL import Image
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(__file__)
IMAGES_DIR = os.path.join(BASE_DIR, "images")
COLLECTION_FILE = os.path.join(BASE_DIR, "collection.json")
API_BASE = "https://api.discogs.com"

load_dotenv()
DISCOGS_USER = os.environ["DISCOGS_USER"]
DISCOGS_TOKEN = os.environ["DISCOGS_TOKEN"]

session = requests.Session()
session.headers.update({
    "User-Agent": "DiscogsCollectorBot/1.0",
    "Authorization": f"Discogs token={DISCOGS_TOKEN}",
})

os.makedirs(IMAGES_DIR, exist_ok=True)

def download_image(url: str, filename: str) -> str:
    """Download an image from URL if not already present. Returns filename or empty string."""
    if not url:
        return ""
    ext = os.path.splitext(url)[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        ext = ".jpg"
    fname = f"{filename}{ext}"
    local = os.path.join(IMAGES_DIR, fname)
    if not os.path.exists(local):
        try:
            resp = session.get(url, stream=True, timeout=15)
            resp.raise_for_status()
            with open(local, "wb") as f:
                for chunk in resp.iter_content(1024):
                    f.write(chunk)
        except requests.RequestException:
            return ""
    return fname

def create_thumb(filename: str, size=(256, 256)) -> str:
    """Create a thumbnail for a downloaded image."""
    if not filename:
        return ""
    src = os.path.join(IMAGES_DIR, filename)
    name, ext = os.path.splitext(filename)
    thumb_name = f"thumb_{name}{ext}"
    dst = os.path.join(IMAGES_DIR, thumb_name)
    if not os.path.exists(dst) and os.path.exists(src):
        with Image.open(src) as img:
            img.thumbnail(size)
            img.save(dst)
    return thumb_name

def load_existing() -> Dict[int, dict]:
    if os.path.exists(COLLECTION_FILE):
        with open(COLLECTION_FILE) as f:
            arr = json.load(f)
        return {a["id"]: a for a in arr}
    return {}

def local_exists(path: str) -> bool:
    """Check if a local path (starting with /images/...) exists on disk."""
    if not path or not path.startswith("/images/"):
        return False
    file_name = path.split("/")[-1]
    return os.path.exists(os.path.join(IMAGES_DIR, file_name))

def fetch_release_details(release_id: int) -> Dict:
    try:
        res = session.get(f"{API_BASE}/releases/{release_id}", timeout=15)
        res.raise_for_status()
        return res.json()
    except requests.RequestException:
        return {}

def fetch_collection() -> List[dict]:
    existing = load_existing()
    albums: List[dict] = []
    page, per_page = 1, 100

    while True:
        url = f"{API_BASE}/users/{DISCOGS_USER}/collection/folders/0/releases?page={page}&per_page={per_page}"
        res = session.get(url, timeout=15)
        if res.status_code != 200:
            break
        data = res.json()
        releases = data.get("releases", [])
        if not releases:
            break

        for item in releases:
            basic = item.get("basic_information", {})
            release_id = basic.get("id")
            if not release_id:
                continue

            # Determine if this album needs images refreshed
            if release_id in existing:
                rec = existing[release_id]
                cover_ok = local_exists(rec.get("cover_image"))
                back_ok = local_exists(rec.get("back_image"))
                if cover_ok and back_ok:
                    continue
                else:
                    existing.pop(release_id, None)

            # Fetch detailed info for tracklist and images
            detailed = fetch_release_details(release_id)
            images = detailed.get("images", [])
            urls = [img.get("uri") or img.get("uri_https") or img.get("resource_url") for img in images if img.get("uri") or img.get("uri_https") or img.get("resource_url")]

            # Primary cover (no suffix)
            cover_name = ""
            thumb_name = ""
            if urls:
                fname = download_image(urls[0], str(release_id))
                thumb = create_thumb(fname)
                cover_name = f"/images/{fname}" if fname else ""
                thumb_name = f"/images/{thumb}" if thumb else ""

            # Back cover (suffix "_back") if available
            back_name = ""
            back_thumb_name = ""
            if len(urls) > 1:
                fname2 = download_image(urls[1], f"{release_id}_back")
                thumb2 = create_thumb(fname2)
                back_name = f"/images/{fname2}" if fname2 else ""
                back_thumb_name = f"/images/{thumb2}" if thumb2 else ""

            album = {
                "id": release_id,
                "title": basic.get("title"),
                "artist": ", ".join(a["name"] for a in basic.get("artists", [])),
                "year": basic.get("year"),
                "label": basic.get("labels", [{}])[0].get("name", ""),
                "format": ", ".join(f["name"] for f in basic.get("formats", [])),
                "genre": basic.get("genres", [""])[0],
                "cover_image": cover_name,
                "thumb": thumb_name,
                "back_image": back_name,
                "back_thumb": back_thumb_name,
                "tracklist": [t["title"] for t in detailed.get("tracklist", [])],
                "date_added": item.get("date_added"),
            }
            albums.append(album)
            time.sleep(1)  # respect API rate limits

        if len(releases) < per_page:
            break
        page += 1

    return sorted(list(existing.values()) + albums, key=lambda x: x.get("date_added", ""), reverse=True)

def save_collection(albums: List[dict]) -> None:
    with open(COLLECTION_FILE, "w") as f:
        json.dump(albums, f, indent=2)

if __name__ == "__main__":
    records = fetch_collection()
    save_collection(records)
    print(f"Saved {len(records)} albums")
