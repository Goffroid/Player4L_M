const tg = window.Telegram.WebApp;
const audio = document.getElementById('audio');
const trackList = document.getElementById('track-list');
const progressBar = document.getElementById('progress-bar');
const playBtn = document.getElementById('play-btn');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');

let currentTrack = null;

async function loadTracks() {
    try {
        const response = await fetch('/tracks');
        const { tracks } = await response.json();
        
        trackList.innerHTML = '';
        tracks.forEach(track => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${track.title}</strong>
                <br>
                <small>${track.artist} • ${formatTime(track.duration)}</small>
            `;
            li.onclick = () => playTrack(track.path);
            trackList.appendChild(li);
        });
    } catch (error) {
        console.error('Failed to load tracks:', error);
    }
}

function playTrack(filename) {
    currentTrack = filename;
    audio.src = `/play/${filename}`;
    audio.play();
    playBtn.textContent = '⏸ Pause';
    document.getElementById('now-playing').textContent = 
        `Now playing: ${filename.split('.')[0]}`;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

audio.addEventListener('timeupdate', () => {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
});

progressBar.addEventListener('input', () => {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
});

playBtn.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        playBtn.textContent = '⏸ Pause';
    } else {
        audio.pause();
        playBtn.textContent = '▶️ Play';
    }
});

uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        loadTracks();
    } catch (error) {
        console.error('Upload failed:', error);
    }
});

tg.expand();
loadTracks();