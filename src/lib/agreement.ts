// Inter-rater agreement statistics (backlog #1). Compares two raters'
// judgments of the same items: Cohen's kappa for the categorical
// completion status, and simple agreement measures for the numeric
// counts. Pure functions; no data access. References: Cohen (1960);
// Landis & Koch (1977) for the strength-of-agreement bands.

export interface CategoricalAgreement {
  n: number; // items both raters scored
  observed: number; // proportion of exact agreement, 0..1
  kappa: number | null; // null when undefined (see below)
  label: string; // Landis & Koch band, or a fallback note
}

export interface NumericAgreement {
  n: number;
  exact: number; // proportion of items with identical values
  meanAbsDiff: number; // mean |a - b|
  pearson: number | null; // consistency; null when a series is constant
}

/**
 * Cohen's kappa for two raters over paired categorical labels.
 * Pairs with a null/undefined on either side are dropped. Kappa is
 * undefined when expected agreement is 1 (both raters used a single,
 * identical category): we report observed agreement and a note instead
 * of a misleading kappa, following common practice.
 */
export function cohensKappa(
  pairs: readonly (readonly [string | null, string | null])[],
): CategoricalAgreement {
  const clean = pairs.filter(
    (p): p is [string, string] => p[0] != null && p[1] != null,
  );
  const n = clean.length;
  if (n === 0) {
    return { n: 0, observed: 0, kappa: null, label: "no shared items" };
  }

  const categories = new Set<string>();
  for (const [a, b] of clean) {
    categories.add(a);
    categories.add(b);
  }

  let agree = 0;
  const rowMarg = new Map<string, number>();
  const colMarg = new Map<string, number>();
  for (const [a, b] of clean) {
    if (a === b) agree++;
    rowMarg.set(a, (rowMarg.get(a) ?? 0) + 1);
    colMarg.set(b, (colMarg.get(b) ?? 0) + 1);
  }

  const po = agree / n;
  let pe = 0;
  for (const c of categories) {
    pe += ((rowMarg.get(c) ?? 0) / n) * ((colMarg.get(c) ?? 0) / n);
  }

  if (pe >= 1) {
    // Both raters used one identical category throughout: agreement is
    // trivially perfect but kappa is undefined (0/0).
    return {
      n,
      observed: po,
      kappa: null,
      label: "kappa undefined (single category)",
    };
  }

  const kappa = (po - pe) / (1 - pe);
  return { n, observed: po, kappa, label: kappaLabel(kappa) };
}

// Minimal per-task shapes the session builder needs.
interface TaskScore {
  task_id: string;
  completion_status: string | null;
  action_count: number | null;
  error_count: number | null;
  hesitation_count: number | null;
  seq_rating: number | null;
}
interface CoRaterScore extends TaskScore {
  rater_id: string;
  rater_email: string | null;
}

export interface RaterAgreement {
  raterId: string;
  raterEmail: string | null;
  completion: CategoricalAgreement;
  actions: NumericAgreement;
  errors: NumericAgreement;
  hesitations: NumericAgreement;
  seq: NumericAgreement;
}

/**
 * Agreement of each co-rater against the primary evaluator, joined by
 * task. Only tasks a co-rater actually scored enter their comparison.
 * `primary` is the session's task_results; `coRaters` the rater_scores.
 */
export function sessionAgreement(
  primary: readonly TaskScore[],
  coRaters: readonly CoRaterScore[],
): RaterAgreement[] {
  const primaryByTask = new Map(primary.map((t) => [t.task_id, t]));
  const byRater = new Map<string, CoRaterScore[]>();
  for (const s of coRaters) {
    const list = byRater.get(s.rater_id) ?? [];
    list.push(s);
    byRater.set(s.rater_id, list);
  }

  const out: RaterAgreement[] = [];
  for (const [raterId, scores] of byRater) {
    const joined = scores
      .map((s) => ({ p: primaryByTask.get(s.task_id), c: s }))
      .filter((j): j is { p: TaskScore; c: CoRaterScore } => j.p != null);

    out.push({
      raterId,
      raterEmail: scores[0]?.rater_email ?? null,
      completion: cohensKappa(
        joined.map((j) => [j.p.completion_status, j.c.completion_status]),
      ),
      actions: numericAgreement(
        joined.map((j) => [j.p.action_count, j.c.action_count]),
      ),
      errors: numericAgreement(
        joined.map((j) => [j.p.error_count, j.c.error_count]),
      ),
      hesitations: numericAgreement(
        joined.map((j) => [j.p.hesitation_count, j.c.hesitation_count]),
      ),
      seq: numericAgreement(joined.map((j) => [j.p.seq_rating, j.c.seq_rating])),
    });
  }
  return out;
}

// Landis & Koch (1977) strength-of-agreement bands.
function kappaLabel(k: number): string {
  if (k < 0) return "poor";
  if (k <= 0.2) return "slight";
  if (k <= 0.4) return "fair";
  if (k <= 0.6) return "moderate";
  if (k <= 0.8) return "substantial";
  return "almost perfect";
}

/**
 * Agreement between two numeric series (paired). Pairs with null on
 * either side are dropped. Pearson is null when either series has zero
 * variance over the shared items (correlation undefined).
 */
export function numericAgreement(
  pairs: readonly (readonly [number | null, number | null])[],
): NumericAgreement {
  const clean = pairs.filter(
    (p): p is [number, number] => p[0] != null && p[1] != null,
  );
  const n = clean.length;
  if (n === 0) return { n: 0, exact: 0, meanAbsDiff: 0, pearson: null };

  let exact = 0;
  let absSum = 0;
  let sa = 0;
  let sb = 0;
  for (const [a, b] of clean) {
    if (a === b) exact++;
    absSum += Math.abs(a - b);
    sa += a;
    sb += b;
  }
  const ma = sa / n;
  const mb = sb / n;

  let cov = 0;
  let va = 0;
  let vb = 0;
  for (const [a, b] of clean) {
    cov += (a - ma) * (b - mb);
    va += (a - ma) ** 2;
    vb += (b - mb) ** 2;
  }
  const pearson = va === 0 || vb === 0 ? null : cov / Math.sqrt(va * vb);

  return {
    n,
    exact: exact / n,
    meanAbsDiff: absSum / n,
    pearson,
  };
}
