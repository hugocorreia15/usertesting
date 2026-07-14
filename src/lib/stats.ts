// Small-sample statistics for questionnaire scores, following the
// t-interval recommendation for rating-scale means in Sauro & Lewis,
// "Quantifying the User Experience".

export function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Sample standard deviation (n − 1 denominator).
export function sampleSd(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(
    values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1),
  );
}

// Two-sided 95% critical values of Student's t by degrees of freedom.
const T_95: number[] = [
  12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228,
  2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086,
  2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042,
];

export function tCritical95(df: number): number {
  if (df < 1) return NaN;
  if (df <= T_95.length) return T_95[df - 1];
  return 1.96;
}

export interface ConfidenceInterval {
  n: number;
  mean: number;
  sd: number;
  margin: number;
  low: number;
  high: number;
}

/**
 * Two-sided 95% confidence interval for the mean using the
 * t-distribution: mean ± t(0.975, n−1) · sd/√n.
 * Returns null for fewer than two observations (no interval exists).
 */
export function confidenceInterval95(
  values: number[],
): ConfidenceInterval | null {
  const n = values.length;
  if (n < 2) return null;
  const m = mean(values);
  const sd = sampleSd(values);
  const margin = tCritical95(n - 1) * (sd / Math.sqrt(n));
  return { n, mean: m, sd, margin, low: m - margin, high: m + margin };
}

// SUS-specific: interval clamped to the instrument's 0–100 bounds.
export function susConfidenceInterval95(
  scores: number[],
): ConfidenceInterval | null {
  const ci = confidenceInterval95(scores);
  if (!ci) return null;
  return {
    ...ci,
    low: Math.max(0, ci.low),
    high: Math.min(100, ci.high),
  };
}
