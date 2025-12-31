export const LOGICAL_WIDTH = 320;
export const LOGICAL_HEIGHT = 180;
export const GROUND_HEIGHT = 32;

export const BIRD_WIDTH = 48;
export const BIRD_HEIGHT = 34;
export const BIRD_START_X = LOGICAL_WIDTH * 0.28;
export const BIRD_START_Y = LOGICAL_HEIGHT * 0.5;

export const PIPE_WIDTH = 54;
export const PIPE_GAP = 92;
export const PIPE_GAP_VARIANCE = 18;
export const PIPE_SPAWN_INTERVAL = 1_400; // ms
export const PIPE_SPAWN_OFFSET = 120; // distance before first pipe enters view
export const PIPE_GAP_MARGIN = 20;
export const PIPE_DESPAWN_BUFFER = PIPE_WIDTH * 2;

export const SCROLL_SPEED = 180; // px/s
export const GRAVITY = 790; // px/s^2
export const FLAP_VELOCITY = -260; // px/s
export const MAX_FALL_SPEED = 420; // px/s
export const ROTATION_SMOOTHING = 6; // larger -> smoother tilt
export const MAX_UP_TILT = -0.35; // radians
export const MAX_DOWN_TILT = 0.65; // radians

export const MAX_DELTA = 0.048; // 48 ms
export const MIN_DELTA = 0.016; // 16 ms

export const DPR_LIMIT = 2.5;
export const RENDER_SCALE = 6;

export const STORAGE_KEYS = {
  bestScore: "flappy-best-score",
  audioEnabled: "flappy-audio-enabled",
} as const;

export const AUDIO_FILES = {
  flap: "/audio/flap.wav",
  score: "/audio/score.wav",
  hit: "/audio/hit.wav",
} as const;

export const AUDIO_GAIN = 0.5;
