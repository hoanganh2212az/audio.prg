import { startGame } from './script.js';

document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('info-button').addEventListener('click', showInfoPopup);
document.getElementById('close-popup-button').addEventListener('click', closeInfoPopup);
document.getElementById('settings-button').addEventListener('click', showSettingsPopup);
document.getElementById('close-settings-button').addEventListener('click', closeSettingsPopup);
document.getElementById('mute-bg-music').addEventListener('change', toggleMuteBgMusic);
document.getElementById('mute-game-music').addEventListener('change', toggleMuteGameMusic);
document.getElementById('bg-music-volume').addEventListener('input', adjustBgMusicVolume);
document.getElementById('game-music-volume').addEventListener('input', adjustGameMusicVolume);

function showInfoPopup() {
    document.getElementById('info-popup').style.display = 'block';
}

function closeInfoPopup() {
    document.getElementById('info-popup').style.display = 'none';
}

function showSettingsPopup() {
    document.getElementById('settings-popup').style.display = 'block';
}

function closeSettingsPopup() {
    document.getElementById('settings-popup').style.display = 'none';
}

function toggleMuteBgMusic() {
    const bgMusic = document.getElementById('bg-music');
    bgMusic.muted = !bgMusic.muted;
}

function toggleMuteGameMusic() {
    const gameMusic = document.getElementById('game-music');
    gameMusic.muted = !gameMusic.muted;
}

function adjustBgMusicVolume() {
    const bgMusic = document.getElementById('bg-music');
    const volume = document.getElementById('bg-music-volume').value;
    bgMusic.volume = volume;
}

function adjustGameMusicVolume() {
    const gameMusic = document.getElementById('game-music');
    const volume = document.getElementById('game-music-volume').value;
    gameMusic.volume = volume;
}

let gameStarted = false;

function setGameStarted(value) {
    gameStarted = value;
    const bgMusic = document.getElementById('bg-music');
    const gameMusic = document.getElementById('game-music');
    
    if (value) {
        bgMusic.pause();
        gameMusic.play();
    } else {
        bgMusic.play();
        gameMusic.pause();
    }
}

window.addEventListener('load', () => {
    const bgMusic = document.getElementById('bg-music');
    bgMusic.currentTime = 0; // Ensure the music restarts on page reload
    bgMusic.play();
});

export { gameStarted, setGameStarted };
