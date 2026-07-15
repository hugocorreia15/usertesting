import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TestSessionWithRelations } from "@/types";
import {
  mergeParticipantSession,
  type ParticipantStaticData,
  type ParticipantLiveData,
} from "@/lib/participant-live";

export function useParticipantSessions() {
  return useQuery({
    queryKey: ["participant-sessions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find participant record linked to this auth user
      const { data: participant } = await supabase
        .from("participants")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!participant) return [];

      const { data, error } = await supabase
        .from("test_sessions")
        .select("*, templates(name), participants(name)")
        .eq("participant_id", participant.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useParticipantSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["participant-sessions", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_sessions")
        .select(
          `*, templates(*, template_tasks(*), template_questions(*)),
           participants(*),
           task_results(*, template_tasks(*)),
           interview_answers(*), sus_answers(*)`,
        )
        .eq("id", sessionId!)
        .single();
      if (error) throw error;
      return data as TestSessionWithRelations & {
        templates: TestSessionWithRelations["templates"] & {
          template_tasks: Array<{ id: string; name: string; description: string | null; sort_order: number }>;
          template_questions: Array<{ id: string; question_text: string; sort_order: number }>;
        };
      };
    },
  });
}

// ── Resolve a join code to a session ID (anon-safe) ──

export function useSessionByJoinCode(code: string | undefined) {
  return useQuery({
    queryKey: ["session-by-join-code", code],
    enabled: !!code,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_sessions")
        .select("id, status, join_code, templates(name), user_id")
        .eq("join_code", code!)
        .maybeSingle();
      if (error) throw error;
      return data as {
        id: string;
        status: string;
        join_code: string;
        templates: { name: string };
        user_id: string;
      } | null;
    },
  });
}

// ── Participant live (anon-safe, realtime) ──
// Split into a fetch-once STATIC query (template/task definitions) and
// a LIGHT live query re-fetched on realtime ticks; merged back into the
// historical shape by src/lib/participant-live.ts. The old combined
// 4-level select was the load-test bottleneck (statement timeouts at
// ~15 concurrent participants).

export type {
  ParticipantLiveTaskResult,
  ParticipantLiveSession,
} from "@/lib/participant-live";

async function fetchParticipantStatic(sessionId: string) {
  const { data, error } = await supabase
    .from("test_sessions")
    .select(
      `id,
       templates(instruments, template_questions(id, question_text, sort_order)),
       task_results(id, template_tasks(id, name, description, task_questions(*)))`,
    )
    .eq("id", sessionId)
    .single();
  if (error) throw error;
  return data as unknown as ParticipantStaticData;
}

async function fetchParticipantLive(sessionId: string) {
  const { data, error } = await supabase
    .from("test_sessions")
    .select(
      `id, status, user_id, join_code, template_id, current_task_index,
       instrument_answers(id, instrument, item_number, score),
       task_results(id, sort_order, seq_rating, completion_status,
         task_question_answers(*)),
       interview_answers(id, question_id, answer_text),
       sus_answers(id, question_number, score)`,
    )
    .eq("id", sessionId)
    .single();
  if (error) throw error;
  return data as unknown as ParticipantLiveData;
}

export function useParticipantLiveSession(sessionId: string | null) {
  const qc = useQueryClient();
  const queryKey = ["participant-live", sessionId];
  const staticKey = ["participant-static", sessionId];

  // Supabase Realtime: re-fetch when session or task_results change
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`participant-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "test_sessions",
          filter: `id=eq.${sessionId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "task_results",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, qc]);

  // Static half: definitions can't change mid-session, never refetch.
  const staticQuery = useQuery({
    queryKey: staticKey,
    enabled: !!sessionId,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    queryFn: () => fetchParticipantStatic(sessionId!),
  });

  const liveQuery = useQuery({
    queryKey,
    enabled: !!sessionId,
    queryFn: () => fetchParticipantLive(sessionId!),
  });

  const merged = useMemo(() => {
    if (!staticQuery.data || !liveQuery.data) return undefined;
    return mergeParticipantSession(staticQuery.data, liveQuery.data);
  }, [staticQuery.data, liveQuery.data]);

  // A null merge means a task result had no static definition (the
  // session was rebuilt) — refresh the static half once.
  useEffect(() => {
    if (merged === null) {
      qc.invalidateQueries({ queryKey: staticKey });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merged]);

  return {
    data: merged ?? undefined,
    isLoading: staticQuery.isLoading || liveQuery.isLoading,
  };
}

export function useSubmitParticipantAnswers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: {
        task_result_id: string;
        answers: {
          question_id: string;
          answer_text?: string | null;
          selected_options?: string[] | null;
          rating_value?: number | null;
          media_url?: string | null;
        }[];
      },
    ) => {
      for (const answer of input.answers) {
        const { error } = await supabase
          .from("task_question_answers")
          .upsert(
            {
              task_result_id: input.task_result_id,
              question_id: answer.question_id,
              answer_text: answer.answer_text ?? null,
              selected_options: answer.selected_options ?? null,
              rating_value: answer.rating_value ?? null,
              media_url: answer.media_url ?? null,
            },
            { onConflict: "task_result_id,question_id" },
          );
        if (error) throw error;
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["participant-live"] }),
  });
}

export function useSubmitInstrumentAnswers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      session_id: string;
      instrument: string;
      answers: { item_number: number; score: number }[];
    }) => {
      const { error } = await supabase.from("instrument_answers").insert(
        input.answers.map((a) => ({
          session_id: input.session_id,
          instrument: input.instrument,
          item_number: a.item_number,
          score: a.score,
        })),
      );
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["participant-live"] }),
  });
}

export function useCreateParticipantSusAnswers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: { session_id: string; answers: { question_number: number; score: number }[] },
    ) => {
      const { error } = await supabase
        .from("sus_answers")
        .insert(
          input.answers.map((a) => ({
            session_id: input.session_id,
            question_number: a.question_number,
            score: a.score,
          })),
        );
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["participant-live"] }),
  });
}

export function useUpdateParticipantInterviewAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: { session_id: string; question_id: string; answer_text: string },
    ) => {
      // Try to update the skeleton row created at join time. If it's not
      // there (older session, or skeleton insert previously failed under
      // RLS), .update().eq() silently affects 0 rows — answers would be
      // lost. Detect that and insert instead.
      const { data: updated, error: uErr } = await supabase
        .from("interview_answers")
        .update({ answer_text: input.answer_text })
        .eq("session_id", input.session_id)
        .eq("question_id", input.question_id)
        .select("id");
      if (uErr) throw uErr;
      if (!updated || updated.length === 0) {
        const { error: iErr } = await supabase
          .from("interview_answers")
          .insert({
            session_id: input.session_id,
            question_id: input.question_id,
            answer_text: input.answer_text,
          });
        if (iErr) throw iErr;
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["participant-live"] }),
  });
}
