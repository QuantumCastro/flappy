import { AUDIO_FILES, AUDIO_GAIN } from "./constants";
import type { AudioController, AudioEffect } from "./types";

type ExtendedWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

const audioContextConstructor =
  typeof window !== "undefined"
    ? window.AudioContext ?? (window as ExtendedWindow).webkitAudioContext
    : undefined;

const BROWSER_AUDIO_CTX = audioContextConstructor ?? null;

export class BrowserAudioController implements AudioController {
  private readonly context: AudioContext | null;
  private enabled: boolean;
  private primed = false;
  private readonly buffers = new Map<AudioEffect, AudioBuffer>();
  private readonly bufferPromises = new Map<AudioEffect, Promise<AudioBuffer | null>>();
  private readonly gainNode: GainNode | null;

  constructor(enabled: boolean) {
    if (!BROWSER_AUDIO_CTX) {
      this.context = null;
      this.gainNode = null;
    } else {
      this.context = new BROWSER_AUDIO_CTX({ latencyHint: "interactive" });
      this.gainNode = this.context.createGain();
      this.gainNode.gain.value = AUDIO_GAIN;
      this.gainNode.connect(this.context.destination);
    }

    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  async prime() {
    if (!this.context) return;
    if (this.primed) return;
    try {
      await this.context.resume();
      this.primed = true;
    } catch {
      // ignore resume errors until next gesture
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!this.context) return;
    if (!enabled) {
      void this.context.suspend();
    } else if (enabled && this.primed) {
      void this.context.resume();
    }
  }

  async play(effect: AudioEffect) {
    if (!this.enabled) return;
    if (!this.context || !this.primed) return;

    const buffer = await this.getBuffer(effect);
    if (!buffer) return;

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    if (this.gainNode) {
      source.connect(this.gainNode);
    } else {
      source.connect(this.context.destination);
    }
    source.start();
  }

  private async getBuffer(effect: AudioEffect) {
    if (this.buffers.has(effect)) {
      return this.buffers.get(effect) ?? null;
    }

    let promise = this.bufferPromises.get(effect);
    if (!promise) {
      promise = this.loadBuffer(effect);
      this.bufferPromises.set(effect, promise);
    }

    const buffer = await promise;
    if (buffer) {
      this.buffers.set(effect, buffer);
    }

    return buffer;
  }

  private async loadBuffer(effect: AudioEffect): Promise<AudioBuffer | null> {
    if (!this.context) return null;
    try {
      const response = await fetch(AUDIO_FILES[effect]);
      if (!response.ok) {
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      return await this.context.decodeAudioData(arrayBuffer.slice(0));
    } catch {
      return null;
    }
  }
}

export class NoopAudioController implements AudioController {
  constructor(private enabled: boolean) {}

  isEnabled() {
    return this.enabled;
  }

  async prime() {
    // no-op
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  async play() {
    // no-op
  }
}

export function createAudioController(enabled: boolean): AudioController {
  if (!BROWSER_AUDIO_CTX) {
    return new NoopAudioController(enabled);
  }

  return new BrowserAudioController(enabled);
}
