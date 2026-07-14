// Standardized post-session questionnaires beyond SUS.
// Item definitions and scoring live here; answers are stored as
// (instrument, item_number, score) rows in instrument_answers.

export const INSTRUMENT_KEYS = ["nasa_tlx", "ueq_s"] as const;
export type InstrumentKey = (typeof INSTRUMENT_KEYS)[number];

export interface InstrumentItem {
  number: number;
  prompt: string;
  lowAnchor: string;
  highAnchor: string;
}

export interface InstrumentDef {
  key: InstrumentKey;
  name: string;
  description: string;
  min: number;
  max: number;
  step: number;
  items: InstrumentItem[];
}

// Raw TLX (RTLX): unweighted mean of the six subscales, the common
// modern administration (Hart, 2006). 21-point 0–100 scales in steps
// of 5. All scales read "higher = worse" — Performance is anchored
// Good→Poor per the original instrument.
export const NASA_TLX: InstrumentDef = {
  key: "nasa_tlx",
  name: "NASA-TLX (Raw)",
  description:
    "Rate the workload you experienced during the tasks on each dimension.",
  min: 0,
  max: 100,
  step: 5,
  items: [
    { number: 1, prompt: "Mental demand — How mentally demanding were the tasks?", lowAnchor: "Very low", highAnchor: "Very high" },
    { number: 2, prompt: "Physical demand — How physically demanding were the tasks?", lowAnchor: "Very low", highAnchor: "Very high" },
    { number: 3, prompt: "Temporal demand — How hurried or rushed was the pace?", lowAnchor: "Very low", highAnchor: "Very high" },
    { number: 4, prompt: "Performance — How successful were you in accomplishing what you were asked to do?", lowAnchor: "Perfect", highAnchor: "Failure" },
    { number: 5, prompt: "Effort — How hard did you have to work to accomplish your level of performance?", lowAnchor: "Very low", highAnchor: "Very high" },
    { number: 6, prompt: "Frustration — How insecure, discouraged, irritated, stressed or annoyed were you?", lowAnchor: "Very low", highAnchor: "Very high" },
  ],
};

// UEQ-S (Schrepp, Hinderks & Thomaschewski, 2017): 8 semantic
// differentials on a 7-point scale. Items 1–4 pragmatic quality,
// 5–8 hedonic quality. Stored 1..7, scored on -3..+3.
export const UEQ_S: InstrumentDef = {
  key: "ueq_s",
  name: "UEQ-S",
  description:
    "Rate your impression of the system between the two opposing terms.",
  min: 1,
  max: 7,
  step: 1,
  items: [
    { number: 1, prompt: "", lowAnchor: "obstructive", highAnchor: "supportive" },
    { number: 2, prompt: "", lowAnchor: "complicated", highAnchor: "easy" },
    { number: 3, prompt: "", lowAnchor: "inefficient", highAnchor: "efficient" },
    { number: 4, prompt: "", lowAnchor: "confusing", highAnchor: "clear" },
    { number: 5, prompt: "", lowAnchor: "boring", highAnchor: "exciting" },
    { number: 6, prompt: "", lowAnchor: "not interesting", highAnchor: "interesting" },
    { number: 7, prompt: "", lowAnchor: "conventional", highAnchor: "inventive" },
    { number: 8, prompt: "", lowAnchor: "usual", highAnchor: "leading edge" },
  ],
};

export const INSTRUMENTS: Record<InstrumentKey, InstrumentDef> = {
  nasa_tlx: NASA_TLX,
  ueq_s: UEQ_S,
};

export interface InstrumentAnswerRow {
  instrument: string;
  item_number: number;
  score: number;
}

export interface TlxScore {
  overall: number;
  subscales: { label: string; score: number }[];
}

// Raw TLX overall = mean of the six subscale ratings (0–100).
export function scoreTlx(rows: InstrumentAnswerRow[]): TlxScore | null {
  const own = rows.filter((r) => r.instrument === "nasa_tlx");
  if (own.length < NASA_TLX.items.length) return null;
  const byItem = new Map(own.map((r) => [r.item_number, r.score]));
  const subscales: { label: string; score: number }[] = [];
  let sum = 0;
  for (const item of NASA_TLX.items) {
    const v = byItem.get(item.number);
    if (v == null) return null;
    subscales.push({ label: item.prompt.split(" — ")[0], score: v });
    sum += v;
  }
  return { overall: sum / NASA_TLX.items.length, subscales };
}

export interface UeqScore {
  pragmatic: number;
  hedonic: number;
  overall: number;
}

// UEQ-S: transform 1..7 → -3..+3; pragmatic = mean(items 1–4),
// hedonic = mean(items 5–8), overall = mean of all eight.
export function scoreUeqS(rows: InstrumentAnswerRow[]): UeqScore | null {
  const own = rows.filter((r) => r.instrument === "ueq_s");
  if (own.length < UEQ_S.items.length) return null;
  const byItem = new Map(own.map((r) => [r.item_number, r.score]));
  const t: number[] = [];
  for (const item of UEQ_S.items) {
    const v = byItem.get(item.number);
    if (v == null) return null;
    t.push(v - 4);
  }
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    pragmatic: mean(t.slice(0, 4)),
    hedonic: mean(t.slice(4, 8)),
    overall: mean(t),
  };
}

// True when every selected instrument has all its items answered.
export function instrumentsComplete(
  selected: string[],
  rows: InstrumentAnswerRow[],
): boolean {
  return selected.every((key) => {
    const def = INSTRUMENTS[key as InstrumentKey];
    if (!def) return true; // unknown keys never block completion
    const answered = new Set(
      rows.filter((r) => r.instrument === key).map((r) => r.item_number),
    );
    return def.items.every((i) => answered.has(i.number));
  });
}
