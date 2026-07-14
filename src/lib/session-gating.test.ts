import { describe, it, expect } from "vitest";
import { participantStillAnswering } from "./session-gating";

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
