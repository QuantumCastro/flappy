"use client";

import { useEffect, useRef } from "react";

import { GameCanvas } from "../canvas/GameCanvas";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../game/constants";
import { createAudioController } from "../game/audio";
import { GameEngine } from "../game/engine";
import type { CollisionResult } from "../game/types";
import { ControlsBar } from "./controls-bar";
import { GameOverlay } from "./game-overlay";
import { Hud } from "./hud";
import { useGameSelector } from "../hooks/use-game-selector";
import { useServiceWorker } from "../hooks/use-service-worker";

const aspectRatio = LOGICAL_WIDTH / LOGICAL_HEIGHT;

export function GamePage() {
  const engineRef = useRef<GameEngine>();
  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }
  const engine = engineRef.current;

  const audioRef = useRef(createAudioController(engine.getState().audioEnabled));
  const audioController = audioRef.current;

  useEffect(() => {
    engine.setAudioController(audioController);
    return () => {
      audioController.setEnabled(false);
    };
  }, [engine, audioController]);

  useEffect(() => {
    engine.start();
    return () => engine.stop();
  }, [engine]);

  const phase = useGameSelector(engine, (state) => state.phase);
  const score = useGameSelector(engine, (state) => state.score);
  const bestScore = useGameSelector(engine, (state) => state.bestScore);
  const audioEnabled = useGameSelector(engine, (state) => state.audioEnabled);
  const lastCollision = useGameSelector(engine, (state) => state.lastCollision, collisionEquals);

  const enablePwa = process.env.NEXT_PUBLIC_ENABLE_PWA === "true";
  useServiceWorker(enablePwa);

  const handleStart = () => engine.dispatch("START");
  const handleResume = () => engine.dispatch("RESUME");
  const handleRestart = () => engine.dispatch("RESTART");
  const handlePauseToggle = () => engine.dispatch("TOGGLE_PAUSE");
  const handleAudioToggle = () => engine.dispatch("TOGGLE_AUDIO");

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <header className="flex w-full flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl">Flappy Flight</h1>
        <p className="max-w-4xl text-base text-slate-300 sm:text-lg">
          Dodge the pipes, keep your rhythm, and chase a new personal best in this static Next.js mini-game.
        </p>
      </header>

      <div className="relative w-full" style={{ aspectRatio, maxHeight: "calc(100vh - 8px)" }}>
        <GameCanvas
          engine={engine}
          className="h-full w-full rounded-[32px] border border-slate-800/80 bg-slate-900/50 shadow-[0_80px_120px_-80px_rgba(15,23,42,0.85)]"
        />

        <Hud score={score} bestScore={bestScore} />
        <GameOverlay
          phase={phase}
          score={score}
          bestScore={bestScore}
          lastCollision={lastCollision}
          onStart={handleStart}
          onResume={handleResume}
          onRestart={handleRestart}
        />
      </div>

      <ControlsBar
        phase={phase}
        audioEnabled={audioEnabled}
        onPauseToggle={handlePauseToggle}
        onRestart={handleRestart}
        onAudioToggle={handleAudioToggle}
      />

      <section className="w-full rounded-3xl bg-slate-900/40 p-6 text-sm text-slate-300 shadow-inner shadow-slate-950/30 sm:text-base md:max-w-4xl">
        <h2 className="mb-2 text-lg font-semibold text-slate-100">Controls</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Tap or click anywhere on the canvas to flap.</li>
          <li>
            Keyboard: <kbd className="kbd">Space</kbd>, <kbd className="kbd">ArrowUp</kbd>, <kbd className="kbd">W</kbd>, or{" "}
            <kbd className="kbd">Enter</kbd> to flap.
          </li>
          <li>
            Pause with <kbd className="kbd">Escape</kbd> or the Pause button. Restart with <kbd className="kbd">R</kbd>.
          </li>
          <li>
            Toggle sound with <kbd className="kbd">M</kbd> or the audio button.
          </li>
        </ul>
      </section>
    </div>
  );
}

function collisionEquals(a: CollisionResult | null, b: CollisionResult | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.collided === b.collided && a.withBounds === b.withBounds && a.withPipeId === b.withPipeId;
}

