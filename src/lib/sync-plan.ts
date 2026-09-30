/**
 * What a template save should do to a child table.
 *
 * Saving a template used to delete every row of some child tables and reinsert
 * them. That is not equivalent, because the reinserted rows get new
 * identifiers, and participant data points at the old ones:
 *
 *   task_question_answers.question_id -> task_questions      ON DELETE CASCADE
 *   error_logs.error_type_id          -> template_error_types ON DELETE CASCADE
 *   interview_answers.question_id     -> template_questions   ON DELETE CASCADE
 *
 * So an ordinary edit, changing a task's wording, silently deleted every
 * answer, every logged error and every interview response from every session
 * already run. The only answers left were those recorded after the most recent
 * save, which is how it was noticed: one session had data and the rest did not.
 *
 * Keeping a row that is still present is therefore not an optimization. It is
 * the difference between editing a protocol and destroying the study.
 */

export interface SyncPlan<T> {
  /** Rows whose id already exists: written in place, keeping their id. */
  toUpdate: T[];
  /** Rows the editor added, with a client-generated id. */
  toInsert: T[];
  /** Ids the editor removed, and only those. */
  toDeleteIds: string[];
}

/**
 * Split incoming rows against what the database already holds.
 *
 * An incoming row without an id is always an insert: an editor that has lost
 * track of which row it is editing must not be able to claim an existing one.
 */
export function planSync<T extends { id?: string | null }>(
  existingIds: readonly string[],
  incoming: readonly T[],
): SyncPlan<T> {
  const existing = new Set(existingIds);
  const keep = new Set<string>();

  const toUpdate: T[] = [];
  const toInsert: T[] = [];

  for (const row of incoming) {
    if (row.id && existing.has(row.id)) {
      keep.add(row.id);
      toUpdate.push(row);
    } else {
      toInsert.push(row);
    }
  }

  return {
    toUpdate,
    toInsert,
    toDeleteIds: existingIds.filter((id) => !keep.has(id)),
  };
}
