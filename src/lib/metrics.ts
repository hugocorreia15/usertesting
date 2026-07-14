// Session-level metric aggregation shared by dashboards and tests.

export interface MetricTaskResult {
  time_seconds: number | string | null;
  action_count: number | null;
  seq_rating: number | null;
  completion_status: string | null;
  template_tasks: {
    optimal_time_seconds: number | null;
  };
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
  results: MetricTaskResult[],
): SessionAveragesResult {
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
