import { describe, it, expect } from "vitest";
import { timelinePosition, effectiveDuration } from "./event-timeline";

describe("timelinePosition", () => {
  it("places events proportionally", () => {
    expect(timelinePosition(15, 60)).toBeCloseTo(0.25);
    expect(timelinePosition(60, 60)).toBe(1);
    expect(timelinePosition(0, 60)).toBe(0);
  });

  it("clamps events past the end of the track", () => {
    expect(timelinePosition(90, 60)).toBe(1);
  });

  it("clamps negative timestamps to the start", () => {
    expect(timelinePosition(-5, 60)).toBe(0);
  });

  it("degrades safely with a zero duration", () => {
    expect(timelinePosition(10, 0)).toBe(0);
  });
});

describe("effectiveDuration", () => {
  it("uses the task duration when it covers all events", () => {
    expect(effectiveDuration(60, [{ t: 10 }, { t: 42 }])).toBe(60);
  });

  it("stretches to the latest event when it exceeds the duration", () => {
    expect(effectiveDuration(60, [{ t: 75.5 }])).toBe(75.5);
  });

  it("falls back to a non-zero floor with no data", () => {
    expect(effectiveDuration(null, [])).toBe(1);
    expect(effectiveDuration(0, [{ t: null }])).toBe(1);
  });
});
