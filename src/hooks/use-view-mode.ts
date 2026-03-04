import { useState, useCallback } from "react";

type ViewMode = "table" | "card";

export function useViewMode(key: string): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setModeState] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === "table" || stored === "card") return stored;
    } catch {}
    return "table";
  });

  const setMode = useCallback(
    (newMode: ViewMode) => {
      setModeState(newMode);
      try {
        localStorage.setItem(key, newMode);
      } catch {}
    },
    [key],
  );

  return [mode, setMode];
}
