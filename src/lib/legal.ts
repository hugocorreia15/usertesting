/**
 * The details a deployment has to fill in before its legal pages mean anything.
 *
 * These pages are written for a specific deployment, not for the software in
 * general: who the controller is, where to write, and which supervisory
 * authority hears a complaint all depend on who is running the instance. They
 * are gathered here rather than scattered through the prose so that a fork can
 * change them in one place, and so the pages can say plainly when they have not
 * been filled in yet instead of quietly showing a placeholder as if it were a
 * real company.
 */

export interface LegalEntity {
  /** The natural or legal person who decides why and how data is processed. */
  controllerName: string;
  /** A postal address. The GDPR expects an identity a person can actually reach. */
  address: string;
  /** Where a data subject writes to exercise their rights. */
  contactEmail: string;
  /** Only if one has been appointed; most small deployments have not. */
  dpoEmail?: string;
  /** Where the hosted database and files physically live. */
  hostingRegion: string;
  /** Country whose supervisory authority is competent. */
  supervisoryAuthority: string;
  supervisoryAuthorityUrl: string;
}

export const LEGAL_ENTITY: LegalEntity = {
  controllerName: "Hugo Correia",
  // Incomplete: this is a postal code, not an address anyone could write to.
  // Article 13 GDPR expects contact details a data subject can actually use,
  // so add the street and locality before relying on these pages.
  address: "Rua Fernando Pessoa Lote 26, 3800-740, Portugal",
  contactEmail: "hf_correya@hotmail.com",
  hostingRegion: "the European Union",
  supervisoryAuthority: "Comissão Nacional de Proteção de Dados (CNPD)",
  supervisoryAuthorityUrl: "https://www.cnpd.pt",
};

/** Nothing on the legal pages should pretend to be filled in when it is not. */
export function entityIsConfigured(e: LegalEntity = LEGAL_ENTITY): boolean {
  return !!(e.controllerName.trim() && e.address.trim() && e.contactEmail.trim());
}

/** The date the current wording took effect, shown on each page. */
export const LEGAL_LAST_UPDATED = "2026-09-22";

/**
 * The version account holders accept, stored with each acceptance.
 *
 * Change this when the terms or the privacy notice change materially, and
 * every account is asked again on its next visit: an acceptance records which
 * wording was agreed to, so a later version is not covered by an earlier
 * answer. Cosmetic edits should not change it, because asking again for
 * nothing trains people to click through.
 */
export const LEGAL_VERSION = "2026-09-22";

/** The documents that must be accepted to hold an account. */
export const REQUIRED_DOCUMENTS = ["terms", "privacy"] as const;
export type LegalDocument = (typeof REQUIRED_DOCUMENTS)[number];

/**
 * Whether the application must be replaced by the acceptance gate.
 *
 * Written here rather than inline in the root layout so the rule has one
 * definition and can be tested. The default matters: an unknown answer must
 * not block, or someone who has already accepted sees the gate on every load,
 * and it must not open either, which is why it turns on `accepted === false`
 * rather than on a falsy value.
 */
export function shouldBlockUntilAccepted(input: {
  signedIn: boolean;
  /** Login, join, or complete-profile: pages that precede having an account. */
  onBarePage: boolean;
  /** The documents themselves, which must stay readable while the gate is up. */
  onLegalPage: boolean;
  loading: boolean;
  accepted: boolean | undefined;
}): boolean {
  return (
    input.signedIn &&
    !input.onBarePage &&
    !input.onLegalPage &&
    !input.loading &&
    input.accepted === false
  );
}
