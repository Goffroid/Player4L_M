const tg = window.Telegram.WebApp;
const audio = new Audio();
const trackList = document.getElementById('track-list');
const progressBar = document.getElementById('progress-bar');
const playBtn = document.getElementById('play-btn');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const trackNameEl = document.getElementById('track-name');
const artistNameEl = document.getElementById('artist-name');
const albumArtEl = document.getElementById('album-art');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');

let currentTrack = null;
let isPlaying = false;


function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}


function updateProgress() {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
    currentTimeEl.textContent = formatTime(audio.currentTime);
}


async function loadTracks() {
    try {
        const response = await fetch('/tracks');
        const { tracks } = await response.json();
        
        trackList.innerHTML = '';
        tracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <div class="track-details">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <div class="track-duration">${formatTime(track.duration)}</div>
            `;
            trackItem.addEventListener('click', () => playTrack(track));
            trackList.appendChild(trackItem);
        });
    } catch (error) {
        console.error('Failed to load tracks:', error);
    }
}


function playTrack(track) {
    currentTrack = track;
    audio.src = `/play/${track.path}`;
    audio.play();
    isPlaying = true;
    playBtn.innerHTML = '❚❚';
    
    
    trackNameEl.textContent = track.title;
    artistNameEl.textContent = track.artist;
    albumArtEl.src = track.albumArt || '/static/default-album.png';
    
    
    audio.onloadedmetadata = () => {
        durationEl.textContent = formatTime(audio.duration);
    };
}


audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', () => {
    isPlaying = false;
    playBtn.innerHTML = '▶';
});

progressBar.addEventListener('input', () => {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
});

playBtn.addEventListener('click', () => {
    if (currentTrack) {
        if (isPlaying) {
            audio.pause();
            playBtn.innerHTML = '▶';
        } else {
            audio.play();
            playBtn.innerHTML = '❚❚';
        }
        isPlaying = !isPlaying;
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
tg.setHeaderColor('#191414'); 
loadTracks();