// Inter-rater reliability (backlog #1): a co-rater's independent
// per-task scores for a session. The primary evaluator's scores live in
// task_results; these are the parallel judgments compared against them.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { RaterScore } from "@/types";

export function useRaterScores(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["rater-scores", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rater_scores")
        .select("*")
        .eq("session_id", sessionId!);
      if (error) throw error;
      return data as RaterScore[];
    },
  });
}

export interface RaterScoreInput {
  session_id: string;
  task_id: string;
  completion_status?: string | null;
  action_count?: number | null;
  error_count?: number | null;
  hesitation_count?: number | null;
  seq_rating?: number | null;
}

// Upsert this rater's score for one task (unique on session+rater+task).
export function useUpsertRaterScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RaterScoreInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("rater_scores").upsert(
        {
          session_id: input.session_id,
          task_id: input.task_id,
          rater_id: user.id,
          rater_email: user.email ?? null,
          completion_status: input.completion_status ?? null,
          action_count: input.action_count ?? null,
          error_count: input.error_count ?? null,
          hesitation_count: input.hesitation_count ?? null,
          seq_rating: input.seq_rating ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_id,rater_id,task_id" },
      );
      if (error) throw error;
    },
    onSuccess: (_d, input) =>
      qc.invalidateQueries({ queryKey: ["rater-scores", input.session_id] }),
  });
}

export async function fetchRaterScoresForSessions(
  sessionIds: string[],
): Promise<RaterScore[]> {
  if (sessionIds.length === 0) return [];
  const { data, error } = await supabase
    .from("rater_scores")
    .select("*")
    .in("session_id", sessionIds);
  if (error) throw error;
  return data as RaterScore[];
}
