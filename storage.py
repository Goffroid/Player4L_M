import os
import json
from mutagen.mp3 import MP3

class MusicStorage:
    def __init__(self, music_dir):
        self.music_dir = music_dir
        self.metadata_file = os.path.join(music_dir, "metadata.json")
        self.metadata = {}
        self._init_storage()

    def _init_storage(self):
        os.makedirs(self.music_dir, exist_ok=True)
        if os.path.exists(self.metadata_file):
            with open(self.metadata_file, "r") as f:
                self.metadata = json.load(f)

    def _save_metadata(self):
        with open(self.metadata_file, "w") as f:
            json.dump(self.metadata, f, indent=4)

    def add_music(self, file_path):
        metadata = self._get_metadata(file_path)
        self.metadata[file_path] = metadata
        self._save_metadata()

    def _get_metadata(self, file_path):
        try:
            audio = MP3(file_path)
            return {
                "title": audio.get("TIT2", [os.path.basename(file_path)])[0],
                "artist": audio.get("TPE1", ["Unknown"])[0],
                "duration": audio.info.length,
                "path": os.path.basename(file_path)
            }
        except:
            return {
                "title": os.path.basename(file_path),
                "artist": "Unknown",
                "duration": 0,
                "path": os.path.basename(file_path)
            }

    def get_all_tracks(self):
        return list(self.metadata.values())