import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ReviewMode } from "@/lib/review-gate";

/**
 * Instructor gate mutations. All three go through SECURITY DEFINER functions
 * (migration 050): the review columns cannot be written directly, so a
 * student cannot approve their own template.
 */

const invalidate = (qc: ReturnType<typeof useQueryClient>, id: string) => {
  qc.invalidateQueries({ queryKey: ["templates", id] });
  qc.invalidateQueries({ queryKey: ["templates"] });
};

export function useSetReviewMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, mode }: { templateId: string; mode: ReviewMode }) => {
      const { error } = await supabase.rpc("set_template_review_mode", {
        tid: templateId,
        mode,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => invalidate(qc, v.templateId),
  });
}

export function useRequestReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.rpc("request_template_review", { tid: templateId });
      if (error) throw error;
    },
    onSuccess: (_, templateId) => invalidate(qc, templateId),
  });
}

export function useReviewTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      templateId,
      decision,
      note,
    }: {
      templateId: string;
      decision: "approved" | "changes_requested";
      note?: string;
    }) => {
      const { error } = await supabase.rpc("review_template", {
        tid: templateId,
        decision,
        note: note?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => invalidate(qc, v.templateId),
  });
}
