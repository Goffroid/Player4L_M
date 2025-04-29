from flask import Flask, request, jsonify, send_file
import os
from storage import MusicStorage
from config import MUSIC_DIR

app = Flask(__name__)
storage = MusicStorage(MUSIC_DIR)

@app.route("/")
def index():
    return "Telegram Music Player Backend"

@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400
    
    file_path = os.path.join(MUSIC_DIR, file.filename)
    file.save(file_path)
    storage.add_music(file_path)
    return jsonify({"status": "OK"})

@app.route("/tracks", methods=["GET"])
def get_tracks():
    tracks = storage.get_all_tracks()
    return jsonify({"tracks": tracks})

@app.route("/play/<path:filename>")
def play(filename):
    file_path = os.path.join(MUSIC_DIR, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    return send_file(file_path, mimetype="audio/mp3")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)