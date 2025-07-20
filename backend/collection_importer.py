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
            retries = 3
            for attempt in range(retries):
                try:
                    resp = requests.get(url, stream=True, timeout=10, headers=headers)
                    if resp.status_code == 200:
                        with open(img_path, "wb") as f:
                            for chunk in resp.iter_content(1024):
                                f.write(chunk)
                        break
                except Exception as e:
                    print(f"Retry {attempt + 1} failed for image {release_id}: {e}")
                    time.sleep(1)
        return f"/images/{base_filename}"
    except Exception as e:
        print(f"Failed to download image for {release_id}: {e}")
        return None

def fetch_collection():
    headers = {
        "Authorization": f"Discogs token={DISCOGS_TOKEN}",
        "User-Ag
