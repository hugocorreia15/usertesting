/**
 * Which sessions of a study may contribute participant text to a summary, and
 * why the others may not.
 *
 * This mirrors sessions_with_participant_text_ai() in migration 059 exactly. It
 * is not the enforcement: the database refuses on its own, and the edge
 * function only ever sends what that function returns. This exists so the
 * person running a study can answer the question an ethics reviewer asks,
 * which is not "is it on" but "whose answers went, and whose did not".
 *
 * The case worth noticing is a study that turns this on after running sessions.
 * Enabling stamps the moment it was enabled, so every session already finished
 * consented earlier and is excluded for good. That is correct, and it is also
 * surprising, so the interface says it plainly rather than showing a zero.
 */

export type ConsentState =
  /** Consented at or after the clause was in the consent text. */
  | "eligible"
  /** Consented, but before this study turned participant text on. */
  | "before_clause"
  /** Never accepted a consent at all. */
  | "no_consent"
  /** A pilot, excluded from every study aggregate. */
  | "pilot";

export interface SessionConsent {
  id: string;
  consent_accepted_at: string | null;
  is_pilot: boolean;
}

export function classifySessionConsent(
  session: SessionConsent,
  /** templates.ai_participant_text_from, or null if never turned on. */
  from: string | null,
): ConsentState {
  // A pilot is out regardless of consent, so it is checked first and never
  // reported as a consent problem it does not have.
  if (session.is_pilot) return "pilot";
  if (!session.consent_accepted_at) return "no_consent";
  // Not yet turned on: enabling would stamp now, so nothing already run
  // could qualify.
  if (!from) return "before_clause";
  return session.consent_accepted_at >= from ? "eligible" : "before_clause";
}

export interface ConsentOverview {
  total: number;
  eligible: number;
  beforeClause: number;
  noConsent: number;
  pilots: number;
  states: Record<string, ConsentState>;
  /** True when turning it on now would exclude every session already run. */
  everySessionWouldBeExcluded: boolean;
}

export function consentOverview(
  sessions: readonly SessionConsent[],
  from: string | null,
): ConsentOverview {
  const states: Record<string, ConsentState> = {};
  let eligible = 0;
  let beforeClause = 0;
  let noConsent = 0;
  let pilots = 0;

  for (const s of sessions) {
    const state = classifySessionConsent(s, from);
    states[s.id] = state;
    if (state === "eligible") eligible++;
    else if (state === "before_clause") beforeClause++;
    else if (state === "no_consent") noConsent++;
    else pilots++;
  }

  return {
    total: sessions.length,
    eligible,
    beforeClause,
    noConsent,
    pilots,
    states,
    everySessionWouldBeExcluded:
      !from && sessions.some((s) => !s.is_pilot) && eligible === 0,
  };
}

/** One sentence a person can read without counting rows. */
export function describeConsent(o: ConsentOverview): string {
  if (o.total === 0) return "No sessions yet.";
  const parts: string[] = [`${o.eligible} of ${o.total - o.pilots} sessions eligible`];
  if (o.beforeClause > 0) parts.push(`${o.beforeClause} consented before the clause`);
  if (o.noConsent > 0) parts.push(`${o.noConsent} never consented`);
  if (o.pilots > 0) parts.push(`${o.pilots} pilot${o.pilots === 1 ? "" : "s"} excluded`);
  return parts.join(", ") + ".";
}
