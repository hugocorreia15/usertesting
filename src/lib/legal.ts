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
  address: "3800-740, Portugal",
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
