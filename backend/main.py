# backend/main.py
import os
import json
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

# Requires the helper functions defined in backend/image_cache.py
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


# -------- On-demand cover/back endpoints (self-healing cache) -------- #

@app.route("/cover/<int:release_id>")
def cover_release(release_id: int):
    cover_url, _ = ensure_release_images(release_id)
    # Convert /images/xyz.ext -> serve file from IMAGES_DIR
    filename = cover_url.split("/images/", 1)[-1]
    return send_from_directory(IMAGES_DIR, filename)


@app.route("/back/<int:release_id>")
def back_release(release_id: int):
    _, back_url = ensure_release_images(release_id)
    if not back_url:
        # If no back image exists, serve the cover
        return cover_release(release_id)
    filename = back_url.split("/images/", 1)[-1]
    return send_from_directory(IMAGES_DIR, filename)


# -------------------------- API: collection -------------------------- #

@app.route("/api/collection", methods=["GET"])
def get_collection():
    """
    Returns the collection with normalized absolute image paths.
    If an album has an ID, prefer /cover/:id and /back/:id so the first
    request can auto-fetch and cache images if they are missing locally.
    """
    try:
        raw = load_collection()

        # Extract album list while preserving original shape
        if isinstance(raw, list):
            albums = raw
            shape = "list"
        elif isinstance(raw, dict):
            albums = []
            shape = "dict"
            key_used = None
            for key in ("records", "collection", "items"):
                if isinstance(raw.get(key), list):
                    albums = raw[key]
                    key_used = key
                    break
        else:
            albums, shape = [], "list"

        # Normalize each album's image fields
        for a in albums:
            normalize_album_paths(a)
            if not a.get("cover_image"):
                a["cover_image"] = FALLBACK_IMAGE

        # Return with original shape
        if shape == "list":
            return jsonify(albums)
        else:
            out = dict(raw)
            if key_used:
                out[key_used] = albums
            return jsonify(out)

    except Exception:
        return jsonify({"error": "Failed to read collection"}), 500


if __name__ == "__main__":
    # For local dev; in prod run via gunicorn/systemd/etc.
    app.run(host="0.0.0.0", port=5000, debug=False)
