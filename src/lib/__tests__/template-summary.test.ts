import { describe, it, expect } from "vitest";
import {
  attentionItems,
  countChips,
  readiness,
  reviewChip,
  type TemplateFacts,
} from "../template-summary";

const base: TemplateFacts = {
  tasks: 5,
  sessions: 0,
  inspections: 0,
  reviewMode: "off",
  reviewStatus: "draft",
  hasConsent: true,
  isShared: false,
  isPublic: false,
  requiresInspection: false,
};

describe("reviewChip", () => {
  it("says nothing when the organization does not review", () => {
    expect(reviewChip(base)).toBeNull();
  });

  it("marks a required study that was never submitted", () => {
    const c = reviewChip({ ...base, reviewMode: "required" });
    expect(c).toMatchObject({ label: "Not submitted", tone: "warning" });
  });

  it("is gentler when review is only advisory", () => {
    expect(reviewChip({ ...base, reviewMode: "advisory" })).toMatchObject({
      label: "Draft",
      tone: "neutral",
    });
  });

  it("reports approval, waiting and changes requested", () => {
    const at = (reviewStatus: TemplateFacts["reviewStatus"]) =>
      reviewChip({ ...base, reviewMode: "required", reviewStatus })?.label;
    expect(at("approved")).toBe("Approved");
    expect(at("submitted")).toBe("Waiting for review");
    expect(at("changes_requested")).toBe("Changes requested");
  });

  it("distinguishes a lapsed approval from a study never submitted", () => {
    const c = reviewChip({
      ...base,
      reviewMode: "required",
      reviewStatus: "draft",
      approvalInvalidatedAt: "2026-09-01T00:00:00Z",
    });
    expect(c).toMatchObject({ label: "Approval lapsed", tone: "warning" });
  });
});

describe("countChips", () => {
  it("does not write 1 tasks", () => {
    expect(countChips({ ...base, tasks: 1, sessions: 1 }).map((c) => c.label)).toEqual([
      "1 task",
      "1 session",
    ]);
  });

  it("warns on a study with no tasks", () => {
    expect(countChips({ ...base, tasks: 0 })[0]).toMatchObject({ tone: "warning" });
  });

  it("mentions inspections only when there are some", () => {
    expect(countChips(base)).toHaveLength(2);
    expect(countChips({ ...base, inspections: 2 })[2].label).toBe("2 inspections");
  });
});

describe("attentionItems", () => {
  it("is empty for a study with nothing wrong", () => {
    expect(attentionItems(base)).toEqual([]);
  });

  it("puts what blocks first, first", () => {
    const items = attentionItems({
      ...base,
      tasks: 0,
      hasConsent: false,
      reviewMode: "required",
    });
    expect(items[0]).toContain("No tasks");
    expect(items[1]).toContain("Not approved");
    expect(items[2]).toContain("No consent");
  });

  it("says nothing about review when the organization does not require it", () => {
    const items = attentionItems({ ...base, reviewMode: "advisory", reviewStatus: "draft" });
    expect(items).toEqual([]);
  });

  it("reads differently when sessions have already run without consent", () => {
    expect(attentionItems({ ...base, hasConsent: false, sessions: 3 })[0]).toContain(
      "already run",
    );
  });

  it("notices a required inspection that does not exist", () => {
    expect(attentionItems({ ...base, requiresInspection: true })[0]).toContain("inspection");
    expect(attentionItems({ ...base, requiresInspection: true, inspections: 1 })).toEqual([]);
  });
});

describe("readiness", () => {
  it("tells a study that has not started from one that has", () => {
    expect(readiness(base).label).toBe("Ready to run");
    expect(readiness({ ...base, sessions: 2 }).label).toBe("Running");
  });

  it("counts the problems and explains them in the tooltip", () => {
    const r = readiness({ ...base, tasks: 0, hasConsent: false });
    expect(r).toMatchObject({ label: "2 things to fix", tone: "warning" });
    expect(r.title).toContain("No tasks");
    expect(r.title).toContain("consent");
  });

  it("does not write 1 things", () => {
    expect(readiness({ ...base, hasConsent: false }).label).toBe("1 thing to fix");
  });
});
