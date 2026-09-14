import { describe, expect, it } from "vitest";
import {
  moderationMomentsByTask,
  summarizeModeration,
  type ModerationEvent,
  type ModerationKind,
  type ModerationResult,
} from "../moderation";

let seq = 0;
const ev = (kind: ModerationKind, task_id: string | null = "t1", timer_seconds: number | null = null): ModerationEvent => ({
  seq: ++seq,
  session_id: "s",
  task_id,
  task_index: 0,
  kind,
  timer_seconds,
  occurred_at: "",
});

const res = (task_id: string, over: Partial<ModerationResult> = {}): ModerationResult => ({
  task_id,
  task_name: `Task ${task_id}`,
  is_practice: false,
  completion_status: "success",
  action_count: 3,
  error_count: 0,
  hesitation_count: 0,
  ...over,
});

describe("summarizeModeration", () => {
  it("does not call a session clean when nobody was recording it", () => {
    const s = summarizeModeration({ events: [], results: [res("t1")] });
    expect(s.recorded).toBe(false);
    expect(s.undos.total).toBe(0);
  });

  it("treats a recorded session with no corrections as recorded", () => {
    const s = summarizeModeration({ events: [ev("logging_started", null)], results: [res("t1")] });
    expect(s.recorded).toBe(true);
    expect(s.undos.total).toBe(0);
    expect(s.resets).toEqual([]);
  });

  it("counts each kind of correction", () => {
    const s = summarizeModeration({
      events: [
        ev("logging_started", null),
        ev("undo_action"),
        ev("undo_error"),
        ev("undo_error"),
        ev("undo_hesitation"),
        ev("step_back"),
        ev("timer_reset"),
      ],
      results: [res("t1")],
    });
    expect(s.undos).toEqual({ action: 1, error: 2, hesitation: 1, total: 4 });
    expect(s.stepBacks).toBe(1);
    expect(s.timerResets).toBe(1);
  });

  it("names reset tasks, including one since removed from the protocol", () => {
    const s = summarizeModeration({
      events: [ev("logging_started", null), ev("task_reset", "t2", 41.5), ev("task_reset", "gone")],
      results: [res("t1"), res("t2")],
    });
    expect(s.resets).toEqual([
      { taskId: "t2", taskName: "Task t2", timerSeconds: 41.5 },
      { taskId: "gone", taskName: "a task no longer in the protocol", timerSeconds: null },
    ]);
  });

  it("lists skipped measured tasks and successes with nothing counted", () => {
    const s = summarizeModeration({
      events: [],
      results: [
        res("a", { completion_status: "skipped" }),
        res("b", { action_count: 0 }),
        res("c", { action_count: null }),
        res("d", { action_count: 0, hesitation_count: 1 }),
        res("p", { is_practice: true, completion_status: "skipped" }),
      ],
    });
    expect(s.skipped).toEqual(["Task a"]);
    // d had a hesitation logged, so something was being recorded.
    expect(s.silentSuccesses).toEqual(["Task b", "Task c"]);
  });
});

describe("moderationMomentsByTask", () => {
  it("weights a reset above an undone entry", () => {
    const m = moderationMomentsByTask([
      ev("task_reset", "t1"),
      ev("undo_error", "t2"),
      ev("undo_error", "t2"),
      ev("undo_hesitation", "t2"),
    ]);
    expect(m.get("t1")).toEqual({ reasons: ["reset and attempted again"], weight: 3 });
    expect(m.get("t2")).toEqual({
      reasons: ["2 logged errors undone", "1 logged hesitation undone"],
      weight: 2,
    });
  });

  it("ignores the marker, timer resets and events with no task", () => {
    const m = moderationMomentsByTask([ev("logging_started", null), ev("timer_reset", "t1"), ev("undo_action", null)]);
    expect(m.size).toBe(0);
  });
});
