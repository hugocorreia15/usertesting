import { describe, it, expect } from "vitest";
import { applyTaskOrder } from "../task-order";

const IDS = ["a", "b", "c", "d", "e"];

// deterministic LCG for reproducible shuffles
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    return s / 2 ** 32;
  };
}

describe("applyTaskOrder", () => {
  it("fixed keeps the template order and returns a copy", () => {
    const out = applyTaskOrder(IDS, "fixed");
    expect(out).toEqual(IDS);
    expect(out).not.toBe(IDS);
  });

  it("shuffled is a permutation of the same tasks", () => {
    const out = applyTaskOrder(IDS, "shuffled", 0, seededRng(1));
    expect([...out].sort()).toEqual([...IDS].sort());
    expect(out).toHaveLength(IDS.length);
  });

  it("shuffled differs across sessions (different rng streams)", () => {
    const a = applyTaskOrder(IDS, "shuffled", 0, seededRng(1));
    const b = applyTaskOrder(IDS, "shuffled", 0, seededRng(2));
    expect(a).not.toEqual(b);
  });

  it("shuffled is deterministic for a given rng", () => {
    const a = applyTaskOrder(IDS, "shuffled", 0, seededRng(7));
    const b = applyTaskOrder(IDS, "shuffled", 0, seededRng(7));
    expect(a).toEqual(b);
  });

  it("latin_square rotates by the session index", () => {
    expect(applyTaskOrder(IDS, "latin_square", 0)).toEqual(IDS);
    expect(applyTaskOrder(IDS, "latin_square", 1)).toEqual([
      "b",
      "c",
      "d",
      "e",
      "a",
    ]);
    expect(applyTaskOrder(IDS, "latin_square", 4)).toEqual([
      "e",
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("latin_square wraps around and tolerates negatives", () => {
    expect(applyTaskOrder(IDS, "latin_square", 5)).toEqual(IDS);
    expect(applyTaskOrder(IDS, "latin_square", 7)).toEqual(
      applyTaskOrder(IDS, "latin_square", 2),
    );
    expect(applyTaskOrder(IDS, "latin_square", -1)).toEqual(
      applyTaskOrder(IDS, "latin_square", 4),
    );
  });

  it("across k sessions every task hits every position once", () => {
    const positions = new Map<string, Set<number>>();
    for (let s = 0; s < IDS.length; s++) {
      const order = applyTaskOrder(IDS, "latin_square", s);
      order.forEach((id, pos) => {
        if (!positions.has(id)) positions.set(id, new Set());
        positions.get(id)!.add(pos);
      });
    }
    for (const set of positions.values()) {
      expect(set.size).toBe(IDS.length);
    }
  });

  it("handles empty and single-item lists", () => {
    expect(applyTaskOrder([], "shuffled")).toEqual([]);
    expect(applyTaskOrder(["only"], "latin_square", 3)).toEqual(["only"]);
  });
});
