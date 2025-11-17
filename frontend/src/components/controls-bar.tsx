"use client";

import type { GamePhase } from "../game/types";

type ControlsBarProps = {
  phase: GamePhase;
  audioEnabled: boolean;
  onPauseToggle: () => void;
  onRestart: () => void;
  onAudioToggle: () => void;
};

export function ControlsBar({ phase, audioEnabled, onPauseToggle, onRestart, onAudioToggle }: ControlsBarProps) {
  const canPause = phase === "PLAYING" || phase === "PAUSED";
  const pauseLabel = phase === "PAUSED" ? "Resume" : "Pause";

  return (
    <div className="flex w-full flex-wrap justify-center gap-3 rounded-2xl bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60 backdrop-blur">
      <button
        type="button"
        onClick={onPauseToggle}
        disabled={!canPause}
        className={buttonClassName}
        aria-pressed={phase === "PAUSED"}
      >
        {pauseLabel}
      </button>

      <button type="button" onClick={onRestart} className={buttonClassName}>
        Restart
      </button>

      <button
        type="button"
        onClick={onAudioToggle}
        className={buttonClassName}
        aria-pressed={audioEnabled}
      >
        {audioEnabled ? "Mute" : "Unmute"}
      </button>
    </div>
  );
}

const buttonClassName =
  "min-w-[96px] rounded-full border border-slate-700 bg-slate-800/60 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-50";
