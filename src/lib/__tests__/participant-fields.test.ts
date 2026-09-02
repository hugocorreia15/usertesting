import { describe, expect, it } from "vitest";
import {
  PARTICIPANT_FIELD_TYPES,
  decodeMultiValue,
  encodeMultiValue,
  formatParticipantFieldValue,
  isMultiValue,
  needsOptions,
  ratingScale,
} from "../participant-fields";

describe("multi-select encoding", () => {
  it("round-trips the chosen options", () => {
    const chosen = ["Daily", "Weekly"];
    expect(decodeMultiValue(encodeMultiValue(chosen))).toEqual(chosen);
  });

  it("drops blank entries", () => {
    expect(encodeMultiValue(["Daily", "  ", ""])).toBe('["Daily"]');
    expect(encodeMultiValue([])).toBe("");
  });

  it("reads a legacy single-choice answer as one value", () => {
    // A field switched from Single to Multiple Choice must keep showing the
    // answer already collected, which was stored as plain text.
    expect(decodeMultiValue("Weekly")).toEqual(["Weekly"]);
  });

  it("treats unparseable content as one answer rather than losing it", () => {
    expect(decodeMultiValue("[not json")).toEqual(["[not json"]);
  });

  it("reads nothing from empty input", () => {
    expect(decodeMultiValue("")).toEqual([]);
    expect(decodeMultiValue(null)).toEqual([]);
    expect(decodeMultiValue(undefined)).toEqual([]);
  });
});

describe("display formatting", () => {
  it("joins multi-select answers", () => {
    expect(
      formatParticipantFieldValue(
        { field_type: "multiple_choice" },
        '["Daily","Weekly"]',
      ),
    ).toBe("Daily, Weekly");
  });

  it("passes other types through untouched", () => {
    expect(formatParticipantFieldValue({ field_type: "textarea" }, "a, b")).toBe("a, b");
    expect(formatParticipantFieldValue({ field_type: "rating" }, "4")).toBe("4");
  });

  it("renders an absent value as empty", () => {
    expect(formatParticipantFieldValue({ field_type: "text" }, null)).toBe("");
  });
});

describe("field type helpers", () => {
  it("asks for options only where they are chosen from", () => {
    expect(needsOptions("select")).toBe(true);
    expect(needsOptions("multiple_choice")).toBe(true);
    expect(needsOptions("rating")).toBe(false);
    expect(isMultiValue("select")).toBe(false);
  });

  it("offers every type the task question picker offers", () => {
    const labels = PARTICIPANT_FIELD_TYPES.map((t) => t.label);
    expect(labels).toContain("Open Text");
    expect(labels).toContain("Single Choice");
    expect(labels).toContain("Multiple Choice");
    expect(labels).toContain("Rating");
  });
});

describe("ratingScale", () => {
  it("spans the configured bounds inclusively", () => {
    expect(ratingScale({ field_type: "rating", rating_min: 1, rating_max: 5 }))
      .toEqual([1, 2, 3, 4, 5]);
    expect(ratingScale({ field_type: "rating", rating_min: 0, rating_max: 10 }))
      .toHaveLength(11);
  });

  it("defaults to 1..5", () => {
    expect(ratingScale({ field_type: "rating" })).toEqual([1, 2, 3, 4, 5]);
  });

  it("degrades safely when bounds are inverted", () => {
    expect(ratingScale({ field_type: "rating", rating_min: 5, rating_max: 1 }))
      .toEqual([5]);
  });
});
