import { describe, expect, it } from "vitest";
import { summarizeSynthesis } from "../synthesis";

describe("summarizeSynthesis", () => {
  it("reports nothing before anything is tested", () => {
    const s = summarizeSynthesis({ outcomes: ["untested", "untested"], testOnlyCount: 0 });
    expect(s).toMatchObject({ predicted: 2, untested: 2, predictedAndConfirmed: null, confirmedAndPredicted: null });
  });

  it("leaves untested predictions out of both ratios", () => {
    const s = summarizeSynthesis({
      outcomes: ["confirmed", "not_observed", "untested", "untested"],
      testOnlyCount: 0,
    });
    expect(s.predictedAndConfirmed).toBe(0.5);
    expect(s.confirmedAndPredicted).toBe(1);
  });

  it("counts problems only testing found against the inspection's coverage", () => {
    const s = summarizeSynthesis({
      outcomes: ["confirmed", "confirmed", "confirmed", "not_observed"],
      testOnlyCount: 3,
    });
    expect(s.predictedAndConfirmed).toBe(0.75);
    expect(s.confirmedAndPredicted).toBe(0.5);
  });

  it("handles testing that showed only unpredicted problems", () => {
    const s = summarizeSynthesis({ outcomes: ["not_observed"], testOnlyCount: 2 });
    expect(s.predictedAndConfirmed).toBe(0);
    expect(s.confirmedAndPredicted).toBe(0);
  });
});
