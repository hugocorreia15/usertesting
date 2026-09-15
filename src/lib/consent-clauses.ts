/**
 * The standard pieces of a usability test consent text.
 *
 * Students asked to write consent prose from a blank box write bad consent
 * prose: they describe the product and forget that the person may stop, or
 * they promise anonymity for a session they are about to record. A short
 * catalogue of sentences turns it into a checklist, which is also how an
 * ethics reviewer reads it.
 *
 * The sentences are deliberately plain. Consent text that a participant cannot
 * follow is not consent, and the reading age of a clause matters more than its
 * legal polish for a class exercise.
 *
 * The clause about automated processing is NOT here. It lives in the database,
 * in ai_consent_clause(), because set_participant_text_ai() checks the consent
 * text against it character for character. Two copies would drift, and the
 * failure would be silent: a study that looks opted in and is refused.
 */

export interface ConsentClause {
  id: string;
  /** What the person building the text ticks. */
  label: string;
  /** What the participant reads. */
  sentence: string;
  /** Ticked by default, because leaving it out is nearly always a mistake. */
  recommended: boolean;
  hint?: string;
}

export const CONSENT_CLAUSES: readonly ConsentClause[] = [
  {
    id: "voluntary",
    label: "Taking part is voluntary",
    sentence: "Taking part is voluntary.",
    recommended: true,
  },
  {
    id: "withdraw",
    label: "They may stop at any time",
    sentence: "You may stop at any time, without giving a reason, and nothing you have done so far will be used.",
    recommended: true,
    hint: "The one clause an ethics reviewer looks for first.",
  },
  {
    id: "not_a_test",
    label: "We are testing the system, not them",
    sentence: "We are testing the system, not you. There are no wrong answers, and any difficulty you have is useful to us.",
    recommended: true,
    hint: "Reduces the pressure that makes people hide their confusion.",
  },
  {
    id: "observer_notes",
    label: "Someone is taking notes",
    sentence: "Someone will be taking written notes about what happens during the session.",
    recommended: true,
  },
  {
    id: "screen_recording",
    label: "The screen is recorded",
    sentence: "Your screen will be recorded while you work through the tasks.",
    recommended: false,
  },
  {
    id: "audio_recording",
    label: "Audio is recorded",
    sentence: "Your voice will be recorded so we can review what you said afterwards.",
    recommended: false,
  },
  {
    id: "anonymous_reporting",
    label: "Results are reported without names",
    sentence: "Results are reported without your name, and nothing that identifies you appears in any report.",
    recommended: true,
  },
  {
    id: "storage",
    label: "Data is kept by the research team only",
    sentence: "What is collected is stored securely and seen only by the research team.",
    recommended: true,
  },
] as const;

export interface ComposeInput {
  /** What this particular study is about. Study specific, so it is typed. */
  purpose: string;
  /** Ids from CONSENT_CLAUSES. */
  selected: readonly string[];
  /** ai_consent_clause() from the database, when the model clause is ticked. */
  aiClause?: string | null;
  /** Who to contact, appended last if given. */
  contact?: string;
}

/**
 * Purpose first, then what will happen, then what the person may do, then the
 * model clause, then who to ask. That is the order people read, and the order
 * the pieces stop being surprising in.
 */
export function composeConsent(input: ComposeInput): string {
  const chosen = CONSENT_CLAUSES.filter((c) => input.selected.includes(c.id));
  const parts: string[] = [];

  const purpose = input.purpose.trim();
  if (purpose) parts.push(purpose.endsWith(".") ? purpose : `${purpose}.`);

  for (const clause of chosen) parts.push(clause.sentence);

  if (input.aiClause?.trim()) parts.push(input.aiClause.trim());

  const contact = input.contact?.trim();
  if (contact) {
    parts.push(
      contact.includes("@")
        ? `If you have questions, contact ${contact}.`
        : `${contact.endsWith(".") ? contact : `${contact}.`}`,
    );
  }

  return parts.join(" ");
}

/**
 * Which clauses an existing text already contains, so opening the builder on a
 * study that has consent text pre-ticks what is there instead of proposing to
 * replace it with something different.
 */
export function clausesPresentIn(text: string | null | undefined): string[] {
  if (!text) return [];
  return CONSENT_CLAUSES.filter((c) => text.includes(c.sentence)).map((c) => c.id);
}

/** The ids ticked for a study that has nothing yet. */
export function recommendedClauseIds(): string[] {
  return CONSENT_CLAUSES.filter((c) => c.recommended).map((c) => c.id);
}

/**
 * What a text is missing that it probably should not be. Shown as a warning
 * rather than enforced: a study may genuinely not record audio, but a study
 * that never mentions stopping is an oversight every time.
 */
export function consentGaps(text: string | null | undefined): string[] {
  const present = new Set(clausesPresentIn(text));
  const gaps: string[] = [];
  if (!text || !text.trim()) return ["There is no consent text at all."];
  if (!present.has("withdraw")) gaps.push("it does not say they may stop at any time");
  if (!present.has("voluntary")) gaps.push("it does not say taking part is voluntary");
  if (!present.has("anonymous_reporting")) gaps.push("it does not say results are reported without names");
  return gaps;
}
