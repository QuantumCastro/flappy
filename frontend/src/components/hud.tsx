"use client";

type HudProps = {
  score: number;
  bestScore: number;
};

export function Hud({ score, bestScore }: HudProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
      <div className="flex min-w-[180px] flex-col items-center gap-1 rounded-full bg-slate-950/70 px-5 py-2 shadow-lg shadow-slate-950/60">
        <span
          suppressHydrationWarning
          className="text-[2.5rem] font-extrabold leading-none text-amber-300 drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]"
        >
          {score}
        </span>
        <span
          suppressHydrationWarning
          className="text-xs font-semibold uppercase tracking-widest text-slate-200"
        >
          Best {bestScore}
        </span>
      </div>
    </div>
  );
}
