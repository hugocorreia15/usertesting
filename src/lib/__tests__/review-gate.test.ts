import { describe, expect, it } from "vitest";
import {
  gateClosed,
  recruitingAllowed,
  reviewActions,
  sessionWouldBePilot,
  type ReviewableTemplate,
  type ReviewMode,
} from "../review-gate";

const t = (over: Partial<ReviewableTemplate> = {}): ReviewableTemplate => ({
  review_mode: "required",
  review_status: "draft",
  org_id: "org",
  ...over,
});

describe("gateClosed", () => {
  it("is closed only when review is required and not yet approved", () => {
    expect(gateClosed(t())).toBe(true);
    expect(gateClosed(t({ review_status: "submitted" }))).toBe(true);
    expect(gateClosed(t({ review_status: "changes_requested" }))).toBe(true);
    expect(gateClosed(t({ review_status: "approved" }))).toBe(false);
  });

  it("never closes in advisory or off mode", () => {
    expect(gateClosed(t({ review_mode: "advisory" }))).toBe(false);
    expect(gateClosed(t({ review_mode: "off" }))).toBe(false);
  });
});

describe("recruiting and pilots", () => {
  it("gates recruiting for students and members on a closed gate", () => {
    expect(recruitingAllowed(t(), "student")).toBe(false);
    expect(recruitingAllowed(t(), "member")).toBe(false);
    expect(recruitingAllowed(t(), "none")).toBe(false);
  });

  it("never gates the owner, who is the one approving", () => {
    expect(recruitingAllowed(t(), "owner")).toBe(true);
    expect(sessionWouldBePilot(t(), "owner")).toBe(false);
  });

  it("opens once approved", () => {
    expect(recruitingAllowed(t({ review_status: "approved" }), "student")).toBe(true);
    expect(sessionWouldBePilot(t({ review_status: "approved" }), "student")).toBe(false);
  });

  it("records a student's rehearsal on a closed gate as a pilot", () => {
    // Rehearsal is allowed; it just does not count toward the template's aggregates.
    expect(sessionWouldBePilot(t(), "student")).toBe(true);
  });
});

describe("reviewActions", () => {
  it("is inactive on a personal template even for its owner", () => {
    const a = reviewActions(t({ org_id: null }), "owner", true);
    expect(a.active).toBe(false);
    expect(a.canSetMode).toBe(false);
    expect(a.canRequest).toBe(false);
  });

  it("lets only the org owner choose the mode", () => {
    expect(reviewActions(t(), "owner", true).canSetMode).toBe(true);
    expect(reviewActions(t(), "member", true).canSetMode).toBe(false);
    expect(reviewActions(t(), "student", true).canSetMode).toBe(false);
  });

  it("lets an editor request review from draft and after changes were requested", () => {
    expect(reviewActions(t({ review_status: "draft" }), "student", true).canRequest).toBe(true);
    expect(reviewActions(t({ review_status: "changes_requested" }), "student", true).canRequest).toBe(true);
    expect(reviewActions(t({ review_status: "submitted" }), "student", true).canRequest).toBe(false);
    expect(reviewActions(t({ review_status: "approved" }), "student", true).canRequest).toBe(false);
  });

  it("requires edit access to request review", () => {
    expect(reviewActions(t(), "member", false).canRequest).toBe(false);
  });

  it("lets only the owner decide, and only on a submitted template", () => {
    expect(reviewActions(t({ review_status: "submitted" }), "owner", true).canDecide).toBe(true);
    expect(reviewActions(t({ review_status: "draft" }), "owner", true).canDecide).toBe(false);
    expect(reviewActions(t({ review_status: "submitted" }), "member", true).canDecide).toBe(false);
  });

  it("hides the workflow when the mode is off", () => {
    const a = reviewActions(t({ review_mode: "off", review_status: "submitted" }), "owner", true);
    expect(a.active).toBe(false);
    expect(a.canDecide).toBe(false);
    expect(a.canSetMode).toBe(true);
  });
});

describe("organization defaults", () => {
  // Mirrors set_template_org in migration 051: sharing takes the org's review
  // mode outright, but only fills consent and instruments when the template
  // has none, so a team's own choices survive being shared.
  const inherit = (
    tpl: { consent_text: string | null; instruments: string[] },
    org: {
      default_review_mode: ReviewMode;
      default_consent_text: string | null;
      default_instruments: string[];
    },
  ) => ({
    review_mode: org.default_review_mode,
    consent_text: tpl.consent_text?.trim()
      ? tpl.consent_text
      : org.default_consent_text,
    instruments: tpl.instruments.length ? tpl.instruments : org.default_instruments,
  });

  const org = {
    default_review_mode: "required" as ReviewMode,
    default_consent_text: "Class consent text",
    default_instruments: ["sus", "nasa_tlx"],
  };

  it("takes the organization's review mode outright", () => {
    expect(inherit({ consent_text: null, instruments: [] }, org).review_mode)
      .toBe("required");
  });

  it("fills consent and instruments only when the template has none", () => {
    const empty = inherit({ consent_text: null, instruments: [] }, org);
    expect(empty.consent_text).toBe("Class consent text");
    expect(empty.instruments).toEqual(["sus", "nasa_tlx"]);
  });

  it("does not clobber a team's own consent text or instruments", () => {
    const own = inherit(
      { consent_text: "Our own text", instruments: ["ueq_s"] },
      org,
    );
    expect(own.consent_text).toBe("Our own text");
    expect(own.instruments).toEqual(["ueq_s"]);
  });

  it("treats whitespace-only consent text as absent", () => {
    expect(inherit({ consent_text: "   ", instruments: [] }, org).consent_text)
      .toBe("Class consent text");
  });

  it("an org with defaults off leaves a shared template ungated", () => {
    const plain = inherit(
      { consent_text: null, instruments: [] },
      { default_review_mode: "off", default_consent_text: null, default_instruments: [] },
    );
    expect(gateClosed({ ...plain, review_status: "draft", org_id: "org" })).toBe(false);
  });
});
