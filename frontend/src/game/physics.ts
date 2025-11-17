import {
  BIRD_HEIGHT,
  BIRD_START_X,
  BIRD_START_Y,
  BIRD_WIDTH,
  FLAP_VELOCITY,
  GRAVITY,
  LOGICAL_HEIGHT,
  MAX_DELTA,
  MAX_FALL_SPEED,
  MAX_DOWN_TILT,
  MAX_UP_TILT,
  ROTATION_SMOOTHING,
  GROUND_HEIGHT,
  PIPE_WIDTH,
  PIPE_GAP,
} from "./constants";
import type { AABB, BirdState, CollisionResult, PipePair } from "./types";

const HALF_BIRD_HEIGHT = BIRD_HEIGHT / 2;
const HALF_BIRD_WIDTH = BIRD_WIDTH / 2;

const PLAYFIELD_TOP = 0;
const PLAYFIELD_BOTTOM = LOGICAL_HEIGHT - GROUND_HEIGHT;

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function clampDelta(delta: number) {
  return clamp(delta, 0, MAX_DELTA);
}

export function createInitialBird(): BirdState {
  return {
    position: { x: BIRD_START_X, y: BIRD_START_Y },
    velocity: { x: 0, y: 0 },
    rotation: 0,
  };
}

export function applyFlap(bird: BirdState): BirdState {
  return {
    ...bird,
    velocity: { ...bird.velocity, y: FLAP_VELOCITY },
  };
}

export function integrateBird(bird: BirdState, delta: number) {
  const nextVelocityY = clamp(bird.velocity.y + GRAVITY * delta, -Infinity, MAX_FALL_SPEED);
  let nextY = bird.position.y + nextVelocityY * delta;

  let hitTop = false;
  let hitGround = false;

  const minY = PLAYFIELD_TOP + HALF_BIRD_HEIGHT;
  if (nextY < minY) {
    nextY = minY;
    hitTop = true;
  }

  const maxY = PLAYFIELD_BOTTOM - HALF_BIRD_HEIGHT;
  if (nextY > maxY) {
    nextY = maxY;
    hitGround = true;
  }

  const targetRotation =
    nextVelocityY < 0
      ? MAX_UP_TILT
      : clamp((nextVelocityY / MAX_FALL_SPEED) * MAX_DOWN_TILT, 0, MAX_DOWN_TILT);

  const nextRotation = bird.rotation + (targetRotation - bird.rotation) / ROTATION_SMOOTHING;

  return {
    next: {
      position: { x: bird.position.x, y: nextY },
      velocity: { x: bird.velocity.x, y: hitGround ? 0 : nextVelocityY },
      rotation: clamp(nextRotation, MAX_UP_TILT, MAX_DOWN_TILT),
    },
    hitTop,
    hitGround,
  };
}

export function getBirdAABB(bird: BirdState): AABB {
  return {
    x: bird.position.x - HALF_BIRD_WIDTH,
    y: bird.position.y - HALF_BIRD_HEIGHT,
    width: BIRD_WIDTH,
    height: BIRD_HEIGHT,
  };
}

function intersects(a: AABB, b: AABB) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function getPipeAABBs(pipe: PipePair): { top: AABB; bottom: AABB } {
  const halfGap = PIPE_GAP / 2;
  const gapTop = pipe.gapCenterY - halfGap;
  const gapBottom = pipe.gapCenterY + halfGap;

  return {
    top: {
      x: pipe.x,
      y: PLAYFIELD_TOP - LOGICAL_HEIGHT,
      width: PIPE_WIDTH,
      height: gapTop + LOGICAL_HEIGHT,
    },
    bottom: {
      x: pipe.x,
      y: gapBottom,
      width: PIPE_WIDTH,
      height: PLAYFIELD_BOTTOM - gapBottom,
    },
  };
}

export function detectPipeCollisions(birdAABB: AABB, pipes: PipePair[]): CollisionResult {
  for (const pipe of pipes) {
    const { top, bottom } = getPipeAABBs(pipe);
    if (intersects(birdAABB, top) || intersects(birdAABB, bottom)) {
      return { collided: true, withPipeId: pipe.id };
    }
  }

  return { collided: false };
}

export function detectBoundaryCollision(bird: BirdState): CollisionResult {
  if (bird.position.y - HALF_BIRD_HEIGHT <= PLAYFIELD_TOP) {
    return { collided: true, withBounds: "TOP" };
  }

  if (bird.position.y + HALF_BIRD_HEIGHT >= PLAYFIELD_BOTTOM) {
    return { collided: true, withBounds: "GROUND" };
  }

  return { collided: false };
}
