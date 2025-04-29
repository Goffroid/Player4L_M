import os
import tkinter as tk
from tkinter import ttk
from player import MusicPlayer
from storage import MusicStorage

class MusicPlayerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Music Player")
        self.root.geometry("400x300")
        
        self.player = MusicPlayer()
        self.storage = MusicStorage()
        
        self.create_widgets()
        self.update_track_list()
    
    def create_widgets(self):
        # Track list
        self.track_list = tk.Listbox(self.root)
        self.track_list.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Buttons frame
        button_frame = tk.Frame(self.root)
        button_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Add music button
        add_button = tk.Button(button_frame, text="Add Music", command=self.add_music)
        add_button.pack(side=tk.LEFT, padx=2)
        
        # Play button
        play_button = tk.Button(button_frame, text="Play", command=self.play_selected)
        play_button.pack(side=tk.LEFT, padx=2)
        
        # Pause button
        pause_button = tk.Button(button_frame, text="Pause", command=self.player.pause)
        pause_button.pack(side=tk.LEFT, padx=2)
        
        # Stop button
        stop_button = tk.Button(button_frame, text="Stop", command=self.player.stop)
        stop_button.pack(side=tk.LEFT, padx=2)
    
    def update_track_list(self):
        self.track_list.delete(0, tk.END)
        tracks = self.storage.get_tracks()
        for track in tracks:
            self.track_list.insert(tk.END, os.path.basename(track))
    
    def add_music(self):
        self.storage.add_music()
        self.update_track_list()
    
    def play_selected(self):
        selected_index = self.track_list.curselection()
        if selected_index:
            track_path = self.storage.get_tracks()[selected_index[0]]
            self.player.play(track_path)