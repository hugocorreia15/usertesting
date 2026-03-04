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
           task_results(*, template_tasks(*), error_logs(*), hesitation_logs(*)),
           interview_answers(*), sus_answers(*)`,
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
           task_results(*, template_tasks(*), error_logs(*), hesitation_logs(*)),
           interview_answers(*), sus_answers(*)`,
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
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from("test_sessions")
        .insert({
          ...input,
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

      // Create task_results skeleton
      const { data: tasks } = await supabase
        .from("template_tasks")
        .select("id")
        .eq("template_id", input.template_id)
        .order("sort_order");

      if (tasks && tasks.length > 0) {
        const { error: trErr } = await supabase.from("task_results").insert(
          tasks.map((t) => ({
            session_id: data.id,
            task_id: t.id,
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

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("test_sessions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}
