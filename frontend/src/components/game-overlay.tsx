"use client";

import { Fragment } from "react";

import type { CollisionResult, GamePhase } from "../game/types";

type OverlayProps = {
  phase: GamePhase;
  score: number;
  bestScore: number;
  lastCollision: CollisionResult | null;
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
};

export function GameOverlay({
  phase,
  score,
  bestScore,
  lastCollision,
  onStart,
  onResume,
  onRestart,
}: OverlayProps) {
  if (phase === "PLAYING") {
    return null;
  }

  const isMenu = phase === "MENU";
  const isPaused = phase === "PAUSED";
  const isGameOver = phase === "GAME_OVER";

  const title = isMenu ? "Tap to play" : isPaused ? "Paused" : "Game Over";
  const subtitle = isMenu
    ? "Flap by tapping anywhere or pressing Space."
    : isPaused
      ? "Resume to continue or restart for a fresh run."
      : collisionMessage(lastCollision, score);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 rounded-[28px] bg-slate-950/75 backdrop-blur-md">
      <div className="flex flex-col items-center gap-2 text-center text-slate-50">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="max-w-[220px] text-sm text-slate-300">{subtitle}</p>
        {isGameOver && (
          <p className="text-sm font-semibold text-amber-300">
            Score {score} | Best {bestScore}
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {isMenu && (
          <OverlayButton onClick={onStart} data-testid="start-button">
            Start
          </OverlayButton>
        )}
        {isPaused && (
          <Fragment>
            <OverlayButton onClick={onResume}>Resume</OverlayButton>
            <OverlayButton variant="ghost" onClick={onRestart}>
              Restart
            </OverlayButton>
          </Fragment>
        )}
        {isGameOver && (
          <OverlayButton onClick={onRestart} data-testid="restart-button">
            Play again
          </OverlayButton>
        )}
      </div>
    </div>
  );
}

type OverlayButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "solid" | "ghost";
  "data-testid"?: string;
};

function OverlayButton({ children, onClick, variant = "solid", ...dom }: OverlayButtonProps) {
  const base =
    "rounded-full px-6 py-2 text-sm font-semibold uppercase tracking-widest transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200";
  const variants = {
    solid: "bg-amber-400 text-slate-950 hover:bg-amber-300",
    ghost: "border border-amber-300 text-amber-200 hover:bg-amber-200/10",
  };

  return (
    <button type="button" onClick={onClick} className={`${base} ${variants[variant]}`} {...dom}>
      {children}
    </button>
  );
}

function collisionMessage(collision: CollisionResult | null, score: number) {
  if (!collision) {
    return score > 0 ? "Nice run! Can you beat your best score?" : "A good flap begins with practice.";
  }

  if (collision.withBounds === "GROUND") {
    return "Too low! Keep the rhythm to avoid the ground.";
  }

  if (collision.withBounds === "TOP") {
    return "Slow down - flying too high is risky.";
  }

  return "Those pipes are sneaky! Time your flaps to slip through the gap.";
}
