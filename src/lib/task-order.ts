// Task presentation order for a session. The chosen strategy is applied
// once at session creation; the concrete order is materialized into
// task_results.sort_order, so live mode and reports need no changes.

export const TASK_ORDER_STRATEGIES = [
  "fixed",
  "shuffled",
  "latin_square",
] as const;
export type TaskOrderStrategy = (typeof TASK_ORDER_STRATEGIES)[number];

export const TASK_ORDER_LABELS: Record<TaskOrderStrategy, string> = {
  fixed: "Fixed (template order)",
  shuffled: "Shuffled per session",
  latin_square: "Latin square (rotating)",
};

/**
 * Apply an ordering strategy to a task-id list.
 *
 * - fixed: template order, unchanged.
 * - shuffled: independent Fisher–Yates permutation per session.
 * - latin_square: rotate by `rotationIndex` positions, so across k
 *   consecutive sessions every task appears at every position exactly
 *   once (classic order counterbalancing).
 *
 * `rng` is injectable for deterministic tests.
 */
export function applyTaskOrder(
  taskIds: readonly string[],
  strategy: TaskOrderStrategy,
  rotationIndex = 0,
  rng: () => number = Math.random,
): string[] {
  const ids = [...taskIds];
  if (ids.length <= 1 || strategy === "fixed") return ids;

  if (strategy === "shuffled") {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  }

  // latin_square rotation
  const offset = ((rotationIndex % ids.length) + ids.length) % ids.length;
  return [...ids.slice(offset), ...ids.slice(0, offset)];
}

/**
 * Session task order with practice-task pinning: warm-up tasks keep
 * their template order at the START of the session; the ordering
 * strategy applies only to the measured tasks that follow.
 */
export function orderSessionTasks(
  tasks: readonly { id: string; is_practice?: boolean | null }[],
  strategy: TaskOrderStrategy,
  rotationIndex = 0,
  rng: () => number = Math.random,
): string[] {
  const practice = tasks.filter((t) => t.is_practice).map((t) => t.id);
  const measured = tasks.filter((t) => !t.is_practice).map((t) => t.id);
  return [...practice, ...applyTaskOrder(measured, strategy, rotationIndex, rng)];
}
