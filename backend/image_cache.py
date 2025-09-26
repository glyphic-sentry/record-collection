import os
import io
import hashlib
import requests
from typing import Optional, Tuple, List
from werkzeug.datastructures import FileStorage

# Directories
HERE = os.path.dirname(__file__)
CACHE_DIR = os.path.join(HERE, "images")
os.makedirs(CACHE_DIR, exist_ok=True)

# Public URLs for the app to serve
FALLBACK_IMAGE = "/static/fallback.jpg"   # absolute path is important

# Discogs auth
DISCOGS_TOKEN = os.environ.get("DISCOGS_TOKEN")  # required for on-demand fetch
USER_AGENT = os.environ.get("DISCOGS_UA", "RecordCollectionApp/1.0 +https://example.local")

# ---------- Basic disk helpers ----------

def _abs_path_for(filename: str) -> str:
    return os.path.join(CACHE_DIR, filename)

def _exists(filename: str) -> bool:
    return os.path.exists(_abs_path_for(filename))

def _save_bytes(filename: str, content: bytes) -> None:
    with open(_abs_path_for(filename), "wb") as f:
        f.write(content)

# ---------- Discogs helpers ----------

def _discogs_get(url: str) -> requests.Response:
    headers = {"User-Agent": USER_AGENT}
    if DISCOGS_TOKEN:
        headers["Authorization"] = f"Discogs token={DISCOGS_TOKEN}"
    resp = requests.get(url, headers=headers, timeout=20)
    resp.raise_for_status()
    return resp

def _choose_images_from_release_payload(images: List[dict]) -> Tuple[Optional[str], Optional[str]]:
    """
    Return (front_url, back_url) best-effort from Discogs 'images' array.
    - front: first with type=='primary' or the first image
    - back:  prefer items whose 'resource_url' or 'uri' hints 'back'/'rear'
            else any 'secondary', else None
    """
    if not images:
        return None, None

    front = None
    back = None

    # front
    primaries = [img for img in images if img.get("type") == "primary"]
    if primaries:
        front = primaries[0].get("resource_url") or primaries[0].get("uri")
    else:
        front = (images[0].get("resource_url") or images[0].get("uri"))

    # back
