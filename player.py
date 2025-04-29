import pygame

class MusicPlayer:
    def __init__(self):
        pygame.mixer.init()
        self.current_track = None
        self.paused = False

    def play(self, file_path):
        if not pygame.mixer.music.get_busy():
            pygame.mixer.music.load(file_path)
            pygame.mixer.music.play()
            self.current_track = file_path
        elif self.paused:
            pygame.mixer.music.unpause()
            self.paused = False

    def pause(self):
        if pygame.mixer.music.get_busy() and not self.paused:
            pygame.mixer.music.pause()
            self.paused = True

    def stop(self):
        pygame.mixer.music.stop()
        self.current_track = None