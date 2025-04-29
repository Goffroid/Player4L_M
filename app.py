from flask import Flask, request, jsonify, send_file, send_from_directory, render_template
import os
from mutagen.mp3 import MP3
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
MUSIC_DIR = "music"
os.makedirs(MUSIC_DIR, exist_ok=True)

tracks_metadata = {}

def update_metadata():
    global tracks_metadata
    tracks_metadata = {}
    for file in os.listdir(MUSIC_DIR):
        if file.endswith(('.mp3', '.wav')):
            path = os.path.join(MUSIC_DIR, file)
            try:
                audio = MP3(path)
                tracks_metadata[file] = {
                    "title": audio.get("TIT2", [file])[0],
                    "artist": audio.get("TPE1", ["Unknown"])[0],
                    "duration": audio.info.length,
                    "path": file
                }
            except:
                tracks_metadata[file] = {
                    "title": file,
                    "artist": "Unknown",
                    "duration": 0,
                    "path": file
                }

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory('static', 'favicon.ico')

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({"error": "No file"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400
    
    file.save(os.path.join(MUSIC_DIR, file.filename))
    update_metadata()
    return jsonify({"status": "OK"})

@app.route('/tracks')
def get_tracks():
    return jsonify({"tracks": list(tracks_metadata.values())})

@app.route('/play/<filename>')
def play(filename):
    return send_file(os.path.join(MUSIC_DIR, filename))

if __name__ == '__main__':
    update_metadata()
    app.run(host='0.0.0.0', port=5000)