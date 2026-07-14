import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  TestSession,
  TestSessionWithRelations,
  TaskResult,
  ErrorLog,
  HesitationLog,
  InterviewAnswer,
  SusAnswer,
} from "@/types";
import { applyTaskOrder, type TaskOrderStrategy } from "@/lib/task-order";

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_sessions")
        .select("*, templates(name), participants(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Poll for session changes so the list auto-updates when participants join. */
export function useSessionsRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const interval = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
    }, 5000);
    return () => clearInterval(interval);
  }, [qc]);
}

export function useSessionsByTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: ["sessions", "by-template", templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_sessions")
        .select("*, templates(name), participants(name)")
        .eq("template_id", templateId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSessionsByTemplateWithRelations(
  templateId: string | undefined,
) {
  return useQuery({
    queryKey: ["sessions", "by-template-full", templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_sessions")
        .select(
          `*, templates(*), participants(*),
           task_results(*, template_tasks(*, task_questions(*)), error_logs(*), hesitation_logs(*), task_question_answers(*)),
           interview_answers(*), sus_answers(*), instrument_answers(*)`,
        )
        .eq("template_id", templateId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TestSessionWithRelations[];
    },
  });
}

export function useSession(id: string | undefined) {
  return useQuery({
    queryKey: ["sessions", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_sessions")
        .select(
          `*, templates(*), participants(*),
           task_results(*, template_tasks(*, task_questions(*)), error_logs(*), hesitation_logs(*), task_question_answers(*)),
           interview_answers(*), sus_answers(*), instrument_answers(*)`,
        )
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as TestSessionWithRelations;
    },
  });
}

interface CreateSessionInput {
  template_id: string;
  participant_id: string;
  evaluator_name: string;
  status?: "planned" | "in_progress";
  selected_task_ids?: string[];
  task_order_strategy?: TaskOrderStrategy;
}

// Latin-square rotation index: how many sessions this template already
// has determines the rotation offset of the next one.
async function templateSessionCount(templateId: string): Promise<number> {
  const { count } = await supabase
    .from("test_sessions")
    .select("id", { count: "exact", head: true })
    .eq("template_id", templateId);
  return count ?? 0;
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      const userId = await getCurrentUserId();
      const {
        selected_task_ids,
        task_order_strategy = "fixed",
        ...sessionFields
      } = input;

      const rotationIndex =
        task_order_strategy === "latin_square"
          ? await templateSessionCount(input.template_id)
          : 0;

      const { data, error } = await supabase
        .from("test_sessions")
        .insert({
          ...sessionFields,
          task_order_strategy,
          user_id: userId,
          status: input.status || "planned",
          started_at:
            input.status === "in_progress"
              ? new Date().toISOString()
              : null,
        })
        .select()
        .single();
      if (error) throw error;

      // Materialize the task order into the task_results skeleton
      let baseIds: string[];
      if (selected_task_ids && selected_task_ids.length > 0) {
        baseIds = selected_task_ids;
      } else {
        const { data: tasks } = await supabase
          .from("template_tasks")
          .select("id, sort_order")
          .eq("template_id", input.template_id)
          .order("sort_order");
        baseIds = (tasks ?? []).map((t) => t.id);
      }

      const orderedIds = applyTaskOrder(
        baseIds,
        task_order_strategy,
        rotationIndex,
      );
      if (orderedIds.length > 0) {
        const { error: trErr } = await supabase.from("task_results").insert(
          orderedIds.map((taskId, index) => ({
            session_id: data.id,
            task_id: taskId,
            sort_order: index,
          })),
        );
        if (trErr) throw trErr;
      }

      // Create interview_answers skeleton
      const { data: questions } = await supabase
        .from("template_questions")
        .select("id")
        .eq("template_id", input.template_id)
        .order("sort_order");

      if (questions && questions.length > 0) {
        const { error: iaErr } = await supabase
          .from("interview_answers")
          .insert(
            questions.map((q) => ({
              session_id: data.id,
              question_id: q.id,
            })),
          );
        if (iaErr) throw iaErr;
      }

      return data as TestSession;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<TestSession> & { id: string },
    ) => {
      const { id, ...updates } = input;
      const { error } = await supabase
        .from("test_sessions")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["sessions", vars.id] });
    },
  });
}

export function useUpdateTaskResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<TaskResult> & { id: string },
    ) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("task_results")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as TaskResult;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

// Reset a task result back to its initial (unattempted) state:
// clears metrics, deletes its answers and error/hesitation logs.
export function useResetTaskResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskResultId: string) => {
      const { error: aErr } = await supabase
        .from("task_question_answers")
        .delete()
        .eq("task_result_id", taskResultId);
      if (aErr) throw aErr;

      const { error: eErr } = await supabase
        .from("error_logs")
        .delete()
        .eq("task_result_id", taskResultId);
      if (eErr) throw eErr;

      const { error: hErr } = await supabase
        .from("hesitation_logs")
        .delete()
        .eq("task_result_id", taskResultId);
      if (hErr) throw hErr;

      const { error } = await supabase
        .from("task_results")
        .update({
          completion_status: null,
          time_seconds: null,
          action_count: null,
          error_count: 0,
          hesitation_count: 0,
          seq_rating: null,
        })
        .eq("id", taskResultId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useCreateErrorLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<ErrorLog, "id" | "created_at">,
    ) => {
      const { data, error } = await supabase
        .from("error_logs")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as ErrorLog;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

// Deletions used by live-mode undo: remove a just-logged event.
export function useDeleteErrorLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("error_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useDeleteHesitationLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hesitation_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useCreateHesitationLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<HesitationLog, "id" | "created_at">,
    ) => {
      const { data, error } = await supabase
        .from("hesitation_logs")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as HesitationLog;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useUpdateInterviewAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: { id: string; answer_text: string },
    ) => {
      const { error } = await supabase
        .from("interview_answers")
        .update({ answer_text: input.answer_text })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useCreateSusAnswers() {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useUpsertSusAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: { session_id: string; question_number: number; score: number },
    ) => {
      const { error } = await supabase
        .from("sus_answers")
        .upsert(
          {
            session_id: input.session_id,
            question_number: input.question_number,
            score: input.score,
          },
          { onConflict: "session_id,question_number" },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useUpsertTaskQuestionAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      task_result_id: string;
      question_id: string;
      answer_text?: string | null;
      selected_options?: string[] | null;
      rating_value?: number | null;
      media_url?: string | null;
    }) => {
      const { error } = await supabase
        .from("task_question_answers")
        .upsert(
          {
            task_result_id: input.task_result_id,
            question_id: input.question_id,
            answer_text: input.answer_text ?? null,
            selected_options: input.selected_options ?? null,
            rating_value: input.rating_value ?? null,
            media_url: input.media_url ?? null,
          },
          { onConflict: "task_result_id,question_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

// Media files live under <owner>/<sessionId>/<taskResultId>/<questionId>.<ext>
// in the private session-media bucket. Rows cascade-delete with the session,
// but storage files don't — remove them best-effort before deleting the row.
async function deleteSessionMedia(sessionId: string) {
  try {
    const { data: session } = await supabase
      .from("test_sessions")
      .select("user_id")
      .eq("id", sessionId)
      .single();
    if (!session?.user_id) return;

    const base = `${session.user_id}/${sessionId}`;
    const bucket = supabase.storage.from("session-media");
    const { data: folders } = await bucket.list(base);
    const paths: string[] = [];
    for (const entry of folders ?? []) {
      if (entry.id) {
        paths.push(`${base}/${entry.name}`);
      } else {
        const { data: files } = await bucket.list(`${base}/${entry.name}`);
        for (const f of files ?? []) paths.push(`${base}/${entry.name}/${f.name}`);
      }
    }
    if (paths.length > 0) await bucket.remove(paths);
  } catch {
    // storage cleanup must never block session deletion
  }
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteSessionMedia(id);
      const { error } = await supabase
        .from("test_sessions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

// Retroactive anonymization (036 RPC): replaces the participant's name
// with a random identifier and removes email, notes and custom field
// values. Identity lives on the participants row, so this affects ALL
// of the participant's sessions; demographics and metrics are kept.
// Irreversible.
export function useAnonymizeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.rpc("anonymize_session", {
        p_session_id: sessionId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["participants"] });
    },
  });
}
