import os
import json
from flask import Flask, jsonify, request, send_from_directory, abort
from flask_cors import CORS
from image_cache import patch_album_images

BASE_DIR = os.path.dirname(__file__)
STATIC_DIR = os.path.join(BASE_DIR, "static")
IMAGES_DIR = os.path.join(BASE_DIR, "images")  # now storing images here
COLLECTION_FILE = os.path.join(BASE_DIR, "collection.json")
BIN_FILE = os.path.join(BASE_DIR, "bin_store.json")

app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="/static")
CORS(app)

def load_collection():
    with open(COLLECTION_FILE) as f:
        return json.load(f)

@app.route("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")

@app.route("/favicon.ico")
def favicon():
    try:
        return send_from_directory(STATIC_DIR, "favicon.ico")
    except FileNotFoundError:
        abort(404)


@app.route("/api/bin/<int:album_id>", methods=["POST"])
def update_bin(album_id: int):
    if not request.is_json:
        return jsonify({"error": "Invalid request"}), 400
    bins = {}
    if os.path.exists(BIN_FILE):
        with open(BIN_FILE) as f:
            bins = json.load(f)
    bins[str(album_id)] = request.json.get("bin", "")
    with open(BIN_FILE, "w") as f:
        json.dump(bins, f, indent=2)
    return jsonify({"success": True})

@app.route("/api/bin", methods=["GET"])
def get_bins():
    if not os.path.exists(BIN_FILE):
        return jsonify({})
    with open(BIN_FILE) as f:
        return jsonify(json.load(f))

@app.route("/images/<path:filename>")
def serve_image(filename: str):
    """Serve album art and thumbnails from backend/images."""
    try:
        return send_from_directory(IMAGES_DIR, filename)
    except FileNotFoundError:
        abort(404)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)

@app.route("/api/collection", methods=["GET"])
def get_collection():
    try:
        data = load_collection()
        # Ensure each album has a server-hosted cover_image URL
        patched = patch_album_images(data)  # <-- patch in-place
        return jsonify(patched)
    except Exception:
        return jsonify({"error": "Failed to read collection"}), 500
