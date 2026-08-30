export class AmbientAudioEngine {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private isPlaying: boolean = false;
  private filterNode: BiquadFilterNode | null = null;

  public init(): void {
    if (!this.audioContext && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          this.gainNode = this.audioContext.createGain();
          this.gainNode.connect(this.audioContext.destination);
          this.gainNode.gain.value = 0.3;
        }
      } catch (e) {
        console.warn('Web Audio API not allowed or not supported:', e);
      }
    }
  }

  public generateWhiteNoise(): AudioBuffer | null {
    this.init();
    if (!this.audioContext) return null;
    const ctx = this.audioContext;

    try {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      return buffer;
    } catch {
      return null;
    }
  }

  public generateBrownNoise(): AudioBuffer | null {
    this.init();
    if (!this.audioContext) return null;
    const ctx = this.audioContext;

    try {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
      return buffer;
    } catch {
      return null;
    }
  }

  public play(type: 'white' | 'brown' | 'rain'): void {
    try {
      this.stop();
      this.init();

      if (!this.audioContext || !this.gainNode) return;
      const ctx = this.audioContext;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      this.noiseNode = ctx.createBufferSource();
      this.noiseNode.loop = true;

      let buffer: AudioBuffer | null = null;
      if (type === 'white') {
        buffer = this.generateWhiteNoise();
        if (buffer) {
          this.noiseNode.buffer = buffer;
          this.noiseNode.connect(this.gainNode);
        }
      } else if (type === 'brown') {
        buffer = this.generateBrownNoise();
        if (buffer) {
          this.noiseNode.buffer = buffer;
          this.noiseNode.connect(this.gainNode);
        }
      } else if (type === 'rain') {
        buffer = this.generateWhiteNoise();
        if (buffer) {
          this.noiseNode.buffer = buffer;

          this.filterNode = ctx.createBiquadFilter();
          this.filterNode.type = 'lowpass';
          this.filterNode.frequency.value = 1000;

          const hpFilter = ctx.createBiquadFilter();
          hpFilter.type = 'highpass';
          hpFilter.frequency.value = 400;

          this.noiseNode.connect(this.filterNode);
          this.filterNode.connect(hpFilter);
          hpFilter.connect(this.gainNode);
        }
      }

      if (buffer && this.noiseNode) {
        this.noiseNode.start(0);
        this.isPlaying = true;
      }
    } catch (err) {
      console.warn('Failed to play ambient sound:', err);
    }
  }

  public stop(): void {
    try {
      if (this.noiseNode) {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      if (this.filterNode) {
        this.filterNode.disconnect();
        this.filterNode = null;
      }
    } catch {
      // Ignore
    }
    this.isPlaying = false;
  }

  public setVolume(value: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public dispose(): void {
    this.stop();
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {
        // Ignore
      }
      this.audioContext = null;
      this.gainNode = null;
    }
  }
}
