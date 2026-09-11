// @vitest-environment node
import { describe, it, expect } from "vitest";
import { mergeParticipantSession, type ParticipantStaticData, type ParticipantLiveData, participantStep } from "../participant-live";

const def = (id: string, name: string) => ({
  id: `task-${id}`,
  name,
  description: null,
  task_questions: [],
});

function staticData(): ParticipantStaticData {
  return {
    id: "s1",
    templates: {
      instruments: ["nasa_tlx"],
      template_questions: [
        { id: "q1", question_text: "Thoughts?", sort_order: 0 },
      ],
    },
    task_results: [
      { id: "tr1", template_tasks: def("1", "Find") },
      { id: "tr2", template_tasks: def("2", "Checkout") },
    ],
  };
}

function liveData(): ParticipantLiveData {
  return {
    id: "s1",
    status: "in_progress",
    user_id: "u1",
    join_code: "abc",
    template_id: "t1",
    current_task_index: 1,
    task_results: [
      {
        id: "tr2",
        sort_order: 1,
        seq_rating: null,
        completion_status: null,
        task_question_answers: [],
      },
      {
        id: "tr1",
        sort_order: 0,
        seq_rating: 6,
        completion_status: "success",
        task_question_answers: [],
      },
    ],
    sus_answers: [],
    interview_answers: [],
    instrument_answers: [],
  };
}

describe("mergeParticipantSession", () => {
  it("reattaches task definitions to live rows by task_result id", () => {
    const merged = mergeParticipantSession(staticData(), liveData())!;
    expect(merged.status).toBe("in_progress");
    expect(merged.templates.instruments).toEqual(["nasa_tlx"]);
    const tr1 = merged.task_results.find((t) => t.id === "tr1")!;
    expect(tr1.template_tasks.name).toBe("Find");
    expect(tr1.completion_status).toBe("success");
    const tr2 = merged.task_results.find((t) => t.id === "tr2")!;
    expect(tr2.template_tasks.name).toBe("Checkout");
  });

  it("preserves live ordering and fields untouched", () => {
    const merged = mergeParticipantSession(staticData(), liveData())!;
    expect(merged.task_results.map((t) => t.id)).toEqual(["tr2", "tr1"]);
    expect(merged.current_task_index).toBe(1);
  });

  it("returns null when a live row has no static definition", () => {
    const s = staticData();
    s.task_results = s.task_results.slice(0, 1); // drop tr2's definition
    expect(mergeParticipantSession(s, liveData())).toBeNull();
  });

  it("handles sessions with no task results", () => {
    const s = staticData();
    s.task_results = [];
    const l = liveData();
    l.task_results = [];
    const merged = mergeParticipantSession(s, l)!;
    expect(merged.task_results).toEqual([]);
  });
});

describe("participantStep", () => {
  const base = {
    hasPendingTask: false,
    sessionCompleted: false,
    hasInterviewQuestions: false,
    interviewAnswered: false,
    susEnabled: true,
    susAnswered: false,
    hasNextInstrument: false,
  };

  it("answers a pending task before anything else", () => {
    expect(participantStep({ ...base, hasPendingTask: true })).toBe("answer-task");
    expect(
      participantStep({ ...base, hasPendingTask: true, sessionCompleted: true }),
    ).toBe("answer-task");
  });

  it("stays in session between tasks when SUS is not administered", () => {
    // The reported bug: with SUS off, "satisfied" was true from the start, so
    // a participant waiting for the evaluator to open the next task was shown
    // the thank-you screen.
    expect(
      participantStep({ ...base, susEnabled: false, sessionCompleted: false }),
    ).toBe("in-session");
  });

  it("stays in session between tasks with no SUS and no instruments", () => {
    expect(
      participantStep({
        ...base,
        susEnabled: false,
        hasNextInstrument: false,
        sessionCompleted: false,
      }),
    ).toBe("in-session");
  });

  it("never ends the session before the evaluator does", () => {
    for (const susEnabled of [true, false]) {
      for (const hasNextInstrument of [true, false]) {
        for (const hasInterviewQuestions of [true, false]) {
          expect(
            participantStep({
              ...base,
              sessionCompleted: false,
              susEnabled,
              hasNextInstrument,
              hasInterviewQuestions,
            }),
          ).toBe("in-session");
        }
      }
    }
  });

  it("runs the closing steps in order: interview, SUS, instruments, thanks", () => {
    const done = { ...base, sessionCompleted: true };
    expect(
      participantStep({ ...done, hasInterviewQuestions: true, hasNextInstrument: true }),
    ).toBe("interview");
    expect(
      participantStep({
        ...done,
        hasInterviewQuestions: true,
        interviewAnswered: true,
        hasNextInstrument: true,
      }),
    ).toBe("sus");
    expect(
      participantStep({ ...done, susAnswered: true, hasNextInstrument: true }),
    ).toBe("instrument");
    expect(participantStep({ ...done, susAnswered: true })).toBe("thank-you");
  });

  it("does not skip the interview on a template without SUS", () => {
    // The same regression also let the thank-you screen pre-empt the
    // interview, because it was tested first.
    expect(
      participantStep({
        ...base,
        sessionCompleted: true,
        susEnabled: false,
        hasInterviewQuestions: true,
      }),
    ).toBe("interview");
  });

  it("skips SUS when the template does not administer it", () => {
    expect(
      participantStep({ ...base, sessionCompleted: true, susEnabled: false }),
    ).toBe("thank-you");
  });
});
