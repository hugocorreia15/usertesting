/**
 * The class view: every project in an organization, one row each, reduced to
 * what an instructor needs to act on this week.
 *
 * Without it the instructor opens a dozen projects one at a time, and the
 * platform's case for weekly use has no anchor. The columns are not a
 * dashboard's worth of numbers chosen for being available. Each one is the
 * evidence column of a row in the paper's constructive-alignment table, the
 * thing that would show a learning objective was met, where the platform
 * actually records that evidence:
 *
 *   inspection before testing          merged, with the evaluators' agreement
 *   tasks written as goals, criteria   protocol review warnings outstanding
 *   knowing when a protocol is ready   review status, pilots run meanwhile
 *   handling participant data          consent on file per session
 *   controlling order effects          counterbalanced sessions
 *   treating "error" as a judgement    sessions co-rated, and the kappa
 *   moderating without leading         sessions someone else observed
 *   reflecting on the session          sessions with a submitted reflection
 *
 * Two rows of that table are deliberately absent, because the platform cannot
 * see them: whether a report states its uncertainty, and whether a warning was
 * resolved with a written justification. Showing a number for either would
 * claim evidence that does not exist.
 *
 * Pilot sessions are counted but excluded from every expectation. They exist
 * to rehearse a protocol before approval, so missing consent or reflection on a
 * pilot is not something to chase.
 *
 * Everything here is pure. The rows it receives are whatever row-level security
 * lets an organization owner read, which is why an inspection still collecting
 * contributes its progress but no agreement figure.
 */

import { reviewTemplate } from "@/lib/protocol-review";
import { sessionAgreement } from "@/lib/agreement";
import { summarizeInspection, type InspectionPass } from "@/lib/inspection";
import type { ReviewMode, ReviewStatus } from "@/lib/review-gate";
import type { InspectionStatus, TemplateWithRelations } from "@/types";

export interface SessionRow {
  id: string;
  template_id: string;
  status: "planned" | "in_progress" | "completed";
  is_pilot: boolean;
  consent_accepted_at: string | null;
  task_order_strategy: "fixed" | "shuffled" | "latin_square";
  completed_at: string | null;
}

export interface TaskResultRow {
  session_id: string;
  task_id: string;
  completion_status: string | null;
  action_count: number | null;
  error_count: number | null;
  hesitation_count: number | null;
  seq_rating: number | null;
}

export interface RaterScoreRow extends TaskResultRow {
  rater_id: string;
  rater_email: string | null;
}

export interface InspectionRow {
  id: string;
  template_id: string;
  status: InspectionStatus;
  created_at: string;
}

export interface EvaluatorRow {
  id: string;
  inspection_id: string;
  submitted_at: string | null;
}

export interface FindingRow {
  inspection_id: string;
  evaluator_id: string;
  problem_id: string | null;
  severity: number | null;
}

export interface GroupRow {
  id: string;
  name: string;
  org_group_members: { user_id: string; member_email: string | null }[];
}

export interface ClassData {
  templates: TemplateWithRelations[];
  groups: GroupRow[];
  sessions: SessionRow[];
  taskResults: TaskResultRow[];
  raterScores: RaterScoreRow[];
  observedSessionIds: string[];
  reflections: { session_id: string; submitted_at: string | null }[];
  inspections: InspectionRow[];
  evaluators: EvaluatorRow[];
  findings: FindingRow[];
}

export type AttentionLevel = "action" | "warn" | "info";

export interface Attention {
  level: AttentionLevel;
  text: string;
}

export interface Ratio {
  done: number;
  of: number;
}

export interface ProjectStatus {
  templateId: string;
  name: string;
  groupName: string | null;
  students: string[];
  inspection:
    | { state: "none" }
    | { state: "collecting"; submitted: number; evaluators: number }
    | { state: "merged"; evaluators: number; problems: number; agreement: number | null };
  protocolWarnings: number;
  review: { mode: ReviewMode; status: ReviewStatus };
  sessions: { completed: number; pilots: number; open: number; lastCompletedAt: string | null };
  consent: Ratio;
  counterbalanced: Ratio & { applicable: boolean };
  coRated: Ratio & { meanKappa: number | null };
  observed: Ratio;
  reflected: Ratio;
  attention: Attention[];
}

export interface ClassSummary {
  projects: number;
  awaitingReview: number;
  noSessions: number;
  withWarnings: number;
  consentGaps: number;
}

/** Below this kappa, agreement on completion is at best "fair" (Landis and Koch). */
const WEAK_KAPPA = 0.4;
/** The protocol review suggests counterbalancing from this many measured tasks. */
const COUNTERBALANCE_FROM = 4;

const LEVEL_RANK: Record<AttentionLevel, number> = { action: 0, warn: 1, info: 2 };

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function projectStatus(template: TemplateWithRelations, data: ClassData): ProjectStatus {
  const group = data.groups.find((g) => g.id === template.org_group_id) ?? null;

  const sessions = data.sessions.filter((s) => s.template_id === template.id);
  const completed = sessions.filter((s) => s.status === "completed");
  const counted = completed.filter((s) => !s.is_pilot);
  const pilots = completed.filter((s) => s.is_pilot).length;
  const open = sessions.filter((s) => s.status !== "completed").length;
  const completedDates = counted
    .map((s) => s.completed_at)
    .filter((d): d is string => !!d)
    .sort();
  const lastCompletedAt = completedDates[completedDates.length - 1] ?? null;

  // ── inspection ────────────────────────────────────────────
  // Oldest first, so the last of each kind is the most recent one.
  const inspections = data.inspections
    .filter((i) => i.template_id === template.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const merged = inspections.filter((i) => i.status !== "collecting");
  const collecting = inspections.filter((i) => i.status === "collecting");
  let inspection: ProjectStatus["inspection"] = { state: "none" };
  if (merged.length > 0) {
    // The most recent merged inspection is the one that informs the protocol.
    const latest = merged[merged.length - 1];
    const evaluators = data.evaluators.filter((e) => e.inspection_id === latest.id);
    const findings = data.findings.filter((f) => f.inspection_id === latest.id && f.problem_id);
    const passes: InspectionPass[] = evaluators.map((e) => ({
      evaluatorId: e.id,
      problemIds: findings.filter((f) => f.evaluator_id === e.id).map((f) => f.problem_id!),
    }));
    const summary = summarizeInspection(passes);
    inspection = {
      state: "merged",
      evaluators: evaluators.length,
      problems: summary.totalProblems,
      agreement: summary.anyTwo.value,
    };
  } else if (collecting.length > 0) {
    const latest = collecting[collecting.length - 1];
    const evaluators = data.evaluators.filter((e) => e.inspection_id === latest.id);
    inspection = {
      state: "collecting",
      evaluators: evaluators.length,
      submitted: evaluators.filter((e) => e.submitted_at).length,
    };
  }

  // ── protocol ──────────────────────────────────────────────
  const protocolWarnings = reviewTemplate(template).filter((f) => f.severity === "warn").length;

  // ── sessions: the evidence columns ────────────────────────
  const consent: Ratio = {
    done: counted.filter((s) => s.consent_accepted_at).length,
    of: counted.length,
  };

  const measuredTasks = template.template_tasks.filter((t) => !t.is_practice).length;
  const counterbalanced = {
    applicable: measuredTasks >= COUNTERBALANCE_FROM,
    done: counted.filter((s) => s.task_order_strategy !== "fixed").length,
    of: counted.length,
  };

  const kappas: number[] = [];
  let coRatedSessions = 0;
  for (const s of counted) {
    const scores = data.raterScores.filter((r) => r.session_id === s.id);
    if (scores.length === 0) continue;
    coRatedSessions++;
    const primary = data.taskResults.filter((t) => t.session_id === s.id);
    for (const rater of sessionAgreement(primary, scores)) {
      if (rater.completion.kappa !== null) kappas.push(rater.completion.kappa);
    }
  }
  const coRated = {
    done: coRatedSessions,
    of: counted.length,
    meanKappa: kappas.length ? kappas.reduce((a, b) => a + b, 0) / kappas.length : null,
  };

  const observedIds = new Set(data.observedSessionIds);
  const observed: Ratio = {
    done: counted.filter((s) => observedIds.has(s.id)).length,
    of: counted.length,
  };

  const reflectedIds = new Set(
    data.reflections.filter((r) => r.submitted_at).map((r) => r.session_id),
  );
  const reflected: Ratio = {
    done: counted.filter((s) => reflectedIds.has(s.id)).length,
    of: counted.length,
  };

  // ── what to act on ────────────────────────────────────────
  const attention: Attention[] = [];
  const review = { mode: template.review_mode, status: template.review_status };

  if (review.mode !== "off" && review.status === "submitted") {
    attention.push({ level: "action", text: "Waiting for your review" });
  }
  if (inspection.state === "collecting" && inspection.submitted < inspection.evaluators) {
    attention.push({
      level: "info",
      text: `Inspection: ${inspection.submitted} of ${inspection.evaluators} passes in`,
    });
  }
  if (inspection.state === "none" && template.require_inspection) {
    attention.push({ level: "warn", text: "Inspection required but not started" });
  }
  if (protocolWarnings > 0) {
    attention.push({ level: "warn", text: plural(protocolWarnings, "protocol warning") });
  }
  if (consent.of > consent.done) {
    attention.push({
      level: "warn",
      text: `${plural(consent.of - consent.done, "session")} without consent on file`,
    });
  }
  if (counterbalanced.applicable && counted.length >= 2 && counterbalanced.done === 0) {
    attention.push({ level: "warn", text: "Task order never counterbalanced" });
  }
  if (counted.length >= 2 && coRatedSessions === 0) {
    attention.push({ level: "info", text: "No session co-rated yet" });
  }
  if (coRated.meanKappa !== null && coRated.meanKappa < WEAK_KAPPA) {
    attention.push({
      level: "info",
      text: `Co-rating agreement is weak (kappa ${coRated.meanKappa.toFixed(2)})`,
    });
  }
  if (reflected.of > reflected.done) {
    attention.push({
      level: "info",
      text: `${plural(reflected.of - reflected.done, "session")} without a reflection`,
    });
  }
  if (sessions.length === 0) {
    attention.push({ level: "info", text: "No sessions yet" });
  }

  attention.sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);

  return {
    templateId: template.id,
    name: template.name,
    groupName: group?.name ?? null,
    students: (group?.org_group_members ?? [])
      .map((m) => m.member_email)
      .filter((e): e is string => !!e),
    inspection,
    protocolWarnings,
    review,
    sessions: { completed: counted.length, pilots, open, lastCompletedAt },
    consent,
    counterbalanced,
    coRated,
    observed,
    reflected,
    attention,
  };
}

/** Every project, the ones needing action first, then by team and name. */
export function classOverview(data: ClassData): {
  projects: ProjectStatus[];
  summary: ClassSummary;
} {
  const projects = data.templates.map((t) => projectStatus(t, data));

  const urgency = (p: ProjectStatus) =>
    p.attention.length === 0 ? 3 : LEVEL_RANK[p.attention[0].level];

  projects.sort(
    (a, b) =>
      urgency(a) - urgency(b) ||
      b.attention.length - a.attention.length ||
      (a.groupName ?? "￿").localeCompare(b.groupName ?? "￿") ||
      a.name.localeCompare(b.name),
  );

  return {
    projects,
    summary: {
      projects: projects.length,
      awaitingReview: projects.filter(
        (p) => p.review.mode !== "off" && p.review.status === "submitted",
      ).length,
      noSessions: projects.filter((p) => p.sessions.completed + p.sessions.open + p.sessions.pilots === 0)
        .length,
      withWarnings: projects.filter((p) => p.protocolWarnings > 0).length,
      consentGaps: projects.filter((p) => p.consent.of > p.consent.done).length,
    },
  };
}
