// @vitest-environment node
import { describe, it, expect } from "vitest";
import { cohensKappa, numericAgreement, sessionAgreement } from "../agreement";

describe("cohensKappa", () => {
  it("returns 1 for perfect agreement across ≥2 categories", () => {
    const r = cohensKappa([
      ["success", "success"],
      ["failure", "failure"],
      ["partial", "partial"],
    ]);
    expect(r.kappa).toBe(1);
    expect(r.observed).toBe(1);
    expect(r.label).toBe("almost perfect");
  });

  it("matches the textbook worked example", () => {
    // Classic 2x2: raters agree yes/yes 20, no/no 15, disagree 5+10.
    // po = 35/50 = 0.7; A yes=25,no=25; B yes=30,no=20;
    // pe = .5*.6 + .5*.4 = 0.5; kappa = (0.7-0.5)/(1-0.5) = 0.4
    const pairs: [string, string][] = [];
    for (let i = 0; i < 20; i++) pairs.push(["yes", "yes"]);
    for (let i = 0; i < 15; i++) pairs.push(["no", "no"]);
    for (let i = 0; i < 5; i++) pairs.push(["yes", "no"]);
    for (let i = 0; i < 10; i++) pairs.push(["no", "yes"]);
    const r = cohensKappa(pairs);
    expect(r.kappa).toBeCloseTo(0.4, 10);
    expect(r.label).toBe("fair");
  });

  it("is near zero for chance-level agreement", () => {
    // Both raters split 50/50 independently, agreeing exactly at chance
    const r = cohensKappa([
      ["a", "a"],
      ["a", "b"],
      ["b", "a"],
      ["b", "b"],
    ]);
    expect(r.kappa).toBeCloseTo(0, 10);
  });

  it("goes negative for systematic disagreement", () => {
    const r = cohensKappa([
      ["a", "b"],
      ["b", "a"],
      ["a", "b"],
      ["b", "a"],
    ]);
    expect(r.kappa!).toBeLessThan(0);
    expect(r.label).toBe("poor");
  });

  it("reports undefined kappa when both use a single identical category", () => {
    const r = cohensKappa([
      ["success", "success"],
      ["success", "success"],
    ]);
    expect(r.kappa).toBeNull();
    expect(r.observed).toBe(1);
    expect(r.label).toContain("single category");
  });

  it("drops pairs with a missing side and counts the rest", () => {
    const r = cohensKappa([
      ["success", "success"],
      ["failure", null],
      [null, "partial"],
      ["partial", "partial"],
    ]);
    expect(r.n).toBe(2);
    expect(r.kappa).toBe(1);
  });

  it("handles no shared items", () => {
    const r = cohensKappa([[null, "a"]]);
    expect(r.n).toBe(0);
    expect(r.kappa).toBeNull();
  });
});

describe("numericAgreement", () => {
  it("computes exact agreement, mean abs diff, and correlation", () => {
    const r = numericAgreement([
      [3, 3],
      [5, 6],
      [2, 4],
    ]);
    expect(r.n).toBe(3);
    expect(r.exact).toBeCloseTo(1 / 3, 10);
    expect(r.meanAbsDiff).toBeCloseTo((0 + 1 + 2) / 3, 10);
    expect(r.pearson).not.toBeNull();
  });

  it("gives pearson 1 for a perfect linear relationship", () => {
    const r = numericAgreement([
      [1, 2],
      [2, 4],
      [3, 6],
    ]);
    expect(r.pearson).toBeCloseTo(1, 10);
  });

  it("returns null pearson when a series is constant", () => {
    const r = numericAgreement([
      [4, 1],
      [4, 2],
      [4, 3],
    ]);
    expect(r.pearson).toBeNull();
    expect(r.exact).toBe(0);
  });

  it("drops pairs with a missing side", () => {
    const r = numericAgreement([
      [1, 1],
      [2, null],
      [null, 3],
    ]);
    expect(r.n).toBe(1);
    expect(r.exact).toBe(1);
  });

  it("handles empty input", () => {
    const r = numericAgreement([]);
    expect(r).toEqual({ n: 0, exact: 0, meanAbsDiff: 0, pearson: null });
  });
});

describe("sessionAgreement", () => {
  const primary = [
    { task_id: "t1", completion_status: "success", action_count: 4, error_count: 1, hesitation_count: 0, seq_rating: 6 },
    { task_id: "t2", completion_status: "failure", action_count: 9, error_count: 3, hesitation_count: 2, seq_rating: 2 },
  ];

  it("joins a co-rater to the primary by task and scores each channel", () => {
    const co = [
      { rater_id: "r2", rater_email: "b@x.pt", task_id: "t1", completion_status: "success", action_count: 4, error_count: 1, hesitation_count: 0, seq_rating: 6 },
      { rater_id: "r2", rater_email: "b@x.pt", task_id: "t2", completion_status: "partial", action_count: 8, error_count: 3, hesitation_count: 1, seq_rating: 3 },
    ];
    const [r] = sessionAgreement(primary, co);
    expect(r.raterId).toBe("r2");
    expect(r.completion.n).toBe(2);
    expect(r.errors.exact).toBe(1); // both errors match
    expect(r.actions.n).toBe(2);
  });

  it("only counts tasks the co-rater actually scored", () => {
    const co = [
      { rater_id: "r2", rater_email: null, task_id: "t1", completion_status: "success", action_count: 4, error_count: 1, hesitation_count: 0, seq_rating: 6 },
    ];
    const [r] = sessionAgreement(primary, co);
    expect(r.completion.n).toBe(1);
  });

  it("separates multiple co-raters", () => {
    const co = [
      { rater_id: "r2", rater_email: null, task_id: "t1", completion_status: "success", action_count: 4, error_count: 1, hesitation_count: 0, seq_rating: 6 },
      { rater_id: "r3", rater_email: null, task_id: "t1", completion_status: "failure", action_count: 4, error_count: 1, hesitation_count: 0, seq_rating: 6 },
    ];
    const rs = sessionAgreement(primary, co);
    expect(rs).toHaveLength(2);
  });
});
