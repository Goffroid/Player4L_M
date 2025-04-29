from gui import MusicPlayerApp
import tkinter as tk

def main():
    root = tk.Tk()
    app = MusicPlayerApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()