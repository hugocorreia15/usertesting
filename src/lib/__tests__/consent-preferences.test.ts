import { describe, it, expect } from "vitest";
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  acceptAll,
  allows,
  needsDecision,
  readConsent,
  rejectAll,
  writeConsent,
} from "../consent-preferences";

function memoryStore(initial?: string) {
  let value = initial;
  return {
    getItem: () => value ?? null,
    setItem: (_k: string, v: string) => {
      value = v;
    },
    get raw() {
      return value;
    },
  };
}

describe("reading consent", () => {
  it("treats no answer as no consent, not as silent agreement", () => {
    const store = memoryStore();
    expect(readConsent(store)).toBeNull();
    expect(allows(readConsent(store), "monitoring")).toBe(false);
    expect(allows(readConsent(store), "embeds")).toBe(false);
    expect(needsDecision(readConsent(store))).toBe(true);
  });

  it("ignores an answer given to an older version of the question", () => {
    const store = memoryStore(
      JSON.stringify({
        version: CONSENT_VERSION - 1,
        decidedAt: "2026-01-01T00:00:00.000Z",
        monitoring: true,
        embeds: true,
      }),
    );
    expect(readConsent(store)).toBeNull();
  });

  it("ignores malformed or partial records rather than guessing", () => {
    for (const raw of [
      "not json",
      "{}",
      '{"version":1}',
      '{"version":1,"decidedAt":"x","monitoring":"yes","embeds":true}',
      "null",
    ]) {
      expect(readConsent(memoryStore(raw))).toBeNull();
    }
  });

  it("survives a browser that refuses storage", () => {
    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readConsent(throwing)).toBeNull();
  });
});

describe("writing consent", () => {
  it("records what was chosen, when", () => {
    const store = memoryStore();
    const at = new Date("2026-09-22T10:00:00.000Z");
    const record = writeConsent({ monitoring: true, embeds: false }, store, () => at);

    expect(record).toEqual({
      version: CONSENT_VERSION,
      decidedAt: "2026-09-22T10:00:00.000Z",
      monitoring: true,
      embeds: false,
    });
    expect(JSON.parse(store.raw!)).toEqual(record);
  });

  it("round-trips through storage", () => {
    const store = memoryStore();
    writeConsent({ monitoring: false, embeds: true }, store);
    const back = readConsent(store);
    expect(allows(back, "embeds")).toBe(true);
    expect(allows(back, "monitoring")).toBe(false);
  });

  it("treats refusing everything as an answer, so the banner stops asking", () => {
    const store = memoryStore();
    writeConsent(rejectAll(), store);
    expect(needsDecision(readConsent(store))).toBe(false);
    expect(allows(readConsent(store), "monitoring")).toBe(false);
  });

  it("can be withdrawn as easily as it was given", () => {
    const store = memoryStore();
    writeConsent(acceptAll(), store);
    expect(allows(readConsent(store), "monitoring")).toBe(true);
    writeConsent(rejectAll(), store);
    expect(allows(readConsent(store), "monitoring")).toBe(false);
  });

  it("does not throw when storage refuses the write", () => {
    const blocked = {
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => writeConsent(acceptAll(), blocked)).not.toThrow();
  });
});

describe("the defaults themselves", () => {
  it("offers nothing pre-ticked", () => {
    expect(rejectAll()).toEqual({ monitoring: false, embeds: false });
  });

  it("uses the same key the cookie policy names", () => {
    expect(CONSENT_STORAGE_KEY).toBe("avalux-consent");
  });
});
