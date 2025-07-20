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
IMG_DIR = "static/images"
THUMB_DIR = "static/images/thumbs"
COLLECTION_PATH = "collection.json"

os.makedirs(IMG_DIR, exist_ok=True)
os.makedirs(THUMB_DIR, exist_ok=True)

def download_image(url, release_id, is_thumb=False):
    if not url:
        return None
    try:
        ext = os.path.splitext(urlparse(url).path)[-1] or ".jpg"
        base_filename = f"{'thumb_' if is_thumb else ''}{release_id}{ext}"
        img_path = os.path.join(IMG_DIR, base_filename)
        thumb_path = os.path.join(THUMB_DIR, base_filename)

        if not os.path.exists(img_path):
            print(f"Downloading image for release {release_id}")
            headers = {"User-Agent": "DiscogsCollectorBot/1.0 +https://github.com/glyphic"}
            retries = 3
            for attempt in range(retries):
                try:
                    resp = requests.get(url, stream=True, timeout=10, headers=headers)
                    if resp.status_code == 200:
                        img_data = resp.content
                        with open(img_path, "wb") as f:
                            f.write(img_data)
                        # Create thumbnail
                        image = Image.open(BytesIO(img_data))
                        image.thumbnail((150, 150))
                        image.save(thumb_path)
                        break
                    else:
                        print(f"Failed to download {url}: {resp.status_code}")
                        return None
                except requests.RequestException as e:
                    print(f"Attempt {attempt + 1} failed for {url}: {e}")
                    time.sleep(2)
        return f"/static/images/{'thumbs/' if is_thumb else ''}{base_filename}"
    except Exception as e:
        print(f"Error downloading image for {release_id}: {e}")
        return None

def fetch_collection(user, token):
    headers = {"Authorization": f"Discogs token={token}"}
    items = []
    page = 1
    per_page = 100

    while True:
        url = f"{API_BASE}/users/{user}/collection/folders/0/releases?page={page}&per_page={per_page}"
        resp = requests.get(url, headers=headers)

        if resp.status_code == 429:
            print("Rate limited. Sleeping...")
            time.sleep(60)
            continue
        elif resp.status_code != 200:
            print("Error:", resp.status_code, resp.text)
            break

        data = resp.json()
        releases = data.get("releases", [])

        for release in releases:
            r = release.get("basic_information", {})
            album_id = r.get("id")
            album = {
                "id": album_id,
                "title": r.get("title"),
                "artist": ", ".join(a["name"] for a in r.get("artists", [])),
                "year": r.get("year"),
                "label": r.get("labels", [{}])[0].get("name", ""),
                "format": r.get("formats", [{}])[0].get("name", ""),
                "genre": r.get("genres", ["Unknown"])[0],
                "cover_image":download_image(r.get("cover_image"), r.get("id"))
                "cover_image": f"/static/images/{r.get('id')}.jpg",
                "thumb": download_image(r.get("thumb"), album_id, is_thumb=True) or "",
                "tracklist": [],
                "date_added": release.get("date_added"),
            }
            items.append(album)

        if page >= data.get("pagination", {}).get("pages", 0):
            break

        page += 1
        time.sleep(1.2)

    return items

def validate_images(data):
    missing = []
    for album in data:
        cover_path = album.get("cover_image", "").replace("/static/", "static/")
        thumb_path = album.get("thumb", "").replace("/static/", "static/")
        if cover_path and not os.path.exists(cover_path):
            missing.append(cover_path)
        if thumb_path and not os.path.exists(thumb_path):
            missing.append(thumb_path)
    return missing

if __name__ == "__main__":
    releases = fetch_collection(DISCOGS_USER, DISCOGS_TOKEN)
    with open(COLLECTION_PATH, "w") as f:
        json.dump(releases, f, indent=2)
    print(f"Saved {len(releases)} albums.")

    missing_files = validate_images(releases)
    if missing_files:
        print("Missing or broken image files:")
        for path in missing_files:
            print(" -", path)
    else:
        print("All referenced images exist.")
