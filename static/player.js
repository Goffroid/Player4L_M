const tg = window.Telegram.WebApp;
const audio = new Audio();
const elements = {
    trackList: document.getElementById('track-list'),
    progressBar: document.getElementById('progress-bar'),
    playBtn: document.getElementById('play-btn'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    currentTime: document.getElementById('current-time'),
    duration: document.getElementById('duration'),
    trackName: document.getElementById('track-name'),
    artistName: document.getElementById('artist-name'),
    albumArt: document.getElementById('album-art'),
    uploadBtn: document.getElementById('upload-btn'),
    fileInput: document.getElementById('file-input'),
    tracksCount: document.getElementById('tracks-count')
};

const state = {
    tracks: [],
    currentTrackIndex: -1,
    isPlaying: false,
    isShuffled: false,
    isRepeating: false
};

function init() {
    tg.expand();
    tg.setHeaderColor('#191414'); 
    setupEventListeners();
    loadTracks();
}


function setupEventListeners() {
    elements.playBtn.addEventListener('click', togglePlay);
    elements.prevBtn.addEventListener('click', playPreviousTrack);
    elements.nextBtn.addEventListener('click', playNextTrack);
    elements.uploadBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileUpload);


    elements.progressBar.addEventListener('input', seekAudio);
    elements.progressBar.addEventListener('mousedown', () => audio.pause());
    elements.progressBar.addEventListener('mouseup', () => {
        if (state.isPlaying) audio.play();
    });


    audio.addEventListener('timeupdate', updateProgressBar);
    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('play', () => {
        state.isPlaying = true;
        updatePlayButton();
        elements.albumArt.classList.add('playing');
    });
    audio.addEventListener('pause', () => {
        state.isPlaying = false;
        updatePlayButton();
        elements.albumArt.classList.remove('playing');
    });
}


async function loadTracks() {
    try {
        const response = await fetch('/tracks');
        const data = await response.json();
        state.tracks = data.tracks;
        renderTrackList();
        updateTracksCount();
    } catch (error) {
        console.error('Ошибка загрузки треков:', error);
    }
}


function renderTrackList() {
    elements.trackList.innerHTML = '';
    state.tracks.forEach((track, index) => {
        const trackElement = document.createElement('div');
        trackElement.className = `track-item ${index === state.currentTrackIndex ? 'active' : ''}`;
        trackElement.innerHTML = `
            <div class="track-number">${index + 1}</div>
            <div class="track-details">
                <div class="track-title">${track.title}</div>
                <div class="track-artist">${track.artist}</div>
            </div>
            <div class="track-duration">${formatTime(track.duration)}</div>
        `;
        trackElement.addEventListener('click', () => playTrack(index));
        elements.trackList.appendChild(trackElement);
    });
}


function playTrack(index) {
    if (index < 0 || index >= state.tracks.length) return;

    const track = state.tracks[index];
    state.currentTrackIndex = index;

    
    elements.trackName.textContent = track.title;
    elements.artistName.textContent = track.artist;
    elements.albumArt.src = track.albumArt || '/static/default-album.png';
    elements.duration.textContent = formatTime(track.duration);

    
    audio.src = `/play/${track.path}`;
    audio.play().catch(e => console.error('Ошибка воспроизведения:', e));

    
    renderTrackList();
}

function togglePlay() {
    if (state.currentTrackIndex === -1 && state.tracks.length > 0) {
        playTrack(0);
    } else {
        state.isPlaying ? audio.pause() : audio.play();
    }
}

function playNextTrack() {
    if (state.tracks.length === 0) return;
    
    let nextIndex = state.currentTrackIndex + 1;
    if (nextIndex >= state.tracks.length) nextIndex = 0;
    playTrack(nextIndex);
}

function playPreviousTrack() {
    if (state.tracks.length === 0) return;
    
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }
    
    let prevIndex = state.currentTrackIndex - 1;
    if (prevIndex < 0) prevIndex = state.tracks.length - 1;
    playTrack(prevIndex);
}

function handleTrackEnd() {
    if (state.isRepeating) {
        audio.currentTime = 0;
        audio.play();
    } else {
        playNextTrack();
    }
}

function updateProgressBar() {
    const progress = (audio.currentTime / audio.duration) * 100 || 0;
    elements.progressBar.value = progress;
    elements.currentTime.textContent = formatTime(audio.currentTime);
}

function seekAudio() {
    audio.currentTime = (elements.progressBar.value / 100) * audio.duration;
}

function updatePlayButton() {
    elements.playBtn.innerHTML = state.isPlaying ? '❚❚' : '▶';
}


async function handleFileUpload(event) {
    const file = event.target.files[0];
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
        console.error('Ошибка загрузки:', error);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function updateTracksCount() {
    const count = state.tracks.length;
    elements.tracksCount.textContent = `${count} ${count === 1 ? 'track' : 'tracks'}`;
}

document.addEventListener('DOMContentLoaded', init);