import { STORAGE_KEYS } from "./constants";
import { applyFlap, clampDelta, createInitialBird, detectBoundaryCollision, detectPipeCollisions, getBirdAABB, integrateBird } from "./physics";
import { createInitialWorldState, createRng, updateWorld, type RNG } from "./world";
import type {
  AudioController,
  AudioEffect,
  GameOptions,
  GamePhase,
  GameState,
  GameSubscriber,
  InputAction,
} from "./types";

type MutableGameState = GameState;

export class GameEngine {
  private state: MutableGameState;
  private readonly listeners = new Set<GameSubscriber>();
  private rafId: number | null = null;
  private lastTimestamp: number | null = null;
  private readonly rng: RNG;
  private audio: AudioController | null = null;

  constructor(options: GameOptions = {}) {
    const bestScore = readNumber(STORAGE_KEYS.bestScore, 0);
    const audioEnabled = readBoolean(STORAGE_KEYS.audioEnabled, true);

    this.rng = createRng(options.rngSeed ?? Date.now());
    this.state = createBaseState(bestScore, audioEnabled);
  }

  getState(): GameState {
    return this.state;
  }

  subscribe(listener: GameSubscriber) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setAudioController(controller: AudioController) {
    this.audio = controller;
    controller.setEnabled(this.state.audioEnabled);
  }

  start() {
    if (this.rafId == null) {
      this.rafId = window.requestAnimationFrame(this.handleFrame);
    }
  }

  stop() {
    if (this.rafId != null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastTimestamp = null;
  }

  dispatch(action: InputAction) {
    switch (action) {
      case "START":
        this.startGame(false);
        break;
      case "FLAP":
        this.handleFlap();
        break;
      case "PAUSE":
        this.setPhase("PAUSED");
        break;
      case "RESUME":
        this.resumeFromPause();
        break;
      case "TOGGLE_PAUSE":
        if (this.state.phase === "PLAYING") {
          this.setPhase("PAUSED");
        } else if (this.state.phase === "PAUSED") {
          this.resumeFromPause();
        }
        break;
      case "RESTART":
        this.startGame(false);
        break;
      case "TOGGLE_AUDIO":
        this.toggleAudio();
        break;
      case "MUTE":
        this.setAudioEnabled(false);
        break;
      case "UNMUTE":
        this.setAudioEnabled(true);
        break;
      case "VISIBILITY_HIDDEN":
        if (this.state.phase === "PLAYING") {
          this.setPhase("PAUSED", true);
        }
        break;
      case "VISIBILITY_VISIBLE":
        // noop: UI layer decides if resume is desired
        break;
      default:
        break;
    }
  }

  private handleFlap() {
    void this.audio?.prime();

    if (this.state.phase === "MENU") {
      this.startGame(true);
      return;
    }

    if (this.state.phase === "PLAYING") {
      this.state = {
        ...this.state,
        bird: applyFlap(this.state.bird),
      };
      this.emit();
      this.playAudio("flap");
    } else if (this.state.phase === "GAME_OVER") {
      this.startGame(true);
    }
  }

  private startGame(withFlap: boolean) {
    const nextState = createBaseState(this.state.bestScore, this.state.audioEnabled);
    nextState.phase = "PLAYING";
    if (withFlap) {
      nextState.bird = applyFlap(nextState.bird);
    }

    this.state = nextState;
    this.lastTimestamp = null;
    this.emit();
    this.start();
  }

  private resumeFromPause() {
    if (this.state.phase !== "PAUSED") return;
    this.state = {
      ...this.state,
      phase: "PLAYING",
    };
    this.lastTimestamp = null;
    this.emit();
  }

  private setPhase(phase: GamePhase, silent = false) {
    if (this.state.phase === phase) return;
    this.state = {
      ...this.state,
      phase,
    };
    if (!silent) {
      this.emit();
    }
    if (phase === "PAUSED") {
      this.lastTimestamp = null;
    }
  }

  private toggleAudio() {
    this.setAudioEnabled(!this.state.audioEnabled);
  }

  private setAudioEnabled(enabled: boolean) {
    if (this.state.audioEnabled === enabled) return;
    this.state = {
      ...this.state,
      audioEnabled: enabled,
    };
    persistBoolean(STORAGE_KEYS.audioEnabled, enabled);
    this.audio?.setEnabled(enabled);
    this.emit();
  }

  private handleFrame = (timestamp: number) => {
    if (this.lastTimestamp == null) {
      this.lastTimestamp = timestamp;
    }

    let delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    delta = clampDelta(Math.max(delta, 0));

    this.step(delta);
    this.rafId = window.requestAnimationFrame(this.handleFrame);
  };

  private step(delta: number) {
    let nextState: MutableGameState = {
      ...this.state,
      delta,
      elapsedMs: this.state.elapsedMs + delta * 1000,
    };

    const phase = this.state.phase;
    const activePhase = phase === "PLAYING" || phase === "GAME_OVER";

    if (activePhase) {
      const { next: nextBird } = integrateBird(this.state.bird, delta);

      const { state: nextWorld, scoredPipeIds } = updateWorld(
        { ...this.state.world, pipes: this.state.world.pipes.map((pipe) => ({ ...pipe })) },
        delta,
        this.rng,
        nextBird.position.x,
        phase === "PLAYING",
      );

      const birdAABB = getBirdAABB(nextBird);
      const pipeCollision = detectPipeCollisions(birdAABB, nextWorld.pipes);
      const boundaryCollision = detectBoundaryCollision(nextBird);

      let nextPhase = phase;
      let lastCollision = this.state.lastCollision;
      let nextScore = this.state.score;

      if (phase === "PLAYING" && scoredPipeIds.length > 0) {
        nextScore += scoredPipeIds.length;
        this.playAudio("score");
      }

      if (pipeCollision.collided) {
        nextPhase = "GAME_OVER";
        lastCollision = pipeCollision;
      } else if (boundaryCollision.collided) {
        nextPhase = "GAME_OVER";
        lastCollision = boundaryCollision;
      }

      const becameGameOver = phase !== "GAME_OVER" && nextPhase === "GAME_OVER";
      if (becameGameOver) {
        this.playAudio("hit");
        if (nextScore > this.state.bestScore) {
          persistNumber(STORAGE_KEYS.bestScore, nextScore);
        }
      }

      nextState = {
        ...nextState,
        phase: nextPhase,
        score: nextScore,
        bestScore: Math.max(this.state.bestScore, nextScore),
        bird: nextBird,
        world: nextWorld,
        lastCollision: lastCollision,
      };
    }

    this.state = nextState;
    this.emit();
  }

  private emit() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private playAudio(effect: AudioEffect) {
    if (!this.state.audioEnabled) return;
    this.audio?.play(effect);
  }
}

function createBaseState(bestScore: number, audioEnabled: boolean): MutableGameState {
  return {
    phase: "MENU",
    score: 0,
    bestScore,
    elapsedMs: 0,
    bird: createInitialBird(),
    world: createInitialWorldState(),
    delta: 0,
    audioEnabled,
    lastCollision: null,
  };
}

function readNumber(key: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? Number(raw) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function persistNumber(key: string, value: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

function readBoolean(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw === "true";
  } catch {
    return fallback;
  }
}

function persistBoolean(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value ? "true" : "false");
  } catch {
    // ignore
  }
}
