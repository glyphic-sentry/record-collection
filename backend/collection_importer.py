# backend/collection_importer.py
import os, json, time, requests
from typing import Dict, List
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(__file__)
IMG_DIR = os.path.join(BASE_DIR, "static", "images")
COLLECTION_PATH = os.path.join(BASE_DIR, "collection.json")
API_BASE = "https://api.discogs.com"

load_dotenv()  # read DISCOGS_USER and DISCOGS_TOKEN from .env
DISCOGS_USER = os.environ["DISCOGS_USER"]
DISCOGS_TOKEN = os.environ["DISCOGS_TOKEN"]

os.makedirs(IMG_DIR, exist_ok=True)
session = requests.Session()
session.headers.update({
    "User-Agent": "DiscogsCollectorBot/1.0",
    "Authorization": f"Discogs token={DISCOGS_TOKEN}",
})

def download_image(url: str, release_id: int) -> str:
    if not url:
        return ""
    ext = os.path.splitext(url)[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        ext = ".jpg"
    filename = f"{release_id}{ext}"
    local_path = os.path.join(IMG_DIR, filename)
    if not os.path.exists(local_path):
        try:
            with session.get(url, stream=True, timeout=10) as resp:
                resp.raise_for_status()
                with open(local_path, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=8192):
                        f.write(chunk)
        except requests.RequestException:
            return ""
    return f"/images/{filename}"

def fetch_release_details(release_id: int) -> Dict:
    try:
        resp = session.get(f"{API_BASE}/releases/{release_id}", timeout=10)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException:
        return {}

def load_existing_ids() -> Dict[int, dict]:
    if os.path.exists(COLLECTION_PATH):
        with open(COLLECTION_PATH) as f:
            data = json.load(f)
        return {album["id"]: album for album in data}
    return {}

def fetch_collection() -> List[dict]:
    existing = load_existing_ids()
    albums = []
    page = 1
    per_page = 100
    while True:
        url = f"{API_BASE}/users/{DISCOGS_USER}/collection/folders/0/releases?page={page}&per_page={per_page}"
        try:
            resp = session.get(url, timeout=10)
            resp.raise_for_status()
        except requests.RequestException:
            break
        data = resp.json()
        releases = data.get("releases", [])
        if not releases:
            break
        for entry in releases:
            basic = entry.get("basic_information", {})
            rid = basic.get("id")
            if rid in existing:
                continue
            detailed = fetch_release_details(rid)
            album = {
                "id": rid,
                "title": basic.get("title"),
                "artist": ", ".join(a["name"] for a in basic.get("artists", [])),
                "year": basic.get("year"),
                "label": basic.get("labels", [{}])[0].get("name", ""),
                "format": ", ".join(fmt["name"] for fmt in basic.get("formats", [])),
                "genre": basic.get("genres", [""])[0],
                "cover_image": download_image(basic.get("cover_image"), rid),
                "thumb": basic.get("thumb"),
                "tracklist": [t["title"] for t in detailed.get("tracklist", [])],
                "date_added": entry.get("date_added"),
            }
            albums.append(album)
            time.sleep(1)  # throttle to respect API rate limits
        if len(releases) < per_page:
            break
        page += 1
    combined = list(existing.values()) + albums
    return sorted(combined, key=lambda x: x.get("date_added", ""), reverse=True)

def save_collection(albums: List[dict]) -> None:
    with open(COLLECTION_PATH, "w") as f:
        json.dump(albums, f, indent=2)

if __name__ == "__main__":
    albums = fetch_collection()
    save_collection(albums)
    print(f"Saved {len(albums)} albums")
