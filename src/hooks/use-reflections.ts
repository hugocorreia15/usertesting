import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ReflectionAnswers } from "@/lib/reflection";
import type { SessionReflection } from "@/types";

/**
 * Session reflections (migration 053).
 *
 * The list this returns is whatever row-level security lets the viewer see:
 * always their own; a teammate's only after submitting their own; and, for an
 * organization owner, every submitted one. The hook does not filter, because
 * filtering here would suggest the rule lives in the client. It does not.
 */

const key = (sessionId: string) => ["reflections", sessionId] as const;

export function useSessionReflections(sessionId: string | undefined) {
  return useQuery({
    queryKey: key(sessionId ?? ""),
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_reflections")
        .select("*")
        .eq("session_id", sessionId!)
        .order("submitted_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as SessionReflection[];
    },
  });
}

/** Create or update your own draft. The database refuses once submitted. */
export function useSaveReflection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      sessionId: string;
      userId: string;
      existingId: string | null;
      answers: ReflectionAnswers;
    }) => {
      if (input.existingId) {
        const { error } = await supabase
          .from("session_reflections")
          .update(input.answers)
          .eq("id", input.existingId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("session_reflections").insert({
        session_id: input.sessionId,
        user_id: input.userId,
        ...input.answers,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: key(v.sessionId) }),
  });
}

export function useSubmitReflection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.rpc("submit_session_reflection", {
        sid: sessionId,
      });
      if (error) throw error;
    },
    onSuccess: (_, sessionId) => qc.invalidateQueries({ queryKey: key(sessionId) }),
  });
}

/** For exports: every reflection the viewer may read across these sessions. */
export async function fetchReflectionsForSessions(
  sessionIds: string[],
): Promise<SessionReflection[]> {
  if (sessionIds.length === 0) return [];
  const { data, error } = await supabase
    .from("session_reflections")
    .select("*")
    .in("session_id", sessionIds);
  if (error) throw error;
  return (data ?? []) as SessionReflection[];
}
