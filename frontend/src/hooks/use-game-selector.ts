import { useEffect, useState } from "react";

import type { GameEngine } from "../game/engine";
import type { GameState } from "../game/types";

export function useGameSelector<T>(
  engine: GameEngine,
  selector: (state: GameState) => T,
  equality: (a: T, b: T) => boolean = Object.is,
) {
  const [value, setValue] = useState(() => selector(engine.getState()));

  useEffect(() => {
    return engine.subscribe((state) => {
      const nextValue = selector(state);
      setValue((prev) => (equality(prev, nextValue) ? prev : nextValue));
    });
  }, [engine, selector, equality]);

  return value;
}
