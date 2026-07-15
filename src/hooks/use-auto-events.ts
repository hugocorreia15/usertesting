// Auto-instrumentation events (P2.5): read side for the evaluator.
// Events are written by public/avalux-instrument.js embedded in the
// system under test; RLS restricts reads to the session owner.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AutoEvent } from "@/types";

export function useAutoEvents(
  sessionId: string | undefined,
  opts: { refetchInterval?: number } = {},
) {
  return useQuery({
    queryKey: ["auto-events", sessionId],
    enabled: !!sessionId,
    refetchInterval: opts.refetchInterval,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auto_events")
        .select("*")
        .eq("session_id", sessionId!)
        .order("occurred_at");
      if (error) throw error;
      return data as AutoEvent[];
    },
  });
}

export async function fetchAutoEventsForSessions(
  sessionIds: string[],
): Promise<AutoEvent[]> {
  if (sessionIds.length === 0) return [];
  const { data, error } = await supabase
    .from("auto_events")
    .select("*")
    .in("session_id", sessionIds)
    .order("occurred_at");
  if (error) throw error;
  return data as AutoEvent[];
}
