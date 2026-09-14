import { describe, it, expect } from "vitest";
import { csvEscape, toCsv, buildExportTables } from "../export-data";
import { calculateSusScore } from "../sus";
import type {
  TemplateWithRelations,
  TestSessionWithRelations,
} from "@/types";

describe("csvEscape", () => {
  it("passes plain values through", () => {
    expect(csvEscape("hello")).toBe("hello");
    expect(csvEscape(42)).toBe("42");
  });
  it("renders null/undefined as empty", () => {
    expect(csvEscape(null)).toBe("");
  });
  it("quotes commas, quotes and newlines", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("toCsv", () => {
  it("emits header + rows with trailing newline", () => {
    const csv = toCsv({
      headers: ["a", "b"],
      rows: [
        ["x", 1],
        ["y,z", null],
      ],
    });
    expect(csv).toBe('a,b\nx,1\n"y,z",\n');
  });
});

// ── acceptance: SUS recomputed from the export matches the app ──

const SUS_VECTOR = [5, 2, 4, 1, 4, 2, 4, 1, 4, 2]; // scores 82.5

function fakeTemplate(): TemplateWithRelations {
  return {
    id: "t1",
    name: "Demo Template",
    require_inspection: false,
    description: null,
    user_id: "u1",
    org_id: null,
    org_group_id: null,
    repo_url: null,
    is_public: false,
    review_mode: "off" as const,
    review_status: "draft" as const,
    review_note: null,
    review_submitted_at: null,
    reviewed_at: null,
    reviewed_by: null,
    approval_invalidated_at: null,
    consent_text: null,
    created_at: "",
    updated_at: "",
    task_groups: [],
    template_tasks: [],
    template_error_types: [
      { id: "et1", template_id: "t1", code: "E1", label: "Nav", created_at: "" },
    ],
    template_questions: [
      {
        id: "iq1",
        template_id: "t1",
        sort_order: 0,
        question_text: "Overall thoughts?",
        created_at: "",
      },
    ],
    template_participant_fields: [],
    instruments: [],
    template_codes: [
      {
        id: "c1",
        template_id: "t1",
        code: "confusion",
        description: null,
        color: "#f97316",
        sort_order: 0,
        created_at: "",
        answer_codes: [
          {
            id: "ac1",
            code_id: "c1",
            task_question_answer_id: "a1",
            interview_answer_id: null,
            created_at: "",
          },
          {
            id: "ac2",
            code_id: "c1",
            task_question_answer_id: null,
            interview_answer_id: "ia1",
            created_at: "",
          },
        ],
      },
    ],
  };
}

function fakeSession(): TestSessionWithRelations {
  return {
    id: "s1",
    template_id: "t1",
    participant_id: "p1",
    evaluator_name: "Eva",
    status: "completed",
    started_at: null,
    completed_at: null,
    notes: null,
    user_id: "u1",
    org_id: null,
    join_code: null,
    current_task_index: 0,
    task_order_strategy: "fixed",
    is_pilot: false,
    consent_accepted_at: null,
    consent_method: null,
    created_at: "",
    templates: fakeTemplate(),
    participants: {
      id: "p1",
      name: "Ana, the \"tester\"",
      email: null,
      age: null,
      gender: null,
      occupation: null,
      tech_proficiency: null,
      notes: null,
      user_id: "u1",
      auth_user_id: null,
      is_anonymous: false,
      created_at: "",
    },
    task_results: [
      {
        id: "tr1",
        session_id: "s1",
        task_id: "task1",
        completion_status: "success",
        time_seconds: 30.5,
        action_count: 4,
        error_count: 1,
        hesitation_count: 1,
        seq_rating: 6,
        sort_order: 0,
        notes: null,
        created_at: "",
        template_tasks: {
          id: "task1",
          template_id: "t1",
          from_problem_id: null,
          group_id: null,
          sort_order: 0,
          name: "Find the thing",
          description: null,
          optimal_time_seconds: 20,
          optimal_actions: 3,
          is_practice: false,
          created_at: "",
          task_questions: [
            {
              id: "q1",
              task_id: "task1",
              sort_order: 0,
              question_text: "How was it?",
              question_type: "open",
              options: null,
              rating_min: null,
              rating_max: null,
              created_at: "",
            },
          ],
        },
        error_logs: [
          {
            id: "e1",
            task_result_id: "tr1",
            error_type_id: "et1",
            timestamp_seconds: 12.3,
            description: null,
            created_at: "",
          },
        ],
        hesitation_logs: [
          {
            id: "h1",
            task_result_id: "tr1",
            timestamp_seconds: 5,
            note: "paused, looked around",
            created_at: "",
          },
        ],
        task_question_answers: [
          {
            id: "a1",
            task_result_id: "tr1",
            question_id: "q1",
            answer_text: "fine",
            selected_options: null,
            rating_value: null,
            media_url: null,
            created_at: "",
          },
        ],
      },
    ],
    interview_answers: [
      {
        id: "ia1",
        session_id: "s1",
        question_id: "iq1",
        answer_text: "Loved it",
        created_at: "",
      },
    ],
    instrument_answers: [],
    sus_answers: SUS_VECTOR.map((score, i) => ({
      id: `sus${i}`,
      session_id: "s1",
      question_number: i + 1,
      score,
      created_at: "",
    })),
  };
}

describe("buildExportTables", () => {
  const tables = buildExportTables(fakeTemplate(), [fakeSession()]);

  it("recomputing SUS from the exported rows matches the app", () => {
    const idx = {
      session: tables.sus_answers.headers.indexOf("session_id"),
      q: tables.sus_answers.headers.indexOf("question_number"),
      score: tables.sus_answers.headers.indexOf("score"),
    };
    const answers = tables.sus_answers.rows
      .filter((r) => r[idx.session] === "s1")
      .map((r) => ({
        question_number: Number(r[idx.q]),
        score: Number(r[idx.score]),
      }));
    const recomputed = calculateSusScore(answers);
    expect(recomputed).toBe(82.5);
    // and equals the convenience column on the sessions table
    const susCol = tables.sessions.headers.indexOf("sus_score");
    expect(tables.sessions.rows[0][susCol]).toBe(recomputed);
  });

  it("flattens every event and answer with resolved names", () => {
    expect(tables.task_results.rows).toHaveLength(1);
    expect(tables.error_logs.rows[0]).toContain("E1");
    expect(tables.error_logs.rows[0]).toContain("Find the thing");
    expect(tables.hesitation_logs.rows[0]).toContain("paused, looked around");
    expect(tables.task_question_answers.rows[0]).toContain("How was it?");
    expect(tables.interview_answers.rows[0]).toContain("Overall thoughts?");
  });

  it("exports the practice flag on task result rows", () => {
    const idx = tables.task_results.headers.indexOf("is_practice");
    expect(idx).toBeGreaterThan(-1);
    expect(tables.task_results.rows[0][idx]).toBe("false");
  });

  it("exports qualitative code tags with resolved answers", () => {
    const t = tables.answer_codes;
    expect(t).toBeDefined();
    expect(t.rows).toHaveLength(2);
    const col = (name: string) => t.headers.indexOf(name);

    const taskRow = t.rows.find((r) => r[col("source")] === "task")!;
    expect(taskRow[col("session_id")]).toBe("s1");
    expect(taskRow[col("code")]).toBe("confusion");
    expect(taskRow[col("task_name")]).toBe("Find the thing");
    expect(taskRow[col("question_text")]).toBe("How was it?");
    expect(taskRow[col("answer_text")]).toBe("fine");

    const interviewRow = t.rows.find((r) => r[col("source")] === "interview")!;
    expect(interviewRow[col("session_id")]).toBe("s1");
    expect(interviewRow[col("task_name")]).toBeNull();
    expect(interviewRow[col("question_text")]).toBe("Overall thoughts?");
    expect(interviewRow[col("answer_text")]).toBe("Loved it");
  });

  it("survives a CSV round of the participant name with quotes and commas", () => {
    const csv = toCsv(tables.sessions);
    expect(csv).toContain('"Ana, the ""tester"""');
  });

  it("exports auto events only for the exported sessions", () => {
    const autoEvent = (
      id: string,
      sessionId: string,
      eventType: "click" | "keydown" | "navigation",
      occurredAt: string,
    ) => ({
      id,
      session_id: sessionId,
      event_type: eventType,
      occurred_at: occurredAt,
      path: null,
      detail: null,
      created_at: "",
    });
    const withEvents = buildExportTables(fakeTemplate(), [fakeSession()], { autoEvents: [
      autoEvent("ae1", "s1", "click", "2026-07-14T10:00:05Z"),
      autoEvent("ae2", "s1", "navigation", "2026-07-14T10:01:00Z"),
      autoEvent("ae3", "s-other", "keydown", "2026-07-14T10:02:00Z"),
    ] });
    const t = withEvents.auto_events;
    expect(t.headers).toEqual([
      "session_id",
      "event_type",
      "occurred_at",
      "path",
      "detail",
    ]);
    expect(t.rows).toHaveLength(2);
    const col = (name: string) => t.headers.indexOf(name);
    expect(t.rows[0][col("event_type")]).toBe("click");
    expect(t.rows[0][col("occurred_at")]).toBe("2026-07-14T10:00:05Z");
    expect(t.rows[1][col("event_type")]).toBe("navigation");
    expect(t.rows[1][col("occurred_at")]).toBe("2026-07-14T10:01:00Z");

    // omitting the third argument still yields the (empty) table
    expect(tables.auto_events).toBeDefined();
    expect(tables.auto_events.rows).toHaveLength(0);
  });

  it("exports submitted reflections only, never a draft", () => {
    const reflection = (
      id: string,
      sessionId: string,
      submittedAt: string | null,
    ) => ({
      id,
      session_id: sessionId,
      user_id: `u-${id}`,
      surprised: `surprised ${id}`,
      protocol_change: `change ${id}`,
      may_have_led: `led ${id}`,
      submitted_at: submittedAt,
      created_at: "",
      updated_at: "",
    });
    const t = buildExportTables(fakeTemplate(), [fakeSession()], { reflections: [
      reflection("r1", "s1", "2026-09-14T10:00:00Z"),
      reflection("r2", "s1", null),
      reflection("r3", "s-other", "2026-09-14T11:00:00Z"),
    ] }).reflections;

    expect(t.headers).toEqual([
      "session_id",
      "user_id",
      "surprised",
      "protocol_change",
      "may_have_led",
      "submitted_at",
    ]);
    // r2 is a draft; r3 belongs to a session outside this export.
    expect(t.rows).toHaveLength(1);
    expect(t.rows[0][t.headers.indexOf("may_have_led")]).toBe("led r1");
  });

  it("exports review history in order, snapshots as JSON, other templates left out", () => {
    const event = (seq: number, event: string, over: Record<string, unknown> = {}) => ({
      id: `ev${seq}`,
      seq,
      template_id: "t1",
      event,
      review_mode: "required",
      actor_id: "u1",
      note: null,
      protocol_snapshot: null,
      backfilled: false,
      created_at: `2026-09-14T10:0${seq}:00Z`,
      ...over,
    });
    const t = buildExportTables(fakeTemplate(), [fakeSession()], {
      reviewEvents: [
        event(3, "approved", { note: "Good to recruit" }),
        event(1, "submitted", { protocol_snapshot: { tasks: [{ name: "Original" }] } }),
        event(2, "changes_requested", { note: "Rewrite task 1" }),
        event(9, "approved", { template_id: "other" }),
      ] as never,
    }).review_events;

    expect(t.rows.map((r) => r[t.headers.indexOf("event")])).toEqual([
      "submitted",
      "changes_requested",
      "approved",
    ]);
    expect(t.rows[1][t.headers.indexOf("note")]).toBe("Rewrite task 1");
    expect(JSON.parse(t.rows[0][t.headers.indexOf("protocol_snapshot")] as string)).toEqual({
      tasks: [{ name: "Original" }],
    });
    expect(t.rows[2][t.headers.indexOf("protocol_snapshot")]).toBeNull();
  });

  it("exports inspections with their evaluators, findings and problems", () => {
    const tables = buildExportTables(fakeTemplate(), [fakeSession()], {
      inspections: [
        { id: "i1", template_id: "t1", heuristic_set_id: null, subject_kind: "own", subject_name: "Prototype", subject_url: null, status: "closed", created_by: null, created_at: "c", collection_closed_at: "x", closed_at: "y" },
        { id: "i9", template_id: "other", heuristic_set_id: null, subject_kind: "own", subject_name: "Elsewhere", subject_url: null, status: "closed", created_by: null, created_at: "c", collection_closed_at: null, closed_at: null },
      ],
      inspectionEvaluators: [
        { id: "e1", inspection_id: "i1", user_id: "u1", submitted_at: "s", created_at: "c" },
        { id: "e9", inspection_id: "i9", user_id: "u9", submitted_at: "s", created_at: "c" },
      ],
      inspectionFindings: [
        { id: "f1", inspection_id: "i1", evaluator_id: "e1", heuristic_id: "h1", location: "Home", description: "No feedback", severity: 3, evidence_path: null, problem_id: "p1", created_at: "c" },
      ],
      inspectionProblems: [
        { id: "p1", inspection_id: "i1", title: "No feedback on save", notes: null, heuristic_id: "h1", agreed_severity: 3, sort_order: 0, test_outcome: "confirmed", outcome_note: null, created_at: "c" },
      ],
    });
    expect(tables.inspections.rows).toHaveLength(1);
    expect(tables.inspection_evaluators.rows).toHaveLength(1);
    expect(tables.inspection_findings.rows[0]).toContain("No feedback");
    expect(tables.inspection_problems.rows[0]).toContain("No feedback on save");
  });

  it("labels each piece of evidence with the kind of problem it supports", () => {
    const t = buildExportTables(fakeTemplate(), [fakeSession()], {
      testProblems: [
        { id: "tp1", template_id: "t1", title: "Unpredicted", severity: 2, heuristic_id: null, note: null, created_by: null, created_at: "c" },
        { id: "tp9", template_id: "other", title: "Elsewhere", severity: 1, heuristic_id: null, note: null, created_by: null, created_at: "c" },
      ],
      problemEvidence: [
        { id: "ev1", template_id: "t1", inspection_problem_id: "p1", test_problem_id: null, session_id: "s1", created_by: null, created_at: "c" },
        { id: "ev2", template_id: "t1", inspection_problem_id: null, test_problem_id: "tp1", session_id: "s1", created_by: null, created_at: "c" },
      ],
    });
    expect(t.test_problems.rows).toHaveLength(1);
    const e = t.problem_evidence;
    expect(e.rows.map((r) => [r[e.headers.indexOf("problem_kind")], r[e.headers.indexOf("problem_id")]])).toEqual([
      ["predicted", "p1"],
      ["test_only", "tp1"],
    ]);
  });
});

