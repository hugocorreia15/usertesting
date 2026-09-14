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
 * The literature on comparing evaluation methods calls these validity and
 * thoroughness (Hartson, Andre and Williges, IJHCI). That attribution comes from
 * search summaries and must be checked against the paper before it is cited.
 *
 * The interface never says "false alarm". A predicted problem nobody hit in a
 * handful of sessions may still be real; user testing is not ground truth, a
 * point made directly in the critique of these measures, and a team that treats
 * it as such learns to distrust inspection for the wrong reason.
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
