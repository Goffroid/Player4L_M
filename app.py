from flask import Flask, request, jsonify, send_file, send_from_directory, render_template
import os
from mutagen.mp3 import MP3
from mutagen.id3 import ID3
from werkzeug.utils import secure_filename
from PIL import Image
import io

app = Flask(__name__, static_url_path='/static')

app.config['MUSIC_DIR'] = os.path.join(os.getcwd(), "music")
app.config['COVERS_DIR'] = os.path.join(os.getcwd(), "static", "covers")
app.config['ALLOWED_EXTENSIONS'] = {'mp3', 'wav'}
os.makedirs(app.config['MUSIC_DIR'], exist_ok=True)
os.makedirs(app.config['COVERS_DIR'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def extract_cover(file_path, track_id):
    try:
        audio = ID3(file_path)
        if 'APIC:' in audio:
            cover_data = audio['APIC:'].data
            img = Image.open(io.BytesIO(cover_data))
            
            cover_path = os.path.join(
                app.config['COVERS_DIR'], 
                f"{track_id}.jpg"
            )
            img.convert('RGB').save(cover_path, "JPEG", quality=85)
            return f"/static/covers/{track_id}.jpg"
    except Exception as e:
        print(f"Ошибка извлечения обложки: {e}")
    return None

def get_track_metadata(file_path, track_id):
    try:
        audio = MP3(file_path)
        cover_url = extract_cover(file_path, track_id)
        
        return {
            "id": track_id,
            "title": audio.get("TIT2", [os.path.basename(file_path)])[0],
            "artist": audio.get("TPE1", ["Unknown Artist"])[0],
            "duration": audio.info.length,
            "path": os.path.basename(file_path),
            "albumArt": cover_url or "/static/default-album.jpg"
        }
    except Exception as e:
        print(f"Ошибка чтения метаданных: {e}")
        return {
            "id": track_id,
            "title": os.path.basename(file_path),
            "artist": "Unknown Artist",
            "duration": 0,
            "path": os.path.basename(file_path),
            "albumArt": "/static/default-album.jpg"
        }

def load_all_tracks():
    tracks = []
    for filename in os.listdir(app.config['MUSIC_DIR']):
        if not allowed_file(filename):
            continue
            
        file_path = os.path.join(app.config['MUSIC_DIR'], filename)
        track_id = os.path.splitext(filename)[0]
        tracks.append(get_track_metadata(file_path, track_id))
    
    return sorted(tracks, key=lambda x: x['title'])

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tracks')
def get_tracks():
    try:
        tracks = load_all_tracks()
        return jsonify({"tracks": tracks})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/search')
def search_tracks():
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify({"results": load_all_tracks()})
    
    try:
        tracks = load_all_tracks()
        results = [
            track for track in tracks
            if query in track['title'].lower() or 
               query in track['artist'].lower()
        ]
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/play/<filename>')
def play_track(filename):
    try:
        file_path = os.path.join(app.config['MUSIC_DIR'], secure_filename(filename))
        if not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 404
        
        return send_file(file_path)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_track():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['MUSIC_DIR'], filename)
            file.save(file_path)
            
            track_id = os.path.splitext(filename)[0]
            metadata = get_track_metadata(file_path, track_id)
            
            return jsonify({
                "status": "success",
                "track": metadata
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    return jsonify({"error": "Invalid file type"}), 400

@app.route('/static/covers/<filename>')
def serve_cover(filename):
    try:
        return send_from_directory(app.config['COVERS_DIR'], filename)
    except FileNotFoundError:
        return send_from_directory('static', 'default-album.jpg')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)