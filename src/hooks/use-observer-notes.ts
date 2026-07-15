// Observer notes (migration 045): anyone who can read a session — its
// creator, org full members, assigned students — can attach timestamped
// notes while spectating. A parallel qualitative record, never mixed
// into the evaluator's metrics.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ObserverNote } from "@/types";

export function useObserverNotes(
  sessionId: string | undefined,
  opts: { refetchInterval?: number } = {},
) {
  return useQuery({
    queryKey: ["observer-notes", sessionId],
    enabled: !!sessionId,
    refetchInterval: opts.refetchInterval,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("observer_notes")
        .select("*")
        .eq("session_id", sessionId!)
        .order("created_at");
      if (error) throw error;
      return data as ObserverNote[];
    },
  });
}

export function useCreateObserverNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      session_id: string;
      note: string;
      task_index?: number | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("observer_notes").insert({
        session_id: input.session_id,
        author_id: user.id,
        author_email: user.email ?? null,
        note: input.note,
        task_index: input.task_index ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, input) =>
      qc.invalidateQueries({ queryKey: ["observer-notes", input.session_id] }),
  });
}

export function useDeleteObserverNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; session_id: string }) => {
      const { error } = await supabase
        .from("observer_notes")
        .delete()
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, input) =>
      qc.invalidateQueries({ queryKey: ["observer-notes", input.session_id] }),
  });
}

export async function fetchObserverNotesForSessions(
  sessionIds: string[],
): Promise<ObserverNote[]> {
  if (sessionIds.length === 0) return [];
  const { data, error } = await supabase
    .from("observer_notes")
    .select("*")
    .in("session_id", sessionIds)
    .order("created_at");
  if (error) throw error;
  return data as ObserverNote[];
}
