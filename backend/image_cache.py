import os
import hashlib
import requests
from typing import Optional

CACHE_DIR = os.path.join(os.path.dirname(__file__), "static", "images")
os.makedirs(CACHE_DIR, exist_ok=True)

def sanitize_filename(name: str) -> str:
    return "".join(c for c in name if c.isalnum() or c in ("-", "_")).rstrip()

def hash_url(url: str) -> str:
    return hashlib.md5(url.encode("utf-8")).hexdigest()

def download_and_cache_image(url: Optional[str]) -> str:
    if not url or not url.startswith("http"):
        return "/fallback.jpg"

    ext = os.path.splitext(url)[-1].lower()
    ext = ext if ext in [".jpg", ".jpeg", ".png", ".webp"] else ".jpg"

    hashed_name = sanitize_filename(hash_url(url)) + ext
    local_path = os.path.join(CACHE_DIR, hashed_name)
    public_path = f"/static/images/{hashed_name}"

    if not os.path.exists(local_path):
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                with open(local_path, "wb") as f:
                    f.write(response.content)
        except Exception as e:
            print(f"Failed to download image: {url}\n{e}")
            return "/fallback.jpg"

    return public_path

def clear_cache():
    for file in os.listdir(CACHE_DIR):
        file_path = os.path.join(CACHE_DIR, file)
        if os.path.isfile(file_path):
            os.remove(file_path)

def get_image_for_album(album: dict) -> str:
    if album.get("cover_image", "").startswith("/static/images/"):
        return album["cover_image"]

    url = album.get("cover_image") or album.get("thumb")
    cached_url = download_and_cache_image(url)
    album["cover_image"] = cached_url
    return cached_url

def patch_album_images(albums: list[dict]) -> list[dict]:
    for album in albums:
        get_image_for_album(album)
    return albums

if __name__ == "__main__":
    import json
    import sys
    from collection_importer import load_collection, save_collection, fetch_collection, DISCOGS_USER, DISCOGS_TOKEN

    if len(sys.argv) > 1:
        if sys.argv[1] == "patch":
            albums = load_collection()
            patch_album_images(albums)
            save_collection(albums)
            print("All album images patched and cached.")
        elif sys.argv[1] == "clear":
            clear_cache()
            print("Image cache cleared.")
        elif sys.argv[1] == "fetch":
            albums = fetch_collection(DISCOGS_USER, DISCOGS_TOKEN)
            patch_album_images(albums)
            save_collection(albums)
            print(f"Fetched and saved {len(albums)} albums with image caching.")
    else:
        print("Usage: python image_cache.py [patch|clear|fetch]")
