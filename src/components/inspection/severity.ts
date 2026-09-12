/**
 * Nielsen's severity scale, as published. The wording matters: students who
 * pick from a numbered list without the anchors rate inconsistently, which is
 * one of the "vague problem criteria" Hertzum and Jacobsen name as a cause of
 * the evaluator effect.
 */
export const SEVERITY = [
  { value: 0, label: "Not a usability problem", short: "None" },
  { value: 1, label: "Cosmetic: fix only if time is left over", short: "Cosmetic" },
  { value: 2, label: "Minor: low priority to fix", short: "Minor" },
  { value: 3, label: "Major: important to fix, high priority", short: "Major" },
  { value: 4, label: "Catastrophe: must be fixed before release", short: "Catastrophe" },
] as const;

export function severityShort(v: number | null): string {
  if (v === null) return "Unrated";
  return SEVERITY.find((s) => s.value === v)?.short ?? String(v);
}

/** 3 and 4 are the act-on-it half of the scale. */
export function isSevere(v: number | null): boolean {
  return v !== null && v >= 3;
}
