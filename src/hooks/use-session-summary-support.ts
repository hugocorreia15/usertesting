import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * The heuristic set a study's summary may choose from.
 *
 * A template carries a heuristic set so that problems found by testing can be
 * named with the same vocabulary as problems found by inspection. Without one
 * the model is told to return null rather than to invent a code.
 */
export function useHeuristicsForTemplate(templateId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["template-heuristics", templateId] as const,
    enabled: !!templateId && enabled,
    queryFn: async () => {
      const { data: template } = await supabase
        .from("templates")
        .select("heuristic_set_id")
        .eq("id", templateId!)
        .maybeSingle();
      if (!template?.heuristic_set_id) return [];

      const { data, error } = await supabase
        .from("heuristics")
        .select("id, code, name")
        .eq("set_id", template.heuristic_set_id)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as { id: string; code: string | null; name: string }[];
    },
  });
}

/**
 * The exact sentence a participant has to have been shown before anything they
 * wrote may be sent to a model. Read from the database rather than repeated
 * here, because set_participant_text_ai() checks the consent text against it
 * and two copies would eventually disagree.
 */
export function useAiConsentClause(enabled = true) {
  return useQuery({
    queryKey: ["ai-consent-clause"] as const,
    enabled,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ai_consent_clause");
      if (error) throw error;
      return data as string;
    },
  });
}

/** Turning participant text on, which the database refuses without the clause. */
export function useSetParticipantTextAi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { templateId: string; enable: boolean }) => {
      const { error } = await supabase.rpc("set_participant_text_ai", {
        tid: input.templateId,
        enable: input.enable,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["template", v.templateId] }),
  });
}

/** Append the clause to a study's consent text, leaving the rest untouched. */
export function useAppendConsentClause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { templateId: string; consentText: string; clause: string }) => {
      const next = input.consentText.trim()
        ? `${input.consentText.trim()} ${input.clause}`
        : input.clause;
      const { error } = await supabase
        .from("templates")
        .update({ consent_text: next })
        .eq("id", input.templateId);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["template", v.templateId] }),
  });
}
