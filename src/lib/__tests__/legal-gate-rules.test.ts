import { describe, expect, it } from "vitest";
import {
  LEGAL_VERSION,
  REQUIRED_DOCUMENTS,
  shouldBlockUntilAccepted as shouldBlock,
} from "../legal";

/**
 * The gate decides, from five facts, whether the application may render.
 * "Nothing renders until accepted" is the whole point, and both a wrong-open
 * and a wrong-closed default are bugs, so the rule is tested rather than left
 * inline in the root layout.
 */

const base = {
  signedIn: true,
  onBarePage: false,
  onLegalPage: false,
  loading: false,
  accepted: false as boolean | undefined,
};

describe("the acceptance gate", () => {
  it("blocks a signed-in user who has not accepted", () => {
    expect(shouldBlock(base)).toBe(true);
  });

  it("lets a user through once they have accepted", () => {
    expect(shouldBlock({ ...base, accepted: true })).toBe(false);
  });

  it("does not block while the answer is still being fetched", () => {
    // Blocking on an unknown answer would show the gate to someone who has
    // already accepted, every time they load a page.
    expect(shouldBlock({ ...base, loading: true, accepted: undefined })).toBe(false);
  });

  it("does not block a visitor who is not signed in", () => {
    expect(shouldBlock({ ...base, signedIn: false })).toBe(false);
  });

  it("leaves the login, join and profile pages alone", () => {
    expect(shouldBlock({ ...base, onBarePage: true })).toBe(false);
  });

  it("leaves the legal pages reachable, so the documents can be read", () => {
    expect(shouldBlock({ ...base, onLegalPage: true })).toBe(false);
  });
});

describe("what acceptance covers", () => {
  it("requires the terms and the privacy notice", () => {
    expect([...REQUIRED_DOCUMENTS]).toEqual(["terms", "privacy"]);
  });

  it("does not require the optional cookie purposes", () => {
    // Consent to those has to be freely given, so it cannot be a condition of
    // access. If this ever fails, the cookie consent has become invalid.
    expect(REQUIRED_DOCUMENTS as readonly string[]).not.toContain("cookies");
    expect(REQUIRED_DOCUMENTS as readonly string[]).not.toContain("monitoring");
  });

  it("pins acceptance to a version, so changed terms ask again", () => {
    expect(LEGAL_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
