/**
 * Validation for what a model proposes during consolidation.
 *
 * The model is asked to group findings that describe the same problem and to
 * name the heuristic each group violates. Its answer is untrusted input, in the
 * strict sense: it can invent finding ids that do not exist, put one finding in
 * two groups, return a heuristic code from a different set, or a severity of
 * 11. None of that may reach the database, and none of it should be silently
 * swallowed either, because a team deciding whether to trust a suggestion
 * deserves to know the model referred to three findings that do not exist.
 *
 * So this module is deliberately suspicious. It keeps only what it can match
 * against rows the caller already holds, and reports everything it discarded.
 */

export interface MergeCluster {
  title: string;
  findingIds: string[];
  /** A code from the inspection's own heuristic set, or null. */
  heuristicCode: string | null;
  /** Nielsen's 0..4, or null. */
  severity: number | null;
}

export interface Discarded {
  reason:
    | "unknown finding"
    | "finding already in another group"
    | "no findings left"
    | "no title"
    | "unknown heuristic"
    | "unusable severity"
    | "beyond the cluster limit";
  count: number;
}

export interface ValidatedSuggestion {
  clusters: MergeCluster[];
  discarded: Discarded[];
}

/** More than this from one inspection is a runaway answer, not a proposal. */
export const MAX_CLUSTERS = 60;
const MAX_TITLE = 160;

interface RawCluster {
  title?: unknown;
  finding_ids?: unknown;
  heuristic_code?: unknown;
  severity?: unknown;
}

function asArray(raw: unknown): RawCluster[] {
  if (Array.isArray(raw)) return raw as RawCluster[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["clusters", "problems", "groups"]) {
      if (Array.isArray(obj[key])) return obj[key] as RawCluster[];
    }
  }
  return [];
}

export function validateMergeSuggestion(
  raw: unknown,
  context: { findingIds: readonly string[]; heuristicCodes: readonly string[] },
): ValidatedSuggestion {
  const known = new Set(context.findingIds);
  const codes = new Set(context.heuristicCodes.map((c) => c.toUpperCase()));
  const used = new Set<string>();
  const tally = new Map<Discarded["reason"], number>();
  const drop = (reason: Discarded["reason"], n = 1) =>
    tally.set(reason, (tally.get(reason) ?? 0) + n);

  const clusters: MergeCluster[] = [];

  for (const rawCluster of asArray(raw)) {
    if (clusters.length >= MAX_CLUSTERS) {
      drop("beyond the cluster limit");
      continue;
    }

    const ids: string[] = [];
    const candidates = Array.isArray(rawCluster.finding_ids) ? rawCluster.finding_ids : [];
    for (const id of candidates) {
      if (typeof id !== "string" || !known.has(id)) {
        drop("unknown finding");
        continue;
      }
      // One finding belongs to one problem. The first group wins, so a model
      // that lists a finding twice cannot attach it to two problems.
      if (used.has(id)) {
        drop("finding already in another group");
        continue;
      }
      used.add(id);
      ids.push(id);
    }

    if (ids.length === 0) {
      drop("no findings left");
      continue;
    }

    const title = typeof rawCluster.title === "string" ? rawCluster.title.trim() : "";
    if (title.length === 0) {
      // Without a title nobody can judge the grouping, and the ids are released
      // so a later group may still claim them.
      for (const id of ids) used.delete(id);
      drop("no title");
      continue;
    }

    let heuristicCode: string | null = null;
    if (typeof rawCluster.heuristic_code === "string" && rawCluster.heuristic_code.trim()) {
      const code = rawCluster.heuristic_code.trim().toUpperCase();
      if (codes.has(code)) heuristicCode = code;
      else drop("unknown heuristic");
    }

    let severity: number | null = null;
    if (rawCluster.severity !== null && rawCluster.severity !== undefined) {
      const value = Number(rawCluster.severity);
      if (Number.isInteger(value) && value >= 0 && value <= 4) severity = value;
      else drop("unusable severity");
    }

    clusters.push({
      title: title.slice(0, MAX_TITLE),
      findingIds: ids,
      heuristicCode,
      severity,
    });
  }

  return {
    clusters,
    discarded: [...tally.entries()].map(([reason, count]) => ({ reason, count })),
  };
}

/**
 * One line a team can read before trusting a proposal. Takes the loose shape,
 * because a stored payload is JSON and carries no guarantee of the union above.
 */
export function describeDiscarded(
  discarded: readonly { reason: string; count: number }[],
): string | null {
  if (discarded.length === 0) return null;
  const parts = discarded.map((d) => `${d.count} ${d.reason}`);
  return `Ignored from the model's answer: ${parts.join(", ")}.`;
}
