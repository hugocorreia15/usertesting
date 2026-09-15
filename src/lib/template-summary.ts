/**
 * What a template card should say about a study at a glance.
 *
 * The list used to show a name, a truncated description, an unlabelled date and
 * whether it was public. None of that answers the question someone opening this
 * page actually has, which is where each study has got to: has it been
 * approved, has anyone run a session, is there a consent step, is it ready to
 * send to a participant.
 *
 * Kept separate from the card so the rules can be tested, and so the same
 * summary can be shown in the list and in the preview without the two drifting.
 */

export interface TemplateFacts {
  tasks: number;
  sessions: number;
  inspections: number;
  reviewMode: "off" | "advisory" | "required";
  reviewStatus: "draft" | "submitted" | "approved" | "changes_requested";
  approvalInvalidatedAt?: string | null;
  hasConsent: boolean;
  isShared: boolean;
  isPublic: boolean;
  requiresInspection: boolean;
}

export type Tone = "neutral" | "good" | "warning";

export interface Chip {
  label: string;
  tone: Tone;
  /** Why it says that, for the tooltip. */
  title?: string;
}

/**
 * The state of the review gate, in the words the gate itself uses.
 * "off" produces nothing: a study with no review requirement should not carry a
 * badge saying so on every card.
 */
export function reviewChip(f: TemplateFacts): Chip | null {
  if (f.reviewMode === "off") return null;

  if (f.approvalInvalidatedAt && f.reviewStatus === "draft") {
    return {
      label: "Approval lapsed",
      tone: "warning",
      title: "The protocol changed after it was approved, so it needs approving again.",
    };
  }

  switch (f.reviewStatus) {
    case "approved":
      return { label: "Approved", tone: "good" };
    case "submitted":
      return { label: "Waiting for review", tone: "neutral" };
    case "changes_requested":
      return { label: "Changes requested", tone: "warning" };
    default:
      return f.reviewMode === "required"
        ? {
            label: "Not submitted",
            tone: "warning",
            title: "This organization requires review before sessions count.",
          }
        : { label: "Draft", tone: "neutral" };
  }
}

/** The counts, written so that one task does not read as "1 tasks". */
export function countChips(f: TemplateFacts): Chip[] {
  const chips: Chip[] = [
    {
      label: f.tasks === 1 ? "1 task" : `${f.tasks} tasks`,
      tone: f.tasks === 0 ? "warning" : "neutral",
      title: f.tasks === 0 ? "A study with no tasks cannot be run." : undefined,
    },
    {
      label: f.sessions === 1 ? "1 session" : `${f.sessions} sessions`,
      tone: "neutral",
    },
  ];
  if (f.inspections > 0) {
    chips.push({
      label: f.inspections === 1 ? "1 inspection" : `${f.inspections} inspections`,
      tone: "neutral",
    });
  }
  return chips;
}

/**
 * What would stop this study being run, or make its results hard to defend.
 * Ordered by what blocks first: a study with no tasks cannot start at all, a
 * study awaiting approval cannot count, and a study with no consent step can
 * run but should not.
 */
export function attentionItems(f: TemplateFacts): string[] {
  const items: string[] = [];

  if (f.tasks === 0) items.push("No tasks yet, so there is nothing to run");

  if (f.reviewMode === "required" && f.reviewStatus !== "approved") {
    items.push(
      f.reviewStatus === "changes_requested"
        ? "Changes were requested before this can be approved"
        : "Not approved yet, and this organization requires review",
    );
  }

  if (f.approvalInvalidatedAt && f.reviewStatus === "draft" && f.reviewMode !== "off") {
    items.push("The protocol changed after approval, so it needs approving again");
  }

  if (!f.hasConsent) {
    items.push(
      f.sessions > 0
        ? "No consent step, and sessions have already run"
        : "No consent step yet",
    );
  }

  if (f.requiresInspection && f.inspections === 0) {
    items.push("An inspection is required before testing, and there is none");
  }

  return items;
}

/** One line for a study that has nothing wrong with it. */
export function readiness(f: TemplateFacts): Chip {
  const problems = attentionItems(f);
  if (problems.length > 0) {
    return {
      label: problems.length === 1 ? "1 thing to fix" : `${problems.length} things to fix`,
      tone: "warning",
      title: problems.join(". ") + ".",
    };
  }
  return f.sessions > 0
    ? { label: "Running", tone: "good" }
    : { label: "Ready to run", tone: "good" };
}
