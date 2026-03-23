class AudioEngine {
    private ctx: AudioContext | null = null;
    private enabled: boolean = true;
    private masterGain: GainNode | null = null;

    constructor() {
        // Initialize lazily to avoid auto-play policy issues in browsers
    }

    public init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5; // default volume 50%
            this.masterGain.connect(this.ctx.destination);
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    public toggleMute() {
        this.enabled = !this.enabled;
        if (this.masterGain) {
            this.masterGain.gain.value = this.enabled ? 0.5 : 0;
        }
        return this.enabled;
    }

    // Play a simple synthesized tick sound for peg hits
    public playTick() {
        if (!this.ctx || !this.enabled || !this.masterGain) return;

        // Simple oscillator
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + Math.random() * 200, this.ctx.currentTime);

        // Very short decay
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    // Play a drop sound
    public playDrop() {
        if (!this.ctx || !this.enabled || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.02);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    // Play a land sound based on win amount
    public playLand(multiplier: number) {
        if (!this.ctx || !this.enabled || !this.masterGain) return;

        const isWin = multiplier >= 1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = isWin ? 'square' : 'sawtooth';

        const baseFreq = isWin ? 600 : 200;
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

        if (multiplier >= 10) {
            // Big win flourishes
            osc.frequency.setValueAtTime(600, this.ctx.currentTime);
            osc.frequency.setValueAtTime(800, this.ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(1200, this.ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.05);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.5);
        } else {
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(isWin ? 0.4 : 0.2, this.ctx.currentTime + 0.05);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.2);
        }

        osc.connect(gain);
        gain.connect(this.masterGain);
    }
}

export const audio = new AudioEngine();
