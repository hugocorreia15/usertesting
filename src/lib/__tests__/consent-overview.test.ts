import { describe, it, expect } from "vitest";
import {
  classifySessionConsent,
  consentOverview,
  describeConsent,
} from "../consent-overview";

const FROM = "2026-09-15T12:00:00.000Z";
const s = (id: string, at: string | null, is_pilot = false) => ({
  id,
  consent_accepted_at: at,
  is_pilot,
});

describe("classifySessionConsent", () => {
  it("counts a session that consented after the clause", () => {
    expect(classifySessionConsent(s("a", "2026-09-15T13:00:00.000Z"), FROM)).toBe("eligible");
  });

  it("excludes one that consented before it", () => {
    expect(classifySessionConsent(s("a", "2026-09-01T00:00:00.000Z"), FROM)).toBe("before_clause");
  });

  it("treats the exact instant as eligible, as the database does", () => {
    expect(classifySessionConsent(s("a", FROM), FROM)).toBe("eligible");
  });

  it("excludes one that never consented", () => {
    expect(classifySessionConsent(s("a", null), FROM)).toBe("no_consent");
  });

  it("reports a pilot as a pilot, not as a consent problem", () => {
    expect(classifySessionConsent(s("a", "2026-09-15T13:00:00.000Z", true), FROM)).toBe("pilot");
    // A pilot with no consent is still reported as a pilot.
    expect(classifySessionConsent(s("b", null, true), FROM)).toBe("pilot");
  });

  it("excludes everything while the study has never turned it on", () => {
    expect(classifySessionConsent(s("a", "2026-09-15T13:00:00.000Z"), null)).toBe("before_clause");
  });
});

describe("consentOverview", () => {
  const sessions = [
    s("1", "2026-09-15T13:00:00.000Z"),
    s("2", "2026-09-15T14:00:00.000Z"),
    s("3", "2026-09-01T00:00:00.000Z"),
    s("4", null),
    s("5", "2026-09-15T13:00:00.000Z", true),
  ];

  it("counts each reason separately", () => {
    const o = consentOverview(sessions, FROM);
    expect(o).toMatchObject({
      total: 5,
      eligible: 2,
      beforeClause: 1,
      noConsent: 1,
      pilots: 1,
    });
  });

  it("warns when turning it on now would exclude every session already run", () => {
    const o = consentOverview(sessions, null);
    expect(o.everySessionWouldBeExcluded).toBe(true);
    expect(o.eligible).toBe(0);
  });

  it("does not warn once some session qualifies", () => {
    expect(consentOverview(sessions, FROM).everySessionWouldBeExcluded).toBe(false);
  });

  it("does not warn for a study with only pilots", () => {
    expect(consentOverview([s("p", null, true)], null).everySessionWouldBeExcluded).toBe(false);
  });

  it("says nothing confusing about an empty study", () => {
    expect(describeConsent(consentOverview([], null))).toBe("No sessions yet.");
  });

  it("reads as a sentence, counting pilots out of the denominator", () => {
    expect(describeConsent(consentOverview(sessions, FROM))).toBe(
      "2 of 4 sessions eligible, 1 consented before the clause, 1 never consented, 1 pilot excluded.",
    );
  });
});
