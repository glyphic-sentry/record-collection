# backend/image_cache.py
import os
import hashlib
import requests
from typing import Optional

CACHE_DIR = os.path.join(os.path.dirname(__file__), "images")
FALLBACK_IMAGE = "/static/fallback.jpg"
os.makedirs(CACHE_DIR, exist_ok=True)

def _local_exists(images_path: str) -> bool:
    if not images_path or not images_path.startswith("/images/"):
        return False
    return os.path.exists(os.path.join(CACHE_DIR, images_path.split("/")[-1]))

def get_image_for_album(album: dict) -> str:
    current = album.get("cover_image")
    # If pointing at /images/... but file is missing, downgrade to fallback
    if current and current.startswith("/images/"):
        if _local_exists(current):
            return current
        album["cover_image"] = FALLBACK_IMAGE
        return FALLBACK_IMAGE

    # Otherwise try to cache a remote URL (cover_image or thumb)
    url = album.get("cover_image") or album.get("thumb")
    cached = download_and_cache_image(url)
    album["cover_image"] = cached
    return cached
