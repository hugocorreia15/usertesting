import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimer } from "../use-timer";

const KEY = "avalux-live-timer-test-0";

describe("useTimer persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("persists a running span and credits it on rehydration", () => {
    vi.setSystemTime(new Date("2026-07-14T10:00:00Z"));
    const first = renderHook(() => useTimer(KEY));
    act(() => first.result.current.start());

    const saved = JSON.parse(localStorage.getItem(KEY)!);
    expect(saved.startedAt).not.toBeNull();
    expect(saved.accumulated).toBe(0);

    // tab "crashes"; 90 seconds pass before the evaluator reloads
    first.unmount();
    vi.setSystemTime(new Date("2026-07-14T10:01:30Z"));

    const second = renderHook(() => useTimer(KEY));
    expect(second.result.current.seconds).toBeGreaterThanOrEqual(90);
    // it resumes running rather than sitting paused
    expect(second.result.current.isRunning).toBe(true);
    second.unmount();
  });

  it("rehydrates a paused timer without drift", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ accumulated: 42.5, startedAt: null }),
    );
    const { result, unmount } = renderHook(() => useTimer(KEY));
    expect(result.current.seconds).toBeCloseTo(42.5);
    expect(result.current.isRunning).toBe(false);
    unmount();
  });

  it("reset clears persisted state", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ accumulated: 10, startedAt: null }),
    );
    const { result, unmount } = renderHook(() => useTimer(KEY));
    act(() => result.current.reset());
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(result.current.seconds).toBe(0);
    unmount();
  });

  it("a new persist key starts clean", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ accumulated: 99, startedAt: null }),
    );
    const { result, unmount } = renderHook(() => useTimer("other-key"));
    expect(result.current.seconds).toBe(0);
    unmount();
  });

  it("tolerates corrupt persisted state", () => {
    localStorage.setItem(KEY, "{not json");
    const { result, unmount } = renderHook(() => useTimer(KEY));
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
    unmount();
  });
});
