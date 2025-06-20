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
    tracksCount: document.getElementById('tracks-count'),
    
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn')
};

const state = {
    tracks: [],
    currentTrackIndex: -1,
    isPlaying: false,
    isShuffled: false,
    isRepeating: false,
    originalTrackOrder: []
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
    
    
    elements.searchInput.addEventListener('input', debounceSearch);
    elements.searchBtn.addEventListener('click', performSearch);
    
    
    audio.addEventListener('timeupdate', updateProgressBar);
    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('play', onAudioPlay);
    audio.addEventListener('pause', onAudioPause);
}


async function loadTracks() {
    try {
        const response = await fetch('/tracks');
        const data = await response.json();
        state.tracks = data.tracks;
        state.originalTrackOrder = [...data.tracks];
        renderTrackList();
        updateTracksCount();
    } catch (error) {
        console.error('Ошибка загрузки треков:', error);
        showError('Failed to load tracks');
    }
}


function renderTrackList() {
    elements.trackList.innerHTML = '';
    
    if (state.tracks.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'empty-message';
        emptyMsg.textContent = elements.searchInput.value ? 'No matching tracks' : 'No tracks available';
        elements.trackList.appendChild(emptyMsg);
        return;
    }
    
    state.tracks.forEach((track, index) => {
        const trackElement = document.createElement('div');
        trackElement.className = `track-item ${index === state.currentTrackIndex ? 'active' : ''}`;
        trackElement.innerHTML = `
            <div class="track-number">
                ${index === state.currentTrackIndex && state.isPlaying ? '♫' : index + 1}
            </div>
            <div class="track-details">
                <div class="track-title">${highlightText(track.title, elements.searchInput.value)}</div>
                <div class="track-artist">${highlightText(track.artist, elements.searchInput.value)}</div>
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
    elements.albumArt.src = track.albumArt || '/static/default-album.jpg';
    elements.duration.textContent = formatTime(track.duration);
    
    
    audio.src = `/play/${track.path}`;
    audio.play().catch(e => {
        console.error('Ошибка воспроизведения:', e);
        showError('Playback error');
    });
    
    
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


function debounceSearch() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
        performSearch();
    }, 300);
}

async function performSearch() {
    const query = elements.searchInput.value.trim();
    
    if (query === '') {
        state.tracks = [...state.originalTrackOrder];
        renderTrackList();
        updateTracksCount();
        return;
    }

    try {
        const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        state.tracks = data.results;
        renderTrackList();
        updateTracksCount();
    } catch (error) {
        console.error('Ошибка поиска:', error);
        showError('Search failed');
    }
}


function onAudioPlay() {
    state.isPlaying = true;
    updatePlayButton();
    elements.albumArt.classList.add('playing');
}

function onAudioPause() {
    state.isPlaying = false;
    updatePlayButton();
    elements.albumArt.classList.remove('playing');
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

function updateTracksCount() {
    const count = state.tracks.length;
    elements.tracksCount.textContent = `${count} ${count === 1 ? 'track' : 'tracks'}`;
}

function highlightText(text, query) {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
        showMessage('Track uploaded successfully!');
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showError('Upload failed');
    }
}

function showMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'status-message success';
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}

function showError(text) {
    const msg = document.createElement('div');
    msg.className = 'status-message error';
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}


document.addEventListener('DOMContentLoaded', init);