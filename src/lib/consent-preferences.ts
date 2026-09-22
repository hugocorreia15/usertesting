/**
 * What this browser has agreed to beyond what the platform cannot work without.
 *
 * Under the ePrivacy Directive as transposed in Portugal (Lei 41/2004, art. 5)
 * and the GDPR, storing or reading anything on a visitor's device needs consent
 * unless it is strictly necessary to provide the service they asked for. Two
 * things here are not strictly necessary and therefore wait:
 *
 *   monitoring  Sentry, which reports errors so they can be fixed. It is told
 *               to send no personal data and no session replays, but it is
 *               still a request to a third party that the visitor did not ask
 *               for, so it stays off until they say yes.
 *   embeds      The walkthrough video on the help page. Loading the player
 *               contacts YouTube or Vimeo before anyone presses play, so the
 *               page shows a placeholder until this is allowed.
 *
 * Everything else is strictly necessary and is not offered as a choice,
 * because refusing it would mean refusing the service: the sign-in session,
 * the task timer that has to survive a reload mid-session, the chosen language
 * and theme. Offering a toggle that cannot honestly be turned off is worse
 * than not offering one.
 *
 * Consent must be as easy to withdraw as to give, so the stored answer is a
 * plain record that Cookie settings rewrites, and withdrawal takes effect on
 * the next page load for anything already running.
 */

export const CONSENT_STORAGE_KEY = "avalux-consent";

/** Fired on this tab when the answer changes, so the page can react at once. */
export const CONSENT_CHANGED_EVENT = "avalux-consent-changed";

/**
 * Bumped when what is asked for changes. An older answer is then treated as no
 * answer, because consent to one thing is not consent to another.
 */
export const CONSENT_VERSION = 1;

export type OptionalPurpose = "monitoring" | "embeds";

export const OPTIONAL_PURPOSES: readonly OptionalPurpose[] = ["monitoring", "embeds"];

export interface ConsentRecord {
  version: number;
  /** ISO timestamp, so it can be shown back and audited. */
  decidedAt: string;
  monitoring: boolean;
  embeds: boolean;
}

export type ConsentState = ConsentRecord | null;

function isRecord(value: unknown): value is ConsentRecord {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.version === "number" &&
    typeof v.decidedAt === "string" &&
    typeof v.monitoring === "boolean" &&
    typeof v.embeds === "boolean"
  );
}

/**
 * Reads the stored answer. Anything unreadable, malformed or from an older
 * version counts as no answer, which means nothing optional runs.
 */
export function readConsent(storage?: Pick<Storage, "getItem">): ConsentState {
  const store = storage ?? safeStorage();
  if (!store) return null;
  try {
    const raw = store.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(
  choices: Record<OptionalPurpose, boolean>,
  storage?: Pick<Storage, "setItem">,
  now: () => Date = () => new Date(),
): ConsentRecord {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    decidedAt: now().toISOString(),
    monitoring: choices.monitoring,
    embeds: choices.embeds,
  };
  const store = storage ?? safeStorage();
  try {
    store?.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    // Storage events only fire in other tabs, so anything in this one that
    // depends on the answer is told directly.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT));
    }
  } catch {
    // A browser refusing storage is not a reason to break the page. The answer
    // then lasts for this page only, which is the safe direction: it expires
    // rather than persisting something the visitor cannot later withdraw.
  }
  return record;
}

/**
 * The question has not been answered yet, so the banner is due. Note that this
 * is not "consent is false": a visitor who refused everything has answered.
 */
export function needsDecision(state: ConsentState): boolean {
  return state === null;
}

/** Whether one optional purpose may run. No answer means no. */
export function allows(state: ConsentState, purpose: OptionalPurpose): boolean {
  if (!state) return false;
  return state[purpose];
}

/** Refusing everything is a decision, and is recorded as one. */
export function rejectAll(): Record<OptionalPurpose, boolean> {
  return { monitoring: false, embeds: false };
}

export function acceptAll(): Record<OptionalPurpose, boolean> {
  return { monitoring: true, embeds: true };
}

function safeStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
