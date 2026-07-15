// @vitest-environment node
import { describe, it, expect } from "vitest";
import { DICTIONARIES, format, localizeInstrument } from "../i18n";
import { NASA_TLX, UEQ_S } from "../instruments";

function keyPaths(obj: unknown, prefix = ""): string[] {
  if (Array.isArray(obj)) return [`${prefix}[${obj.length}]`];
  if (obj !== null && typeof obj === "object") {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      keyPaths(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [prefix];
}

describe("i18n dictionaries", () => {
  it("en and pt have identical structure (incl. array lengths)", () => {
    expect(keyPaths(DICTIONARIES.pt).sort()).toEqual(
      keyPaths(DICTIONARIES.en).sort(),
    );
  });

  it("has exactly 10 SUS items in both languages", () => {
    expect(DICTIONARIES.en.sus.questions).toHaveLength(10);
    expect(DICTIONARIES.pt.sus.questions).toHaveLength(10);
  });

  it("no empty strings anywhere", () => {
    for (const dict of Object.values(DICTIONARIES)) {
      const walk = (v: unknown): void => {
        if (typeof v === "string") expect(v.trim()).not.toBe("");
        else if (Array.isArray(v)) v.forEach(walk);
        else if (v && typeof v === "object") Object.values(v).forEach(walk);
      };
      walk(dict);
    }
  });
});

describe("format", () => {
  it("substitutes params and resolves plural markers", () => {
    expect(format("{n} task(s) to complete:", { n: 3 })).toBe(
      "3 tasks to complete:",
    );
    expect(format("{n} task(s) to complete:", { n: 1 })).toBe(
      "1 task to complete:",
    );
    expect(format("{n} tarefa(s) agendada(s)", { n: 2 })).toBe(
      "2 tarefas agendadas",
    );
  });

  it("handles multiple params without touching unrelated parens", () => {
    expect(format("Rating {i} of {max}", { i: 2, max: 7 })).toBe(
      "Rating 2 of 7",
    );
    expect(format("{done}/{total} done", { done: 1, total: 5 })).toBe(
      "1/5 done",
    );
  });
});

describe("localizeInstrument", () => {
  const pt = DICTIONARIES.pt;

  it("translates TLX prompts and keeps the Performance anchors inverted", () => {
    const tlx = localizeInstrument(NASA_TLX, pt);
    expect(tlx.items).toHaveLength(6);
    expect(tlx.items[0].prompt).toMatch(/mental/i);
    expect(tlx.items[3].lowAnchor).toBe(pt.instruments.perfect);
    expect(tlx.items[3].highAnchor).toBe(pt.instruments.failure);
    expect(tlx.items[0].lowAnchor).toBe(pt.instruments.veryLow);
    // scoring fields untouched
    expect(tlx.min).toBe(NASA_TLX.min);
    expect(tlx.max).toBe(NASA_TLX.max);
    expect(tlx.items.map((i) => i.number)).toEqual(
      NASA_TLX.items.map((i) => i.number),
    );
  });

  it("translates all 8 UEQ-S anchor pairs", () => {
    const ueq = localizeInstrument(UEQ_S, pt);
    expect(ueq.items).toHaveLength(8);
    for (const [idx, item] of ueq.items.entries()) {
      expect(item.lowAnchor).toBe(pt.instruments.ueqPairs[idx][0]);
      expect(item.highAnchor).toBe(pt.instruments.ueqPairs[idx][1]);
    }
  });

  it("returns the original definition for english", () => {
    const tlx = localizeInstrument(NASA_TLX, DICTIONARIES.en);
    expect(tlx.items[0].prompt).toBe(NASA_TLX.items[0].prompt);
  });
});
