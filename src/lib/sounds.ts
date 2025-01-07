export const playSound = (type: 'correct' | 'wrong') => {
    const audio = new Audio(`/${type}.wav`);
    audio.play().catch((error) => {
        console.error('Error playing sound:', error);
    });
}; 