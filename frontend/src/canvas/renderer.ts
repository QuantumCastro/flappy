import {
  BIRD_HEIGHT,
  BIRD_WIDTH,
  GROUND_HEIGHT,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  PIPE_GAP,
  PIPE_WIDTH,
  SCROLL_SPEED,
} from "../game/constants";
import type { GameState, PipePair } from "../game/types";

type SpriteKey = "bird" | "pipe" | "ground" | "background";

export type SpriteMap = Record<SpriteKey, HTMLImageElement>;

let spritePromise: Promise<SpriteMap> | null = null;

export function loadSprites(): Promise<SpriteMap> {
  if (!spritePromise) {
    spritePromise = Promise.all(
      (Object.entries({
        bird: "/sprites/bird.png",
        pipe: "/sprites/pipe.png",
        ground: "/sprites/ground.png",
        background: "/sprites/background.png",
      }) as [SpriteKey, string][]).map(([key, src]) => loadImage(src).then((img) => [key, img] as const)),
    ).then((entries) => Object.fromEntries(entries) as SpriteMap);
  }

  return spritePromise;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

export interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  sprites: SpriteMap;
  debug?: boolean;
}

export function drawScene(state: GameState, { ctx, sprites, debug = false }: RenderOptions) {
  ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  drawBackground(ctx, sprites.background);
  drawPipes(ctx, sprites.pipe, state.world.pipes);
  drawGround(ctx, sprites.ground, state.elapsedMs);
  drawBird(ctx, sprites.bird, state);

  if (debug) {
    drawDebug(ctx, state);
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, sprite: HTMLImageElement) {
  ctx.drawImage(sprite, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
}

function drawPipes(ctx: CanvasRenderingContext2D, sprite: HTMLImageElement, pipes: PipePair[]) {
  for (const pipe of pipes) {
    const gapTop = pipe.gapCenterY - PIPE_GAP / 2;
    const gapBottom = pipe.gapCenterY + PIPE_GAP / 2;
    const topHeight = Math.max(gapTop, 0);
    const bottomHeight = Math.max(LOGICAL_HEIGHT - gapBottom, 0);

    if (topHeight > 0) {
      ctx.drawImage(sprite, pipe.x, 0, PIPE_WIDTH, topHeight);
    }

    if (bottomHeight > 0) {
      ctx.drawImage(sprite, pipe.x, gapBottom, PIPE_WIDTH, bottomHeight);
    }
  }
}

function drawGround(ctx: CanvasRenderingContext2D, sprite: HTMLImageElement, elapsedMs: number) {
  const groundY = LOGICAL_HEIGHT - GROUND_HEIGHT;
  const scroll = ((elapsedMs / 1000) * SCROLL_SPEED) % LOGICAL_WIDTH;
  ctx.save();
  ctx.translate(-scroll, groundY);
  ctx.drawImage(sprite, 0, 0, LOGICAL_WIDTH, GROUND_HEIGHT);
  ctx.drawImage(sprite, LOGICAL_WIDTH, 0, LOGICAL_WIDTH, GROUND_HEIGHT);
  ctx.restore();
}

function drawBird(ctx: CanvasRenderingContext2D, sprite: HTMLImageElement, state: GameState) {
  const { bird } = state;
  ctx.save();
  ctx.translate(bird.position.x, bird.position.y);
  ctx.rotate(bird.rotation);
  ctx.drawImage(sprite, -BIRD_WIDTH / 2, -BIRD_HEIGHT / 2, BIRD_WIDTH, BIRD_HEIGHT);
  ctx.restore();
}

function drawDebug(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();
  ctx.strokeStyle = "rgba(0,200,255,0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    state.bird.position.x - BIRD_WIDTH / 2,
    state.bird.position.y - BIRD_HEIGHT / 2,
    BIRD_WIDTH,
    BIRD_HEIGHT,
  );

  ctx.strokeStyle = "rgba(0,255,128,0.4)";
  for (const pipe of state.world.pipes) {
    const gapTop = pipe.gapCenterY - PIPE_GAP / 2;
    const gapBottom = pipe.gapCenterY + PIPE_GAP / 2;
    ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, gapTop);
    ctx.strokeRect(pipe.x, gapBottom, PIPE_WIDTH, LOGICAL_HEIGHT - gapBottom);
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.8)";
  ctx.fillRect(6, 6, 120, 44);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillText(`FPS Δ: ${(1000 / Math.max(state.delta * 1000, 1)).toFixed(1)}`, 12, 20);
  ctx.fillText(`Score: ${state.score}`, 12, 32);
  ctx.fillText(`Pipes: ${state.world.pipes.length}`, 12, 44);
  ctx.restore();
}
