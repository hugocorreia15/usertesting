// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  mergeParticipantSession,
  type ParticipantStaticData,
  type ParticipantLiveData,
} from "../participant-live";

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
