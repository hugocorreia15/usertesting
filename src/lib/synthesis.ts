/**
 * Synthesis after testing: the inspection's predictions set against what
 * participants actually ran into.
 *
 * Two ratios describe the comparison, and both leave untested problems out,
 * so a team that has not tested yet does not appear to have confirmed nothing:
 *
 *   predicted and confirmed
 *     Of the predicted problems that testing could speak to, the share
 *     participants actually hit.
 *
 *   confirmed and predicted
 *     Of the problems testing showed, predicted or not, the share the
 *     inspection had predicted.
 *
 * These are the validity and thoroughness of an evaluation method, as defined by
 * Sears (IJHCI 9(3), 1997) and systematized by Hartson, Andre and Williges
 * (IJHCI 13(4), 2001, republished 15(1), 2003), checked against the published
 * text: thoroughness = real problems found / real problems that exist (their
 * eq. 2), validity = real problems found / issues identified as problems
 * (eq. 10). "Real" is decided by an actual criterion, here the team's testing.
 *
 * One deliberate departure: their validity counts every reported problem in the
 * denominator. Untested predictions are left out here, because no task exposed
 * them to the criterion. And the reference set is what testing showed, never
 * the union of inspection and testing, which Hartson et al. show makes validity
 * equal to one by construction (eqs. 14 and 15).
 *
 * The interface never says "false alarm". A predicted problem nobody hit in a
 * handful of sessions may still be real. Hartson et al. call laboratory testing
 * the de facto standard but not an ultimate criterion: "the typical usability
 * laboratory test will miss some usability problems", and its tasks are chosen
 * by the people who designed it.
 */

export type TestOutcome = "untested" | "confirmed" | "not_observed";

export interface SynthesisSummary {
  predicted: number;
  confirmed: number;
  notObserved: number;
  untested: number;
  /** Problems only testing found. */
  testOnly: number;
  /** confirmed / (confirmed + notObserved); null until something is tested. */
  predictedAndConfirmed: number | null;
  /** confirmed / (confirmed + testOnly); null until testing shows anything. */
  confirmedAndPredicted: number | null;
}

export function summarizeSynthesis(input: {
  outcomes: readonly TestOutcome[];
  testOnlyCount: number;
}): SynthesisSummary {
  const count = (o: TestOutcome) => input.outcomes.filter((x) => x === o).length;
  const confirmed = count("confirmed");
  const notObserved = count("not_observed");
  const tested = confirmed + notObserved;
  const shown = confirmed + input.testOnlyCount;

  return {
    predicted: input.outcomes.length,
    confirmed,
    notObserved,
    untested: count("untested"),
    testOnly: input.testOnlyCount,
    predictedAndConfirmed: tested === 0 ? null : confirmed / tested,
    confirmedAndPredicted: shown === 0 ? null : confirmed / shown,
  };
}
