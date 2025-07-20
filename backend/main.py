from flask import Flask, send_from_directory, jsonify, request, abort, make_response
import os
import json

app = Flask(__name__, static_folder="static", static_url_path="/static")

@app.route("/")
def serve_index():
    index_path = os.path.join(app.static_folder, "index.html")
    if os.path.exists(index_path):
        return send_from_directory(app.static_folder, "index.html")
    return make_response("index.html not found", 500)

@app.route("/favicon.ico")
def favicon():
    try:
        return send_from_directory(app.static_folder, "favicon.ico")
    except:
        abort(404)

@app.route("/api/collection")
def get_collection():
    try:
        with open("collection.json") as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/bin/<int:album_id>", methods=["POST"])
def update_bin(album_id):
    if not request.is_json:
        return jsonify({"error": "Invalid request"}), 400
    data = request.get_json()
    bin_store = "bin_store.json"
    if os.path.exists(bin_store):
        with open(bin_store) as f:
            bins = json.load(f)
    else:
        bins = {}
    bins[str(album_id)] = data.get("bin", "")
    with open(bin_store, "w") as f:
        json.dump(bins, f)
    return jsonify({"success": True})

@app.route("/api/bin", methods=["GET"])
def get_bins():
    try:
        with open("bin_store.json") as f:
            bins = json.load(f)
        return jsonify(bins)
    except:
        return jsonify({})

@app.route("/static/images/<path:filename>")
def serve_album_image(filename):
    image_dir = os.path.join(app.static_folder, "images")
    return send_from_directory(image_dir, filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
