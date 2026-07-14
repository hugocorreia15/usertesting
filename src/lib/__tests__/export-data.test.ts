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
    description: null,
    user_id: "u1",
    is_public: false,
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
    join_code: null,
    current_task_index: 0,
    task_order_strategy: "fixed",
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

  it("survives a CSV round of the participant name with quotes and commas", () => {
    const csv = toCsv(tables.sessions);
    expect(csv).toContain('"Ana, the ""tester"""');
  });
});
