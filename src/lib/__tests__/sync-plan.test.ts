import { describe, expect, it } from "vitest";
import { planSync } from "../sync-plan";

/**
 * The regression this guards: a template save that deleted every child row and
 * reinserted it, cascading away every answer, logged error and interview
 * response from every session already run.
 */
describe("planSync", () => {
  it("keeps a row that is still there instead of replacing it", () => {
    const plan = planSync(["a", "b"], [{ id: "a" }, { id: "b" }]);
    expect(plan.toDeleteIds).toEqual([]);
    expect(plan.toUpdate.map((r) => r.id)).toEqual(["a", "b"]);
    expect(plan.toInsert).toEqual([]);
  });

  it("deletes only what the editor actually removed", () => {
    const plan = planSync(["a", "b", "c"], [{ id: "a" }, { id: "c" }]);
    expect(plan.toDeleteIds).toEqual(["b"]);
  });

  it("inserts a row the editor added", () => {
    const plan = planSync(["a"], [{ id: "a" }, { id: "new-1" }]);
    expect(plan.toInsert.map((r) => r.id)).toEqual(["new-1"]);
    expect(plan.toDeleteIds).toEqual([]);
  });

  it("treats a row with no id as new rather than letting it claim one", () => {
    const plan = planSync(["a"], [{ question_text: "x" } as { id?: string }]);
    expect(plan.toInsert).toHaveLength(1);
    // "a" was not in the incoming set, so it really was removed.
    expect(plan.toDeleteIds).toEqual(["a"]);
  });

  it("does not delete everything when the editor sends ids it knows", () => {
    // The whole bug in one assertion: before the fix this was ["a","b","c"].
    const plan = planSync(
      ["a", "b", "c"],
      [{ id: "a" }, { id: "b" }, { id: "c" }],
    );
    expect(plan.toDeleteIds).toEqual([]);
  });

  it("handles an empty template and an empty editor", () => {
    expect(planSync([], [])).toEqual({ toUpdate: [], toInsert: [], toDeleteIds: [] });
    expect(planSync(["a"], []).toDeleteIds).toEqual(["a"]);
    expect(planSync([], [{ id: "x" }]).toInsert).toHaveLength(1);
  });

  it("ignores a duplicate id rather than scheduling it twice", () => {
    const plan = planSync(["a"], [{ id: "a" }, { id: "a" }]);
    expect(plan.toDeleteIds).toEqual([]);
    expect(plan.toUpdate).toHaveLength(2);
  });
});
