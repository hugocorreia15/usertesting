import { useCallback, useRef, useState, useEffect } from "react";

interface PersistedTimer {
  accumulated: number;
  // epoch ms when the current running span started; null when paused
  startedAt: number | null;
}

function readPersisted(key: string): PersistedTimer | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as PersistedTimer) : null;
  } catch {
    return null;
  }
}

// With a persistKey the timer survives tab crashes/reloads: the epoch
// start of the running span is stored, so rehydration loses nothing.
export function useTimer(persistKey?: string) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const persist = useCallback(
    (startedAt: number | null) => {
      if (!persistKey) return;
      try {
        localStorage.setItem(
          persistKey,
          JSON.stringify({
            accumulated: accumulatedRef.current,
            startedAt,
          } satisfies PersistedTimer),
        );
      } catch {
        /* storage full/unavailable — timer still works in-memory */
      }
    },
    [persistKey],
  );

  const tick = useCallback(() => {
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    setSeconds(accumulatedRef.current + elapsed);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
    setIsRunning(true);
    persist(Date.now());
    rafRef.current = requestAnimationFrame(tick);
  }, [tick, persist]);

  const pause = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    accumulatedRef.current +=
      (performance.now() - startTimeRef.current) / 1000;
    setIsRunning(false);
    persist(null);
  }, [persist]);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    accumulatedRef.current = 0;
    setSeconds(0);
    setIsRunning(false);
    if (persistKey) {
      try {
        localStorage.removeItem(persistKey);
      } catch {
        /* ignore */
      }
    }
  }, [persistKey]);

  // Rehydrate whenever the persist key changes (e.g. task advance).
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    accumulatedRef.current = 0;
    setSeconds(0);
    setIsRunning(false);
    if (!persistKey) return;

    const saved = readPersisted(persistKey);
    if (!saved) return;

    if (saved.startedAt != null) {
      // Was running when the tab died: credit the missing span and resume.
      accumulatedRef.current =
        saved.accumulated + (Date.now() - saved.startedAt) / 1000;
      setSeconds(accumulatedRef.current);
      startTimeRef.current = performance.now();
      setIsRunning(true);
      persist(Date.now());
      rafRef.current = requestAnimationFrame(tick);
    } else {
      accumulatedRef.current = saved.accumulated;
      setSeconds(saved.accumulated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return { seconds, isRunning, start, pause, reset };
}
