// Participant live-session data shapes and the static/live merge
// (P3.5). The load tests showed the old single nested select (session +
// task definitions + questions + answers, 4 levels deep) hitting the
// 8 s statement timeout near 15 concurrent participants because it was
// re-fetched on every realtime tick. The client now fetches the STATIC
// half (template instruments/questions, task definitions) once per
// session and re-fetches only the LIGHT half (status, task progress,
// answers) on ticks; this module merges the two back into the shape
// the participant view has always consumed.

import type { TaskQuestion } from "@/types";

export interface ParticipantLiveTaskResult {
  id: string;
  sort_order: number;
  seq_rating: number | null;
  completion_status: string | null;
  template_tasks: {
    id: string;
    name: string;
    description: string | null;
    task_questions: TaskQuestion[];
  };
  task_question_answers: import("@/types").TaskQuestionAnswer[];
}

export interface ParticipantLiveSession {
  id: string;
  status: string;
  user_id: string;
  join_code: string | null;
  template_id: string;
  current_task_index: number;
  task_results: ParticipantLiveTaskResult[];
  sus_answers: { id: string; question_number: number; score: number }[];
  interview_answers: {
    id: string;
    question_id: string;
    answer_text: string | null;
  }[];
  instrument_answers: {
    id: string;
    instrument: string;
    item_number: number;
    score: number;
  }[];
  templates: {
    instruments: string[] | null;
    template_questions: {
      id: string;
      question_text: string;
      sort_order: number;
    }[];
  };
}

/** Fetched once per session: everything that cannot change mid-run. */
export interface ParticipantStaticData {
  id: string;
  templates: ParticipantLiveSession["templates"];
  task_results: {
    id: string;
    template_tasks: ParticipantLiveTaskResult["template_tasks"];
  }[];
}

/** Re-fetched on every realtime tick: state and answers only. */
export interface ParticipantLiveData {
  id: string;
  status: string;
  user_id: string;
  join_code: string | null;
  template_id: string;
  current_task_index: number;
  task_results: Omit<ParticipantLiveTaskResult, "template_tasks">[];
  sus_answers: ParticipantLiveSession["sus_answers"];
  interview_answers: ParticipantLiveSession["interview_answers"];
  instrument_answers: ParticipantLiveSession["instrument_answers"];
}

/**
 * Recombine into the historical shape. Returns null when a task result
 * has no matching static definition (a session rebuilt under our feet)
 * so the caller can refetch the static half instead of rendering holes.
 */
export function mergeParticipantSession(
  staticData: ParticipantStaticData,
  liveData: ParticipantLiveData,
): ParticipantLiveSession | null {
  const defs = new Map(
    staticData.task_results.map((tr) => [tr.id, tr.template_tasks]),
  );
  const task_results: ParticipantLiveTaskResult[] = [];
  for (const tr of liveData.task_results) {
    const template_tasks = defs.get(tr.id);
    if (!template_tasks) return null;
    task_results.push({ ...tr, template_tasks });
  }
  return {
    ...liveData,
    task_results,
    templates: staticData.templates,
  };
}
