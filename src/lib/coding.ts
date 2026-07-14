// Qualitative coding: aggregate answer-level code tags into a
// code-by-session matrix shared by dashboards and tests.

import type {
  TemplateCodeWithAnswers,
  TestSessionWithRelations,
} from "@/types";

export interface CodeMatrixRow {
  codeId: string;
  code: string;
  color: string;
  description: string | null;
  countsBySession: Record<string, number>; // sessionId -> tag count
  total: number;
}

// Each answer_code references either a task question answer or an
// interview answer (XOR). Attribution walks the loaded sessions once
// to map answer ids -> session id; tags whose answer isn't among the
// loaded sessions are ignored (sessions may be filtered).
export function buildCodeMatrix(
  codes: TemplateCodeWithAnswers[],
  sessions: TestSessionWithRelations[],
): CodeMatrixRow[] {
  const taskAnswerSession = new Map<string, string>();
  const interviewAnswerSession = new Map<string, string>();
  for (const s of sessions) {
    for (const tr of s.task_results ?? []) {
      for (const a of tr.task_question_answers ?? []) {
        taskAnswerSession.set(a.id, s.id);
      }
    }
    for (const ia of s.interview_answers ?? []) {
      interviewAnswerSession.set(ia.id, s.id);
    }
  }

  return [...codes]
    .sort((a, b) => a.sort_order - b.sort_order || a.code.localeCompare(b.code))
    .map((c) => {
      const countsBySession: Record<string, number> = {};
      for (const s of sessions) countsBySession[s.id] = 0;

      let total = 0;
      for (const ac of c.answer_codes ?? []) {
        const sessionId = ac.task_question_answer_id
          ? taskAnswerSession.get(ac.task_question_answer_id)
          : ac.interview_answer_id
            ? interviewAnswerSession.get(ac.interview_answer_id)
            : undefined;
        if (sessionId == null) continue;
        countsBySession[sessionId] += 1;
        total += 1;
      }

      return {
        codeId: c.id,
        code: c.code,
        color: c.color,
        description: c.description,
        countsBySession,
        total,
      };
    });
}
