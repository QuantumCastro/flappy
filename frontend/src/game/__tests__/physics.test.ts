import { describe, expect, it } from "vitest";

import {
  BIRD_HEIGHT,
  BIRD_START_X,
  BIRD_START_Y,
  FLAP_VELOCITY,
  LOGICAL_HEIGHT,
  GROUND_HEIGHT,
  MAX_FALL_SPEED,
  PIPE_WIDTH,
  PIPE_GAP,
} from "../constants";
import {
  applyFlap,
  createInitialBird,
  detectBoundaryCollision,
  detectPipeCollisions,
  getBirdAABB,
  integrateBird,
} from "../physics";
import type { PipePair } from "../types";

describe("physics", () => {
  it("creates an initial bird with expected defaults", () => {
    const bird = createInitialBird();
    expect(bird.position.x).toBe(BIRD_START_X);
    expect(bird.position.y).toBe(BIRD_START_Y);
    expect(bird.velocity.y).toBe(0);
    expect(bird.rotation).toBe(0);
  });

  it("applies flap velocity immediately", () => {
    const bird = createInitialBird();
    const flapped = applyFlap(bird);
    expect(flapped.velocity.y).toBe(FLAP_VELOCITY);
    expect(flapped.position).toEqual(bird.position);
  });

  it("integrates bird position and clamps to ground", () => {
    const bird = createInitialBird();
    const nearGround = {
      ...bird,
      position: {
        x: bird.position.x,
        y: LOGICAL_HEIGHT - GROUND_HEIGHT - BIRD_HEIGHT / 2,
      },
      velocity: { x: 0, y: MAX_FALL_SPEED },
    };

    const { next, hitGround } = integrateBird(nearGround, 0.2);
    expect(hitGround).toBe(true);
    expect(next.position.y).toBe(LOGICAL_HEIGHT - GROUND_HEIGHT - BIRD_HEIGHT / 2);
    expect(next.velocity.y).toBe(0);
  });

  it("detects collision when bird overlaps pipe AABB", () => {
    const pipe: PipePair = {
      id: 1,
      x: BIRD_START_X + 5,
      gapCenterY: BIRD_START_Y - 10,
      width: PIPE_WIDTH,
      scored: false,
    };

    const bird = {
      position: {
        x: pipe.x + pipe.width / 2,
        y: pipe.gapCenterY + PIPE_GAP / 2 - BIRD_HEIGHT / 2 + 1,
      },
      velocity: { x: 0, y: 0 },
      rotation: 0,
    };

    const aabb = getBirdAABB(bird);
    const collision = detectPipeCollisions(aabb, [pipe]);
    expect(collision.collided).toBe(true);
    expect(collision.withPipeId).toBe(pipe.id);
  });

  it("detects boundary collision at top and bottom limits", () => {
    const birdTop = {
      position: { x: BIRD_START_X, y: BIRD_HEIGHT / 2 - 1 },
      velocity: { x: 0, y: 0 },
      rotation: 0,
    };
    const topCollision = detectBoundaryCollision(birdTop);
    expect(topCollision.collided).toBe(true);
    expect(topCollision.withBounds).toBe("TOP");

    const birdBottom = {
      position: { x: BIRD_START_X, y: LOGICAL_HEIGHT - GROUND_HEIGHT - BIRD_HEIGHT / 2 + 1 },
      velocity: { x: 0, y: 0 },
      rotation: 0,
    };
    const bottomCollision = detectBoundaryCollision(birdBottom);
    expect(bottomCollision.collided).toBe(true);
    expect(bottomCollision.withBounds).toBe("GROUND");
  });
});
