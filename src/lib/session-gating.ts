// Two-way live-session gate, evaluator side: in join-code mode the
// participant answers each completed task's questions on their own
// device; the evaluator must not advance while answers are pending.
// Derived from persisted state so both clients can reload mid-session.

type MaybeArchived = { id?: string; archived_at?: string | null };
type AnswerRef = { question_id?: string };

/**
 * Whether a task's questions still have one without an answer.
 *
 * Shared by the evaluator's gate and the participant's own "do I have
 * something to answer" check, because the two used to count differently. The
 * participant is shown only the questions still in the protocol, while the
 * evaluator counted every question including archived ones (migration 063
 * keeps a reworded question's original as an archived row). A task with one
 * reworded question then had two questions to the evaluator and one to the
 * participant, and the evaluator waited forever for an answer to a question
 * nobody could be shown.
 *
 * Matching by question id rather than comparing counts also stops an answer
 * to an archived question being taken as an answer to the current one.
 */
export function hasUnansweredQuestions(
  questions: readonly unknown[] | null | undefined,
  answers: readonly unknown[] | null | undefined,
): boolean {
  const active = ((questions ?? []) as MaybeArchived[]).filter((q) => !q.archived_at);
  if (active.length === 0) return false;

  const answered = new Set(
    ((answers ?? []) as AnswerRef[]).map((a) => a.question_id).filter(Boolean),
  );
  // Rows without ids are counted rather than matched, so a caller that
  // selected no ids still gets the old count-based answer instead of a false
  // "everything is pending".
  if (active.some((q) => !q.id) || answered.size === 0) {
    return ((answers ?? []).length) < active.length;
  }
  return active.some((q) => !answered.has(q.id as string));
}

export interface GatingSession {
  join_code: string | null;
  task_results?:
    | {
        completion_status: string | null;
        template_tasks?: { task_questions?: unknown[] | null } | null;
        task_question_answers?: unknown[] | null;
      }[]
    | null;
}

export function participantStillAnswering(
  session: GatingSession | null | undefined,
): boolean {
  if (!session?.join_code) return false;
  return (session.task_results ?? []).some((tr) => {
    if (!tr.completion_status) return false;
    return hasUnansweredQuestions(
      tr.template_tasks?.task_questions,
      tr.task_question_answers,
    );
  });
}
