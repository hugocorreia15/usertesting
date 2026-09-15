import { describe, expect, it } from "vitest";
import {
  classOverview,
  projectStatus,
  type ClassData,
  type SessionRow,
} from "../class-overview";
import type { TemplateTask, TemplateWithRelations } from "@/types";

const task = (id: string, over: Partial<TemplateTask> = {}): TemplateTask => ({
  id,
  template_id: "t",
  group_id: null,
  sort_order: 0,
  name: "Find yesterday's energy use",
  description: "Done when yesterday's total is on screen.",
  optimal_time_seconds: 30,
  optimal_actions: 3,
  is_practice: false,
  created_at: "",
  from_problem_id: null,
  ...over,
});

const template = (
  id: string,
  over: Partial<TemplateWithRelations> = {},
): TemplateWithRelations => ({
  id,
  name: `Project ${id}`,
  description: null,
  user_id: "student",
  org_id: "org",
  org_group_id: null,
  repo_url: null,
  is_public: false,
  instruments: ["sus"],
  review_mode: "off",
  review_status: "draft",
  review_note: null,
  review_submitted_at: null,
  reviewed_at: null,
  reviewed_by: null,
  approval_invalidated_at: null,
  consent_text: null,
  require_inspection: false,
  created_at: "",
  updated_at: "",
  task_groups: [],
  template_tasks: [task("a"), task("b"), task("c")],
  template_error_types: [
    { id: "e", template_id: id, code: "WB", label: "Wrong button", created_at: "" },
  ],
  template_questions: [],
  template_participant_fields: [],
  template_codes: [],
  ...over,
});

const session = (id: string, templateId: string, over: Partial<SessionRow> = {}): SessionRow => ({
  id,
  template_id: templateId,
  status: "completed",
  is_pilot: false,
  consent_accepted_at: "2026-09-10T10:00:00Z",
  task_order_strategy: "latin_square",
  completed_at: "2026-09-10T11:00:00Z",
  ...over,
});

const empty = (over: Partial<ClassData> = {}): ClassData => ({
  templates: [],
  groups: [],
  sessions: [],
  taskResults: [],
  raterScores: [],
  observedSessionIds: [],
  reflections: [],
  inspections: [],
  evaluators: [],
  findings: [],
  ...over,
});

const texts = (p: { attention: { text: string }[] }) => p.attention.map((a) => a.text);

describe("projectStatus", () => {
  it("has nothing to chase on a clean protocol with complete sessions", () => {
    const t = template("p");
    const p = projectStatus(
      t,
      empty({
        templates: [t],
        sessions: [session("s1", "p"), session("s2", "p")],
        raterScores: [
          { session_id: "s1", task_id: "a", rater_id: "r", rater_email: null, completion_status: "success", action_count: 3, error_count: 0, hesitation_count: 0, seq_rating: 6 },
          { session_id: "s1", task_id: "b", rater_id: "r", rater_email: null, completion_status: "failure", action_count: 3, error_count: 0, hesitation_count: 0, seq_rating: 6 },
        ],
        taskResults: [
          { session_id: "s1", task_id: "a", completion_status: "success", action_count: 3, error_count: 0, hesitation_count: 0, seq_rating: 6 },
          { session_id: "s1", task_id: "b", completion_status: "failure", action_count: 3, error_count: 0, hesitation_count: 0, seq_rating: 6 },
        ],
        observedSessionIds: ["s1"],
        reflections: [
          { session_id: "s1", submitted_at: "x" },
          { session_id: "s2", submitted_at: "x" },
        ],
      }),
    );
    expect(p.protocolWarnings).toBe(0);
    expect(p.attention).toEqual([]);
    expect(p.coRated).toEqual({ done: 1, of: 2, meanKappa: 1 });
    expect(p.reflected).toEqual({ done: 2, of: 2 });
  });

  it("puts a review waiting on the instructor first", () => {
    const t = template("p", {
      review_mode: "required",
      review_status: "submitted",
      template_tasks: [task("a", { description: null })],
    });
    const p = projectStatus(t, empty({ templates: [t] }));
    expect(p.attention[0]).toEqual({ level: "action", text: "Waiting for your review" });
    expect(texts(p)).toContain("1 protocol warning");
  });

  it("does not ask for a review when review is off", () => {
    const t = template("p", { review_mode: "off", review_status: "submitted" });
    expect(texts(projectStatus(t, empty({ templates: [t] })))).not.toContain(
      "Waiting for your review",
    );
  });

  it("excludes pilots from every expectation but still counts them", () => {
    const t = template("p");
    const p = projectStatus(
      t,
      empty({
        templates: [t],
        sessions: [
          session("pilot", "p", { is_pilot: true, consent_accepted_at: null, task_order_strategy: "fixed" }),
        ],
      }),
    );
    expect(p.sessions).toMatchObject({ completed: 0, pilots: 1 });
    expect(p.consent).toEqual({ done: 0, of: 0 });
    expect(texts(p).some((x) => x.includes("consent"))).toBe(false);
    expect(texts(p).some((x) => x.includes("reflection"))).toBe(false);
  });

  it("flags sessions without consent on file", () => {
    const t = template("p");
    const p = projectStatus(
      t,
      empty({
        templates: [t],
        sessions: [session("s1", "p"), session("s2", "p", { consent_accepted_at: null })],
      }),
    );
    expect(p.consent).toEqual({ done: 1, of: 2 });
    expect(texts(p)).toContain("1 session without consent on file");
  });

  it("flags a never counterbalanced order only when the protocol is long enough", () => {
    const fixed = { task_order_strategy: "fixed" as const };
    const short = template("short");
    const long = template("long", {
      template_tasks: [task("a"), task("b"), task("c"), task("d")],
    });
    const data = empty({
      templates: [short, long],
      sessions: [
        session("s1", "short", fixed),
        session("s2", "short", fixed),
        session("s3", "long", fixed),
        session("s4", "long", fixed),
      ],
    });
    expect(texts(projectStatus(short, data))).not.toContain("Task order never counterbalanced");
    expect(texts(projectStatus(long, data))).toContain("Task order never counterbalanced");
  });

  it("reports collecting inspections as progress, without an agreement figure", () => {
    const t = template("p");
    const p = projectStatus(
      t,
      empty({
        templates: [t],
        inspections: [{ id: "i", template_id: "p", status: "collecting", created_at: "1" }],
        evaluators: [
          { id: "e1", inspection_id: "i", submitted_at: "x" },
          { id: "e2", inspection_id: "i", submitted_at: null },
        ],
      }),
    );
    expect(p.inspection).toEqual({ state: "collecting", submitted: 1, evaluators: 2 });
    expect(texts(p)).toContain("Inspection: 1 of 2 passes in");
  });

  it("summarizes the most recent merged inspection with its agreement", () => {
    const t = template("p");
    const p = projectStatus(
      t,
      empty({
        templates: [t],
        inspections: [
          { id: "old", template_id: "p", status: "closed", created_at: "1" },
          { id: "new", template_id: "p", status: "consolidating", created_at: "2" },
        ],
        evaluators: [
          { id: "a", inspection_id: "new", submitted_at: "x" },
          { id: "b", inspection_id: "new", submitted_at: "x" },
        ],
        findings: [
          { inspection_id: "new", evaluator_id: "a", problem_id: "p1", severity: 3 },
          { inspection_id: "new", evaluator_id: "a", problem_id: "p2", severity: 2 },
          { inspection_id: "new", evaluator_id: "b", problem_id: "p1", severity: 3 },
          // an unmerged finding has no identity to compare, so it is ignored
          { inspection_id: "new", evaluator_id: "b", problem_id: null, severity: 1 },
        ],
      }),
    );
    expect(p.inspection).toEqual({ state: "merged", evaluators: 2, problems: 2, agreement: 0.5 });
  });

  it("warns when an inspection is required and none has started", () => {
    const t = template("p", { require_inspection: true });
    expect(texts(projectStatus(t, empty({ templates: [t] })))).toContain(
      "Inspection required but not started",
    );
  });

  it("names weak co-rating agreement", () => {
    const t = template("p");
    const score = (task_id: string, completion_status: string) => ({
      session_id: "s1", task_id, completion_status, action_count: null, error_count: null, hesitation_count: null, seq_rating: null,
    });
    const p = projectStatus(
      t,
      empty({
        templates: [t],
        sessions: [session("s1", "p")],
        taskResults: [score("a", "success"), score("b", "failure"), score("c", "success")],
        raterScores: [
          { ...score("a", "failure"), rater_id: "r", rater_email: null },
          { ...score("b", "success"), rater_id: "r", rater_email: null },
          { ...score("c", "success"), rater_id: "r", rater_email: null },
        ],
      }),
    );
    expect(p.coRated.meanKappa).not.toBeNull();
    expect(p.coRated.meanKappa!).toBeLessThan(0.4);
    expect(texts(p).some((x) => x.startsWith("Co-rating agreement is weak"))).toBe(true);
  });

  it("takes the team name and students from the project's group", () => {
    const t = template("p", { org_group_id: "g" });
    const p = projectStatus(
      t,
      empty({
        templates: [t],
        groups: [
          {
            id: "g",
            name: "Team Aurora",
            repo_url: "https://github.com/example/aurora",
            org_group_members: [
              { user_id: "u1", member_email: "a@example.edu" },
              { user_id: "u2", member_email: null },
            ],
          },
        ],
      }),
    );
    expect(p.groupName).toBe("Team Aurora");
    expect(p.students).toEqual(["a@example.edu"]);
    // The study names no repository, so the team's stands in.
    expect(p.repoUrl).toBe("https://github.com/example/aurora");
  });

  it("prefers the study's own repository over the team's", () => {
    const t = template("p", { org_group_id: "g", repo_url: "https://github.com/example/study" });
    const p = projectStatus(
      t,
      empty({
        templates: [t],
        groups: [
          { id: "g", name: "Team Aurora", repo_url: "https://github.com/example/aurora", org_group_members: [] },
        ],
      }),
    );
    expect(p.repoUrl).toBe("https://github.com/example/study");
  });
});

describe("classOverview", () => {
  it("lists projects needing action first, then warnings, then the rest", () => {
    const calm = template("calm", { name: "A calm project" });
    const warned = template("warned", {
      name: "B warned",
      template_tasks: [task("a", { description: null })],
    });
    const waiting = template("waiting", {
      name: "C waiting",
      review_mode: "required",
      review_status: "submitted",
    });
    const data = empty({
      templates: [calm, warned, waiting],
      sessions: [session("s", "calm")],
      reflections: [{ session_id: "s", submitted_at: "x" }],
    });
    const { projects, summary } = classOverview(data);
    expect(projects.map((p) => p.templateId)).toEqual(["waiting", "warned", "calm"]);
    expect(summary).toEqual({
      projects: 3,
      awaitingReview: 1,
      noSessions: 2,
      withWarnings: 1,
      consentGaps: 0,
    });
  });

  it("handles an organization with no projects", () => {
    expect(classOverview(empty())).toEqual({
      projects: [],
      summary: { projects: 0, awaitingReview: 0, noSessions: 0, withWarnings: 0, consentGaps: 0 },
    });
  });
});
