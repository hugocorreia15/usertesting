import { describe, expect, it } from "vitest";
import { quoteName, quoteNames } from "../quote-names";

describe("quoteName", () => {
  it("quotes a name so it reads as a quotation", () => {
    expect(quoteName("Find the away mode")).toBe('"Find the away mode"');
  });

  it("drops trailing punctuation that would collide with the list comma", () => {
    // The real case: a task named as a sentence, ending in a full stop.
    expect(quoteName("Siga o tutorial e responda.")).toBe('"Siga o tutorial e responda"');
    expect(quoteName("Ends with a comma,")).toBe('"Ends with a comma"');
  });

  it("shortens a name long enough to swallow the message", () => {
    const long = "Siga o tutorial e responda às seguintes questões quando terminar";
    const out = quoteName(long);
    expect(out.length).toBeLessThanOrEqual(54);
    expect(out.endsWith('…"')).toBe(true);
  });

  it("leaves a name that fits exactly alone", () => {
    const fits = "a".repeat(52);
    expect(quoteName(fits)).toBe(`"${fits}"`);
  });

  it("says untitled rather than showing empty quotes", () => {
    expect(quoteName("   ")).toBe('"untitled"');
    expect(quoteName(".")).toBe('"untitled"');
  });
});

describe("quoteNames", () => {
  it("reads as a sentence for two", () => {
    expect(quoteNames(["One", "Two"])).toBe('"One" and "Two"');
  });

  it("keeps the list short and counts the rest", () => {
    expect(quoteNames(["A", "B", "C", "D", "E"])).toBe('"A", "B", "C" and 2 more');
  });

  it("does not write and 1 more for a single overflow", () => {
    expect(quoteNames(["A", "B", "C", "D"])).toBe('"A", "B", "C" and 1 more');
  });

  it("is empty for nothing", () => {
    expect(quoteNames([])).toBe("");
  });

  it("fixes the reported line end to end", () => {
    const out = quoteNames([
      "Siga o tutorial e responda às seguintes questões quando terminar.",
      "Cybersickness Pós-Experiência",
    ]);
    // No "., " collision, and both names are visibly quotations.
    expect(out).not.toContain(".,");
    expect(out).toContain("and");
    expect(out.startsWith('"Siga o tutorial')).toBe(true);
  });
});
