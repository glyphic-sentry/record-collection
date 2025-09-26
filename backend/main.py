# backend/main.py
import os
import json
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from image_cache import (
    ensure_release_images,
    normalize_album_paths,
    FALLBACK_IMAGE,
)

HERE = os.path.dirname(__file__)
STATIC_DIR = os.path.join(HERE, "static")
IMAGES_DIR = os.path.join(HERE, "images")

app = Flask(__name__, static_folder="static")
CORS(app)

def load_collection():
    """Load collection.json from backend/."""
    path = os.path.join(HERE, "collection.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.route("/static/<path:filename>")
def serve_static(filename: str):
    return send_from_directory(STATIC_DIR, filename)

@app.route("/images/<path:filename>")
def serve_image(filename: str):
    return send_from_directory(IMAGES_DIR, filename)

# ---------- Self-healing image endpoints ----------

@app.route("/cover/<int:release_id>")
def cover_release(release_id: int):
    cover_url, _ = ensure_release_images(release_id)
    # Map /images/xyz.ext -> serve file from IMAGES_DIR
    filename = cover_url.split("/images/", 1)[-1]
    return send_from_directory(IMAGES_DIR, filename)

@app.route("/back/<int:release_id>")
def back_release(release_id: int):
    _, back_url = ensure_release_images(release_id)
    if not back_url:
        return cover_release(release_id)  # fall back to cover
    filename = back_url.split("/images/", 1)[-1]
    return send_from_directory(IMAGES_DIR, filename)

# ---------- Compatibility routes for legacy absolute thumb paths ----------

@app.route("/thumb_<int:release_id>.<ext>")
def legacy_thumb_release(release_id: int, ext: str):
    # Serve the cover for any legacy /thumb_<id>.<ext> request
    return cover_release(release_id)

@app.route("/back_thumb_<int:release_id>.<ext>")
def legacy_back_thumb_release(release_id: int, ext: str):
    # Serve the back (or cover) for any legacy /back_thumb_<id>.<ext> request
    return back_release(release_id)

# -------------------------- API: collection --------------------------

@app.route("/api/collection", methods=["GET"])
def get_collection():
    """
    Returns the collection with normalized absolute image paths.
    If an album has an ID, prefer /cover/:id and /back/:id so the first
    request can auto-fetch and cache images if they are missing locally.
    Also rewrites any legacy thumb/back_thumb to those endpoints.
    """
    try:
        raw = load_collection()

        # Extract album list while preserving original shape
        if isinstance(raw, list):
            albums = raw
            shape = ("list", None)
        elif isinstance(raw, dict):
            key_used = None
            albums = []
            for key in ("records", "collection", "items"):
                if isinstance(raw.get(key), list):
                    key_used = key
                    albums = raw[key]
                    break
            shape = ("dict", key_used)
        else:
            albums = []
            shape = ("list", None)

        # Normalize each album's image fields
        for a in albums:
            normalize_album_paths(a)
            if not a.get("cover_image"):
                a["cover_image"] = FALLBACK_IMAGE

        # Return with original shape
        kind, key = shape
        if kind == "list":
            return jsonify(albums)
        else:
            out = dict(raw)
            if key:
                out[key] = albums
            return jsonify(out)

    except Exception:
        return jsonify({"error": "Failed to read collection"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
