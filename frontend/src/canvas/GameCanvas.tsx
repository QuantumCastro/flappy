'use client';

import { useEffect, useRef, useState } from "react";

import { loadSprites, drawScene, type SpriteMap } from "./renderer";
import { DPR_LIMIT, LOGICAL_HEIGHT, LOGICAL_WIDTH, RENDER_SCALE } from "../game/constants";
import type { GameEngine } from "../game/engine";
import { createInputBindings } from "../game/input";

type GameCanvasProps = {
  engine: GameEngine;
  className?: string;
};

const DEBUG_OVERLAY = process.env.NEXT_PUBLIC_DEBUG_OVERLAY === "true";

export function GameCanvas({ engine, className }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const spritesRef = useRef<SpriteMap | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadSprites()
      .then((sprites) => {
        if (!mounted) return;
        spritesRef.current = sprites;
        setReady(true);
      })
      .catch(() => {
        // noop. Failing to load sprites keeps ready=false; UI overlay should show error (handled elsewhere).
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctxRef.current = ctx;
    const bindings = createInputBindings(engine);
    bindings.attach(canvas);

    const setupCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio ?? 1, DPR_LIMIT);
      const renderScale = RENDER_SCALE;
      canvas.width = Math.floor(LOGICAL_WIDTH * renderScale * dpr);
      canvas.height = Math.floor(LOGICAL_HEIGHT * renderScale * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.scale(renderScale * dpr, renderScale * dpr);
      const state = engine.getState();
      if (spritesRef.current) {
        drawScene(state, { ctx, sprites: spritesRef.current, debug: DEBUG_OVERLAY });
      }
    };

    setupCanvas();

    const handleResize = () => setupCanvas();
    window.addEventListener("resize", handleResize);

    return () => {
      bindings.detach();
      window.removeEventListener("resize", handleResize);
      ctxRef.current = null;
    };
  }, [engine]);

  useEffect(() => {
    if (!ready) return;
    const ctx = ctxRef.current;
    const sprites = spritesRef.current;
    if (!ctx || !sprites) return;

    return engine.subscribe((state) => {
      drawScene(state, { ctx, sprites, debug: DEBUG_OVERLAY });
    });
  }, [engine, ready]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Flappy Flight gameplay canvas"
    />
  );
}

