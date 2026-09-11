/**
 * Protocol review: non-blocking checks on a template against the mistakes
 * novices most often make when designing a usability test.
 *
 * Every other classroom feature of the platform observes (co-rating, CIs,
 * timelines). This one gives feedback, at the moment a student is designing
 * the study rather than after it has run. Findings are advisory: a template
 * with warnings can still be used.
 *
 * Pure and synchronous, so it is unit-tested directly and can run at display
 * time on whatever the editor currently holds.
 */
import type { TemplateWithRelations, TemplateTask } from "@/types";

export type ReviewSeverity = "warn" | "info";

/** Anchors on the in-app /help page a finding can point at. */
export type HelpAnchor = "templates" | "sessions" | "live" | "analytics";

export interface ReviewFinding {
  id: string;
  severity: ReviewSeverity;
  /** What was found, in one line. */
  title: string;
  /** Specifics: which tasks, which terms. */
  detail: string;
  /** The methodological reason it matters. */
  why: string;
  help: HelpAnchor;
  taskIds?: string[];
}

/**
 * Words that describe the interface rather than the user's goal. A task that
 * says "click the Settings tab" has told the participant where to go, which
 * is the thing the test was meant to find out.
 */
const UI_NOUNS = [
  "button",
  "menu",
  "tab",
  "icon",
  "dropdown",
  "drop-down",
  "toggle",
  "checkbox",
  "dialog",
  "modal",
  "sidebar",
  "toolbar",
  "panel",
  "link",
  "field",
];

/** Verbs that give the participant a procedure rather than a goal. */
const UI_VERBS = ["click", "tap", "press", "scroll", "drag", "navigate to", "go to"];

const termRe = (terms: string[]) =>
  new RegExp(
    `\\b(${terms.map((t) => t.replace(/[-\s]/g, "[\\s-]")).join("|")})s?\\b`,
    "gi",
  );
const NOUN_RE = termRe(UI_NOUNS);
const VERB_RE = termRe(UI_VERBS);

/** "Settings", 'Cloud Studies', “Export”: a quoted string is usually a label. */
const QUOTED_RE = /["“”']([^"“”']{2,40})["“”']/g;

export interface LeadingSignal {
  /** Procedural verbs and quoted labels: the task walks the participant through the UI. */
  strong: string[];
  /** Interface nouns alone. In a hardware study the "panel" or "button" may be the device itself. */
  weak: string[];
}

/** Terms in a task's wording that name the interface instead of the goal. */
export function leadingSignals(
  task: Pick<TemplateTask, "name" | "description">,
): LeadingSignal {
  const text = `${task.name ?? ""} ${task.description ?? ""}`;
  const strong = new Set<string>();
  const weak = new Set<string>();
  for (const m of text.matchAll(VERB_RE)) strong.add(m[1].toLowerCase());
  for (const m of text.matchAll(QUOTED_RE)) strong.add(`"${m[1]}"`);
  for (const m of text.matchAll(NOUN_RE)) weak.add(m[1].toLowerCase());
  return { strong: [...strong], weak: [...weak] };
}

/** All leading terms, strongest first. Kept for callers that only need the list. */
export function leadingTerms(task: Pick<TemplateTask, "name" | "description">): string[] {
  const { strong, weak } = leadingSignals(task);
  return [...strong, ...weak];
}

const wordCount = (s: string | null | undefined) =>
  (s ?? "").trim().split(/\s+/).filter(Boolean).length;

const listNames = (tasks: TemplateTask[], max = 3) => {
  const names = tasks.map((t) => t.name);
  return names.length <= max
    ? names.join(", ")
    : `${names.slice(0, max).join(", ")} and ${names.length - max} more`;
};

export function reviewTemplate(t: TemplateWithRelations): ReviewFinding[] {
  const findings: ReviewFinding[] = [];
  const tasks = [...(t.template_tasks ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const measured = tasks.filter((x) => !x.is_practice);

  // ── Study shape ──────────────────────────────────────────────
  if (tasks.length === 0) {
    findings.push({
      id: "no-tasks",
      severity: "warn",
      title: "No tasks",
      detail: "The template has no tasks, so a session would have nothing to measure.",
      why: "A usability test is a set of goals the participant tries to reach. Everything the platform measures hangs off a task.",
      help: "templates",
    });
    return findings;
  }

  if (measured.length < 3) {
    findings.push({
      id: "few-tasks",
      severity: "info",
      title: `Only ${measured.length} measured task${measured.length === 1 ? "" : "s"}`,
      detail: "Practice tasks are excluded from every metric.",
      why: "One or two tasks rarely localize a problem. Problem-discovery studies typically give participants several distinct goals so that failures point somewhere specific.",
      help: "templates",
    });
  }

  // ── Per-task wording ────────────────────────────────────────
  const signals = tasks.map((task) => ({ task, ...leadingSignals(task) }));
  const procedural = signals.filter((x) => x.strong.length > 0);
  if (procedural.length > 0) {
    const terms = [...new Set(procedural.flatMap((x) => x.strong))].slice(0, 6);
    findings.push({
      id: "leading-task",
      severity: "warn",
      title: `${procedural.length} task${procedural.length === 1 ? " walks" : "s walk"} the participant through the interface`,
      detail: `${listNames(procedural.map((x) => x.task))}: ${terms.join(", ")}.`,
      why: "A task should state the participant's goal in their own words. Telling them what to click, or naming the label to look for, hands them the answer the test was meant to find.",
      help: "templates",
      taskIds: procedural.map((x) => x.task.id),
    });
  }
  // Nouns alone are only a hint: "wake up the panel" is a goal when the
  // panel is the device under test.
  const nounOnly = signals.filter((x) => x.strong.length === 0 && x.weak.length > 0);
  if (nounOnly.length > 0) {
    const terms = [...new Set(nounOnly.flatMap((x) => x.weak))].slice(0, 6);
    findings.push({
      id: "interface-nouns",
      severity: "info",
      title: `${nounOnly.length} task${nounOnly.length === 1 ? "" : "s"} mention interface elements`,
      detail: `${listNames(nounOnly.map((x) => x.task))}: ${terms.join(", ")}. Fine if that is the device itself; a hint if it is a control within it.`,
      why: "Naming a button or menu can steer the participant toward it. When the word refers to the thing being tested rather than a control inside it, there is nothing to change.",
      help: "templates",
      taskIds: nounOnly.map((x) => x.task.id),
    });
  }

  const noCriterion = measured.filter((x) => wordCount(x.description) === 0);
  if (noCriterion.length > 0) {
    findings.push({
      id: "no-success-criterion",
      severity: "warn",
      title: `${noCriterion.length} task${noCriterion.length === 1 ? " has" : "s have"} no description`,
      detail: listNames(noCriterion),
      why: "The description is where the evaluator's success criterion lives. Without one, success, partial, and failure are decided differently from session to session, and from rater to rater.",
      help: "live",
      taskIds: noCriterion.map((x) => x.id),
    });
  }

  const noBaseline = measured.filter(
    (x) => x.optimal_time_seconds == null && x.optimal_actions == null,
  );
  if (noBaseline.length > 0) {
    findings.push({
      id: "no-baseline",
      severity: "warn",
      title: `${noBaseline.length} task${noBaseline.length === 1 ? " has" : "s have"} no optimal path`,
      detail: listNames(noBaseline),
      why: "Efficiency is measured against an optimal time and action count. Without a baseline the task's time and actions are recorded but cannot be scored.",
      help: "analytics",
      taskIds: noBaseline.map((x) => x.id),
    });
  }

  const wordy = tasks.filter((x) => wordCount(x.description) > 60);
  if (wordy.length > 0) {
    findings.push({
      id: "long-task-text",
      severity: "info",
      title: `${wordy.length} task description${wordy.length === 1 ? " is" : "s are"} over 60 words`,
      detail: listNames(wordy),
      why: "Participants read task text on a phone, once, while being watched. Long instructions get skimmed, and what they missed becomes noise in the error log.",
      help: "templates",
      taskIds: wordy.map((x) => x.id),
    });
  }

  // ── Instruments and taxonomy ─────────────────────────────────
  if ((t.template_error_types ?? []).length === 0) {
    findings.push({
      id: "no-error-taxonomy",
      severity: "warn",
      title: "No error taxonomy",
      detail: "Errors can only be counted, not categorized, and the event timeline will show nothing.",
      why: "Deciding in advance what counts as which kind of error is what makes two observers comparable. It is also the input to inter-rater agreement.",
      help: "live",
    });
  }

  if (measured.length >= 4 && !tasks.some((x) => x.is_practice)) {
    findings.push({
      id: "no-practice-task",
      severity: "info",
      title: "No practice task",
      detail: "The first measured task will absorb the participant's warm-up.",
      why: "The first task is often slower and more error-prone for reasons that have nothing to do with the design. A practice task runs first and is excluded from every metric.",
      help: "templates",
    });
  }

  if ((t.instruments ?? []).length === 0) {
    findings.push({
      id: "no-instrument",
      severity: "info",
      title: "No post-session questionnaire",
      detail: "SUS, NASA-TLX, and UEQ-S are all switched off.",
      why: "Task metrics say what happened; a standardized instrument says how it felt, on a scale comparable to other studies. Without one the study cannot be placed against a benchmark.",
      help: "templates",
    });
  }

  // ── Advice for when sessions are created ─────────────────────
  if (measured.length >= 4) {
    findings.push({
      id: "counterbalance",
      severity: "info",
      title: `${measured.length} measured tasks: counterbalance their order`,
      detail: "Order strategy is chosen per session. Pick shuffled or Latin square when creating them.",
      why: "With several tasks, whatever comes first is attempted cold and whatever comes last benefits from everything learned before it. Rotating the order spreads that effect across tasks instead of stacking it on one.",
      help: "sessions",
    });
  }

  if (tasks.length >= 6 && (t.task_groups ?? []).length === 0) {
    findings.push({
      id: "no-groups",
      severity: "info",
      title: `${tasks.length} tasks and no groups`,
      detail: "Groups organize the results view and the report by the area of the system each task exercises.",
      why: "Grouping tasks by feature area turns a flat list of results into a map of where the design succeeds and fails.",
      help: "templates",
    });
  }

  return findings;
}

export interface ReviewSummary {
  warnings: number;
  notes: number;
}

export const summarizeReview = (findings: ReviewFinding[]): ReviewSummary => ({
  warnings: findings.filter((f) => f.severity === "warn").length,
  notes: findings.filter((f) => f.severity === "info").length,
});
