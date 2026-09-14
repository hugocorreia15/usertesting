/**
 * How a live session was run, from the corrections the evaluator made while
 * logging it (migration 055) and the results it produced.
 *
 * None of these is a mistake in itself. An undone error is often a good
 * correction. But together they describe the session in a way its final
 * numbers cannot: a task that was reset was attempted twice, and its recorded
 * time and errors describe only the second attempt. A task marked successful
 * with nothing counted at all is more likely unlogged than effortless.
 *
 * Sessions run before logging existed have no events, which is not the same as
 * a clean session. The live cockpit writes a logging_started marker when it
 * opens, and `recorded` is true only when that marker exists, so the interface
 * never reports "no corrections" for a session nobody was recording. A date
 * would not do: sessions run between a date and the day logging actually went
 * live would read as recorded and clean.
 */

export type ModerationKind =
  | "logging_started"
  | "undo_action"
  | "undo_error"
  | "undo_hesitation"
  | "step_back"
  | "task_reset"
  | "timer_reset";

export interface ModerationEvent {
  seq: number;
  session_id: string;
  task_id: string | null;
  task_index: number | null;
  kind: ModerationKind;
  timer_seconds: number | null;
  occurred_at: string;
}

export interface ModerationResult {
  task_id: string;
  task_name: string;
  is_practice: boolean;
  completion_status: string | null;
  action_count: number | null;
  error_count: number;
  hesitation_count: number;
}

export interface TaskReset {
  taskId: string | null;
  taskName: string;
  timerSeconds: number | null;
}

export interface ModerationSummary {
  /** False when the session predates logging, so absence of events means nothing. */
  recorded: boolean;
  undos: { action: number; error: number; hesitation: number; total: number };
  stepBacks: number;
  timerResets: number;
  resets: TaskReset[];
  skipped: string[];
  /** Measured tasks marked successful with no action, error or hesitation counted. */
  silentSuccesses: string[];
}

export function summarizeModeration(input: {
  events: readonly ModerationEvent[];
  results: readonly ModerationResult[];
}): ModerationSummary {
  const events = [...input.events].sort((a, b) => a.seq - b.seq);
  const nameOf = new Map(input.results.map((r) => [r.task_id, r.task_name]));
  const count = (k: ModerationKind) => events.filter((e) => e.kind === k).length;

  const undos = {
    action: count("undo_action"),
    error: count("undo_error"),
    hesitation: count("undo_hesitation"),
    total: 0,
  };
  undos.total = undos.action + undos.error + undos.hesitation;

  const recorded = events.some((e) => e.kind === "logging_started");

  const measured = input.results.filter((r) => !r.is_practice);

  return {
    recorded,
    undos,
    stepBacks: count("step_back"),
    timerResets: count("timer_reset"),
    resets: events
      .filter((e) => e.kind === "task_reset")
      .map((e) => ({
        taskId: e.task_id,
        taskName: (e.task_id && nameOf.get(e.task_id)) || "a task no longer in the protocol",
        timerSeconds: e.timer_seconds,
      })),
    skipped: measured.filter((r) => r.completion_status === "skipped").map((r) => r.task_name),
    silentSuccesses: measured
      .filter(
        (r) =>
          r.completion_status === "success" &&
          !r.action_count &&
          r.error_count === 0 &&
          r.hesitation_count === 0,
      )
      .map((r) => r.task_name),
  };
}

/** Per task, the corrections worth pointing at when reflecting on the session. */
export function moderationMomentsByTask(
  events: readonly ModerationEvent[],
): Map<string, { reasons: string[]; weight: number }> {
  const byTask = new Map<string, { resets: number; undoneErrors: number; undoneHesitations: number; stepBacks: number }>();
  for (const e of events) {
    if (!e.task_id) continue;
    const t = byTask.get(e.task_id) ?? { resets: 0, undoneErrors: 0, undoneHesitations: 0, stepBacks: 0 };
    if (e.kind === "task_reset") t.resets++;
    if (e.kind === "undo_error") t.undoneErrors++;
    if (e.kind === "undo_hesitation") t.undoneHesitations++;
    // A step back is recorded on the task being left.
    if (e.kind === "step_back") t.stepBacks++;
    byTask.set(e.task_id, t);
  }

  const out = new Map<string, { reasons: string[]; weight: number }>();
  for (const [taskId, t] of byTask) {
    const reasons: string[] = [];
    let weight = 0;
    if (t.resets > 0) {
      reasons.push(t.resets === 1 ? "reset and attempted again" : `reset ${t.resets} times`);
      weight += 3;
    }
    if (t.undoneErrors > 0) {
      reasons.push(`${t.undoneErrors} logged ${t.undoneErrors === 1 ? "error" : "errors"} undone`);
      weight += 1;
    }
    if (t.undoneHesitations > 0) {
      reasons.push(
        `${t.undoneHesitations} logged ${t.undoneHesitations === 1 ? "hesitation" : "hesitations"} undone`,
      );
      weight += 1;
    }
    if (t.stepBacks > 0) {
      reasons.push("left to go back to the previous task");
      weight += 1;
    }
    if (reasons.length > 0) out.set(taskId, { reasons, weight });
  }
  return out;
}
