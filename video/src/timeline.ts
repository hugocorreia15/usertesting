/**
 * Every scene duration in one place, in frames at 30 fps.
 * Retune pacing here without opening a scene file.
 */
export const FPS = 30;

/** Crossfade length between scenes. Overlapping shortens the finished timeline. */
export const TRANSITION = 15;

export const MARKETING = {
  coldOpen: 300,
  logoReveal: 180,
  protocols: 360,
  cockpit: 480,
  participant: 300,
  instruments: 360,
  analysis: 180,
  classrooms: 240,
  close: 180,
} as const;

export const TUTORIAL = {
  intro: 450,
  templates: 1500,
  sessions: 1200,
  live: 1500,
  participant: 1050,
  results: 1350,
  exports: 750,
  coding: 750,
  orgs: 600,
  inspection: 1350,
  review: 1200,
  observing: 1200,
  classAndModel: 1200,
  outro: 300,
} as const;

/** Total frames once the crossfade overlaps are subtracted. */
const totalOf = (scenes: Record<string, number>) => {
  const values = Object.values(scenes);
  const sum = values.reduce((a, b) => a + b, 0);
  return sum - (values.length - 1) * TRANSITION;
};

export const MARKETING_DURATION = totalOf(MARKETING);
export const TUTORIAL_DURATION = totalOf(TUTORIAL);

/** Chapter labels for the tutorial rail, in play order. */
export const TUTORIAL_CHAPTERS = [
  { key: "templates", label: "Templates" },
  { key: "sessions", label: "Sessions" },
  { key: "live", label: "Live" },
  { key: "participant", label: "Participant" },
  { key: "results", label: "Results" },
  { key: "exports", label: "Exports" },
  { key: "coding", label: "Coding" },
  { key: "orgs", label: "Orgs" },
  { key: "inspection", label: "Inspection" },
  { key: "review", label: "Review" },
  { key: "observing", label: "Observing" },
  { key: "classAndModel", label: "Class" },
] as const;

/**
 * Absolute start frame of each tutorial section on the finished timeline.
 * A crossfade overlaps two sequences, so each one starts `TRANSITION` frames
 * earlier than a naive running total would suggest.
 */
export const tutorialStarts = (): Record<string, number> => {
  const out: Record<string, number> = {};
  let acc = 0;
  Object.entries(TUTORIAL).forEach(([key, duration], i) => {
    out[key] = acc - i * TRANSITION;
    acc += duration;
  });
  return out;
};
