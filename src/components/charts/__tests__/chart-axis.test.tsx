import { describe, it, expect } from "vitest";
import { truncateLabel } from "../chart-axis";

describe("truncateLabel", () => {
  it("passes short labels through unchanged", () => {
    expect(truncateLabel("Short task")).toBe("Short task");
  });

  it("keeps labels exactly at the limit", () => {
    expect(truncateLabel("12345678901234")).toBe("12345678901234");
  });

  it("truncates long labels with an ellipsis within the limit", () => {
    const out = truncateLabel("Compare whole-recording vs TOI in the chart");
    expect(out).toHaveLength(14);
    expect(out.endsWith("…")).toBe(true);
    expect(out).toBe("Compare whole…");
  });

  it("honors a custom max length", () => {
    expect(truncateLabel("abcdefghij", 5)).toBe("abcd…");
  });
});
