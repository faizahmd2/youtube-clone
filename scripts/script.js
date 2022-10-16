const playPauseBtn = document.querySelector('.play-pause-btn');
const theaterBtn = document.querySelector('.theater-player-btn');
const fullScreenBtn = document.querySelector('.full-player-btn');
const miniPlayerBtn = document.querySelector('.mini-player-btn');
const video = document.querySelector('video');
const videoContainer = document.querySelector('.video-container');
const muteBtn = document.querySelector('.mute-btn');
const captionsBtn = document.querySelector('.captions-btn');
const speedBtn = document.querySelector('.speed-btn');
const previewImg = document.querySelector('.preview-image');
const thumbnailImg = document.querySelector('.thumbnail-img');
const volumeSlider = document.querySelector('.volume-slider');
const currentTimeElem = document.querySelector('.current-time');
const totalTimeElem = document.querySelector('.total-time');
const timelineContainer = document.querySelector('.timeline-container');

const fs = require('browserify-fs')
const path = require('path')

document.addEventListener('keydown', (e) =>{
    const tagName = document.activeElement.tagName.toLowerCase();

    if(tagName === 'input') return
    switch (e.key.toLowerCase()) {
        case ' ' :
            if(tagName === 'button') return
        case 'k' :
            togglePlay()
            break
        case 'f':
            toggleFullScreenMode()
        case 't':
            toggleTheaterMode()
        case 'i':
            toggleMiniPlayerMode()
        case 'm':
            toggleMute()
            break
        case 'arrowleft':
        case 'j':
            skip(-5)
            break
        case 'arrowright':
        case 'l':
            skip(5)
            break
        case 'c':
            toggleCaptions()
            break
    }
})

//Timeline
timelineContainer.addEventListener('mousemove', handleTimelineUpdate);
timelineContainer.addEventListener('mousedown', toggleScrubbing);
document.addEventListener('mouseup', e => {
    if(isScrubbing) toggleScrubbing(e);
})

document.addEventListener('mousemove', e => {
    if(isScrubbing) handleTimelineUpdate(e);
})

let isScrubbing = false;
let wasPaused;
function toggleScrubbing(e) {
    const rect = timelineContainer.getBoundingClientRect();
    const percent = Math.min(Math.max(0, e.x - rect.x), rect.width) / rect.width;
    isScrubbing = (e.buttons & 1) === 1;
    videoContainer.classList.toggle('scrubbing', isScrubbing);

    if(isScrubbing) {
        wasPaused = video.paused;
        video.pause();
    } else{
        video.currentTime = percent * video.duration
        if(!wasPaused) video.play()
    }

    handleTimelineUpdate(e)
}

function handleTimelineUpdate(e) {
    const rect = timelineContainer.getBoundingClientRect();
    const percent = Math.min(Math.max(0, e.x - rect.x), rect.width) / rect.width;
    const previewImageNumber = Math.max(1, Math.floor((percent * video.duration) / 10));
    const previewImgSrc = `assets/previewImages/preview${previewImageNumber}.png`;
    previewImg.src = previewImgSrc;
    timelineContainer.style.setProperty("--preview-position", percent);

    if(isScrubbing) {
        e.preventDefault();
        thumbnailImg.src = previewImgSrc;
        timelineContainer.style.setProperty("--progress-position", percent);
    }
}

//Playback speed
speedBtn.addEventListener('click', changePlaybackSpeed);

function changePlaybackSpeed() {
    let newPlaybackRate = video.playbackRate + .25
    if(newPlaybackRate > 2) newPlaybackRate = .25
    video.playbackRate = newPlaybackRate;
    speedBtn.textContent = `${newPlaybackRate}x`
}

//Caption
const captions = video.textTracks[0];
captions.mode = 'hidden';

captionsBtn.addEventListener('click',toggleCaptions);

function toggleCaptions() {
    const isHidden = captions.mode === 'hidden';
    captions.mode = isHidden ? 'showing' : 'hidden';
    videoContainer.classList.toggle('captions',isHidden);
}

//Duration
video.addEventListener('loadeddata',() => {
    totalTimeElem.textContent = formatDuration(video.duration);
})

video.addEventListener('timeupdate', () => {
    currentTimeElem.textContent = formatDuration(video.currentTime);
    const percent = video.currentTime / video.duration;
    timelineContainer.style.setProperty("--progress-position", percent);
})

const leadingZeroFormatter = new Intl.NumberFormat(undefined, {
    minimumIntegerDigits: 2
})

function formatDuration(time) {
    const seconds = Math.floor(time % 60);
    const minutes = Math.floor(time / 60) % 60;
    const hours = Math.floor(time / 3600);

    if(hours === 0) {
        return `${minutes}:${leadingZeroFormatter.format(seconds)}`
    } else {
        return `${hours}:${leadingZeroFormatter.format(minutes)}:${leadingZeroFormatter.format(seconds)}`
    }

}

function skip(duration) {
    video.currentTime += duration;
}

//Volume 
muteBtn.addEventListener('click',toggleMute);
volumeSlider.addEventListener('input', (e) => {
    video.volume = e.target.value;
    video.muted = e.target.value === 0;
})

video.addEventListener('volumechange',() => {
    volumeSlider.volume = video.volume
    let volumeLevel;
    if(video.muted || video.volume === 0) {
        volumeLevel = 'muted'
    } else if(video.volume >= .5) {
        volumeLevel = 'high'
    } else {
        volumeLevel = 'low'
    }

    videoContainer.dataset.volumeLevel = volumeLevel;
})

function toggleMute() {
    video.muted = !video.muted;
}

//View modes
theaterBtn.addEventListener('click',toggleTheaterMode);
fullScreenBtn.addEventListener('click',toggleFullScreenMode);
miniPlayerBtn.addEventListener('click',toggleMiniPlayerMode);

function toggleTheaterMode() {
    videoContainer.classList.toggle('theater')
}

function toggleFullScreenMode() {
    if(document.fullscreenElement == null) {
        videoContainer.requestFullscreen();
    }
    else{
        document.exitFullscreen();
    }
}

function toggleMiniPlayerMode() {
    if(videoContainer.classList.contains('mini-player')) {
        document.exitPictureInPicture()
    }
    else{
        video.requestPictureInPicture();
    }
}

document.addEventListener('fullscreenchange', () => {
    videoContainer.classList.toggle('full-screen',document.fullscreenElement);
})

video.addEventListener('enterpictureinpicture', () => {
    videoContainer.classList.add('mini-player');
})

video.addEventListener('leavepictureinpicture', () => {
    videoContainer.classList.remove('mini-player');
})

// play/pause
playPauseBtn.addEventListener('click', togglePlay);
video.addEventListener('click',togglePlay)

function togglePlay() {
    video.paused ? video.play() : video.pause();
}

video.addEventListener('play',() => {
    videoContainer.classList.remove('paused');
})

video.addEventListener('pause',() => {
    videoContainer.classList.add('paused');
})


//Remove previewImage Directory
removeDirectory()
function removeDirectory() {

    fs.readdir('assets/previewImages', (err, files) => {
        console.log('files',files)
    if (err) throw err;

    // for (const file of files) {
    //     fs.unlink(path.join(directory, file), err => {
    //     if (err) throw err;
    //     });
    // }
    });
}