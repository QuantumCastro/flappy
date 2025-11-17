import type { GameEngine } from "./engine";

type ListenerDisposer = () => void;

export interface InputBindings {
  attach(canvas: HTMLCanvasElement | null): void;
  detach(): void;
}

export function createInputBindings(engine: GameEngine): InputBindings {
  let detachFns: ListenerDisposer[] = [];

  function detach() {
    for (const dispose of detachFns) {
      dispose();
    }
    detachFns = [];
  }

  function attach(canvas: HTMLCanvasElement | null) {
    detach();
    if (!canvas) return;

    const pointerDown = (event: PointerEvent) => {
      event.preventDefault();
      engine.dispatch("FLAP");
    };

    canvas.addEventListener("pointerdown", pointerDown, { passive: false });
    detachFns.push(() => canvas.removeEventListener("pointerdown", pointerDown));

    const keyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      switch (event.code) {
        case "Space":
        case "ArrowUp":
        case "KeyW":
        case "Enter":
          event.preventDefault();
          engine.dispatch("FLAP");
          break;
        case "Escape":
          event.preventDefault();
          engine.dispatch("TOGGLE_PAUSE");
          break;
        case "KeyP":
          event.preventDefault();
          engine.dispatch("TOGGLE_PAUSE");
          break;
        case "KeyR":
          engine.dispatch("RESTART");
          break;
        case "KeyM":
          engine.dispatch("TOGGLE_AUDIO");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", keyDown);
    detachFns.push(() => window.removeEventListener("keydown", keyDown));

    const visibilityChange = () => {
      if (document.visibilityState === "hidden") {
        engine.dispatch("VISIBILITY_HIDDEN");
      } else {
        engine.dispatch("VISIBILITY_VISIBLE");
      }
    };

    document.addEventListener("visibilitychange", visibilityChange);
    detachFns.push(() => document.removeEventListener("visibilitychange", visibilityChange));
  }

  return {
    attach,
    detach,
  };
}
