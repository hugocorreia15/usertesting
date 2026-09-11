/**
 * Instructor gate: the per-template review workflow and what it permits.
 *
 * The rule, decided against the plain "no sessions until approved" gate:
 * recruiting is gated, rehearsal is not. While a template that requires
 * review is unapproved, join links cannot be created by anyone but an org
 * owner, and any session run directly is recorded as a pilot, excluded from
 * the template's aggregates. The instructor then reviews with the protocol
 * review's findings and the pilot data in hand.
 *
 * These predicates mirror the SQL in migration 050 exactly. The database is
 * the authority; this file lets the UI explain a refusal before it happens.
 */

export type ReviewMode = "off" | "advisory" | "required";
export type ReviewStatus = "draft" | "submitted" | "approved" | "changes_requested";

export interface ReviewableTemplate {
  review_mode: ReviewMode;
  review_status: ReviewStatus;
  org_id: string | null;
}

/** What the current viewer is to the template's organization. */
export type OrgRole = "owner" | "member" | "student" | "none";

export const REVIEW_MODES: { value: ReviewMode; label: string; hint: string }[] = [
  { value: "off", label: "Off", hint: "No review workflow." },
  {
    value: "advisory",
    label: "Advisory",
    hint: "Students request review and see the decision; nothing is blocked.",
  },
  {
    value: "required",
    label: "Required",
    hint: "Join links wait for approval; sessions run before it are recorded as pilots.",
  },
];

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  draft: "Draft",
  submitted: "Awaiting review",
  approved: "Approved",
  changes_requested: "Changes requested",
};

/** The gate is only ever closed on a template that requires review and is not approved. */
export function gateClosed(t: ReviewableTemplate): boolean {
  return t.review_mode === "required" && t.review_status !== "approved";
}

/** Org owners are never gated; they are the ones who approve. */
export function recruitingAllowed(t: ReviewableTemplate, role: OrgRole): boolean {
  if (role === "owner") return true;
  return !gateClosed(t);
}

/** Same condition as recruiting: a directly created session on a closed gate is a pilot. */
export function sessionWouldBePilot(t: ReviewableTemplate, role: OrgRole): boolean {
  return !recruitingAllowed(t, role);
}

export interface ReviewActions {
  /** Owner can choose off / advisory / required. Only meaningful on org templates. */
  canSetMode: boolean;
  /** Editor can ask for review from draft or after changes were requested. */
  canRequest: boolean;
  /** Owner can approve or request changes on a submitted template. */
  canDecide: boolean;
  /** Whether the workflow is visible at all. */
  active: boolean;
}

export function reviewActions(
  t: ReviewableTemplate,
  role: OrgRole,
  canEdit: boolean,
): ReviewActions {
  const orgTemplate = t.org_id !== null;
  const active = orgTemplate && t.review_mode !== "off";
  return {
    canSetMode: orgTemplate && role === "owner",
    canRequest:
      active &&
      canEdit &&
      (t.review_status === "draft" || t.review_status === "changes_requested"),
    canDecide: active && role === "owner" && t.review_status === "submitted",
    active,
  };
}
