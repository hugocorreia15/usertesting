import { describe, it, expect } from "vitest";
import { computeSessionAverages, type MetricTaskResult } from "./metrics";

function task(overrides: Partial<MetricTaskResult> = {}): MetricTaskResult {
  return {
    time_seconds: 30,
    action_count: 4,
    seq_rating: 6,
    completion_status: "success",
    template_tasks: { optimal_time_seconds: 30 },
    ...overrides,
  };
}

describe("computeSessionAverages", () => {
  it("computes plain averages", () => {
    const r = computeSessionAverages([
      task({ time_seconds: 20 }),
      task({ time_seconds: 40 }),
    ]);
    expect(r.avgTime).toBe(30);
    expect(r.avgActions).toBe("4.0");
    expect(r.avgSeq).toBe("6.0");
  });

  it("never returns Infinity for skipped tasks with zero time", () => {
    // regression: a skipped task stored time_seconds = 0 and used to
    // divide optimal/0 → Infinity%
    const r = computeSessionAverages([
      task({ time_seconds: 30, template_tasks: { optimal_time_seconds: 30 } }),
      task({
        time_seconds: 0,
        completion_status: "skipped",
        template_tasks: { optimal_time_seconds: 45 },
      }),
    ]);
    expect(r.timeEfficiency).toBe(100);
    expect(Number.isFinite(r.timeEfficiency!)).toBe(true);
    expect(r.avgTime).toBe(30);
  });

  it("excludes zero-time rows even when not marked skipped", () => {
    const r = computeSessionAverages([
      task({ time_seconds: 0, completion_status: "success" }),
      task({ time_seconds: 50 }),
    ]);
    expect(r.avgTime).toBe(50);
    expect(Number.isFinite(r.timeEfficiency!)).toBe(true);
  });

  it("handles string numerics from Postgres", () => {
    const r = computeSessionAverages([
      task({ time_seconds: "45.5" as unknown as number }),
    ]);
    expect(r.avgTime).toBeCloseTo(45.5);
  });

  it("returns nulls when nothing is measurable", () => {
    const r = computeSessionAverages([
      task({
        time_seconds: null,
        action_count: null,
        seq_rating: null,
        completion_status: null,
      }),
    ]);
    expect(r).toEqual({
      avgTime: null,
      timeEfficiency: null,
      avgActions: null,
      avgSeq: null,
    });
  });

  it("computes efficiency only over tasks with an optimal baseline", () => {
    const r = computeSessionAverages([
      task({ time_seconds: 30, template_tasks: { optimal_time_seconds: 15 } }),
      task({ time_seconds: 99, template_tasks: { optimal_time_seconds: null } }),
    ]);
    expect(r.timeEfficiency).toBe(50);
  });
});
