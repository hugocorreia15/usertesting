import { describe, expect, it } from "vitest";
import { activeOnly, activeProtocol } from "../active-protocol";
import type { TemplateWithRelations } from "@/types";

describe("activeOnly", () => {
  it("keeps rows that were never archived", () => {
    expect(activeOnly([{ id: "a" }, { id: "b", archived_at: null }])).toHaveLength(2);
  });

  it("drops archived rows", () => {
    const kept = activeOnly([
      { id: "a" },
      { id: "b", archived_at: "2026-09-30T10:00:00Z" },
    ]);
    expect(kept.map((r) => r.id)).toEqual(["a"]);
  });

  it("copes with nothing at all", () => {
    expect(activeOnly(null)).toEqual([]);
    expect(activeOnly(undefined)).toEqual([]);
  });
});

describe("activeProtocol", () => {
  const template = {
    id: "t",
    template_tasks: [
      {
        id: "task",
        task_questions: [
          { id: "q1" },
          { id: "q2", archived_at: "2026-09-30T10:00:00Z" },
        ],
      },
    ],
    template_questions: [{ id: "i1" }, { id: "i2", archived_at: "2026-09-30T10:00:00Z" }],
    template_error_types: [{ id: "e1", archived_at: "2026-09-30T10:00:00Z" }, { id: "e2" }],
  } as unknown as TemplateWithRelations;

  it("removes archived questions from inside each task", () => {
    const active = activeProtocol(template);
    expect(active.template_tasks[0].task_questions?.map((q) => q.id)).toEqual(["q1"]);
  });

  it("removes archived interview questions and error types", () => {
    const active = activeProtocol(template);
    expect(active.template_questions.map((q) => q.id)).toEqual(["i1"]);
    expect(active.template_error_types.map((e) => e.id)).toEqual(["e2"]);
  });

  it("does not mutate what it was given, since reports read the same rows", () => {
    activeProtocol(template);
    expect(template.template_questions).toHaveLength(2);
    expect(template.template_tasks[0].task_questions).toHaveLength(2);
  });
});
