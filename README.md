# Flappy Flight – Static Next.js Mini-Game MVP

## Key Features
- Flappy Bird-inspired gameplay rendered on a Canvas 2D surface with a deterministic game loop.
- Widescreen 16:9 canvas that stretches across the viewport horizontally while preserving aspect ratio on tall screens.
- Fully static Next.js 14 App Router build (`output: 'export'`) deployable to any CDN or object storage.
- Responsive layout with device pixel ratio scaling, keyboard and touch/pointer controls.
- Local best-score persistence and gated audio feedback (flap, score, collision) after the first user gesture.
- Optional PWA mode (manifest + service worker) for offline replay after first load.

## Prerequisites
- Node.js >=20.10 (LTS recommended)
- pnpm >= 10.18 (managed via corepack: `corepack enable && corepack prepare pnpm@latest --activate`)
- Git for version control

## Quick Setup
```bash
pnpm install                 # Installs workspace dependencies
pnpm --dir frontend dev      # Starts Next.js dev server on http://localhost:3000
```
- Asset placeholders live under `frontend/public/` (`sprites/`, `audio/`, `icons/`).

## Primary Commands
| Command | Description |
| --- | --- |
| `pnpm --dir frontend dev` | Local development server with hot reload |
| `pnpm --dir frontend lint` | ESLint static analysis |
| `pnpm --dir frontend type-check` | TypeScript project references check |
| `pnpm --dir frontend test` | Vitest suite (unit & component tests) |
| `pnpm --dir frontend build` | `next build` (prerequisite for export) |
| `pnpm --dir frontend export` | Alias of `pnpm build`; regenerates `frontend/out` |
| `pnpm --dir frontend preview` | Serves the exported `/out` folder for smoke testing |
| `just verify` | Runs lint + type + test + build sequentially |

## Development Workflow
1. Read the MVP specification (`docs/mvp-flappy-bird-spec.md`) for architecture, states, and constants.
2. Implement game modules under `frontend/src/game/` following the documented interfaces.
3. Wire UI components in `frontend/components/` and canvas renderer under `frontend/src/canvas/`.
4. Validate locally with `just verify`; fix any failing gate before committing.
5. Capture manual QA notes in `docs/worklog/` per feature slice.

### Built-In Validations
- ESLint and Prettier enforce code style (`pnpm lint`).
- Type safety via `pnpm type-check`.
- Unit/component tests executed through `pnpm test` (Vitest + Testing Library).
- `pnpm build` ensures Next.js static export compatibility before releasing.

## Static Export & Deployment
```bash
pnpm --dir frontend build        # produces frontend/out with static assets
pnpm --dir frontend preview      # optional: serve out/ locally
```
- Upload `frontend/out` contents to Vercel (static hosting), Netlify, or any CDN supporting static files.
- For Vercel, configure the project with build command `pnpm --dir frontend build` and output directory `frontend/out`.

### Optional PWA / Offline Mode
1. Set `NEXT_PUBLIC_ENABLE_PWA=true` (e.g., in `.env.local`) before running `pnpm dev` or `pnpm build`.
2. The service worker at `public/sw.js` precaches core sprites/audio/icons and applies a cache-first strategy for same-origin GET requests.
3. Install prompts/on-device testing: open DevTools → Application → Service Workers to confirm registration, toggle offline, and reload to verify gameplay without network.
4. To update the cache, bump `CACHE_NAME` inside `public/sw.js` and rebuild; the new worker takes control after the next visit.


### Adjustable Parameters
- `frontend/src/game/constants.ts`: gravity, flap velocity, scroll speed, pipe gap, spawn interval.
- `frontend/public/sprites/`: replace placeholder visuals with custom 320x180-friendly assets (or matching the logical size you configure).
- `frontend/src/game/constants.ts`: adjust `LOGICAL_WIDTH`/`LOGICAL_HEIGHT`, gravity, speed, and other tuning knobs to change pacing or aspect ratio.
- `frontend/public/audio/`: swap low-latency audio cues; keep file sizes < 30 KB.
- `NEXT_PUBLIC_DEBUG_OVERLAY`: when `true`, shows in-game debug HUD (development only).

## Validation Matrix
| Scenario | Desktop (Chrome) | Mobile (Chrome DevTools) | Expected Result |
| --- | --- | --- | --- |
| First interaction primes audio | Manual | Manual | Audio context resumes; flap sound plays on second input |
| Pause on `Escape` | Manual | n/a | Game freezes, overlay visible |
| Pointer tap flap | Manual | Manual | Bird jumps exactly once per tap |
| Collision detection | Manual | Manual | Immediate Game Over with hit sound |
| Best score persistence | Manual | Manual | Refresh keeps highest score in HUD |
| PWA offline (optional) | Manual | Manual | After install/first visit, game runs without network |

### Manual QA Status
- Gameplay smoke tests (desktop & mobile) — **pending manual run**.
- Audio autoplay gating verification — **pending manual run**.
- PWA install/offline validation — **pending manual run**.

## Relevant Structure
```
frontend/
├─ app/
│  └─ page.tsx
├─ src/
│  ├─ game/        # Engine, physics, world, audio, input
│  ├─ canvas/      # Canvas component + renderer
│  ├─ components/  # HUD, overlays, controls
│  └─ hooks/
├─ public/
│  ├─ sprites/
│  ├─ audio/
│  ├─ icons/
│  └─ manifest.json
└─ styles/globals.css
```

## Performance & Accessibility Targets
- Maintain >= 30 FPS on mid-range mobile.
- Clamp delta time to mitigate tab throttling; auto-pause when the tab loses visibility.
- Achieve WCAG 2.1 AA contrast; canvases accompanied by textual instructions for screen readers.
- Bundle budget: total initial download ≤ 500 KB (HTML + JS + CSS + assets).

## Troubleshooting
- **Blank canvas**: Confirm sprites preloaded; check console for path errors (`public/` assets are referenced root-relative).
- **Audio muted**: Ensure a pointer/keyboard interaction occurred before playback; verify browser policy.
- **`next export` fails**: Remove dynamic routes or enable `generateStaticParams`; confirm `output: 'export'` in `next.config.mjs`.
- **Janky animation**: Inspect device pixel ratio; adjust `MAX_DPR` constant in `GameCanvas`.

## Next Steps
1. Implement modules per specification (`docs/mvp-flappy-bird-spec.md`).
2. Produce placeholder assets and confirm responsive sizing.
3. Add automated tests and document results in `docs/worklog/`.
4. Consider enabling PWA once core gameplay is stable.
