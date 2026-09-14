import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  Heuristic,
  HeuristicSet,
  Inspection,
  InspectionEvaluator,
  InspectionFinding,
  InspectionProblem,
  InspectionSubjectKind,
} from "@/types";

/**
 * Heuristic inspection (migration 052).
 *
 * Two things here are enforced by the database, not by this file, and the
 * distinction matters. Reading another evaluator's findings before both of you
 * have submitted is refused by row-level security, so a query that tries it
 * returns fewer rows rather than an error. Editing a submitted pass is refused
 * by a trigger, so that one does raise. Neither is a client-side rule; this
 * module only avoids asking for what it knows it cannot have.
 */

const keys = {
  list: (templateId: string) => ["inspections", templateId] as const,
  one: (id: string) => ["inspection", id] as const,
  sets: ["heuristic-sets"] as const,
};

export function useHeuristicSets() {
  return useQuery({
    queryKey: keys.sets,
    queryFn: async () => {
      const [sets, items] = await Promise.all([
        supabase.from("heuristic_sets").select("*").order("is_builtin", { ascending: false }),
        supabase.from("heuristics").select("*").order("sort_order"),
      ]);
      if (sets.error) throw sets.error;
      if (items.error) throw items.error;
      const bySet = new Map<string, Heuristic[]>();
      for (const h of (items.data ?? []) as Heuristic[]) {
        const list = bySet.get(h.set_id) ?? [];
        list.push(h);
        bySet.set(h.set_id, list);
      }
      return ((sets.data ?? []) as HeuristicSet[]).map((s) => ({
        ...s,
        heuristics: bySet.get(s.id) ?? [],
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInspections(templateId: string | undefined) {
  return useQuery({
    queryKey: keys.list(templateId ?? ""),
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspections")
        .select("*")
        .eq("template_id", templateId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Inspection[];
    },
  });
}

export interface InspectionDetail {
  inspection: Inspection;
  evaluators: InspectionEvaluator[];
  /** Only what row-level security allows this viewer to see. */
  findings: InspectionFinding[];
  problems: InspectionProblem[];
}

export function useInspection(id: string | undefined) {
  return useQuery({
    queryKey: keys.one(id ?? ""),
    enabled: !!id,
    queryFn: async (): Promise<InspectionDetail> => {
      const [ins, evals, finds, probs] = await Promise.all([
        supabase.from("inspections").select("*").eq("id", id!).single(),
        supabase.from("inspection_evaluators").select("*").eq("inspection_id", id!),
        supabase
          .from("inspection_findings")
          .select("*")
          .eq("inspection_id", id!)
          .order("created_at"),
        supabase
          .from("inspection_problems")
          .select("*")
          .eq("inspection_id", id!)
          .order("sort_order"),
      ]);
      if (ins.error) throw ins.error;
      if (evals.error) throw evals.error;
      if (finds.error) throw finds.error;
      if (probs.error) throw probs.error;
      return {
        inspection: ins.data as Inspection,
        evaluators: (evals.data ?? []) as InspectionEvaluator[],
        findings: (finds.data ?? []) as InspectionFinding[],
        problems: (probs.data ?? []) as InspectionProblem[],
      };
    },
  });
}

export function useCreateInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      templateId: string;
      subjectName: string;
      subjectKind: InspectionSubjectKind;
      subjectUrl?: string | null;
      heuristicSetId: string | null;
      userId: string;
    }) => {
      const { data, error } = await supabase
        .from("inspections")
        .insert({
          template_id: input.templateId,
          subject_name: input.subjectName,
          subject_kind: input.subjectKind,
          subject_url: input.subjectUrl ?? null,
          heuristic_set_id: input.heuristicSetId,
          created_by: input.userId,
        })
        .select()
        .single();
      if (error) throw error;
      // The creator is an evaluator by default; a team adds the rest.
      const { error: e2 } = await supabase
        .from("inspection_evaluators")
        .insert({ inspection_id: data.id, user_id: input.userId });
      if (e2) throw e2;
      return data as Inspection;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: keys.list(v.templateId) });
    },
  });
}

export function useJoinInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      inspectionId,
      userId,
    }: {
      inspectionId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("inspection_evaluators")
        .insert({ inspection_id: inspectionId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: keys.one(v.inspectionId) }),
  });
}

export function useAddFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      inspectionId: string;
      evaluatorId: string;
      description: string;
      heuristicId: string | null;
      location: string | null;
      severity: number | null;
    }) => {
      const { error } = await supabase.from("inspection_findings").insert({
        inspection_id: input.inspectionId,
        evaluator_id: input.evaluatorId,
        description: input.description,
        heuristic_id: input.heuristicId,
        location: input.location,
        severity: input.severity,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: keys.one(v.inspectionId) }),
  });
}

export function useUpdateFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      inspectionId: string;
      findingId: string;
      patch: Partial<Pick<InspectionFinding,
        "description" | "heuristic_id" | "location" | "severity" | "problem_id">>;
    }) => {
      const { error } = await supabase
        .from("inspection_findings")
        .update(input.patch)
        .eq("id", input.findingId);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: keys.one(v.inspectionId) }),
  });
}

export function useDeleteFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      findingId,
    }: {
      inspectionId: string;
      findingId: string;
    }) => {
      const { error } = await supabase
        .from("inspection_findings")
        .delete()
        .eq("id", findingId);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: keys.one(v.inspectionId) }),
  });
}

/**
 * Submitting is irreversible and freezes the pass, which is why it goes
 * through a function rather than an update: submitted_at refuses a direct
 * write.
 */
export function useSubmitPass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inspectionId: string) => {
      const { error } = await supabase.rpc("submit_inspection_pass", {
        iid: inspectionId,
      });
      if (error) throw error;
    },
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: keys.one(id) }),
  });
}

export function useCloseCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inspectionId: string) => {
      const { error } = await supabase.rpc("close_inspection_collection", {
        iid: inspectionId,
      });
      if (error) throw error;
    },
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: keys.one(id) }),
  });
}

export function useCreateProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      inspectionId: string;
      title: string;
      agreedSeverity: number | null;
      heuristicId: string | null;
      findingIds: string[];
    }) => {
      const { data, error } = await supabase
        .from("inspection_problems")
        .insert({
          inspection_id: input.inspectionId,
          title: input.title,
          agreed_severity: input.agreedSeverity,
          heuristic_id: input.heuristicId,
        })
        .select()
        .single();
      if (error) throw error;
      if (input.findingIds.length > 0) {
        const { error: e2 } = await supabase
          .from("inspection_findings")
          .update({ problem_id: data.id })
          .in("id", input.findingIds);
        if (e2) throw e2;
      }
      return data as InspectionProblem;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: keys.one(v.inspectionId) }),
  });
}

export function useAssignFindingToProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      inspectionId: string;
      findingId: string;
      problemId: string | null;
    }) => {
      const { error } = await supabase
        .from("inspection_findings")
        .update({ problem_id: input.problemId })
        .eq("id", input.findingId);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: keys.one(v.inspectionId) }),
  });
}

/** Turn a merged problem into a task on the template it belongs to. */
export function useDeriveTaskFromProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      inspectionId: string;
      templateId: string;
      problem: InspectionProblem;
      sortOrder: number;
    }) => {
      const { error } = await supabase.from("template_tasks").insert({
        template_id: input.templateId,
        name: input.problem.title,
        sort_order: input.sortOrder,
        from_problem_id: input.problem.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["templates", v.templateId] });
      qc.invalidateQueries({ queryKey: keys.one(v.inspectionId) });
    },
  });
}

export function useSetRequireInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      templateId,
      required,
    }: {
      templateId: string;
      required: boolean;
    }) => {
      const { error } = await supabase
        .from("templates")
        .update({ require_inspection: required })
        .eq("id", templateId);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["templates", v.templateId] });
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

/**
 * Every inspection row for one template that the exporting user may read. For
 * an inspection still collecting passes, row-level security returns only the
 * exporter's own findings, so the export never leaks what the page would hide.
 */
export async function fetchInspectionsForExport(templateId: string) {
  const { data: inspections, error } = await supabase
    .from("inspections")
    .select("*")
    .eq("template_id", templateId);
  if (error) throw error;
  const ids = (inspections ?? []).map((i) => i.id);
  if (ids.length === 0) {
    return { inspections: [], inspectionEvaluators: [], inspectionFindings: [], inspectionProblems: [] };
  }
  const [evaluators, findings, problems] = await Promise.all([
    supabase.from("inspection_evaluators").select("*").in("inspection_id", ids),
    supabase.from("inspection_findings").select("*").in("inspection_id", ids),
    supabase.from("inspection_problems").select("*").in("inspection_id", ids),
  ]);
  for (const r of [evaluators, findings, problems]) if (r.error) throw r.error;
  return {
    inspections: (inspections ?? []) as Inspection[],
    inspectionEvaluators: (evaluators.data ?? []) as InspectionEvaluator[],
    inspectionFindings: (findings.data ?? []) as InspectionFinding[],
    inspectionProblems: (problems.data ?? []) as InspectionProblem[],
  };
}
