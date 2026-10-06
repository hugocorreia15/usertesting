import { describe, it, expect } from "vitest";
import { hasUnansweredQuestions, participantStillAnswering } from "../session-gating";

const q = {}; // opaque question
const a = {}; // opaque answer

describe("participantStillAnswering", () => {
  it("is false without a join code (evaluator-only session)", () => {
    expect(
      participantStillAnswering({
        join_code: null,
        task_results: [
          {
            completion_status: "success",
            template_tasks: { task_questions: [q] },
            task_question_answers: [],
          },
        ],
      }),
    ).toBe(false);
  });

  it("is true when a completed task has unanswered questions", () => {
    expect(
      participantStillAnswering({
        join_code: "abc123",
        task_results: [
          {
            completion_status: "success",
            template_tasks: { task_questions: [q, q] },
            task_question_answers: [a],
          },
        ],
      }),
    ).toBe(true);
  });

  it("is false once every question is answered", () => {
    expect(
      participantStillAnswering({
        join_code: "abc123",
        task_results: [
          {
            completion_status: "success",
            template_tasks: { task_questions: [q, q] },
            task_question_answers: [a, a],
          },
        ],
      }),
    ).toBe(false);
  });

  it("ignores tasks the evaluator has not completed yet", () => {
    expect(
      participantStillAnswering({
        join_code: "abc123",
        task_results: [
          {
            completion_status: null,
            template_tasks: { task_questions: [q] },
            task_question_answers: [],
          },
        ],
      }),
    ).toBe(false);
  });

  it("ignores completed tasks that have no questions", () => {
    expect(
      participantStillAnswering({
        join_code: "abc123",
        task_results: [
          {
            completion_status: "success",
            template_tasks: { task_questions: [] },
            task_question_answers: [],
          },
        ],
      }),
    ).toBe(false);
  });

  it("tolerates missing relations and null sessions", () => {
    expect(participantStillAnswering(null)).toBe(false);
    expect(participantStillAnswering(undefined)).toBe(false);
    expect(
      participantStillAnswering({ join_code: "abc123", task_results: null }),
    ).toBe(false);
    expect(
      participantStillAnswering({
        join_code: "abc123",
        task_results: [{ completion_status: "success" }],
      }),
    ).toBe(false);
  });
});

describe("hasUnansweredQuestions", () => {
  it("is pending while an active question has no answer", () => {
    expect(
      hasUnansweredQuestions(
        [{ id: "q1" }, { id: "q2" }],
        [{ question_id: "q1" }],
      ),
    ).toBe(true);
  });

  it("is done once every active question has an answer", () => {
    expect(
      hasUnansweredQuestions(
        [{ id: "q1" }, { id: "q2" }],
        [{ question_id: "q1" }, { question_id: "q2" }],
      ),
    ).toBe(false);
  });

  it("ignores an archived question, which the participant is never shown", () => {
    // The evaluator's session query keeps archived rows (migration 063); the
    // participant's does not. Counting them made the evaluator wait forever
    // for an answer to a question nobody could see.
    expect(
      hasUnansweredQuestions(
        [
          { id: "old", archived_at: "2026-09-30T10:00:00Z" },
          { id: "new" },
        ],
        [{ question_id: "new" }],
      ),
    ).toBe(false);
  });

  it("does not take an answer to an archived question as an answer to its successor", () => {
    expect(
      hasUnansweredQuestions(
        [
          { id: "old", archived_at: "2026-09-30T10:00:00Z" },
          { id: "new" },
        ],
        [{ question_id: "old" }],
      ),
    ).toBe(true);
  });

  it("has nothing to answer on a task with no active questions", () => {
    expect(hasUnansweredQuestions([], [])).toBe(false);
    expect(
      hasUnansweredQuestions([{ id: "x", archived_at: "2026-09-30T10:00:00Z" }], []),
    ).toBe(false);
  });

  it("falls back to counting when the rows carry no ids", () => {
    // Older callers selected opaque rows; they keep their old behaviour.
    expect(hasUnansweredQuestions([{}, {}], [{}])).toBe(true);
    expect(hasUnansweredQuestions([{}, {}], [{}, {}])).toBe(false);
  });
});
