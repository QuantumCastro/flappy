# Flappy Flight MVP Specification

## 0. Context and Scope
- **Objective**: deliver a static Next.js web app that ships a responsive Flappy Bird‑style mini-game playable on desktop and mobile, exported to `/out` with zero runtime network calls.
- **Stack**: Next.js 14 App Router, TypeScript, TailwindCSS, Canvas 2D rendering, pnpm.
- **Non-goals**: no backend, no multiplayer, no monetisation, no analytics, no dynamic routes or server components.

## 1. Inputs, Outputs, Assumptions
- **Inputs**
  - Player gestures: keyboard (`Space`, `ArrowUp`, `KeyW`, `Enter`), pointer (`pointerdown` on canvas or UI buttons), optional touch gestures mapped to pointer events.
  - Device capabilities: `window`, `document`, `localStorage`, `AudioContext`, `devicePixelRatio`.
  - Static assets from `public/`: sprites (`PNG` ≤ 50 KB each), audio cues (`OGG`/`MP3` ≤ 30 KB), optional `manifest.json` and icons for PWA.
- **Outputs**
  - Rendered game canvas using a 320x180 logical resolution (16:9), scaled fluidly to the viewport width via DPR.
  - HUD overlays (score, best score, state messages) and interactive buttons (Play/Pause, Resume, Restart).
  - Audio playback for flap, score and collision events triggered after the first user gesture.
  - `localStorage` key `flappy-best-score` storing the session high score (integer).
  - Static export artefact in `frontend/out` ready for hosting on Vercel or static storage.
- **Assumptions**
  - **A1**: Evergreen browsers with ES2019+, Canvas 2D, `PointerEvent`, and Web Audio support.
  - **A2**: Audio autoplay is blocked until explicit user interaction; first gesture will prime audio.
  - **A3**: Asset pipeline lives under `frontend/public/`; swapping sprites/audio is a build-time concern for any contributor (no runtime fetch).
  - **A4**: Layout targets widescreen/full-width canvas; extremely tall screens letterbox vertically to preserve 16:9 framing.
  - **A5**: `OffscreenCanvas` is optional; we provide runtime feature detection and fall back to main-thread rendering.

## 2. Preconditions, Postconditions, Invariants, Edge Cases
- **Preconditions**
  - DOM is mounted and Next.js hydration completed before starting the game loop.
  - Canvas context successfully obtained (`CanvasRenderingContext2D`).
  - Asset loader resolves sprite images before entering `PLAYING` state.
- **Postconditions**
  - On `GAME_OVER`, score comparison updates `localStorage` best score if higher and HUD reflects it.
  - `pnpm run build` completes without errors, generating `/out` with all assets copied.
  - Event listeners and RAF loop cancelled on React unmount to prevent memory leaks.
- **Invariants**
  - Logical coordinate system origin at top-left; ground baseline at `logicalHeight - groundHeight`.
  - Bird collider rectangle remains centred on sprite anchor; width/height fixed constants.
  - Pipe pairs maintain vertical gap `pipeGap` with randomised centre within safe bounds.
  - Game loop clamps delta time between 16 ms and 48 ms to avoid physics explosion.
  - State machine transitions allowed: `MENU -> PLAYING -> (PAUSED|GAME_OVER)`; `PAUSED -> PLAYING`; `GAME_OVER -> PLAYING`.
- **Edge Cases**
  1. Bird starts exactly at pipe edge: AABB collision must treat touching as collision to avoid ghosting.
  2. Sudden FPS drop (tab background): on `visibilitychange` to hidden, auto-pause to prevent unfair death.
  3. DPR ≥ 3 on small screens: downscale rendering buffer via capped max DPR (e.g., 2) with CSS scale to full size.
  4. Pointer input outside canvas: ignore to prevent unintended jumps; buttons nested in UI layer handle focus states.
  5. Audio API unavailable: degrade to muted mode with UI icon reflecting audio disabled.

## 3. Functional Breakdown
### 3.1 Game States
| State | Description | Entry Triggers | Exit Triggers |
| --- | --- | --- | --- |
| `MENU` | Idle screen with Play button, instructions, best score. | Initial load, Restart after Game Over. | Player taps Play button or presses `Space/Enter`. |
| `PLAYING` | Active physics, score increments when passing pipe pairs. | Start from Menu, Resume from Pause. | Collision, ground/ceiling clamp, Pause request, blur event. |
| `PAUSED` | Game loop paused, overlay displayed. | Pause button, `Escape` key, window blur. | Resume button, `Space/Enter`, window focus. |
| `GAME_OVER` | Bird falls, show final score and Restart button. | Collision or ground hit. | Restart button/keys, auto restart after delay (optional). |

### 3.2 Core Mechanics
- **Physics constants** (defaults, configurable via `src/game/constants.ts`):

| Constant | Default | Notes |
| --- | --- | --- |
| `gravity` | 850 px/s² | Applied each frame to bird velocity. |
| `flapVelocity` | -260 px/s | Instant velocity applied on flap. |
| `maxFallSpeed` | 420 px/s | Clamp to avoid tunnelling. |
| `scrollSpeed` | 180 px/s | Horizontal scroll for pipes/ground. |
| `pipeSpawnInterval` | 1400 ms | Time between new pipe pairs. |
| `pipeGap` | 92 px | Vertical gap; randomised ±18 px. |
| `groundHeight` | 32 px | Height of ground sprite bar. |
| `canvasLogicalSize` | 320 x 180 px | Fixed internal resolution. |
| `renderScale` | 6x oversampling | Canvas buffer renders at ~1080p before display scaling. |

- **Entity lifecycle**:
  - Maintain arrays for active pipes. Once pipe pair `x + width < -offscreenBuffer`, recycle to pool.
  - Score increments when bird centre surpasses pipe pair centre and `scored` flag false.
- **Collision detection**:
  - Use axis-aligned bounding boxes derived from logical coordinates.
  - Check bird vs. each pipe rectangle and vs. ground/ceiling each frame.
- **Game loop**:
  - `engine.start()` registers `requestAnimationFrame` loop with timestamp diff -> `deltaSeconds`.
  - On `PAUSED`, skip update but continue rendering static overlay.
  - On `GAME_OVER`, allow bird to fall to ground; stop pipe updates after collision.

### 3.3 Controls
- Keyboard: `Space`, `ArrowUp`, `KeyW`, `Enter` to flap; `Escape` toggles pause.
- Pointer/touch: `pointerdown` on canvas to flap; UI buttons for Play/Pause/Restart with accessible labels.
- Accessibility: ensure buttons focusable via keyboard; include ARIA roles and visually hidden instructions.

### 3.4 Audio
- Sounds: `flap.wav`, `score.wav`, `hit.wav`.
- Flow: on first gesture, call `AudioContext.resume()` and preload buffers.
- Provide mute toggle (icon button) storing preference in `localStorage` `flappy-audio-enabled`.
- Volume balanced at -6 dBFS equivalent (approx. 0.5 gain).

### 3.5 Rendering
- Sprite atlas (`public/sprites/atlas.png`) accompanied by JSON metadata for frame rectangles; fallback to separate PNGs if atlas unavailable.
- Background gradient drawn once per frame; parallax optional via slow-moving cloud layer.
- OffscreenCanvas path:
  1. Detect support and worker availability.
  2. Transfer control to worker rendering module; postMessage simulation data.
  3. If unsupported, main-thread draw using 2D context.
- Optimize draw order: background -> pipes -> bird -> ground -> HUD.

### 3.6 UI Layer
- Components:
  - `GameCanvas`: wraps `<canvas>`, handles DPR scaling, sets up event listeners, exposes imperative API to game engine via React ref.
  - `Hud`: displays current score, best score, and optional debug info.
  - `Overlay`: context-sensitive messages (`Tap to start`, `Paused`, `Game Over`) and buttons.
  - `ControlsBar`: Pause/Resume, Restart, Audio toggle.
- Use Tailwind for layout (full-screen flex column, centred canvas, gradient background).
- Provide fallback text for users without canvas support (“Your browser is not supported.”).

## 4. Architecture & Module Layout
```
src/
 ├─ app/ (App Router root)
 │   └─ page.tsx               // Loads GamePage component
 ├─ components/
 │   ├─ GamePage.tsx           // Assembles layout, HUD, overlays
 │   ├─ Hud.tsx
 │   ├─ Overlay.tsx
 │   └─ ControlsBar.tsx
 ├─ canvas/
 │   ├─ GameCanvas.tsx
 │   └─ renderer.ts            // drawScene(context, state)
 └─ game/
     ├─ engine.ts              // RAF loop, state transitions
     ├─ world.ts               // Pipes, ground scrolling
     ├─ physics.ts             // Bird integration, collisions
     ├─ input.ts               // Keyboard & pointer handlers
     ├─ audio.ts               // Audio manager
     ├─ constants.ts           // Tweaking knob values
     └─ types.ts               // Shared interfaces/enums
```

## 5. Quality Gates & Validation
- **Performance**: steady ≥ 30 FPS on Pixel 4a class device; monitor via `requestAnimationFrame` delta analytics (development only console warnings).
- **SEO / Metadata**: define `export const metadata` with title, description, PWA meta if enabled.
- **Accessibility**: WCAG 2.1 AA basics—contrast ≥ 4.5:1 for text, focus outlines, ARIA labels.
- **Testing strategy**
  - Unit tests (Vitest) for `physics.ts` (gravity integration, collision detection) and `world.ts` (pipe spawn sequencing).
  - Component tests (Testing Library) ensuring HUD renders correct score and responds to state changes.
  - Optional Playwright smoke test verifying ability to start, flap, and detect game over.
- **Manual QA checklist**
  1. Load page on desktop Chrome, start game, confirm audio triggers after click.
  2. Pause via UI and `Escape`, resume via UI, ensure state resumes.
  3. Test on mobile simulator (Chrome DevTools) for portrait and landscape.
  4. Trigger collision and verify Game Over overlay, restart flows.
  5. Refresh page, ensure best score persists.

## 6. Build & Deployment
- `package.json` scripts:
  - `dev`: `next dev`
  - `build`: `next build`
  - `export`: alias of `pnpm run build` to regenerate `/out`
  - `lint`, `type-check`, `test`, `format`, `preview` (serve `/out` locally).
- `next.config.mjs`: `output: 'export'`, disable image optimization (`images.unoptimized = true`), ensure `experimental.appDir = true`.
- Static export: `pnpm --dir frontend run build`; resulting assets in `frontend/out`.
- PWA optional: include `public/manifest.json`, icons, `public/sw.js` registered in `useEffect` guarded by `process.env.NEXT_PUBLIC_ENABLE_PWA === 'true'`.

## 7. Risks & Mitigations
- **High DPR & performance**: cap internal canvas scaling to max 2.5; monitor `delta` spikes to auto-pause if > 100 ms.
- **Autoplay restrictions**: require first gesture before enabling audio, display muted icon until activated.
- **Tab suspension**: listen to `visibilitychange`, auto-pause when hidden, auto-resume prompt on focus.
- **Asset bloat**: enforce sprite total < 200 KB, audio total < 100 KB; compress with TinyPNG/Audacity.
- **Browser compatibility**: provide feature detection and fallback messaging; avoid optional chaining in critical paths or transpile accordingly.

## 8. Roadmap & Next Steps
1. Finalise sprite sheet and audio placeholders (assign to Art).
2. Scaffold code structure and canvas component.
3. Implement physics & world modules with unit tests.
4. Wire state machine, input handlers, and HUD.
5. Integrate audio manager with gesture gating.
6. Polish UI/UX, add pause overlay, responsive layout.
7. Optional: implement PWA manifest + SW (cache-first static assets).
8. Run `just verify`, document results, prepare deployment guide.

## 9. Metrics & Telemetry (Optional)
- Track Core Web Vitals via Vercel Analytics when allowed.
- Local debug overlay toggled via `NEXT_PUBLIC_DEBUG_OVERLAY` to display FPS and collision boxes (development only).

## 10. Deliverables Checklist
- [ ] `frontend/app/page.tsx` renders game page with metadata.
- [ ] `frontend/src/game/*` modules implemented with tests.
- [ ] `frontend/public/sprites/*`, `frontend/public/audio/*` assets present.
- [ ] `frontend/public/manifest.json` & `public/sw.js` (if PWA enabled).
- [ ] README updated with setup, controls, QA matrix, deployment.
- [ ] Static export verified with `pnpm run build`.
## 11. Production Playbook
- **Environments**: Local (`pnpm --dir frontend dev`), preview (`pnpm --dir frontend preview` serving `/out` or Vercel preview), production (Vercel static hosting consuming `/frontend/out`). Git `main` is the release branch.
- **Release checklist**
  1. `just verify` (lint → type → test → build).
  2. `pnpm --dir frontend preview` and run the manual QA table (desktop + mobile + offline).
  3. Commit + push; Vercel build command `pnpm --dir frontend build` with output `frontend/out`.
  4. Smoke-test the preview URL, then promote to production.
- **Rollback**: redeploy a known-good commit in Vercel or promote the previous deployment. No DB migration is needed because the site is static.
- **Secrets / envs**: only public flags (e.g., `NEXT_PUBLIC_ENABLE_PWA`). No private keys should be added to the repo or the Vercel project.
- **Monitoring**: rely on Vercel Analytics + browser console logs. If adding third-party analytics later, ensure they are privacy-friendly and lazy-loaded.
- **Handoff**: new contributors only need Node ≥18.18 and pnpm ≥8.10. Run `pnpm install`, copy `.env.example` → `.env.local` if flags are introduced, and follow this spec plus `README.md`.
