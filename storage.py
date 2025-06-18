from mutagen.id3 import ID3

def _get_metadata(self, file_path):
    try:
        audio = MP3(file_path, ID3=ID3)
        # Извлечение обложки
        album_art = None
        if 'APIC:' in audio.tags:
            with open(f"static/covers/{os.path.basename(file_path)}.jpg", 'wb') as f:
                f.write(audio.tags['APIC:'].data)
            album_art = f"/static/covers/{os.path.basename(file_path)}.jpg"
        
        return {
            "title": audio.tags.get("TIT2", [os.path.basename(file_path)])[0],
            "artist": audio.tags.get("TPE1", ["Unknown"])[0],
            "duration": audio.info.length,
            "path": os.path.basename(file_path),
            "albumArt": album_art
        }
    except Exception as e:
        print(f"Error reading metadata: {e}")
        return {
            "title": os.path.basename(file_path),
            "artist": "Unknown",
            "duration": 0,
            "path": os.path.basename(file_path),
            "albumArt": None
        }