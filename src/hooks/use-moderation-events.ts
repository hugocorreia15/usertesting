import { useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ModerationEvent, ModerationKind } from "@/lib/moderation";

/**
 * Corrections made while logging a live session (migration 055).
 *
 * Writing is deliberately fire-and-forget. These events describe the logging;
 * they must never get in its way. A failed insert is reported to the console
 * and otherwise ignored, rather than raising a toast while the evaluator is
 * timing a participant. The cost is that a session with a network drop can
 * under-record corrections, and never over-record them.
 */

export function useSessionModerationEvents(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["moderation-events", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moderation_events")
        .select("seq, session_id, task_id, task_index, kind, timer_seconds, occurred_at")
        .eq("session_id", sessionId!)
        .order("seq");
      if (error) throw error;
      return (data ?? []) as ModerationEvent[];
    },
  });
}

export interface ModerationContext {
  taskId: string | null;
  taskIndex: number | null;
  timerSeconds: number | null;
}

export function useModerationLog(sessionId: string | undefined) {
  const log = useCallback(
    (kind: ModerationKind, ctx: Partial<ModerationContext> = {}) => {
      if (!sessionId) return;
      void Promise.resolve(
        supabase.from("moderation_events").insert({
          session_id: sessionId,
          kind,
          task_id: ctx.taskId ?? null,
          task_index: ctx.taskIndex ?? null,
          timer_seconds:
            ctx.timerSeconds == null ? null : Math.round(ctx.timerSeconds * 10) / 10,
        }),
      ).then(({ error }) => {
        if (error) console.warn(`moderation event ${kind} not recorded:`, error.message);
      });
    },
    [sessionId],
  );
  return log;
}

/**
 * Writes the logging_started marker once per visit to the live cockpit, which
 * is what later lets a session with no corrections read as clean rather than
 * as unrecorded.
 */
export function useModerationLoggingStarted(
  sessionId: string | undefined,
  active: boolean,
) {
  const log = useModerationLog(sessionId);
  const written = useRef(false);
  useEffect(() => {
    if (!active || written.current) return;
    written.current = true;
    log("logging_started");
  }, [active, log]);
}
