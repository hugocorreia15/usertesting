import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { validateMergeSuggestion, type MergeCluster } from "@/lib/ai-suggestions";
import type { AiSuggestion } from "@/types";

/**
 * Model suggestions during consolidation (migration 058).
 *
 * The edge function returns the model's raw answer and nothing is stored until
 * it has been validated here against findings this client already holds. That
 * ordering is the point: an invented finding id never reaches the database,
 * and what is stored is what a person will be shown.
 */

const key = (inspectionId: string) => ["ai-suggestions", inspectionId] as const;

export function useAiSuggestions(inspectionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: key(inspectionId ?? ""),
    enabled: !!inspectionId && enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_suggestions")
        .select("*")
        .eq("inspection_id", inspectionId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AiSuggestion[];
    },
  });
}

export interface SuggestionRequest {
  inspectionId: string;
  /** Ids of findings this client can see: the model may name no others. */
  findingIds: string[];
  /** Codes of the inspection's own heuristic set. */
  heuristicCodes: string[];
}

export function useRequestSuggestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SuggestionRequest) => {
      const { data, error } = await supabase.functions.invoke("inspection-suggest", {
        body: { inspection_id: input.inspectionId },
      });
      if (error) {
        // The function answers with a readable message; surface that, not "500".
        const detail =
          (data as { error?: string } | null)?.error ??
          (error as { message?: string }).message ??
          "The suggestion service is unavailable";
        throw new Error(detail);
      }
      const { raw, model } = (data ?? {}) as { raw?: unknown; model?: string };
      const validated = validateMergeSuggestion(raw, {
        findingIds: input.findingIds,
        heuristicCodes: input.heuristicCodes,
      });
      if (validated.clusters.length === 0) {
        throw new Error("The model proposed nothing usable for these findings");
      }

      const { error: insertError } = await supabase.from("ai_suggestions").insert({
        inspection_id: input.inspectionId,
        kind: "merge",
        payload: validated,
        model: model ?? null,
        requested_by: (await supabase.auth.getUser()).data.user?.id,
      });
      if (insertError) throw insertError;
      return validated;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: key(v.inspectionId) }),
  });
}

/** Accept one proposed grouping: the same rows a person would create, marked. */
export function useAcceptCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      inspectionId: string;
      cluster: MergeCluster;
      heuristicIdByCode: Record<string, string>;
    }) => {
      const { data, error } = await supabase
        .from("inspection_problems")
        .insert({
          inspection_id: input.inspectionId,
          title: input.cluster.title,
          agreed_severity: input.cluster.severity,
          heuristic_id: input.cluster.heuristicCode
            ? (input.heuristicIdByCode[input.cluster.heuristicCode] ?? null)
            : null,
          assisted: true,
        })
        .select()
        .single();
      if (error) throw error;

      const { error: attachError } = await supabase
        .from("inspection_findings")
        .update({ problem_id: data.id })
        .in("id", input.cluster.findingIds);
      if (attachError) throw attachError;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["inspection", v.inspectionId] });
      qc.invalidateQueries({ queryKey: key(v.inspectionId) });
    },
  });
}

export function useResolveSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      inspectionId: string;
      id: string;
      status: "accepted" | "dismissed";
    }) => {
      const { error } = await supabase
        .from("ai_suggestions")
        .update({ status: input.status })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: key(v.inspectionId) }),
  });
}
