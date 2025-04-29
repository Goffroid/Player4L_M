import os
import shutil
from tkinter import filedialog

class MusicStorage:
    def __init__(self, music_dir="music"):
        self.music_dir = music_dir
        if not os.path.exists(music_dir):
            os.makedirs(music_dir)

    def add_music(self):
        file_paths = filedialog.askopenfilenames(
            title="Выберите треки",
            filetypes=[("Audio Files", "*.mp3 *.wav")]
        )
        for src_path in file_paths:
            try:
                dst_path = os.path.join(self.music_dir, os.path.basename(src_path))
                shutil.copy2(src_path, dst_path)
            except Exception as e:
                print(f"Ошибка при копировании {src_path}: {e}")

    def get_tracks(self):
        return [os.path.abspath(os.path.join(self.music_dir, f)) for f in os.listdir(self.music_dir) 
                if f.endswith(('.mp3', '.wav'))]