const soundEffects = {
    correct: new Audio('https://play.rosebud.ai/assets/Retro PickUp Coin StereoUP 04.wav?QHXu'),
    incorrect: new Audio('https://play.rosebud.ai/assets/Retro Descending Short 20.wav?cZSo'),
    tick: new Audio('https://play.rosebud.ai/assets/Retro PickUp 18.wav?XZ6s'),
    start: new Audio('https://play.rosebud.ai/assets/Retro PowerUP 23.wav?t98v'),
    end: new Audio('https://play.rosebud.ai/assets/Retro Magic Protection 01.wav?u4uN'),
    bigScore: new Audio('https://play.rosebud.ai/assets/Retro PowerUP StereoUP 05.wav?lXYh'),
    streakBonus: new Audio('https://play.rosebud.ai/assets/Retro PowerUP 09.wav?X7W5')
};

// Preload audio and set volumes for a better experience
Object.entries(soundEffects).forEach(([name, audio]) => {
    audio.preload = 'auto';
    audio.volume = name === 'tick' ? 0.3 : 0.5;
});

/**
 * Plays a sound effect by its name.
 * @param {string} name - The name of the sound to play (e.g., 'correct', 'tick').
 */
export function playSound(name) {
    if (soundEffects[name]) {
        // We ensure the sound can be re-triggered quickly by resetting its time
        soundEffects[name].currentTime = 0;
        soundEffects[name].play().catch(error => {
            // Autoplay restrictions might prevent sound from playing without user interaction.
            // This is a common issue in browsers.
            console.warn(`Could not play sound "${name}":`, error);
        });
    }
}