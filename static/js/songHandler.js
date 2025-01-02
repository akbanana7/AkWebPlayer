console.log("Song handler script loaded.");

let song;
let playing = false;

function requestCoverArt(query) {
    fetch(window.location.origin + "/cover?q=" + query)
        .then(response => {
            if (response.status === 404) {
                console.error("Cover art not found (404).");
                document.getElementById("cover_errormsg").innerText = "Cover art not found.";
            }
            else {
                document.getElementById("cover_errormsg").innerText = "";
                return response.blob();
            }
        })
        .then(data => {
            if (data) {
                console.log("Received cover art successfully.");
                const coverUrl = URL.createObjectURL(data);
                document.getElementById("cover").src = coverUrl;
            }
        })
        .catch(error => {
            console.error("Error fetching cover art:", error);
        });
}

function updateProgressBar() {
    if (song) {
        document.getElementById("progress").max = song.duration;
        song.addEventListener("timeupdate", () => {
            document.getElementById("progress").value = song.currentTime;
        });
    }
    else {
        console.log("Song not found for progress bar update.");
    }
}

function parseSong(blob) {
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    return audio;
}

function playSong(song) {
    song.play();
    updateProgressBar();
    playing = true;
}

function pauseSong(song) {
    song.pause();
    updateProgressBar();
    playing = false;
}

async function songTrigger(blob) {
    if (song) {
        song.pause();
        URL.revokeObjectURL(song.src);
    }
    song = await parseSong(blob);
    document.getElementById("play").addEventListener("click", () => {
        playSong(song);
    });
    document.getElementById("pause").addEventListener("click", () => {
        pauseSong(song);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("toQuery").addEventListener("click", () => {
        let query = document.getElementById("query").value;
        requestCoverArt(query);
        fetch(window.location.origin + "/songs?q=" + query)
            .then(response => response.blob())
            .then(data => {
                console.log("Received audio data:", data);
                songTrigger(data);
            });
    });
});