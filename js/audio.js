// Small procedural court sounds: no external audio or copyrighted samples.
export class CourtAudio {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.lastEvent = 0;
    this.lastBounce = -1;
  }
  enable(on) {
    this.enabled = on;
    if (on) {
      this.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
      this.ctx.resume().catch(() => {});
    }
  }
  tone(from, to, duration = 0.12, volume = 0.035, type = "sine") {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.connect(g);
    g.connect(c.destination);
    o.frequency.setValueAtTime(from, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(20, to),
      c.currentTime + duration,
    );
    g.gain.setValueAtTime(volume, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    o.start();
    o.stop(c.currentTime + duration);
  }
  noise(duration, volume = 0.025, frequency = 1800) {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx,
      size = Math.floor(c.sampleRate * duration),
      buffer = c.createBuffer(1, size, c.sampleRate),
      data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++)
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / size, 1.5);
    const src = c.createBufferSource(),
      filter = c.createBiquadFilter(),
      gain = c.createGain();
    src.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 0.7;
    gain.gain.value = volume;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    src.start();
  }
  update(match) {
    if (!this.enabled || !match || match.paused || !match.running) return;
    const tick = Math.floor((match.elapsed * 9) / Math.PI);
    if (
      !match.shot &&
      !match.pass &&
      !match.loose &&
      tick !== this.lastBounce
    ) {
      this.lastBounce = tick;
      this.tone(105, 47, 0.1, 0.07);
    }
    if (match.event.id === this.lastEvent) return;
    this.lastEvent = match.event.id;
    const e = match.event;
    if (e.type === "score") {
      this.noise(0.8, 0.13, 900);
      this.noise(0.17, 0.05, 3500);
      this.tone(
        e.side === 0 ? 660 : 260,
        e.side === 0 ? 990 : 180,
        0.22,
        0.035,
      );
      if (e.kind === "dunk") this.tone(130, 35, 0.3, 0.13);
    }
    if (e.type === "rim") this.tone(540, 310, 0.22, 0.035, "triangle");
    if (e.type === "pass") this.noise(0.13, 0.02, 2200);
    if (e.type === "bounce") this.tone(100, 45, 0.1, 0.05);
    if (e.type === "steal" || e.type === "crossover")
      this.noise(0.12, 0.025, 2600);
    if (e.type === "block") {
      this.noise(0.1, 0.08, 600);
      this.tone(200, 80, 0.12, 0.05);
    }
    if (e.type === "release" && e.perfect) this.tone(1000, 1500, 0.14, 0.022);
  }
}
