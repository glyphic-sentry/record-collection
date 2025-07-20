import os
import requests
import time
import json
from urllib.parse import urlparse
from PIL import Image
from io import BytesIO

DISCOGS_USER = "glyphic"
DISCOGS_TOKEN = "BBBCoVxGwUDXlufRBSfCJFLCqlbHyUkSZOApLZRh"
API_BASE = "https://api.discogs.com"
IMG_DIR = "images"
COLLECTION_PATH = "collection.json"

os.makedirs(IMG_DIR, exist_ok=True)

def download_image(url, release_id):
    if not url:
        return None
    try:
        ext = os.path.splitext(urlparse(url).path)[-1] or ".jpg"
        base_filename = f"{release_id}.jpeg"
        img_path = os.path.join(IMG_DIR, base_filename)

        if not os.path.exists(img_path):
            print(f"Downloading image for release {release_id}")
            headers = {"User-Agent": "DiscogsCollectorBot/1.0 +https://github.com/glyphic"}
            resp = requests.get(url, stream=True, timeout=10, headers=headers)
            if resp.status_code == 200:
                with open(img_path, "wb") as f:
                    for chunk in resp.iter_content(1024):
                        f.write(chunk)
        return f"/images/{base_filename}"
    except Exception as e:
        print(f"Failed to download image for {release_id}: {e}")
        return None

def fetch_release_details(release_id):
    headers = {
        "Authorization": f"Discogs token={DISCOGS_TOKEN}",
        "User-Agent": "DiscogsCollectorBot/1.0 +https://github.com/glyphic"
    }
    url = f"{API_BASE}/releases/{release_id}"
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        print(f"Error fetching release {release_id}: {e}")
    return {}

def fetch_collection():
    headers = {
        "Authorization": f"Discogs token={DISCOGS_TOKEN}",
        "User-Agent": "DiscogsCollectorBot/1.0 +https://github.com/glyphic"
    }
    page = 1
    per_page = 100
    albums = []

    while True:
        url = f"{API_BASE}/users/{DISCOGS_USER}/collection/folders/0/releases?page={page}&per_page={per_page}"
        print(f"Fetching collection page {page}")
        resp = requests.get(url, headers=headers)
        if resp.status_code != 200:
            print(f"Error fetching collection: {resp.status_code}")
            break

        data = resp.json()
        releases = data.get("releases", [])
        if not releases:
            break

        for entry in releases:
            basic = entry.get("basic_information", {})
            release_id = basic.get("id")
            detailed = fetch_release_details(release_id)
            image_url = basic.get("cover_image")

            album = {
                "id": release_id,
                "title": basic.get("title"),
                "artist": ", ".join(a["name"] for a in basic.get("artists", [])),
                "year": basic.get("year"),
                "label": basic.get("labels", [{}])[0].get("name", ""),
                "format": ", ".join(f["name"] for f in basic.get("formats", [])),
                "genre": basic.get("genres", [""])[0],
                "cover_image": download_image(image_url, release_id),
                "tracklist": [{"title": t["title"]} for t in detailed.get("tracklist", [])],
                "date_added": entry.get("date_added")
            }

            albums.append(album)
            time.sleep(1)

        if len(releases) < per_page:
            break
        page += 1

    return albums

def save_collection(albums):
    with open(COLLECTION_PATH, "w") as f:
        json.dump(albums, f, indent=2)
    print(f"Saved {len(albums)} albums to {COLLECTION_PATH}")

if __name__ == "__main__":
    albums = fetch_collection()
    save_collection(albums)
