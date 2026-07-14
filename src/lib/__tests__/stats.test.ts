import { describe, it, expect } from "vitest";
import {
  mean,
  sampleSd,
  tCritical95,
  confidenceInterval95,
  susConfidenceInterval95,
} from "../stats";

describe("basic statistics", () => {
  it("computes mean and sample sd", () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(sampleSd([2, 4, 6])).toBe(2);
  });

  it("t critical values match the standard table", () => {
    expect(tCritical95(1)).toBeCloseTo(12.706);
    expect(tCritical95(3)).toBeCloseTo(3.182);
    expect(tCritical95(30)).toBeCloseTo(2.042);
    expect(tCritical95(200)).toBeCloseTo(1.96);
  });
});

describe("confidenceInterval95", () => {
  it("is null for fewer than two observations", () => {
    expect(confidenceInterval95([])).toBeNull();
    expect(confidenceInterval95([80])).toBeNull();
  });

  it("collapses to the mean when there is no variance", () => {
    const ci = confidenceInterval95([80, 80]);
    expect(ci).not.toBeNull();
    expect(ci!.mean).toBe(80);
    expect(ci!.margin).toBe(0);
    expect(ci!.low).toBe(80);
    expect(ci!.high).toBe(80);
  });

  it("matches a hand-computed interval for the study-1 SUS vector", () => {
    // scores 25, 40, 17.5, 30: mean 28.125, sd 9.437, t(3)=3.182
    const ci = confidenceInterval95([25, 40, 17.5, 30]);
    expect(ci!.n).toBe(4);
    expect(ci!.mean).toBeCloseTo(28.125);
    expect(ci!.sd).toBeCloseTo(9.4373, 3);
    expect(ci!.margin).toBeCloseTo(3.182 * (9.4373 / 2), 2);
    expect(ci!.low).toBeCloseTo(13.11, 1);
    expect(ci!.high).toBeCloseTo(43.14, 1);
  });
});

describe("susConfidenceInterval95", () => {
  it("clamps the interval to the 0–100 instrument bounds", () => {
    // two very low, spread scores: unclamped low would be negative
    const ci = susConfidenceInterval95([2.5, 30]);
    expect(ci!.low).toBe(0);
    expect(ci!.high).toBeLessThanOrEqual(100);
  });
});
