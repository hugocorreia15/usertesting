import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TestOutcome } from "@/lib/synthesis";
import type { ProblemEvidence, TestProblem } from "@/types";

/**
 * Synthesis after testing (migration 056): outcomes of predicted problems,
 * problems only testing found, and the sessions that show each.
 */

const key = (templateId: string) => ["synthesis", templateId] as const;

export function useSynthesis(templateId: string | undefined) {
  return useQuery({
    queryKey: key(templateId ?? ""),
    enabled: !!templateId,
    queryFn: async () => {
      const [problems, evidence] = await Promise.all([
        supabase.from("test_problems").select("*").eq("template_id", templateId!).order("created_at"),
        supabase.from("problem_evidence").select("*").eq("template_id", templateId!),
      ]);
      if (problems.error) throw problems.error;
      if (evidence.error) throw evidence.error;
      return {
        testProblems: (problems.data ?? []) as TestProblem[],
        evidence: (evidence.data ?? []) as ProblemEvidence[],
      };
    },
  });
}

export function useSetProblemOutcome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { inspectionId: string; problemId: string; outcome: TestOutcome }) => {
      const { error } = await supabase
        .from("inspection_problems")
        .update({ test_outcome: input.outcome })
        .eq("id", input.problemId);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["inspection", v.inspectionId] }),
  });
}

export function useToggleEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      templateId: string;
      sessionId: string;
      inspectionProblemId?: string;
      testProblemId?: string;
      existingId: string | null;
    }) => {
      if (input.existingId) {
        const { error } = await supabase.from("problem_evidence").delete().eq("id", input.existingId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("problem_evidence").insert({
        template_id: input.templateId,
        session_id: input.sessionId,
        inspection_problem_id: input.inspectionProblemId ?? null,
        test_problem_id: input.testProblemId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: key(v.templateId) }),
  });
}

export function useAddTestProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { templateId: string; title: string; severity: number | null }) => {
      const { error } = await supabase.from("test_problems").insert({
        template_id: input.templateId,
        title: input.title,
        severity: input.severity,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: key(v.templateId) }),
  });
}

export function useDeleteTestProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { templateId: string; id: string }) => {
      const { error } = await supabase.from("test_problems").delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: key(v.templateId) }),
  });
}

export async function fetchSynthesisForExport(templateId: string) {
  const [problems, evidence] = await Promise.all([
    supabase.from("test_problems").select("*").eq("template_id", templateId),
    supabase.from("problem_evidence").select("*").eq("template_id", templateId),
  ]);
  if (problems.error) throw problems.error;
  if (evidence.error) throw evidence.error;
  return {
    testProblems: (problems.data ?? []) as TestProblem[],
    problemEvidence: (evidence.data ?? []) as ProblemEvidence[],
  };
}
