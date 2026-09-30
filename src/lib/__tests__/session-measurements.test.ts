import { describe, expect, it } from "vitest";
import { describeMissingMeasures, sessionMeasurements } from "../metrics";

/**
 * The case these were written for: a VR study whose two tasks were an
 * instruction sheet and a post-experience questionnaire. Both were marked
 * successful, both collected a SEQ rating, and neither was timed, which the
 * session card reported as four dashes and a reader reported as "no
 * information".
 */
const row = (over: Partial<Record<string, unknown>> = {}) =>
  ({
    time_seconds: null,
    action_count: null,
    error_count: 0,
    hesitation_count: 0,
    seq_rating: null,
    completion_status: null,
    template_tasks: { optimal_time_seconds: null, is_practice: false },
    ...over,
  }) as never;

describe("sessionMeasurements", () => {
  it("calls a freshly created session empty, though its rows exist", () => {
    // Skeleton rows are inserted when the session is created, so counting them
    // would say this session had data.
    const m = sessionMeasurements([row(), row(), row()]);
    expect(m.empty).toBe(true);
    expect(m).toMatchObject({ hasTime: false, hasActions: false, hasSeq: false });
  });

  it("does not call a session empty once anything is filled in", () => {
    expect(sessionMeasurements([row({ completion_status: "success" })]).empty).toBe(false);
    expect(sessionMeasurements([row({ seq_rating: 6 })]).empty).toBe(false);
    expect(sessionMeasurements([row({ action_count: 0 })]).empty).toBe(false);
  });

  it("treats an action count of zero as recorded, not as absent", () => {
    // Zero actions is a measurement. Absent is different, and the difference
    // is exactly what the reader is trying to establish.
    const m = sessionMeasurements([row({ action_count: 0 })]);
    expect(m.hasActions).toBe(true);
  });

  it("treats a time of zero as not timed", () => {
    expect(sessionMeasurements([row({ time_seconds: 0 })]).hasTime).toBe(false);
    expect(sessionMeasurements([row({ time_seconds: 12 })]).hasTime).toBe(true);
  });

  it("ignores practice tasks, as the averages do", () => {
    const practice = row({
      time_seconds: 30,
      template_tasks: { optimal_time_seconds: null, is_practice: true },
    });
    expect(sessionMeasurements([practice]).hasTime).toBe(false);
  });
});

describe("describeMissingMeasures", () => {
  it("says so when nothing was recorded at all", () => {
    expect(describeMissingMeasures([row(), row()])).toBe(
      "Nothing was recorded for this session.",
    );
  });

  it("explains the reported case: answers but no logging", () => {
    const answered = [
      row({ completion_status: "success", seq_rating: 7 }),
      row({ completion_status: "success", seq_rating: 6 }),
    ];
    expect(describeMissingMeasures(answered)).toContain(
      "only from what the participant answered",
    );
  });

  it("mentions just time when actions were logged but nothing was timed", () => {
    const acted = [row({ completion_status: "success", action_count: 4 })];
    expect(describeMissingMeasures(acted)).toBe(
      "No task was timed in this session, so time and efficiency are unavailable.",
    );
  });

  it("says nothing when a session was measured normally", () => {
    const full = [row({ completion_status: "success", time_seconds: 41, action_count: 6 })];
    expect(describeMissingMeasures(full)).toBeNull();
  });
});
