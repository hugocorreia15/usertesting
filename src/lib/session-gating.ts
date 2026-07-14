// Two-way live-session gate, evaluator side: in join-code mode the
// participant answers each completed task's questions on their own
// device; the evaluator must not advance while answers are pending.
// Derived from persisted state so both clients can reload mid-session.

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
    const qs = tr.template_tasks?.task_questions ?? [];
    if (qs.length === 0) return false;
    return (tr.task_question_answers?.length ?? 0) < qs.length;
  });
}
