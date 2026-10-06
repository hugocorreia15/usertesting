import { describe, expect, it } from "vitest";
import { closingStepsComplete, participantStep } from "../participant-live";

/**
 * The evaluator stops waiting when closingStepsComplete says so, and the
 * participant is thanked when participantStep reaches "thank-you". These used
 * to be two separate rules, and on a template without SUS they disagreed: the
 * participant was thanked while the evaluator waited forever.
 */
const base = {
  instruments: [] as string[],
  interviewQuestions: [] as { id: string }[],
  interviewAnswers: [] as { question_id: string; answer_text: string | null }[],
  susAnswerCount: 0,
  instrumentAnswers: [] as { instrument: string; item_number: number; score: number }[],
};

describe("closingStepsComplete", () => {
  it("is done at once on a template with no closing steps at all", () => {
    // The reported case: no SUS, no interview, no instruments. The evaluator
    // used to wait here for ten SUS answers that could never arrive.
    expect(closingStepsComplete(base)).toBe(true);
  });

  it("does not wait for SUS when the template does not administer it", () => {
    expect(closingStepsComplete({ ...base, instruments: ["nasa_tlx"],
      instrumentAnswers: Array.from({ length: 6 }, (_, i) => ({ instrument: "nasa_tlx", item_number: i + 1, score: 50 })),
    })).toBe(true);
  });

  it("waits for SUS when the template does administer it", () => {
    expect(closingStepsComplete({ ...base, instruments: ["sus"] })).toBe(false);
    expect(closingStepsComplete({ ...base, instruments: ["sus"], susAnswerCount: 10 })).toBe(true);
  });

  it("waits for the interview, which the evaluator used to ignore", () => {
    const withInterview = {
      ...base,
      interviewQuestions: [{ id: "q1" }, { id: "q2" }],
    };
    expect(closingStepsComplete(withInterview)).toBe(false);

    expect(closingStepsComplete({
      ...withInterview,
      interviewAnswers: [{ question_id: "q1", answer_text: "yes" }],
    })).toBe(false);

    expect(closingStepsComplete({
      ...withInterview,
      interviewAnswers: [
        { question_id: "q1", answer_text: "yes" },
        { question_id: "q2", answer_text: "no" },
      ],
    })).toBe(true);
  });

  it("treats an empty interview answer as not yet given", () => {
    // Skeleton rows exist before the participant writes anything.
    expect(closingStepsComplete({
      ...base,
      interviewQuestions: [{ id: "q1" }],
      interviewAnswers: [{ question_id: "q1", answer_text: "" }],
    })).toBe(false);
  });

  it("waits for an instrument that is only partly answered", () => {
    expect(closingStepsComplete({
      ...base,
      instruments: ["ueq_s"],
      instrumentAnswers: [{ instrument: "ueq_s", item_number: 1, score: 3 }],
    })).toBe(false);
  });
});

describe("the evaluator and the participant agree", () => {
  // Every combination of the closing steps, judged both ways.
  const cases = [];
  for (const sus of [false, true])
    for (const susDone of [false, true])
      for (const interview of [false, true])
        for (const interviewDone of [false, true])
          cases.push({ sus, susDone, interview, interviewDone });

  it.each(cases)("%o", ({ sus, susDone, interview, interviewDone }) => {
    const evaluatorDone = closingStepsComplete({
      ...base,
      instruments: sus ? ["sus"] : [],
      susAnswerCount: susDone ? 10 : 0,
      interviewQuestions: interview ? [{ id: "q" }] : [],
      interviewAnswers: interview && interviewDone ? [{ question_id: "q", answer_text: "x" }] : [],
    });

    const participantThanked =
      participantStep({
        hasPendingTask: false,
        sessionCompleted: true,
        hasInterviewQuestions: interview,
        interviewAnswered: interview && interviewDone,
        susEnabled: sus,
        susAnswered: susDone,
        hasNextInstrument: false,
      }) === "thank-you";

    expect(evaluatorDone).toBe(participantThanked);
  });
});
