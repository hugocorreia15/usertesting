import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TemplateReviewEvent } from "@/types";

/**
 * Review history for one template (migration 054), oldest first. Written only
 * by a database trigger, so there is nothing to mutate from the client.
 */
export function useReviewEvents(templateId: string | undefined) {
  return useQuery({
    queryKey: ["review-events", templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_review_events")
        .select("*")
        .eq("template_id", templateId!)
        .order("seq");
      if (error) throw error;
      return (data ?? []) as TemplateReviewEvent[];
    },
  });
}

export async function fetchReviewEvents(templateId: string): Promise<TemplateReviewEvent[]> {
  const { data, error } = await supabase
    .from("template_review_events")
    .select("*")
    .eq("template_id", templateId)
    .order("seq");
  if (error) throw error;
  return (data ?? []) as TemplateReviewEvent[];
}
