import { describe, it, expect } from "vitest";
import { buildCodeMatrix } from "../coding";
import type {
  AnswerCode,
  TemplateCodeWithAnswers,
  TestSessionWithRelations,
} from "@/types";

function code(
  overrides: Partial<TemplateCodeWithAnswers> = {},
): TemplateCodeWithAnswers {
  return {
    id: "c1",
    template_id: "t1",
    code: "confusion",
    description: null,
    color: "#f97316",
    sort_order: 0,
    created_at: "",
    answer_codes: [],
    ...overrides,
  };
}

function tag(overrides: Partial<AnswerCode> = {}): AnswerCode {
  return {
    id: "ac1",
    code_id: "c1",
    task_question_answer_id: null,
    interview_answer_id: null,
    created_at: "",
    ...overrides,
  };
}

// Only the fields buildCodeMatrix reads; the rest of the relation
// shape is irrelevant here.
function session(
  id: string,
  taskAnswerIds: string[] = [],
  interviewAnswerIds: string[] = [],
): TestSessionWithRelations {
  return {
    id,
    task_results: [
      { task_question_answers: taskAnswerIds.map((aid) => ({ id: aid })) },
    ],
    interview_answers: interviewAnswerIds.map((iid) => ({ id: iid })),
  } as unknown as TestSessionWithRelations;
}

describe("buildCodeMatrix", () => {
  it("attributes task-answer tags to the owning session", () => {
    const rows = buildCodeMatrix(
      [
        code({
          answer_codes: [tag({ task_question_answer_id: "a1" })],
        }),
      ],
      [session("s1", ["a1"]), session("s2", ["a2"])],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].countsBySession).toEqual({ s1: 1, s2: 0 });
    expect(rows[0].total).toBe(1);
  });

  it("attributes interview-answer tags to the owning session", () => {
    const rows = buildCodeMatrix(
      [
        code({
          answer_codes: [tag({ interview_answer_id: "ia2" })],
        }),
      ],
      [session("s1", [], ["ia1"]), session("s2", [], ["ia2"])],
    );
    expect(rows[0].countsBySession).toEqual({ s1: 0, s2: 1 });
    expect(rows[0].total).toBe(1);
  });

  it("counts multiple codes applied to the same answer independently", () => {
    const rows = buildCodeMatrix(
      [
        code({
          id: "c1",
          code: "confusion",
          answer_codes: [tag({ id: "ac1", task_question_answer_id: "a1" })],
        }),
        code({
          id: "c2",
          code: "delight",
          sort_order: 1,
          answer_codes: [
            tag({ id: "ac2", code_id: "c2", task_question_answer_id: "a1" }),
          ],
        }),
      ],
      [session("s1", ["a1"])],
    );
    expect(rows.map((r) => r.total)).toEqual([1, 1]);
    expect(rows.map((r) => r.countsBySession.s1)).toEqual([1, 1]);
  });

  it("keeps zero-tag codes with total 0 and all session keys present", () => {
    const rows = buildCodeMatrix(
      [code()],
      [session("s1", ["a1"]), session("s2", [], ["ia1"])],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].total).toBe(0);
    expect(rows[0].countsBySession).toEqual({ s1: 0, s2: 0 });
  });

  it("ignores tags whose answer is not in the loaded sessions", () => {
    const rows = buildCodeMatrix(
      [
        code({
          answer_codes: [
            tag({ id: "ac1", task_question_answer_id: "a1" }),
            tag({ id: "ac2", task_question_answer_id: "gone" }),
            tag({ id: "ac3", interview_answer_id: "also-gone" }),
          ],
        }),
      ],
      [session("s1", ["a1"])],
    );
    expect(rows[0].total).toBe(1);
    expect(rows[0].countsBySession).toEqual({ s1: 1 });
  });

  it("sorts rows by sort_order, then code", () => {
    const rows = buildCodeMatrix(
      [
        code({ id: "c1", code: "zebra", sort_order: 2 }),
        code({ id: "c2", code: "beta", sort_order: 0 }),
        code({ id: "c3", code: "alpha", sort_order: 2 }),
      ],
      [],
    );
    expect(rows.map((r) => r.code)).toEqual(["beta", "alpha", "zebra"]);
  });
});
