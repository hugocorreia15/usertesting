/**
 * Metrics for independent heuristic inspection.
 *
 * Several evaluators inspect one interface alone, each producing a set of
 * problems. Those sets are then merged, and these functions describe what the
 * merge reveals: how much any two evaluators overlapped, how many problems
 * only one person saw, and how the total found grows with the number of
 * evaluators.
 *
 * The point is pedagogical. Hertzum and Jacobsen (IJHCI 15(1), 2003) reviewed
 * eleven studies of cognitive walkthrough, heuristic evaluation and
 * thinking-aloud and found average agreement between any two evaluators
 * ranging from 5% to 65%, for experienced and novice evaluators alike. A
 * student who computes that number on their own data learns why one evaluator
 * is not an authoritative statement about an interface, which is not
 * something a lecture slide can do.
 *
 * Two definitions are taken directly from the literature rather than chosen:
 *
 *   Any-two agreement (Hertzum & Jacobsen, eq. 2)
 *     |Pi n Pj| / |Pi u Pj|, averaged over all n(n-1)/2 pairs.
 *
 *   Problems found by k evaluators (Nielsen & Landauer, 1993)
 *     N(1 - (1 - lambda)^k), with lambda the mean single-evaluator
 *     detection rate.
 *
 * Every function here is pure and takes already-merged problem identity as
 * given: deciding that two descriptions are the same problem is the
 * consolidation step's job, not a statistic's.
 */

/** One evaluator's independent pass, after consolidation has merged duplicates. */
export interface InspectionPass {
  evaluatorId: string;
  /** Merged problem ids this evaluator reported. Duplicates are ignored. */
  problemIds: readonly string[];
  /** Severity this evaluator gave each problem, on Nielsen's 0..4 scale. */
  severity?: Readonly<Record<string, number>>;
}

export interface PairAgreement {
  a: string;
  b: string;
  /** |Pi n Pj| / |Pi u Pj|, or null when both evaluators found nothing. */
  jaccard: number | null;
  shared: number;
  collective: number;
}

export interface AnyTwoAgreement {
  /** Mean over pairs, 0..1. Null when fewer than two evaluators have findings. */
  value: number | null;
  pairs: PairAgreement[];
  /** Where the value sits against the published 5% to 65% range. */
  label: string;
}

export interface ProblemCoverage {
  problemId: string;
  /** How many evaluators independently reported it. */
  foundBy: number;
}

export interface CurvePoint {
  /** Number of evaluators, 1..n. */
  evaluators: number;
  /** Expected distinct problems found, averaged over every subset of this size. */
  expected: number;
  /** Share of all known problems, 0..1. */
  share: number;
  /** The Nielsen and Landauer prediction for this k, for comparison. */
  modelled: number;
}

export interface SeverityAgreement {
  /** Problems at least two evaluators rated. */
  n: number;
  /** Proportion of those rated identically by every evaluator who rated them. */
  exact: number;
  /** Mean spread (max minus min) of the ratings given to one problem. */
  meanRange: number;
  /** Problems where evaluators disagreed about whether it is severe (>= 3). */
  severityDisputes: number;
}

export interface InspectionSummary {
  evaluators: number;
  /** Distinct problems across all passes. */
  totalProblems: number;
  /** Problems exactly one evaluator found. */
  uniqueProblems: number;
  /** uniqueProblems / totalProblems, 0..1. */
  uniqueShare: number;
  /** Mean share of all known problems a single evaluator found: Nielsen's lambda. */
  detectionRate: number;
  anyTwo: AnyTwoAgreement;
  coverage: ProblemCoverage[];
  curve: CurvePoint[];
  severity: SeverityAgreement;
  /** Evaluators needed to reach 75% and 90% of known problems, under the model. */
  evaluatorsFor75: number | null;
  evaluatorsFor90: number | null;
}

/** Distinct problem ids in a pass. */
function setOf(pass: InspectionPass): Set<string> {
  return new Set(pass.problemIds);
}

/**
 * Any-two agreement: the Hertzum and Jacobsen measure. A pair where both
 * evaluators found nothing is undefined rather than perfect, and is dropped.
 */
export function anyTwoAgreement(
  passes: readonly InspectionPass[],
): AnyTwoAgreement {
  const sets = passes.map((p) => ({ id: p.evaluatorId, set: setOf(p) }));
  const pairs: PairAgreement[] = [];

  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const a = sets[i];
      const b = sets[j];
      let shared = 0;
      for (const id of a.set) if (b.set.has(id)) shared++;
      const collective = a.set.size + b.set.size - shared;
      pairs.push({
        a: a.id,
        b: b.id,
        jaccard: collective === 0 ? null : shared / collective,
        shared,
        collective,
      });
    }
  }

  const defined = pairs.filter((p): p is PairAgreement & { jaccard: number } => p.jaccard !== null);
  if (defined.length === 0) {
    return { value: null, pairs, label: "not enough independent passes yet" };
  }
  const value = defined.reduce((s, p) => s + p.jaccard, 0) / defined.length;
  return { value, pairs, label: agreementLabel(value) };
}

/**
 * Where a value sits against the published range. The point is not to grade
 * the students but to show them that low overlap is the norm, not a mistake.
 */
function agreementLabel(value: number): string {
  const pct = value * 100;
  if (pct < 5) return "below the published range";
  if (pct <= 65) return "within the published range";
  return "above the published range";
}

/** How many evaluators found each problem, most-agreed first. */
export function problemCoverage(
  passes: readonly InspectionPass[],
): ProblemCoverage[] {
  const counts = new Map<string, number>();
  for (const pass of passes) {
    for (const id of setOf(pass)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([problemId, foundBy]) => ({ problemId, foundBy }))
    .sort((x, y) => y.foundBy - x.foundBy || x.problemId.localeCompare(y.problemId));
}

/**
 * Expected distinct problems found by k evaluators, for every k.
 *
 * This is exact, not sampled. A problem found by c of n evaluators is missed
 * by a subset of size k with probability C(n-c, k) / C(n, k), so the expected
 * number found is the sum over problems of one minus that. Averaging over all
 * subsets this way avoids any dependence on the order the passes happen to be
 * stored in.
 */
export function aggregationCurve(
  passes: readonly InspectionPass[],
): CurvePoint[] {
  const n = passes.length;
  const coverage = problemCoverage(passes);
  const total = coverage.length;
  if (n === 0 || total === 0) return [];

  const lambda = detectionRate(passes);
  const points: CurvePoint[] = [];

  for (let k = 1; k <= n; k++) {
    let expected = 0;
    for (const { foundBy } of coverage) {
      // Probability a size-k subset contains none of the foundBy evaluators.
      const missed = choose(n - foundBy, k) / choose(n, k);
      expected += 1 - missed;
    }
    points.push({
      evaluators: k,
      expected,
      share: expected / total,
      modelled: total * (1 - Math.pow(1 - lambda, k)),
    });
  }
  return points;
}

/**
 * Nielsen's lambda: the mean proportion of all known problems that a single
 * evaluator found. "Known" means known to this group, which is why the curve
 * flattens toward the group's own total and not toward the truth.
 */
export function detectionRate(passes: readonly InspectionPass[]): number {
  const total = problemCoverage(passes).length;
  if (total === 0 || passes.length === 0) return 0;
  const sum = passes.reduce((s, p) => s + setOf(p).size / total, 0);
  return sum / passes.length;
}

/**
 * Smallest k for which the model predicts reaching `target` of known
 * problems. Null when lambda is zero, or when the target is unreachable.
 */
export function evaluatorsNeeded(
  lambda: number,
  target: number,
  cap = 50,
): number | null {
  if (lambda <= 0 || lambda >= 1) return lambda >= 1 ? 1 : null;
  for (let k = 1; k <= cap; k++) {
    if (1 - Math.pow(1 - lambda, k) >= target) return k;
  }
  return null;
}

/**
 * Agreement on severity, over problems that at least two evaluators rated.
 *
 * Hertzum and Jacobsen report that the evaluator effect holds for severity as
 * well as for detection, and Nielsen advises against acting on any single
 * evaluator's severity rating. A dispute here is the more useful teaching
 * moment: a problem one student called cosmetic and another called severe.
 */
export function severityAgreement(
  passes: readonly InspectionPass[],
): SeverityAgreement {
  const ratings = new Map<string, number[]>();
  for (const pass of passes) {
    if (!pass.severity) continue;
    for (const id of setOf(pass)) {
      const v = pass.severity[id];
      if (typeof v !== "number" || Number.isNaN(v)) continue;
      const list = ratings.get(id) ?? [];
      list.push(v);
      ratings.set(id, list);
    }
  }

  const rated = [...ratings.values()].filter((v) => v.length >= 2);
  if (rated.length === 0) {
    return { n: 0, exact: 0, meanRange: 0, severityDisputes: 0 };
  }

  let exact = 0;
  let rangeSum = 0;
  let disputes = 0;
  for (const values of rated) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) exact++;
    rangeSum += max - min;
    // Nielsen's scale calls 3 and 4 major and catastrophic. Disagreeing
    // across that line is a disagreement about whether to act at all.
    if (min < 3 && max >= 3) disputes++;
  }

  return {
    n: rated.length,
    exact: exact / rated.length,
    meanRange: rangeSum / rated.length,
    severityDisputes: disputes,
  };
}

/** Everything above, computed once. */
export function summarizeInspection(
  passes: readonly InspectionPass[],
): InspectionSummary {
  const coverage = problemCoverage(passes);
  const total = coverage.length;
  const unique = coverage.filter((c) => c.foundBy === 1).length;
  const lambda = detectionRate(passes);

  return {
    evaluators: passes.length,
    totalProblems: total,
    uniqueProblems: unique,
    uniqueShare: total === 0 ? 0 : unique / total,
    detectionRate: lambda,
    anyTwo: anyTwoAgreement(passes),
    coverage,
    curve: aggregationCurve(passes),
    severity: severityAgreement(passes),
    evaluatorsFor75: evaluatorsNeeded(lambda, 0.75),
    evaluatorsFor90: evaluatorsNeeded(lambda, 0.9),
  };
}

/** Binomial coefficient. Zero when k exceeds n, which is the case we rely on. */
function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  const j = Math.min(k, n - k);
  let acc = 1;
  for (let i = 0; i < j; i++) acc = (acc * (n - i)) / (i + 1);
  return acc;
}
