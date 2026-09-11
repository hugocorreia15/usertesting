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

/**
 * Which screen the participant should be on.
 *
 * Extracted from the live view because the ordering here is subtle and got it
 * wrong once: when SUS became opt-in (migration 049) the "SUS is satisfied"
 * flag started out true on a template that does not administer it, and the
 * thank-you screen was tested before the in-progress screen. A participant
 * waiting between tasks was told the session was complete, and on a template
 * with no SUS and no instruments the interview was skipped outright.
 *
 * The rule the ordering encodes: nothing that ends a session may be shown
 * while the session is still running, and the closing steps run interview,
 * then SUS, then the remaining instruments, then thanks.
 */
export type ParticipantStep =
  | "answer-task"
  | "interview"
  | "sus"
  | "instrument"
  | "thank-you"
  | "in-session";

export function participantStep(s: {
  /** A task the evaluator has closed whose questions are unanswered. */
  hasPendingTask: boolean;
  /** The evaluator marked the whole session complete. */
  sessionCompleted: boolean;
  hasInterviewQuestions: boolean;
  interviewAnswered: boolean;
  /** The template administers SUS at all. */
  susEnabled: boolean;
  susAnswered: boolean;
  /** A selected instrument (TLX, UEQ-S) still to administer. */
  hasNextInstrument: boolean;
}): ParticipantStep {
  if (s.hasPendingTask) return "answer-task";

  // Everything below closes the session, so none of it may appear before the
  // evaluator has actually ended it.
  if (!s.sessionCompleted) return "in-session";

  if (s.hasInterviewQuestions && !s.interviewAnswered) return "interview";
  if (s.susEnabled && !s.susAnswered) return "sus";
  if (s.hasNextInstrument) return "instrument";
  return "thank-you";
}
