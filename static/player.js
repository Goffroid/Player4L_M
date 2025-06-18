const tg = window.Telegram.WebApp;
const audio = new Audio();
const trackListElement = document.getElementById('track-list');
const progressBar = document.getElementById('progress-bar');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const trackNameEl = document.getElementById('track-name');
const artistNameEl = document.getElementById('artist-name');
const albumArtEl = document.getElementById('album-art');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');

let currentTrackIndex = -1;
let tracks = [];
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
        const data = await response.json();
        tracks = data.tracks;
        
        renderTrackList();
    } catch (error) {
        console.error('Failed to load tracks:', error);
    }
}


function renderTrackList() {
    trackListElement.innerHTML = '';
    tracks.forEach((track, index) => {
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item' + (index === currentTrackIndex ? ' active' : '');
        trackItem.innerHTML = `
            <div class="track-number">${index + 1}</div>
            <div class="track-details">
                <div class="track-title">${track.title}</div>
                <div class="track-artist">${track.artist}</div>
            </div>
            <div class="track-duration">${formatTime(track.duration)}</div>
        `;
        trackItem.addEventListener('click', () => playTrack(index));
        trackListElement.appendChild(trackItem);
    });
}


function playTrack(index) {
    if (index < 0 || index >= tracks.length) return;
    
    currentTrackIndex = index;
    const track = tracks[currentTrackIndex];
    
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
    
    
    renderTrackList();
}

function nextTrack() {
    if (tracks.length === 0) return;
    
    const newIndex = (currentTrackIndex + 1) % tracks.length;
    playTrack(newIndex);
}


function prevTrack() {
    if (tracks.length === 0) return;
    
    let newIndex = currentTrackIndex - 1;
    if (newIndex < 0) newIndex = tracks.length - 1;
    
   
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }
    
    playTrack(newIndex);
}


audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', nextTrack);

progressBar.addEventListener('input', () => {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
});

playBtn.addEventListener('click', () => {
    if (tracks.length === 0) return;
    
    if (currentTrackIndex === -1) {
        playTrack(0);
    } else {
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

prevBtn.addEventListener('click', prevTrack);
nextBtn.addEventListener('click', nextTrack);

uploadBtn.addEventListener('click', () => fileInput.click());

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
        await loadTracks();
    } catch (error) {
        console.error('Upload failed:', error);
    }
});


tg.expand();
tg.setHeaderColor('#191414');
loadTracks();