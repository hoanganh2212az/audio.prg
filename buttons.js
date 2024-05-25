import { startGame } from './script.js';

document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('info-button').addEventListener('click', showInfoPopup);
document.getElementById('close-popup-button').addEventListener('click', closeInfoPopup);

function showInfoPopup() {
    document.getElementById('info-popup').style.display = 'block';
}

function closeInfoPopup() {
    document.getElementById('info-popup').style.display = 'none';
}

let gameStarted = false;

function setGameStarted(value) {
    gameStarted = value;
}

export { gameStarted, setGameStarted };
