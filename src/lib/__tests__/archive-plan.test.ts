import { describe, expect, it } from "vitest";
import { planArchive } from "../archive-plan";

const counts = (m: Record<string, number>) => new Map(Object.entries(m));
/** Treats any row carrying `text` as changed unless it matches the stored one. */
const changedBy = (stored: Record<string, string>) =>
  (row: { text?: string }, id: string) => stored[id] !== row.text;

describe("a row nobody has answered", () => {
  it("is edited in place", () => {
    const plan = planArchive(
      ["a"],
      [{ id: "a", text: "new wording" }],
      counts({}),
      changedBy({ a: "old wording" }),
    );
    expect(plan.toUpdate).toHaveLength(1);
    expect(plan.toSupersede).toEqual([]);
  });

  it("is deleted outright when removed, since it holds nothing", () => {
    const plan = planArchive(["a"], [], counts({}), changedBy({}));
    expect(plan.toDeleteIds).toEqual(["a"]);
    expect(plan.toArchiveIds).toEqual([]);
  });
});

describe("a row participants have answered", () => {
  it("is archived rather than deleted when removed", () => {
    const plan = planArchive(["a"], [], counts({ a: 4 }), changedBy({}));
    expect(plan.toArchiveIds).toEqual(["a"]);
    expect(plan.toDeleteIds).toEqual([]);
  });

  it("is superseded rather than rewritten when reworded", () => {
    const plan = planArchive(
      ["a"],
      [{ id: "a", text: "reworded" }],
      counts({ a: 4 }),
      changedBy({ a: "original" }),
    );
    expect(plan.toUpdate).toEqual([]);
    expect(plan.toSupersede).toHaveLength(1);
    expect(plan.toSupersede[0].id).toBe("a");
    expect(plan.toSupersede[0].replacement.text).toBe("reworded");
  });

  it("is left alone when nothing about it changed", () => {
    // Saving the template for an unrelated reason must not version every
    // answered question, or a study accumulates a copy per save.
    const plan = planArchive(
      ["a"],
      [{ id: "a", text: "original" }],
      counts({ a: 4 }),
      changedBy({ a: "original" }),
    );
    expect(plan.toSupersede).toEqual([]);
    expect(plan.toUpdate).toHaveLength(1);
  });
});

describe("the mix", () => {
  it("handles added, edited, answered and removed together", () => {
    const plan = planArchive(
      ["kept", "answered-edit", "answered-gone", "draft-gone"],
      [
        { id: "kept", text: "same" },
        { id: "answered-edit", text: "changed" },
        { id: "brand-new", text: "new" },
      ],
      counts({ "answered-edit": 2, "answered-gone": 9 }),
      changedBy({
        kept: "same",
        "answered-edit": "was",
        "answered-gone": "was",
        "draft-gone": "was",
      }),
    );

    expect(plan.toUpdate.map((r) => r.id)).toEqual(["kept"]);
    expect(plan.toInsert.map((r) => r.id)).toEqual(["brand-new"]);
    expect(plan.toSupersede.map((s) => s.id)).toEqual(["answered-edit"]);
    expect(plan.toArchiveIds).toEqual(["answered-gone"]);
    expect(plan.toDeleteIds).toEqual(["draft-gone"]);
  });

  it("never both deletes and archives the same row", () => {
    const plan = planArchive(["a"], [], counts({ a: 1 }), changedBy({}));
    expect(plan.toDeleteIds).not.toContain("a");
  });
});
