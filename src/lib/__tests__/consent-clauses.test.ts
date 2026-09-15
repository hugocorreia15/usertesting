import { describe, it, expect } from "vitest";
import {
  CONSENT_CLAUSES,
  clausesPresentIn,
  composeConsent,
  consentGaps,
  recommendedClauseIds,
} from "../consent-clauses";

const AI = "Your written answers may be read by an automated language model.";

describe("composeConsent", () => {
  it("puts the purpose first and the contact last", () => {
    const text = composeConsent({
      purpose: "We are testing a library booking site",
      selected: ["voluntary", "withdraw"],
      contact: "ana@example.org",
    });
    expect(text.startsWith("We are testing a library booking site.")).toBe(true);
    expect(text.endsWith("If you have questions, contact ana@example.org.")).toBe(true);
  });

  it("adds a full stop to a purpose that lacks one, and does not double it", () => {
    expect(composeConsent({ purpose: "A study", selected: [] })).toBe("A study.");
    expect(composeConsent({ purpose: "A study.", selected: [] })).toBe("A study.");
  });

  it("keeps the catalogue order, not the tick order", () => {
    const text = composeConsent({ purpose: "", selected: ["storage", "voluntary"] });
    expect(text.indexOf("Taking part is voluntary")).toBeLessThan(text.indexOf("stored securely"));
  });

  it("puts the model clause after the ordinary ones and before the contact", () => {
    const text = composeConsent({
      purpose: "",
      selected: ["voluntary"],
      aiClause: AI,
      contact: "ana@example.org",
    });
    expect(text.indexOf("Taking part is voluntary")).toBeLessThan(text.indexOf(AI));
    expect(text.indexOf(AI)).toBeLessThan(text.indexOf("ana@example.org"));
  });

  it("includes the model clause exactly as given, since the database matches on it", () => {
    expect(composeConsent({ purpose: "", selected: [], aiClause: AI })).toContain(AI);
  });

  it("omits the model clause when it is absent, empty or whitespace", () => {
    for (const v of [undefined, null, "", "   "]) {
      expect(composeConsent({ purpose: "x", selected: [], aiClause: v })).toBe("x.");
    }
  });

  it("returns an empty string when nothing is chosen", () => {
    expect(composeConsent({ purpose: "  ", selected: [] })).toBe("");
  });

  it("treats a contact without an at sign as a sentence of its own", () => {
    expect(composeConsent({ purpose: "", selected: [], contact: "Ask the moderator" })).toBe(
      "Ask the moderator.",
    );
  });
});

describe("clausesPresentIn", () => {
  it("round-trips what compose produced", () => {
    const selected = ["voluntary", "withdraw", "storage"];
    const text = composeConsent({ purpose: "A study", selected });
    expect(clausesPresentIn(text).sort()).toEqual([...selected].sort());
  });

  it("finds nothing in empty or unrelated text", () => {
    expect(clausesPresentIn(null)).toEqual([]);
    expect(clausesPresentIn("Please help us test our website.")).toEqual([]);
  });
});

describe("consentGaps", () => {
  it("says so when there is no text at all", () => {
    expect(consentGaps("")).toEqual(["There is no consent text at all."]);
  });

  it("names the right to stop when it is missing", () => {
    expect(consentGaps("Taking part is voluntary.")).toContain(
      "it does not say they may stop at any time",
    );
  });

  it("is quiet once the recommended clauses are in", () => {
    const text = composeConsent({ purpose: "A study", selected: recommendedClauseIds() });
    expect(consentGaps(text)).toEqual([]);
  });
});

describe("the catalogue", () => {
  it("has unique ids", () => {
    const ids = CONSENT_CLAUSES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("does not carry a copy of the model clause, which belongs to the database", () => {
    for (const c of CONSENT_CLAUSES) {
      expect(c.sentence.toLowerCase()).not.toContain("language model");
    }
  });

  it("recommends the clauses whose absence is always an oversight", () => {
    expect(recommendedClauseIds()).toEqual(
      expect.arrayContaining(["voluntary", "withdraw", "anonymous_reporting"]),
    );
  });
});
