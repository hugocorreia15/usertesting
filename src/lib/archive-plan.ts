import { planSync } from "./sync-plan";

/**
 * What a template save should do to a child table once answers exist.
 *
 * A row nobody has answered is a draft: edit it in place, remove it outright.
 * A row somebody has answered is a historical fact, and both of the obvious
 * operations destroy the record:
 *
 *   removing it   deletes every answer, through the cascade on its id
 *   rewording it  keeps the answers and attaches them to text nobody was asked
 *
 * The second is the quieter of the two. An export then reports responses under
 * a question that did not exist when they were given, and nothing anywhere
 * says so.
 *
 * So an answered row is never rewritten and never deleted. Removing it
 * archives it; rewording it archives it and creates its successor, and the
 * answers stay on the original with the wording they were given under.
 */

export interface ArchivePlan<T> {
  /** Unanswered rows still in the protocol: written in place. */
  toUpdate: T[];
  /** Rows the editor added, plus successors to reworded answered rows. */
  toInsert: T[];
  /** Answered rows being replaced: archived and pointed at their successor. */
  toSupersede: { id: string; replacement: T }[];
  /** Answered rows the editor removed: archived, keeping their answers. */
  toArchiveIds: string[];
  /** Unanswered rows the editor removed: deleted, since they hold nothing. */
  toDeleteIds: string[];
}

/**
 * @param existingIds  ids currently in the database
 * @param incoming     rows as the editor has them, carrying an id when known
 * @param answerCounts how much participant data each id holds
 * @param changed      whether the editor's version differs from the stored one
 */
export function planArchive<T extends { id?: string | null }>(
  existingIds: readonly string[],
  incoming: readonly T[],
  answerCounts: ReadonlyMap<string, number>,
  changed: (row: T, id: string) => boolean,
): ArchivePlan<T> {
  const base = planSync(existingIds, incoming);
  const answered = (id: string) => (answerCounts.get(id) ?? 0) > 0;

  const toUpdate: T[] = [];
  const toInsert: T[] = [...base.toInsert];
  const toSupersede: { id: string; replacement: T }[] = [];

  for (const row of base.toUpdate) {
    const id = row.id as string;
    if (!answered(id) || !changed(row, id)) {
      // Nothing recorded against it, or nothing about it changed. Either way
      // writing it in place loses nothing.
      toUpdate.push(row);
      continue;
    }
    // Answered and edited: the original keeps its wording and its answers.
    toSupersede.push({ id, replacement: row });
  }

  return {
    toUpdate,
    toInsert,
    toSupersede,
    toArchiveIds: base.toDeleteIds.filter(answered),
    toDeleteIds: base.toDeleteIds.filter((id) => !answered(id)),
  };
}
