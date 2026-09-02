import { describe, it, expect } from "vitest";
import {
  INSTRUMENT_KEYS,
  NASA_TLX,
  SUS_KEY,
  UEQ_S,
  administersSus,
  instrumentsComplete,
  scoreTlx,
  scoreUeqS,
} from "../instruments";

function rows(instrument: string, scores: number[]) {
  return scores.map((score, i) => ({
    instrument,
    item_number: i + 1,
    score,
  }));
}

describe("scoreTlx", () => {
  it("averages the six subscales (Raw TLX)", () => {
    const r = scoreTlx(rows("nasa_tlx", [50, 20, 40, 30, 60, 10]));
    expect(r?.overall).toBeCloseTo(35);
    expect(r?.subscales).toHaveLength(6);
    expect(r?.subscales[0]).toEqual({ label: "Mental demand", score: 50 });
  });

  it("is null when incomplete", () => {
    expect(scoreTlx(rows("nasa_tlx", [50, 20, 40]))).toBeNull();
    expect(scoreTlx([])).toBeNull();
  });

  it("ignores rows from other instruments", () => {
    const mixed = [
      ...rows("ueq_s", [7, 7, 7, 7, 7, 7, 7, 7]),
      ...rows("nasa_tlx", [0, 0, 0, 0, 0, 0]),
    ];
    expect(scoreTlx(mixed)?.overall).toBe(0);
  });
});

describe("scoreUeqS", () => {
  it("transforms 1..7 to -3..+3 and splits pragmatic/hedonic", () => {
    // pragmatic items all 7 (+3), hedonic items all 1 (-3)
    const r = scoreUeqS(rows("ueq_s", [7, 7, 7, 7, 1, 1, 1, 1]));
    expect(r?.pragmatic).toBe(3);
    expect(r?.hedonic).toBe(-3);
    expect(r?.overall).toBe(0);
  });

  it("neutral responses score 0", () => {
    const r = scoreUeqS(rows("ueq_s", [4, 4, 4, 4, 4, 4, 4, 4]));
    expect(r).toEqual({ pragmatic: 0, hedonic: 0, overall: 0 });
  });

  it("is null when incomplete", () => {
    expect(scoreUeqS(rows("ueq_s", [4, 4, 4]))).toBeNull();
  });
});

describe("instrumentsComplete", () => {
  it("true when no instruments selected", () => {
    expect(instrumentsComplete([], [])).toBe(true);
  });

  it("requires every item of every selected instrument", () => {
    const tlxDone = rows("nasa_tlx", [10, 10, 10, 10, 10, 10]);
    expect(instrumentsComplete(["nasa_tlx"], tlxDone)).toBe(true);
    expect(instrumentsComplete(["nasa_tlx", "ueq_s"], tlxDone)).toBe(false);
    expect(
      instrumentsComplete(
        ["nasa_tlx", "ueq_s"],
        [...tlxDone, ...rows("ueq_s", [4, 4, 4, 4, 4, 4, 4, 4])],
      ),
    ).toBe(true);
  });

  it("partial answers do not count", () => {
    expect(
      instrumentsComplete(["ueq_s"], rows("ueq_s", [4, 4, 4, 4])),
    ).toBe(false);
  });

  it("unknown instrument keys never block", () => {
    expect(instrumentsComplete(["something_else"], [])).toBe(true);
  });

  it("item definitions are consistent", () => {
    expect(NASA_TLX.items).toHaveLength(6);
    expect(UEQ_S.items).toHaveLength(8);
  });
});

describe("administersSus", () => {
  it("is true only when the template opted in", () => {
    expect(administersSus(["sus"])).toBe(true);
    expect(administersSus(["sus", "nasa_tlx"])).toBe(true);
    expect(administersSus(["nasa_tlx"])).toBe(false);
  });

  it("treats an empty or missing selection as no SUS", () => {
    // Templates predating migration 049 were backfilled with 'sus', so an
    // empty array now means "opted out" rather than "not recorded".
    expect(administersSus([])).toBe(false);
    expect(administersSus(null)).toBe(false);
    expect(administersSus(undefined)).toBe(false);
  });

  it("does not leak SUS into the generic instrument list", () => {
    // SUS keeps its own table and form; the instrument loop must skip it.
    expect(INSTRUMENT_KEYS).not.toContain(SUS_KEY);
  });
});
