import { describe, expect, it } from "vitest";
import {
  MAX_CLUSTERS,
  describeDiscarded,
  validateMergeSuggestion,
} from "../ai-suggestions";

const context = {
  findingIds: ["f1", "f2", "f3", "f4"],
  heuristicCodes: ["H1", "H2", "H10"],
};

const cluster = (over: Record<string, unknown> = {}) => ({
  title: "No feedback on save",
  finding_ids: ["f1", "f2"],
  heuristic_code: "H1",
  severity: 3,
  ...over,
});

describe("validateMergeSuggestion", () => {
  it("keeps a well-formed proposal", () => {
    const v = validateMergeSuggestion([cluster()], context);
    expect(v.clusters).toEqual([
      { title: "No feedback on save", findingIds: ["f1", "f2"], heuristicCode: "H1", severity: 3 },
    ]);
    expect(v.discarded).toEqual([]);
  });

  it("accepts the answer wrapped in an object", () => {
    for (const key of ["clusters", "problems", "groups"]) {
      const v = validateMergeSuggestion({ [key]: [cluster()] }, context);
      expect(v.clusters).toHaveLength(1);
    }
  });

  it("drops findings that do not exist, and says how many", () => {
    const v = validateMergeSuggestion(
      [cluster({ finding_ids: ["f1", "invented", "also-invented"] })],
      context,
    );
    expect(v.clusters[0].findingIds).toEqual(["f1"]);
    expect(v.discarded).toContainEqual({ reason: "unknown finding", count: 2 });
  });

  it("never lets one finding belong to two problems", () => {
    const v = validateMergeSuggestion(
      [cluster({ finding_ids: ["f1", "f2"] }), cluster({ title: "Second", finding_ids: ["f2", "f3"] })],
      context,
    );
    expect(v.clusters[0].findingIds).toEqual(["f1", "f2"]);
    expect(v.clusters[1].findingIds).toEqual(["f3"]);
    expect(v.discarded).toContainEqual({ reason: "finding already in another group", count: 1 });
  });

  it("drops a group whose findings were all invented", () => {
    const v = validateMergeSuggestion([cluster({ finding_ids: ["nope"] })], context);
    expect(v.clusters).toEqual([]);
    expect(v.discarded).toContainEqual({ reason: "no findings left", count: 1 });
  });

  it("releases the findings of an untitled group so a later one may claim them", () => {
    const v = validateMergeSuggestion(
      [cluster({ title: "   ", finding_ids: ["f1"] }), cluster({ title: "Real", finding_ids: ["f1"] })],
      context,
    );
    expect(v.clusters).toHaveLength(1);
    expect(v.clusters[0].findingIds).toEqual(["f1"]);
    expect(v.discarded).toContainEqual({ reason: "no title", count: 1 });
  });

  it("refuses a heuristic outside the inspection's own set", () => {
    const v = validateMergeSuggestion([cluster({ heuristic_code: "H99" })], context);
    expect(v.clusters[0].heuristicCode).toBeNull();
    expect(v.discarded).toContainEqual({ reason: "unknown heuristic", count: 1 });
  });

  it("accepts a known heuristic in any case", () => {
    expect(validateMergeSuggestion([cluster({ heuristic_code: "h10" })], context).clusters[0].heuristicCode).toBe("H10");
  });

  it("refuses a severity off the scale or not a whole number", () => {
    for (const bad of [11, -1, 2.5, "high", {}]) {
      const v = validateMergeSuggestion([cluster({ severity: bad })], context);
      expect(v.clusters[0].severity).toBeNull();
      expect(v.discarded).toContainEqual({ reason: "unusable severity", count: 1 });
    }
    // Absent severity is not an error.
    expect(validateMergeSuggestion([cluster({ severity: null })], context).discarded).toEqual([]);
  });

  it("caps a runaway answer", () => {
    const many = Array.from({ length: MAX_CLUSTERS + 5 }, (_, i) =>
      cluster({ title: `Problem ${i}`, finding_ids: [] }),
    );
    // Give each one a real finding so only the cap can stop them.
    const withIds = many.map((c, i) => ({ ...c, finding_ids: [context.findingIds[i % 4]] }));
    const v = validateMergeSuggestion(withIds, context);
    expect(v.clusters.length).toBeLessThanOrEqual(MAX_CLUSTERS);
  });

  it("returns nothing for junk instead of throwing", () => {
    for (const junk of [null, undefined, "text", 42, {}, { clusters: "no" }]) {
      expect(validateMergeSuggestion(junk, context).clusters).toEqual([]);
    }
  });

  it("truncates an essay title", () => {
    const v = validateMergeSuggestion([cluster({ title: "x".repeat(400) })], context);
    expect(v.clusters[0].title.length).toBeLessThanOrEqual(160);
  });
});

describe("describeDiscarded", () => {
  it("says nothing when nothing was discarded", () => {
    expect(describeDiscarded([])).toBeNull();
  });

  it("names what was ignored", () => {
    expect(describeDiscarded([{ reason: "unknown finding", count: 2 }])).toBe(
      "Ignored from the model's answer: 2 unknown finding.",
    );
  });
});
