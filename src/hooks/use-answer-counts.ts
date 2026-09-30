import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * How many participant records each question or error type is holding
 * (migration 062).
 *
 * Removing one from the protocol deletes those records through the cascade on
 * its id, so the editor asks for this before offering a delete button. Only
 * entries with a count above zero come back, so an untouched protocol returns
 * an empty map and nothing in the interface changes.
 */
export type AnswerCountKind = "task_question" | "interview_question" | "error_type";

export function useAnswerCounts(templateId: string | undefined) {
  return useQuery({
    queryKey: ["answer-counts", templateId] as const,
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("template_answer_counts", {
        tid: templateId!,
      });
      if (error) throw error;

      const counts = new Map<string, number>();
      for (const row of (data ?? []) as {
        kind: AnswerCountKind;
        ref_id: string;
        n: number;
      }[]) {
        counts.set(row.ref_id, Number(row.n));
      }
      return counts;
    },
  });
}
