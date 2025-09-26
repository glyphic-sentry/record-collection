# backend/image_cache.py
import os
import requests
from typing import Optional, Tuple, List

# --------------------------- Paths & constants ---------------------------

HERE = os.path.dirname(__file__)
CACHE_DIR = os.path.join(HERE, "images")
os.makedirs(CACHE_DIR, exist_ok=True)

# IMPORTANT: absolute path so it works from any route (/list, /report, etc.)
FALLBACK_IMAGE = "/static/fallback.jpg"

# Discogs API configuration (set in your environment)
DISCOGS_TOKEN = os.environ.get("DISCOGS_TOKEN")
USER_AGENT = os.environ.get("DISCOGS_UA", "RecordCollectionApp/1.0 (+https://example.local)")

# For content-type → extension mapping
_EXT_BY_CTYPE = [
    ("image/webp", "webp"),
    ("image/png", "png"),
    ("image/jpeg", "jpg"),
    ("image/jpg", "jpg"),
]


# ------------------------------ File helpers -----------------------------

def _abs_path_for(filename: str) -> str:
    return os.path.join(CACHE_DIR, filename)

def _exists(filename: str) -> bool:
    return os.path.exists(_abs_path_for(filename))

def _save_bytes(filename: str, content: bytes) -> None:
    with open(_abs_path_for(filename), "wb") as f:
        f.write(content)


# ----------------------------- Discogs helpers ---------------------------

def _discogs_get(url: str) -> requests.Response:
    """
    GET a URL from Discogs with auth headers (if provided) and a UA.
    Raises for HTTP errors.
    """
    headers = {"User-Agent": USER_AGENT}
    if DISCOGS_TOKEN:
        headers["Authorization"] = f"Discogs token={DISCOGS_TOKEN}"
    resp = requests.get(url, headers=headers, timeout=20)
    resp.raise_for_status()
    return resp

def _choose_images_from_release_payload(images: List[dict]) -> Tuple[Optional[str], Optional[str]]:
    """
    Given Discogs 'images' payload, pick best (front, back) URLs.
    - front: prefer type=='primary', else first image
    - back:  prefer items that look like back/rear, else a 'secondary' image
    Returns (front_url, back_url_or_None)
    """
    if not images:
        return None, None

    # front
    primaries = [img for img in images if img.get("type") == "primary"]
    if primaries:
        front = primaries[0].get("resource_url") or primaries[0].get("uri")
    else:
        front = images[0].get("resource_url") or images[0].get("uri")

    # back
    def looks_back(img: dict) -> bool:
        s = (img.get("resource_url") or img.get("uri") or "").lower()
        return ("back" in s) or ("rear" in s)

    back_url = None
    hinted = [img for img in images if looks_back(img)]
    if hinted:
        back_url = hinted[0].get("resource_url") or hinted[0].get("uri")
    else:
        secondaries = [img for img in images if img.get("type") == "secondary"]
        if secondaries:
            back_url = secondaries[0].get("resource_url") or secondaries[0].get("uri")

    return front, back_url

def _infer_ext_from_headers(resp: requests.Response) -> str:
    ctype = (resp.headers.get("Content-Type") or "").lower()
    for marker, ext in _EXT_BY_CTYPE:
        if marker in ctype:
            return ext
    # Fallback default
    return "jpg"

def _download_to_cache(url: Optional[str], filename_base: str) -> Optional[str]:
    """
    Download an image and store it in CACHE_DIR as <filename_base>.<ext>.
    Returns the public '/images/<file>' path on success, else None.
    """
    if not url:
        return None
    resp = _discogs_get(url)
    ext = _infer_ext_from_headers(resp)
    filename = f"{filename_base}.{ext}"
    _save_bytes(filename, resp.content)
    return f"/images/{filename}"


# ------------------------- Public: ensure images -------------------------

def ensure_release_images(release_id: int) -> Tuple[str, Optional[str]]:
    """
    Ensure (cover, back) images for a Discogs release exist locally.
    Returns tuple of public URLs: (cover_url, back_url_or_None).
    - If already cached, returns cached paths immediately.
    - Otherwise fetches from Discogs, caches, and returns the new paths.
    """
    cover_base = f"cover_{release_id}"
    back_base = f"back_{release_id}"

    # Check for existing cached files (any supported extension)
    def _first_existing(base: str) -> Optional[str]:
        for ext in ("jpg", "jpeg", "png", "webp"):
            f = f"{base}.{ext}"
            if _exists(f):
                return f"/images/{f}"
        return None

    cover_url = _first_existing(cover_base)
    back_url = _first_existing(back_base)

    if cover_url and back_url:
        return cover_url, back_url
    if cover_url and not back_url:
        # We still try to find a back image; if none, we'll return cover as fallback in main.py
        pass

    # Fetch release payload to discover image URLs
    try:
        release_api = f"https://api.discogs.com/releases/{release_id}"
        rel = _discogs_get(release_api).json()
        images = rel.get("images", []) or []
    except Exception:
        # Network/API error: return what we have (or fallback)
        return cover_url or FALLBACK_IMAGE, back_url

    front_src, back_src = _choose_images_from_release_payload(images)

    if not cover_url:
        cover_url = _download_to_cache(front_src, cover_base) or FALLBACK_IMAGE
    if not back_url and back_src:
        back_url = _download_to_cache(back_src, back_base)

    return cover_url or FALLBACK_IMAGE, back_url


# -------------------- Public: normalize album payload --------------------

def normalize_album_paths(album: dict) -> dict:
    """
    Normalize an album dict to ensure the UI gets absolute, working image URLs.
    Strategy:
      - If album has an 'id', prefer our self-healing endpoints '/cover/:id' and '/back/:id'
      - Absolutize any relative paths (prefix '/')
      - Rewrite legacy 'thumb' / 'back_thumb' to '/cover/:id' and '/back/:id'
      - Guarantee a 'cover_image' (fallback if necessary)
    """
    rid = album.get("id")

    def _abs(p: Optional[str]) -> Optional[str]:
        if not p:
            return None
        if p.startswith(("http://", "https://", "/")):
            return p
        return "/" + p.lstrip("/")

    if rid:
        # Prefer id-based endpoints that auto-heal on first request
        if album.get("cover_image"):
            album["cover_image"] = _abs(album["cover_image"])
        else:
            album["cover_image"] = f"/cover/{rid}"

        if album.get("back_image"):
            album["back_image"] = _abs(album["back_image"])
        else:
            album["back_image"] = f"/back/{rid}"

        # Legacy fields → rewrite to id-based endpoints
        if album.get("thumb"):
            album["thumb"] = f"/cover/{rid}"
        if album.get("back_thumb"):
            album["back_thumb"] = f"/back/{rid}"
    else:
        # No id: just absolutize anything present
        for f in ("cover_image", "thumb", "back_image", "back_thumb"):
            if album.get(f):
                album[f] = _abs(album[f])

    if not album.get("cover_image"):
        album["cover_image"] = FALLBACK_IMAGE

    return album
