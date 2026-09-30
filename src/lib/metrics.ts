// Session-level metric aggregation shared by dashboards and tests.

export interface MetricTaskResult {
  time_seconds: number | string | null;
  action_count: number | null;
  seq_rating: number | null;
  completion_status: string | null;
  template_tasks: {
    optimal_time_seconds: number | null;
    is_practice?: boolean;
  };
}

// Practice (warm-up) tasks run in sessions but never count toward any
// aggregate metric.
export function excludePractice<T extends MetricTaskResult>(
  results: T[],
): T[] {
  return results.filter((r) => !r.template_tasks.is_practice);
}

export interface SessionAveragesResult {
  avgTime: number | null;
  timeEfficiency: number | null;
  avgActions: string | null;
  avgSeq: string | null;
}

// Skipped tasks have time_seconds = 0; including them either skews
// avgTime or, worse, divides by zero in the efficiency formula and
// yields Infinity. Exclude them from both time metrics.
export function computeSessionAverages(
  allResults: MetricTaskResult[],
): SessionAveragesResult {
  const results = excludePractice(allResults);
  const timeTasks = results.filter(
    (r) =>
      r.time_seconds != null &&
      Number(r.time_seconds) > 0 &&
      r.completion_status !== "skipped",
  );
  const avgTime =
    timeTasks.length > 0
      ? timeTasks.reduce((s, r) => s + Number(r.time_seconds), 0) /
        timeTasks.length
      : null;

  const optTimeTasks = timeTasks.filter(
    (r) => r.template_tasks.optimal_time_seconds != null,
  );
  const timeEfficiency =
    optTimeTasks.length > 0
      ? Math.round(
          (optTimeTasks.reduce(
            (s, r) =>
              s +
              r.template_tasks.optimal_time_seconds! / Number(r.time_seconds!),
            0,
          ) /
            optTimeTasks.length) *
            100,
        )
      : null;

  const actionTasks = results.filter((r) => r.action_count != null);
  const avgActions =
    actionTasks.length > 0
      ? (
          actionTasks.reduce((s, r) => s + r.action_count!, 0) /
          actionTasks.length
        ).toFixed(1)
      : null;

  const seqTasks = results.filter((r) => r.seq_rating != null);
  const avgSeq =
    seqTasks.length > 0
      ? (
          seqTasks.reduce((s, r) => s + r.seq_rating!, 0) / seqTasks.length
        ).toFixed(1)
      : null;

  return { avgTime, timeEfficiency, avgActions, avgSeq };
}

/**
 * Which measurements a session actually carries.
 *
 * A session's task_results rows are created when the session is created, one
 * per task, with every measurement null. Counting rows therefore says nothing
 * about whether anything was measured: a session that was never run has the
 * same number of rows as one that was. Asking what is filled in is the only
 * question worth asking, and it is what separates "nothing was recorded" from
 * "this study did not measure time".
 */
export interface SessionMeasurements {
  /** Rows exist, which they always do, but nothing has been filled in. */
  empty: boolean;
  hasTime: boolean;
  hasActions: boolean;
  hasSeq: boolean;
  hasOutcomes: boolean;
}

export function sessionMeasurements(
  allResults: MetricTaskResult[],
): SessionMeasurements {
  const results = excludePractice(allResults);
  const hasTime = results.some(
    (r) => r.time_seconds != null && Number(r.time_seconds) > 0,
  );
  const hasActions = results.some((r) => r.action_count != null);
  const hasSeq = results.some((r) => r.seq_rating != null);
  const hasOutcomes = results.some((r) => r.completion_status != null);

  return {
    empty: !hasTime && !hasActions && !hasSeq && !hasOutcomes,
    hasTime,
    hasActions,
    hasSeq,
    hasOutcomes,
  };
}

/**
 * One line explaining an absence, or null when there is nothing to explain.
 *
 * A dash in a results table is read as a fault. Most of the time it is not:
 * a study whose tasks are an instruction sheet and a questionnaire has no
 * durations to report, and never did. Saying which of the two it is costs a
 * sentence and saves the reader guessing.
 */
export function describeMissingMeasures(
  allResults: MetricTaskResult[],
): string | null {
  const m = sessionMeasurements(allResults);
  if (m.empty) {
    return "Nothing was recorded for this session.";
  }
  if (!m.hasTime && !m.hasActions) {
    return "No time or actions were logged, so the averages above come only from what the participant answered.";
  }
  if (!m.hasTime) {
    return "No task was timed in this session, so time and efficiency are unavailable.";
  }
  return null;
}
