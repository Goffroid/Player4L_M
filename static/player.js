const tg = window.Telegram.WebApp;
const audio = document.getElementById("audio");
const trackList = document.getElementById("track-list");
const progressBar = document.getElementById("progress-bar");
const uploadBtn = document.getElementById("upload-btn");
const fileInput = document.getElementById("file-input");

async function loadTracks() {
    const response = await fetch("/tracks");
    const data = await response.json();
    
    trackList.innerHTML = "";
    data.tracks.forEach(track => {
        const li = document.createElement("li");
        li.textContent = `${track.title} — ${track.artist}`;
        li.onclick = () => playTrack(track.path);
        trackList.appendChild(li);
    });
}

function playTrack(filename) {
    audio.src = `/play/${filename}`;
    audio.play();
}

audio.addEventListener("timeupdate", () => {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
});

progressBar.addEventListener("input", () => {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
});

uploadBtn.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    await fetch("/upload", {
        method: "POST",
        body: formData
    });
    
    loadTracks();  
});

tg.expand();
loadTracks();