// Qualitative coding (P2.4): the code book lives on the template
// (template_codes) and tags land in answer_codes, referencing either a
// task question answer or an interview answer. Evaluator-only — RLS
// scopes everything to the template owner.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TemplateCode, AnswerCode } from "@/types";

export function useTemplateCodes(templateId: string | undefined) {
  return useQuery({
    queryKey: ["template-codes", templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_codes")
        .select("*")
        .eq("template_id", templateId!)
        .order("sort_order")
        .order("code");
      if (error) throw error;
      return data as TemplateCode[];
    },
  });
}

interface CodeInput {
  template_id: string;
  code: string;
  description?: string | null;
  color?: string;
  sort_order?: number;
}

export function useCreateCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CodeInput) => {
      const { data, error } = await supabase
        .from("template_codes")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as TemplateCode;
    },
    onSuccess: (code) => invalidateCoding(qc, code.template_id),
  });
}

export function useUpdateCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      template_id: string;
      code?: string;
      description?: string | null;
      color?: string;
    }) => {
      const { id, template_id: _tid, ...patch } = input;
      const { error } = await supabase
        .from("template_codes")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, input) => invalidateCoding(qc, input.template_id),
  });
}

export function useDeleteCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; template_id: string }) => {
      const { error } = await supabase
        .from("template_codes")
        .delete()
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, input) => invalidateCoding(qc, input.template_id),
  });
}

// ── Tags for one session's answers ──
// One query for every tag attached to the given answer ids; the
// components distribute them per answer.

export function useSessionAnswerCodes(
  sessionId: string | undefined,
  taskAnswerIds: string[],
  interviewAnswerIds: string[],
) {
  const haveAnswers =
    taskAnswerIds.length > 0 || interviewAnswerIds.length > 0;
  return useQuery({
    queryKey: ["answer-codes", sessionId],
    enabled: !!sessionId && haveAnswers,
    queryFn: async () => {
      const filters: string[] = [];
      if (taskAnswerIds.length > 0)
        filters.push(
          `task_question_answer_id.in.(${taskAnswerIds.join(",")})`,
        );
      if (interviewAnswerIds.length > 0)
        filters.push(`interview_answer_id.in.(${interviewAnswerIds.join(",")})`);
      const { data, error } = await supabase
        .from("answer_codes")
        .select("*")
        .or(filters.join(","));
      if (error) throw error;
      return data as AnswerCode[];
    },
  });
}

export type AnswerRef =
  | { task_question_answer_id: string }
  | { interview_answer_id: string };

export function useTagAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      code_id: string;
      session_id: string;
      template_id: string;
      ref: AnswerRef;
    }) => {
      const { error } = await supabase
        .from("answer_codes")
        .insert({ code_id: input.code_id, ...input.ref });
      if (error) throw error;
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: ["answer-codes", input.session_id] });
      invalidateCoding(qc, input.template_id);
    },
  });
}

export function useUntagAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      answer_code_id: string;
      session_id: string;
      template_id: string;
    }) => {
      const { error } = await supabase
        .from("answer_codes")
        .delete()
        .eq("id", input.answer_code_id);
      if (error) throw error;
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: ["answer-codes", input.session_id] });
      invalidateCoding(qc, input.template_id);
    },
  });
}

function invalidateCoding(
  qc: ReturnType<typeof useQueryClient>,
  templateId: string,
) {
  qc.invalidateQueries({ queryKey: ["template-codes", templateId] });
  // the template embed carries template_codes(*, answer_codes(*)) for
  // the matrix and exports
  qc.invalidateQueries({ queryKey: ["templates", templateId] });
}
