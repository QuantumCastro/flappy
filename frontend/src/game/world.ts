import {
  GROUND_HEIGHT,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  PIPE_DESPAWN_BUFFER,
  PIPE_GAP,
  PIPE_GAP_MARGIN,
  PIPE_GAP_VARIANCE,
  PIPE_SPAWN_INTERVAL,
  PIPE_SPAWN_OFFSET,
  PIPE_WIDTH,
  SCROLL_SPEED,
} from "./constants";
import type { GameWorldState, PipePair } from "./types";

const PLAYFIELD_BOTTOM = LOGICAL_HEIGHT - GROUND_HEIGHT;

export type RNG = () => number;

export function createRng(seed = Date.now()): RNG {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createInitialWorldState(): GameWorldState {
  return {
    pipes: [],
    lastSpawnAt: 0,
    timeSinceLastSpawn: PIPE_SPAWN_INTERVAL,
    nextPipeId: 1,
  };
}

const minGapCenter = PIPE_GAP / 2 + PIPE_GAP_MARGIN;
const maxGapCenter = PLAYFIELD_BOTTOM - PIPE_GAP_MARGIN - PIPE_GAP / 2;

export function spawnPipePair(id: number, rng: RNG): PipePair {
  const variance = (rng() * 2 - 1) * PIPE_GAP_VARIANCE;
  const gapCenter = clamp(minGapCenter + (maxGapCenter - minGapCenter) * rng() + variance, minGapCenter, maxGapCenter);

  const pipe: PipePair = {
    id,
    x: LOGICAL_WIDTH + PIPE_SPAWN_OFFSET,
    gapCenterY: gapCenter,
    width: PIPE_WIDTH,
    scored: false,
  };

  return pipe;
}

export interface WorldUpdateResult {
  state: GameWorldState;
  scoredPipeIds: number[];
}

export function updateWorld(
  state: GameWorldState,
  deltaSeconds: number,
  rng: RNG,
  birdX: number,
  spawnEnabled = true,
): WorldUpdateResult {
  const scoredPipeIds: number[] = [];

  const movedPipes: PipePair[] = [];
  for (const pipe of state.pipes) {
    const nextX = pipe.x - SCROLL_SPEED * deltaSeconds;
    const passedThreshold = birdX > nextX + pipe.width / 2;

    if (!pipe.scored && passedThreshold) {
      pipe.scored = true;
      scoredPipeIds.push(pipe.id);
    }

    if (nextX + pipe.width < -PIPE_DESPAWN_BUFFER) {
      continue;
    }

    movedPipes.push({
      ...pipe,
      x: nextX,
    });
  }

  let timeSinceLastSpawn = state.timeSinceLastSpawn + deltaSeconds * 1000;
  let nextPipeId = state.nextPipeId;

  if (spawnEnabled) {
    while (timeSinceLastSpawn >= PIPE_SPAWN_INTERVAL) {
      timeSinceLastSpawn -= PIPE_SPAWN_INTERVAL;
      movedPipes.push(spawnPipePair(nextPipeId, rng));
      nextPipeId += 1;
    }
  }

  return {
    state: {
      ...state,
      pipes: movedPipes,
      timeSinceLastSpawn,
      nextPipeId,
    },
    scoredPipeIds,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
