/**
 * Studio-grade procedural sound engine using Web Audio API.
 * 100% self-contained, 0 external network dependencies, offline-ready,
 * fully compliant with browser autoplay restrictions.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.7;

  // Rate limiting & pitch modulation for rapid clicks (Earn The Gold)
  private lastGoldClickTime: number = 0;
  private goldClickScaleIndex: number = 0;
  private readonly goldPentatonic = [1046.5, 1174.66, 1318.51, 1567.98, 1760.0, 2093.0]; // C6 to C7

  // Audio activity indicator for UI visualizers
  private activeListeners: Set<(active: boolean) => void> = new Set();
  private activeSoundCount: number = 0;

  constructor() {
    // Load persisted settings
    if (typeof window !== 'undefined') {
      const storedEnabled = localStorage.getItem('sound_system_enabled');
      if (storedEnabled !== null) {
        this.isEnabled = storedEnabled === 'true';
      }
      const storedVol = localStorage.getItem('sound_system_volume');
      if (storedVol !== null) {
        const parsed = parseFloat(storedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }

      // Prepare audio context on first genuine user interaction
      const initAudio = () => {
        this.ensureContext();
        window.removeEventListener('pointerdown', initAudio);
        window.removeEventListener('keydown', initAudio);
      };
      window.addEventListener('pointerdown', initAudio, { once: true });
      window.addEventListener('keydown', initAudio, { once: true });
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isEnabled ? this.volume : 0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  // --- Public Settings API ---

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sound_system_enabled', String(enabled));
    }
    if (this.masterGain && this.ctx) {
      const targetGain = enabled ? this.volume : 0;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.03);
    }
    this.notifySettingsChanged();
  }

  public toggleSound(): boolean {
    const next = !this.isEnabled;
    this.setEnabled(next);
    if (next) {
      // Play a gentle audible confirmation click
      this.playButtonClick();
    }
    return next;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('sound_system_volume', String(this.volume));
    }
    if (this.masterGain && this.ctx && this.isEnabled) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.03);
    }
    this.notifySettingsChanged();
  }

  public subscribeActivity(callback: (active: boolean) => void): () => void {
    this.activeListeners.add(callback);
    return () => this.activeListeners.delete(callback);
  }

  private triggerActivity(durationMs: number = 100) {
    this.activeSoundCount++;
    this.activeListeners.forEach((cb) => cb(true));
    setTimeout(() => {
      this.activeSoundCount = Math.max(0, this.activeSoundCount - 1);
      if (this.activeSoundCount === 0) {
        this.activeListeners.forEach((cb) => cb(false));
      }
    }, durationMs);
  }

  private settingsListeners: Set<() => void> = new Set();
  public onSettingsChange(listener: () => void): () => void {
    this.settingsListeners.add(listener);
    return () => this.settingsListeners.delete(listener);
  }
  private notifySettingsChanged() {
    this.settingsListeners.forEach((cb) => cb());
  }

  // --- Core Synthesis Utilities ---

  private createVoice(type: OscillatorType = 'sine', freq: number = 440) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return null;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    osc.connect(gain);
    gain.connect(this.masterGain);

    return { ctx, osc, gain };
  }

  // ==========================================
  // 1. GENERAL UI SOUNDS
  // ==========================================

  /**
   * Crisp, tactile micro-click for buttons.
   * Damped triangle with snappy exponential decay.
   */
  public playButtonClick() {
    const v = this.createVoice('triangle', 880);
    if (!v) return;
    const { ctx, osc, gain } = v;
    const now = ctx.currentTime;

    // Pitch envelope: micro drop from 980 to 440
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.035);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

    osc.start(now);
    osc.stop(now + 0.04);
    this.triggerActivity(40);
  }

  /**
   * Ultra-subtle hover blip. Quiet, non-fatiguing high-pass blip.
   */
  public playHover() {
    const v = this.createVoice('sine', 587.33); // D5
    if (!v) return;
    const { ctx, osc, gain } = v;
    const now = ctx.currentTime;

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.start(now);
    osc.stop(now + 0.028);
  }

  /**
   * Warm ascending two-tone whoosh for opening panels.
   */
  public playPanelOpen() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.12);

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(440, now); // A4
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
    osc2.frequency.setValueAtTime(554.37, now); // C#5
    osc2.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.16);
    osc2.stop(now + 0.16);
    this.triggerActivity(160);
  }

  /**
   * Warm descending two-tone for closing panels.
   */
  public playPanelClose() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.13);
    this.triggerActivity(130);
  }

  /**
   * Clean, cheerful major triad chime for successful operations.
   */
  public playSuccess() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;
    const notes = [587.33, 739.99, 880.0]; // D5, F#5, A5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + i * 0.045;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.24);
    });
    this.triggerActivity(300);
  }

  /**
   * Polite, low dual-tone rejection (soft and non-jarring).
   */
  public playError() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    const freqs = [174.61, 130.81]; // F3, C3
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.18);
    });
    this.triggerActivity(180);
  }

  /**
   * Smooth navigation transition between games.
   */
  public playNavSwitch() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.1);
    this.triggerActivity(100);
  }

  /**
   * Celebratory crystal chime sequence on game completion.
   */
  public playGameComplete() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.14, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(start);
      osc.stop(start + 0.5);
    });
    this.triggerActivity(600);
  }

  // ==========================================
  // 2. SPEND YOUR MONEY
  // ==========================================

  /**
   * Subtle cash/coin sound for buying an item.
   * Layered high metallic bell pings + micro click.
   */
  public playBuy() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    // Metallic chime 1 (1480 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1480, now);
    gain1.gain.setValueAtTime(0.13, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Metallic chime 2 (2240 Hz harmonic)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2240, now + 0.015);
    gain2.gain.setValueAtTime(0.08, now + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.015);
    osc2.stop(now + 0.18);

    this.triggerActivity(180);
  }

  /**
   * Slightly different positive transaction sound for selling.
   * Warm ascending coin refund ring.
   */
  public playSell() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.09); // G6

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
    this.triggerActivity(200);
  }

  /**
   * Attempting to buy something unaffordable.
   * Polite, short warning thud.
   */
  public playCantAfford() {
    this.playError();
  }

  /**
   * Spending a very large amount (Skyscrapers, Super Bowl Ads, NBA teams).
   * Rich luxury gong swell + cascading coin shimmer.
   */
  public playBigSpend() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    // Deep luxury anchor (G2)
    const deepOsc = ctx.createOscillator();
    const deepGain = ctx.createGain();
    deepOsc.type = 'sine';
    deepOsc.frequency.setValueAtTime(98.0, now);
    deepGain.gain.setValueAtTime(0.2, now);
    deepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    deepOsc.connect(deepGain);
    deepGain.connect(this.masterGain);
    deepOsc.start(now);
    deepOsc.stop(now + 0.5);

    // Cascading harmonic shimmer
    const shimmerNotes = [1174.66, 1479.98, 1760.0, 2349.32];
    shimmerNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + 0.03 * idx;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.09, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });

    this.triggerActivity(500);
  }

  /**
   * When the user reaches exactly $0!
   * Short, deeply satisfying completion chord sequence with shimmering resolution.
   */
  public playZeroBalance() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    // Rich C Major 9 chord: C4, G4, B4, D5, E5, G5
    const chord = [261.63, 392.0, 493.88, 587.33, 659.25, 783.99];

    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.85);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(start);
      osc.stop(start + 0.9);
    });

    // Final high crystal ping
    const pingOsc = ctx.createOscillator();
    const pingGain = ctx.createGain();
    pingOsc.type = 'triangle';
    pingOsc.frequency.setValueAtTime(2093.0, now + 0.28); // C7
    pingGain.gain.setValueAtTime(0.15, now + 0.28);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    pingOsc.connect(pingGain);
    pingGain.connect(this.masterGain);
    pingOsc.start(now + 0.28);
    pingOsc.stop(now + 0.75);

    this.triggerActivity(900);
  }

  // ==========================================
  // 3. EARN THE GOLD
  // ==========================================

  /**
   * "Every manual click should produce a very short, soft gold/coin sound.
   * Do NOT make the sound irritating when the player clicks rapidly."
   *
   * Mechanism:
   * 1. Pentatonic scale cycling with micro-pitch randomization (+/- 1.5%).
   * 2. Smooth pitch progression when clicking rapidly (<120ms interval),
   *    sounding like a beautiful chime run rather than a machine gun.
   * 3. Soft bandpass filtering and quick 42ms envelope.
   */
  public playGoldClick() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;
    const timeSinceLast = (now - this.lastGoldClickTime) * 1000;

    if (timeSinceLast < 130) {
      // Rapid clicking: advance musical scale
      this.goldClickScaleIndex = (this.goldClickScaleIndex + 1) % this.goldPentatonic.length;
    } else {
      // Reset to lower root tone
      this.goldClickScaleIndex = 0;
    }
    this.lastGoldClickTime = now;

    const baseFreq = this.goldPentatonic[this.goldClickScaleIndex];
    // Gentle micro-detune so consecutive identical notes don't phase or fatigue
    const detune = (Math.random() - 0.5) * 20; // +/- 10 Hz approx
    const targetFreq = baseFreq + detune;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(targetFreq, now);
    filter.Q.setValueAtTime(3.5, now);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(targetFreq * 1.05, now);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.02);

    // Quiet, warm, and compact
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
    this.triggerActivity(50);
  }

  /**
   * Purchasing an upgrade: rewarding "upgrade/unlock" sound.
   * Rising two-stage harmonic chord.
   */
  public playUpgradeBuy() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 1046.5]; // C5, E5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.04;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(start);
      osc.stop(start + 0.3);
    });
    this.triggerActivity(300);
  }

  /**
   * Occasional or milestone-based audio feedback for auto gold production.
   */
  public playGoldMilestone(milestoneType: 'first_upgrade' | 'major_production' | 'gold_milestone' | 'unlock_element') {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    if (milestoneType === 'first_upgrade') {
      this.playSuccess();
    } else if (milestoneType === 'major_production') {
      const notes = [659.25, 783.99, 987.77, 1318.51];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.06;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(start);
        osc.stop(start + 0.38);
      });
      this.triggerActivity(400);
    } else if (milestoneType === 'gold_milestone') {
      // Shimmering treasure chest sparkle
      const notes = [880, 1108.73, 1318.51, 1760];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.05;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.13, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(start);
        osc.stop(start + 0.45);
      });
      this.triggerActivity(450);
    } else {
      // unlock element
      this.playUpgradeBuy();
    }
  }

  /**
   * The reset action: subtle warning sound only after confirmation.
   */
  public playResetWarning() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.28);
    this.triggerActivity(280);
  }

  // ==========================================
  // 4. HOW MUCH EVERYTHING MOVED
  // ==========================================

  /**
   * Moving to next object:
   * Short transition sound, slightly different sound as the scale becomes dramatically larger.
   */
  public playScaleTransition(tier: 'planetary' | 'stellar' | 'galactic' | 'universal') {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    switch (tier) {
      case 'planetary': {
        // Crisp gentle cosmic swoop (high-passed sine)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.18);
        this.triggerActivity(180);
        break;
      }
      case 'stellar': {
        // Deeper resonant spatial sweep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.22);
        this.triggerActivity(220);
        break;
      }
      case 'galactic': {
        // Expansive warm resonant synth sweep
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + 0.18);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.2);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.28);
        this.triggerActivity(280);
        break;
      }
      case 'universal': {
        // Profound sub-bass cosmic swell with crystal overtone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.25);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        // High crystal overtone
        const overtone = ctx.createOscillator();
        const overGain = ctx.createGain();
        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(1760, now + 0.05);
        overGain.gain.setValueAtTime(0.05, now + 0.05);
        overGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        overtone.connect(overGain);
        overGain.connect(this.masterGain);
        overtone.start(now + 0.05);
        overtone.stop(now + 0.32);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.38);
        this.triggerActivity(380);
        break;
      }
    }
  }

  /**
   * Reaching particularly surprising milestones: short satisfying "discovery" sound.
   * Twinkling stellar arpeggio.
   */
  public playDiscovery() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;
    const freqs = [784, 987.77, 1318.51, 1568];

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);

      gain.gain.setValueAtTime(0.11, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(start);
      osc.stop(start + 0.35);
    });
    this.triggerActivity(380);
  }

  // ==========================================
  // 5. STACKING THE BOXES
  // ==========================================

  /**
   * Soft placement sound:
   * Different sound depending on accuracy:
   * - Perfect (<5% offset): pure wooden snap + harmonic chime (pitch climbs with combo streak!)
   * - Good (<30% offset): solid, warm wooden block thud
   * - Scuffed (>30% offset): dull wooden scrape thud
   */
  public playBoxPlacement(accuracyScore: number, comboStreak: number = 0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    if (accuracyScore >= 0.95) {
      // Perfect placement!
      // 1. Crisp wood impact
      const woodOsc = ctx.createOscillator();
      const woodGain = ctx.createGain();
      woodOsc.type = 'triangle';
      woodOsc.frequency.setValueAtTime(380, now);
      woodOsc.frequency.exponentialRampToValueAtTime(160, now + 0.05);
      woodGain.gain.setValueAtTime(0.18, now);
      woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      woodOsc.connect(woodGain);
      woodGain.connect(this.masterGain);
      woodOsc.start(now);
      woodOsc.stop(now + 0.07);

      // 2. Harmonic combo chime (pitch climbs smoothly with combo!)
      // Combo pitch ladder based on C major pentatonic
      const comboNotes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
      const noteFreq = comboNotes[Math.min(comboStreak, comboNotes.length - 1)];

      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(noteFreq, now + 0.015);
      chimeGain.gain.setValueAtTime(0.14, now + 0.015);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.masterGain);
      chimeOsc.start(now + 0.015);
      chimeOsc.stop(now + 0.3);

      this.triggerActivity(300);
    } else if (accuracyScore >= 0.6) {
      // Good alignment: solid warm wooden thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.07);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.09);
      this.triggerActivity(90);
    } else {
      // Scuffed alignment: lower, duller block chunk
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.09);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.11);
      this.triggerActivity(110);
    }
  }

  /**
   * When the stack becomes unstable: subtle tension sound (soft creak / wobble).
   */
  public playStackTension() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Subtle pitch vibrato/wobble for tension
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.linearRampToValueAtTime(145, now + 0.08);
    osc.frequency.linearRampToValueAtTime(125, now + 0.16);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.24);
    this.triggerActivity(240);
  }

  /**
   * When a box falls: downward tumbling whistle + soft impact thud.
   */
  public playBoxFall() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    // Falling slide tone
    const fallOsc = ctx.createOscillator();
    const fallGain = ctx.createGain();
    fallOsc.type = 'triangle';
    fallOsc.frequency.setValueAtTime(420, now);
    fallOsc.frequency.exponentialRampToValueAtTime(90, now + 0.28);
    fallGain.gain.setValueAtTime(0.14, now);
    fallGain.gain.exponentialRampToValueAtTime(0.001, now + 0.29);
    fallOsc.connect(fallGain);
    fallGain.connect(this.masterGain);
    fallOsc.start(now);
    fallOsc.stop(now + 0.3);

    // Ground impact thud at end
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(110, now + 0.28);
    thudOsc.frequency.exponentialRampToValueAtTime(45, now + 0.38);
    thudGain.gain.setValueAtTime(0.2, now + 0.28);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    thudOsc.connect(thudGain);
    thudGain.connect(this.masterGain);
    thudOsc.start(now + 0.28);
    thudOsc.stop(now + 0.45);

    this.triggerActivity(450);
  }

  /**
   * Reaching a height milestone:
   * - Standard milestone (10, 20 boxes): short rewarding achievement sound.
   * - Impressive height (35+ boxes): more noticeable but still tasteful achievement sound.
   */
  public playHeightMilestone(isImpressive: boolean = false) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.isEnabled) return;
    const now = ctx.currentTime;

    if (!isImpressive) {
      // 3-note bright reward
      const notes = [659.25, 783.99, 1046.5]; // E5, G5, C6
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.06;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(start);
        osc.stop(start + 0.32);
      });
      this.triggerActivity(350);
    } else {
      // Grand celebratory crystal sequence
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.05;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(start);
        osc.stop(start + 0.55);
      });
      this.triggerActivity(600);
    }
  }
}

export const sound = new SoundEngine();
export default sound;
