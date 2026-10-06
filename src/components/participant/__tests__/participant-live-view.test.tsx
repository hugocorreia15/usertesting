import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

/**
 * The participant's screen, driven by a session as the participant sees it.
 *
 * Written for a bug reported on the Calibration Room template: the participant
 * never got the last task's questions and went straight to "session complete".
 * The step ordering itself was right and tested; what broke it was an early
 * return in the component that ran before that ordering was consulted. A test
 * of the pure function could not see it, so this one renders the component.
 */

let session: unknown;

vi.mock("@/hooks/use-participant-sessions", () => ({
  useParticipantLiveSession: () => ({ data: session, isLoading: false }),
  useSubmitParticipantAnswers: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateParticipantSusAnswers: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubmitInstrumentAnswers: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateParticipantInterviewAnswer: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/monitoring", () => ({ setSessionContext: vi.fn() }));

import { ParticipantLiveView } from "../participant-live-view";

afterEach(cleanup);

const task = (over: Record<string, unknown>) => ({
  id: "tr",
  sort_order: 0,
  seq_rating: 6,
  completion_status: "success",
  task_question_answers: [],
  template_tasks: {
    id: "tt",
    name: "A task",
    description: null,
    task_questions: [],
  },
  ...over,
});

/** A template with no SUS, no interview and no instruments, like Calibration Room. */
const noClosingSteps = {
  id: "s",
  status: "completed",
  user_id: "u",
  join_code: "fd350c90",
  template_id: "t",
  current_task_index: 1,
  instrument_answers: [],
  interview_answers: [],
  sus_answers: [],
  templates: { instruments: [], template_questions: [] },
};

describe("the last task's questions on a template without SUS", () => {
  it("are shown, rather than the participant being sent away", () => {
    session = {
      ...noClosingSteps,
      task_results: [
        task({
          id: "tr1",
          sort_order: 0,
          task_question_answers: [{ id: "a1", question_id: "q1" }],
          template_tasks: {
            id: "t1", name: "First task", description: null,
            task_questions: [{ id: "q1", question_text: "How was it?", question_type: "open", sort_order: 0 }],
          },
        }),
        task({
          id: "tr2",
          sort_order: 1,
          task_question_answers: [],
          template_tasks: {
            id: "t2", name: "Calibrate the room", description: null,
            task_questions: [{ id: "q2", question_text: "Was the calibration clear?", question_type: "open", sort_order: 0 }],
          },
        }),
      ],
    };

    render(<ParticipantLiveView sessionId="s" />);

    // The evaluator marked the session completed straight after the last SEQ
    // rating, but this participant still owes that task's questions.
    expect(screen.getByText("Calibrate the room")).toBeTruthy();
    expect(screen.getByText("Was the calibration clear?")).toBeTruthy();
  });

  it("are not asked again once answered, and the participant is thanked", () => {
    session = {
      ...noClosingSteps,
      task_results: [
        task({
          id: "tr2",
          sort_order: 0,
          task_question_answers: [{ id: "a2", question_id: "q2" }],
          template_tasks: {
            id: "t2", name: "Calibrate the room", description: null,
            task_questions: [{ id: "q2", question_text: "Was the calibration clear?", question_type: "open", sort_order: 0 }],
          },
        }),
      ],
    };

    render(<ParticipantLiveView sessionId="s" />);
    expect(screen.queryByText("Was the calibration clear?")).toBeNull();
    // Whatever the thank-you wording is, the task form is gone.
    expect(screen.queryByText("Calibrate the room")).toBeNull();
  });
});
