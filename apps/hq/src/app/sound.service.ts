import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'hq.audio';
const TICK_THROTTLE_S = 0.05;

interface NoiseBurst {
  duration: number;
  frequency: number;
  filter: BiquadFilterType;
  gain: number;
}

/**
 * Diegetic audio cues synthesized with WebAudio — no audio files, per the
 * spy-theme sound rules. Muted by default; the preference persists across
 * sessions. Inert when WebAudio is unavailable (unit tests) and silent until
 * a user gesture has unlocked the context (autoplay policy).
 */
@Injectable({ providedIn: 'root' })
export class SoundService {
  readonly enabled = signal(readStoredPreference());

  private ctx: AudioContext | undefined;
  private lastTickAt = 0;

  constructor() {
    // A context created outside a user gesture starts suspended; when the
    // preference survives from a previous session, unlock on first pointer.
    if (this.enabled() && supported()) {
      document.addEventListener('pointerdown', () => this.resume(), { once: true });
    }
  }

  toggle(): void {
    this.enabled.update((on) => !on);
    try {
      localStorage.setItem(STORAGE_KEY, this.enabled() ? 'on' : 'off');
    } catch {
      // The preference simply won't persist.
    }
    if (this.enabled()) {
      // Called from the click gesture, which is what unlocks the context.
      this.resume();
    }
  }

  /** Soft teletype tick for typewriter characters, throttled. */
  typeTick(): void {
    const ctx = this.context();
    if (!ctx || ctx.currentTime - this.lastTickAt < TICK_THROTTLE_S) {
      return;
    }
    this.lastTickAt = ctx.currentTime;
    this.noiseBurst(ctx, { duration: 0.015, frequency: 3000, filter: 'highpass', gain: 0.03 });
  }

  /** Rubber-stamp thunk when a debrief lands. */
  stampThunk(): void {
    const ctx = this.context();
    if (!ctx) {
      return;
    }
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    this.noiseBurst(ctx, { duration: 0.01, frequency: 1500, filter: 'bandpass', gain: 0.05 });
  }

  /** Relay click when a gadget is dispatched. */
  relayClick(): void {
    const ctx = this.context();
    if (ctx) {
      this.noiseBurst(ctx, { duration: 0.01, frequency: 1200, filter: 'bandpass', gain: 0.05 });
    }
  }

  private context(): AudioContext | undefined {
    return this.enabled() && this.ctx?.state === 'running' ? this.ctx : undefined;
  }

  private resume(): void {
    if (supported()) {
      this.ctx ??= new AudioContext();
      void this.ctx.resume();
    }
  }

  private noiseBurst(ctx: AudioContext, burst: NoiseBurst): void {
    const frames = Math.ceil(ctx.sampleRate * burst.duration);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = burst.filter;
    filter.frequency.value = burst.frequency;
    const gain = ctx.createGain();
    gain.gain.value = burst.gain;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  }
}

function supported(): boolean {
  return typeof AudioContext === 'function';
}

function readStoredPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}
