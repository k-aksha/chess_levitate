export class AudioManager {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.3; // Lower volume
        this.masterGain.connect(this.context.destination);
    }

    playMoveSound() {
        this.playTone(300, 'sine', 0.1);
        setTimeout(() => this.playTone(200, 'sine', 0.15), 50);
    }

    playCaptureSound() {
        this.playTone(150, 'sawtooth', 0.1);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.2), 50);
    }

    playSelectSound() {
        this.playTone(400, 'triangle', 0.05);
    }

    playTone(freq, type, duration) {
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.context.currentTime);

        gain.gain.setValueAtTime(0.5, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.context.currentTime + duration);
    }
}
