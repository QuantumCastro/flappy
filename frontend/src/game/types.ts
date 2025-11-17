export type GamePhase = "MENU" | "PLAYING" | "PAUSED" | "GAME_OVER";

export type InputAction =
  | "START"
  | "FLAP"
  | "PAUSE"
  | "RESUME"
  | "TOGGLE_PAUSE"
  | "RESTART"
  | "TOGGLE_AUDIO"
  | "MUTE"
  | "UNMUTE"
  | "VISIBILITY_HIDDEN"
  | "VISIBILITY_VISIBLE";

export interface Vector2 {
  x: number;
  y: number;
}

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BirdState {
  position: Vector2;
  velocity: Vector2;
  rotation: number;
}

export interface PipePair {
  id: number;
  x: number;
  gapCenterY: number;
  width: number;
  scored: boolean;
}

export interface GameWorldState {
  pipes: PipePair[];
  lastSpawnAt: number;
  timeSinceLastSpawn: number;
  nextPipeId: number;
}

export type AudioEffect = "flap" | "score" | "hit";

export interface AudioController {
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  play(effect: AudioEffect): Promise<void> | void;
  prime(): Promise<void>;
}

export interface GameState {
  phase: GamePhase;
  score: number;
  bestScore: number;
  elapsedMs: number;
  bird: BirdState;
  world: GameWorldState;
  delta: number;
  audioEnabled: boolean;
  lastCollision: CollisionResult | null;
}

export interface GameOptions {
  rngSeed?: number;
}

export type GameSubscriber = (state: GameState) => void;

export interface CollisionResult {
  collided: boolean;
  withPipeId?: number;
  withBounds?: "TOP" | "GROUND";
}
