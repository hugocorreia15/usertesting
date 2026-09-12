import { describe, expect, it } from "vitest";
import {
  aggregationCurve,
  anyTwoAgreement,
  detectionRate,
  evaluatorsNeeded,
  problemCoverage,
  severityAgreement,
  summarizeInspection,
  type InspectionPass,
} from "../inspection";

const pass = (
  evaluatorId: string,
  problemIds: string[],
  severity?: Record<string, number>,
): InspectionPass => ({ evaluatorId, problemIds, severity });

describe("anyTwoAgreement", () => {
  it("is the Hertzum and Jacobsen ratio for one pair", () => {
    // Shared {b}; collectively {a,b,c}. 1/3.
    const r = anyTwoAgreement([pass("e1", ["a", "b"]), pass("e2", ["b", "c"])]);
    expect(r.pairs).toHaveLength(1);
    expect(r.value).toBeCloseTo(1 / 3, 10);
  });

  it("averages over all n(n-1)/2 pairs, not over evaluators", () => {
    const r = anyTwoAgreement([
      pass("e1", ["a"]),
      pass("e2", ["a"]),
      pass("e3", ["b"]),
    ]);
    // Pairs: (1,2)=1, (1,3)=0, (2,3)=0 -> mean 1/3.
    expect(r.pairs).toHaveLength(3);
    expect(r.value).toBeCloseTo(1 / 3, 10);
  });

  it("is 1 when everyone found the same set and 0 when nobody overlaps", () => {
    expect(
      anyTwoAgreement([pass("a", ["x", "y"]), pass("b", ["y", "x"])]).value,
    ).toBe(1);
    expect(
      anyTwoAgreement([pass("a", ["x"]), pass("b", ["y"])]).value,
    ).toBe(0);
  });

  it("treats a pair who both found nothing as undefined, not as perfect", () => {
    const r = anyTwoAgreement([pass("a", []), pass("b", [])]);
    expect(r.pairs[0].jaccard).toBeNull();
    expect(r.value).toBeNull();
  });

  it("ignores duplicate ids within one pass", () => {
    const r = anyTwoAgreement([pass("a", ["x", "x", "x"]), pass("b", ["x"])]);
    expect(r.value).toBe(1);
  });

  it("needs two passes", () => {
    expect(anyTwoAgreement([pass("a", ["x"])]).value).toBeNull();
    expect(anyTwoAgreement([]).value).toBeNull();
  });

  it("labels against the published 5% to 65% range", () => {
    // 2 shared of 41 collectively is under 5%.
    const low = anyTwoAgreement([
      pass("a", Array.from({ length: 21 }, (_, i) => `p${i}`)),
      pass("b", Array.from({ length: 22 }, (_, i) => `p${i + 20}`)),
    ]);
    expect(low.value! * 100).toBeLessThan(5);
    expect(low.label).toContain("below");
    expect(anyTwoAgreement([pass("a", ["x"]), pass("b", ["x"])]).label).toContain(
      "above",
    );
    expect(
      anyTwoAgreement([pass("a", ["x", "y"]), pass("b", ["y", "z"])]).label,
    ).toContain("within");
  });
});

describe("problemCoverage", () => {
  it("counts evaluators per problem, most agreed first", () => {
    const c = problemCoverage([
      pass("a", ["x", "y"]),
      pass("b", ["x"]),
      pass("c", ["x", "z"]),
    ]);
    expect(c[0]).toEqual({ problemId: "x", foundBy: 3 });
    expect(c.map((p) => p.problemId)).toEqual(["x", "y", "z"]);
  });
});

describe("detectionRate", () => {
  it("is the mean share of known problems one evaluator found", () => {
    // Total known = 4. Shares 2/4 and 2/4 -> 0.5.
    expect(
      detectionRate([pass("a", ["w", "x"]), pass("b", ["y", "z"])]),
    ).toBeCloseTo(0.5, 10);
  });

  it("is 1 when every evaluator found everything", () => {
    expect(detectionRate([pass("a", ["x"]), pass("b", ["x"])])).toBe(1);
  });

  it("is 0 with no passes or no findings", () => {
    expect(detectionRate([])).toBe(0);
    expect(detectionRate([pass("a", [])])).toBe(0);
  });
});

describe("aggregationCurve", () => {
  it("reaches every known problem at the full evaluator count", () => {
    const curve = aggregationCurve([
      pass("a", ["x", "y"]),
      pass("b", ["y", "z"]),
      pass("c", ["z"]),
    ]);
    expect(curve).toHaveLength(3);
    expect(curve[2].expected).toBeCloseTo(3, 10);
    expect(curve[2].share).toBeCloseTo(1, 10);
  });

  it("averages over subsets rather than following storage order", () => {
    // Three evaluators, disjoint singletons: any one finds exactly 1 of 3.
    const curve = aggregationCurve([
      pass("a", ["x"]),
      pass("b", ["y"]),
      pass("c", ["z"]),
    ]);
    expect(curve[0].expected).toBeCloseTo(1, 10);
    expect(curve[1].expected).toBeCloseTo(2, 10);
  });

  it("computes the exact subset expectation for a mixed case", () => {
    // x found by a,b; y by a only. n=3 (c found nothing).
    // k=1: x in 2/3 of subsets, y in 1/3 -> 1.0
    const curve = aggregationCurve([
      pass("a", ["x", "y"]),
      pass("b", ["x"]),
      pass("c", []),
    ]);
    expect(curve[0].expected).toBeCloseTo(2 / 3 + 1 / 3, 10);
    // k=2: x missed only by {c,?} where neither is a or b -> impossible, so
    // P(found) = 1 - C(1,2)/C(3,2) = 1. y: 1 - C(2,2)/C(3,2) = 1 - 1/3.
    expect(curve[1].expected).toBeCloseTo(1 + 2 / 3, 10);
  });

  it("is monotonically non-decreasing", () => {
    const curve = aggregationCurve([
      pass("a", ["x", "y", "z"]),
      pass("b", ["y"]),
      pass("c", ["z", "w"]),
      pass("d", ["x", "w", "v"]),
    ]);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].expected).toBeGreaterThanOrEqual(curve[i - 1].expected);
    }
  });

  it("is empty with no passes or no findings", () => {
    expect(aggregationCurve([])).toEqual([]);
    expect(aggregationCurve([pass("a", [])])).toEqual([]);
  });
});

describe("evaluatorsNeeded", () => {
  it("reproduces the classic three-to-five band for mid-range lambda", () => {
    // lambda = 0.3 is the value Nielsen and Landauer report as typical.
    expect(evaluatorsNeeded(0.3, 0.75)).toBe(4);
    expect(evaluatorsNeeded(0.3, 0.9)).toBe(7);
  });

  it("needs one evaluator when a single pass finds everything", () => {
    expect(evaluatorsNeeded(1, 0.9)).toBe(1);
  });

  it("is null when nobody finds anything", () => {
    expect(evaluatorsNeeded(0, 0.75)).toBeNull();
  });

  it("is null when the cap is reached", () => {
    expect(evaluatorsNeeded(0.01, 0.99, 5)).toBeNull();
  });
});

describe("severityAgreement", () => {
  it("counts only problems at least two evaluators rated", () => {
    const r = severityAgreement([
      pass("a", ["x", "y"], { x: 3, y: 2 }),
      pass("b", ["x"], { x: 3 }),
    ]);
    expect(r.n).toBe(1);
    expect(r.exact).toBe(1);
    expect(r.meanRange).toBe(0);
  });

  it("measures the spread of ratings for one problem", () => {
    const r = severityAgreement([
      pass("a", ["x"], { x: 1 }),
      pass("b", ["x"], { x: 4 }),
    ]);
    expect(r.exact).toBe(0);
    expect(r.meanRange).toBe(3);
  });

  it("flags disagreement across the act-or-not line at severity 3", () => {
    const r = severityAgreement([
      pass("a", ["x", "y"], { x: 2, y: 3 }),
      pass("b", ["x", "y"], { x: 3, y: 4 }),
    ]);
    // x: 2 vs 3 crosses the line. y: 3 vs 4 does not, both are severe.
    expect(r.severityDisputes).toBe(1);
  });

  it("is empty when nobody rated severity", () => {
    const r = severityAgreement([pass("a", ["x"]), pass("b", ["x"])]);
    expect(r).toEqual({ n: 0, exact: 0, meanRange: 0, severityDisputes: 0 });
  });
});

describe("summarizeInspection", () => {
  it("describes a realistic low-overlap inspection", () => {
    const s = summarizeInspection([
      pass("a", ["p1", "p2", "p3"], { p1: 3, p2: 2, p3: 1 }),
      pass("b", ["p1", "p4"], { p1: 4, p4: 2 }),
      pass("c", ["p5", "p6"], { p5: 1, p6: 3 }),
    ]);

    expect(s.evaluators).toBe(3);
    expect(s.totalProblems).toBe(6);
    // Only p1 was found twice; the other five are unique.
    expect(s.uniqueProblems).toBe(5);
    expect(s.uniqueShare).toBeCloseTo(5 / 6, 10);
    expect(s.detectionRate).toBeCloseTo((3 / 6 + 2 / 6 + 2 / 6) / 3, 10);
    expect(s.anyTwo.value).toBeGreaterThan(0);
    expect(s.curve).toHaveLength(3);
    expect(s.curve[2].share).toBeCloseTo(1, 10);
    // p1 rated 3 and 4: both severe, so no dispute.
    expect(s.severity.n).toBe(1);
    expect(s.severity.severityDisputes).toBe(0);
  });

  it("survives an empty inspection without dividing by zero", () => {
    const s = summarizeInspection([]);
    expect(s.totalProblems).toBe(0);
    expect(s.uniqueShare).toBe(0);
    expect(s.detectionRate).toBe(0);
    expect(s.anyTwo.value).toBeNull();
    expect(s.curve).toEqual([]);
  });
});
