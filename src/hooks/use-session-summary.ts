import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { validateMergeSuggestion, type MergeCluster } from "@/lib/ai-suggestions";
import type { AiSuggestion } from "@/types";

/**
 * The cross-session summary (migration 059).
 *
 * The same shape as the inspection suggestions, with observations across
 * sessions in place of findings across evaluators, so it reuses the same
 * validator. What is different is where the trust sits: the consent rule that
 * decides whether a participant's words may be sent is enforced by the
 * database, in sessions_with_participant_text_ai, and never here. This file
 * only stops an invented id from reaching a row.
 */

const key = (templateId: string) => ["session-summary", templateId] as const;

export interface SentObservation {
  id: string;
  session_id: string;
  source: "note" | "event" | "participant";
}

export function useSessionSummaries(templateId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: key(templateId ?? ""),
    enabled: !!templateId && enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_suggestions")
        .select("*")
        .eq("template_id", templateId!)
        .eq("kind", "session_summary")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AiSuggestion[];
    },
  });
}

export function useRequestSummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { templateId: string; heuristicCodes: string[] }) => {
      const { data, error } = await supabase.functions.invoke("session-summary", {
        body: { template_id: input.templateId },
      });
      if (error) {
        const detail =
          (data as { error?: string } | null)?.error ??
          (error as { message?: string }).message ??
          "The summary service is unavailable";
        throw new Error(detail);
      }

      const { raw, model, sent, participant_sessions_included, sessions_total } = (data ??
        {}) as {
        raw?: unknown;
        model?: string;
        sent?: SentObservation[];
        participant_sessions_included?: number;
        sessions_total?: number;
      };

      const observations = sent ?? [];
      const validated = validateMergeSuggestion(raw, {
        findingIds: observations.map((o) => o.id),
        heuristicCodes: input.heuristicCodes,
      });
      if (validated.clusters.length === 0) {
        throw new Error("The model proposed nothing usable for these sessions");
      }

      const { error: insertError } = await supabase.from("ai_suggestions").insert({
        template_id: input.templateId,
        kind: "session_summary",
        // The observation list goes in the payload so a team reading an old
        // proposal can still see which session each group came from.
        payload: { ...validated, observations },
        model: model ?? null,
        requested_by: (await supabase.auth.getUser()).data.user?.id,
      });
      if (insertError) throw insertError;

      return { validated, participant_sessions_included, sessions_total };
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: key(v.templateId) }),
  });
}

/** Accept one proposed problem: the rows a person would have written, marked. */
export function useAcceptSummaryCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      templateId: string;
      cluster: MergeCluster;
      observations: SentObservation[];
      heuristicIdByCode: Record<string, string>;
    }) => {
      const { data, error } = await supabase
        .from("test_problems")
        .insert({
          template_id: input.templateId,
          title: input.cluster.title,
          severity: input.cluster.severity,
          heuristic_id: input.cluster.heuristicCode
            ? (input.heuristicIdByCode[input.cluster.heuristicCode] ?? null)
            : null,
          assisted: true,
        })
        .select()
        .single();
      if (error) throw error;

      // Every session the grouping drew on becomes evidence, which is what
      // makes a problem seen in four sessions look different from one seen once.
      const sessions = [
        ...new Set(
          input.cluster.findingIds
            .map((id) => input.observations.find((o) => o.id === id)?.session_id)
            .filter((s): s is string => !!s),
        ),
      ];

      if (sessions.length > 0) {
        const { error: evidenceError } = await supabase.from("problem_evidence").insert(
          sessions.map((session_id) => ({
            template_id: input.templateId,
            test_problem_id: data.id,
            session_id,
          })),
        );
        if (evidenceError) throw evidenceError;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["synthesis", v.templateId] });
      qc.invalidateQueries({ queryKey: key(v.templateId) });
    },
  });
}

export function useResolveSummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      templateId: string;
      id: string;
      status: "accepted" | "dismissed";
    }) => {
      const { error } = await supabase
        .from("ai_suggestions")
        .update({ status: input.status })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: key(v.templateId) }),
  });
}
