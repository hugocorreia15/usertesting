import { describe, it, expect } from "vitest";
import { calculateSusScore, getSusLabel } from "./sus";

function answers(scores: number[]) {
  return scores.map((score, i) => ({ question_number: i + 1, score }));
}

describe("calculateSusScore", () => {
  it("scores the best possible responses as 100", () => {
    // odd items agree (5), even items disagree (1)
    expect(calculateSusScore(answers([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]))).toBe(100);
  });

  it("scores the worst possible responses as 0", () => {
    expect(calculateSusScore(answers([1, 5, 1, 5, 1, 5, 1, 5, 1, 5]))).toBe(0);
  });

  it("scores all-neutral responses as 50", () => {
    expect(calculateSusScore(answers([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]))).toBe(50);
  });

  it("matches a real participant vector (82.5)", () => {
    expect(calculateSusScore(answers([5, 2, 4, 1, 4, 2, 4, 1, 4, 2]))).toBe(82.5);
  });

  it("returns null with fewer than 10 answers", () => {
    expect(calculateSusScore(answers([5, 1, 5]))).toBeNull();
  });

  it("returns null when a question number is missing", () => {
    const a = answers([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]);
    a[9].question_number = 11; // question 10 absent
    expect(calculateSusScore(a)).toBeNull();
  });

  it("is order-independent", () => {
    const a = answers([5, 2, 4, 1, 4, 2, 4, 1, 4, 2]).reverse();
    expect(calculateSusScore(a)).toBe(82.5);
  });
});

describe("getSusLabel", () => {
  it.each([
    [80.3, "Excellent"],
    [80.2, "Good"],
    [68, "Good"],
    [67.9, "OK"],
    [51, "OK"],
    [50.9, "Poor"],
    [25, "Poor"],
    [24.9, "Awful"],
  ])("labels %s as %s", (score, label) => {
    expect(getSusLabel(score as number)).toBe(label);
  });
});
