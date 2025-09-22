# backend/image_cache.py
import os, hashlib, requests
from typing import Optional

CACHE_DIR = os.path.join(os.path.dirname(__file__), "static", "images")
FALLBACK_IMAGE = "/fallback.jpg"
os.makedirs(CACHE_DIR, exist_ok=True)

session = requests.Session()

def hash_url(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()

def download_and_cache_image(url: Optional[str]) -> str:
    if not url or not url.startswith(("http://", "https://")):
        return FALLBACK_IMAGE
    ext = os.path.splitext(url)[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        ext = ".jpg"
    filename = f"{hash_url(url)}{ext}"
    local_path = os.path.join(CACHE_DIR, filename)
    if not os.path.exists(local_path):
        try:
            resp = session.get(url, timeout=10)
            resp.raise_for_status()
            with open(local_path, "wb") as f:
                f.write(resp.content)
        except requests.RequestException:
            return FALLBACK_IMAGE
    return f"/images/{filename}"

def get_image_for_album(album: dict) -> str:
    current = album.get("cover_image")
    if current and current.startswith("/images/"):
        return current
    url = album.get("cover_image") or album.get("thumb")
    cached = download_and_cache_image(url)
    album["cover_image"] = cached
    return cached

def patch_album_images(albums: list[dict]) -> list[dict]:
    for album in albums:
        get_image_for_album(album)
    return albums
