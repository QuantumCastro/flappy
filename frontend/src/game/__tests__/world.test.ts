import { describe, expect, it } from "vitest";

import {
  LOGICAL_HEIGHT,
  GROUND_HEIGHT,
  PIPE_WIDTH,
  PIPE_SPAWN_INTERVAL,
  SCROLL_SPEED,
} from "../constants";
import { createInitialWorldState, createRng, updateWorld } from "../world";
import type { GameWorldState, PipePair } from "../types";

describe("world", () => {
  it("spawns pipes after enough time passes", () => {
    const world = createInitialWorldState();
    const rng = createRng(1);

    const { state } = updateWorld(world, PIPE_SPAWN_INTERVAL / 1000 + 0.01, rng, 20,true);
    expect(state.pipes.length).toBeGreaterThan(0);
  });

  it("moves pipes left according to scroll speed", () => {
    const pipe: PipePair = {
      id: 1,
      x: 200,
      gapCenterY: (LOGICAL_HEIGHT - GROUND_HEIGHT) / 2,
      width: PIPE_WIDTH,
      scored: false,
    };
    const state: GameWorldState = {
      pipes: [pipe],
      lastSpawnAt: 0,
      timeSinceLastSpawn: 0,
      nextPipeId: 2,
    };

    const rng = createRng(2);
    const { state: nextState } = updateWorld(state, 0.5, rng, 0, false);
    expect(nextState.pipes[0].x).toBeCloseTo(pipe.x - SCROLL_SPEED * 0.5, 5);
  });

  it("marks pipe as scored once player passes center", () => {
    const pipe: PipePair = {
      id: 1,
      x: 50,
      gapCenterY: (LOGICAL_HEIGHT - GROUND_HEIGHT) / 2,
      width: PIPE_WIDTH,
      scored: false,
    };
    const state: GameWorldState = {
      pipes: [pipe],
      lastSpawnAt: 0,
      timeSinceLastSpawn: 0,
      nextPipeId: 2,
    };
    const rng = createRng(3);
    const { scoredPipeIds, state: nextState } = updateWorld(state, 0.016, rng, pipe.x + pipe.width, false);
    expect(scoredPipeIds).toContain(pipe.id);
    expect(nextState.pipes[0].scored).toBe(true);
  });
});
