import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { LEGAL_VERSION, REQUIRED_DOCUMENTS } from "@/lib/legal";

/**
 * Whether the signed-in user has accepted the current terms and privacy notice
 * (migration 061).
 *
 * The answer comes from the database rather than from this browser, because it
 * is an account-level contractual fact: signing in on another machine must not
 * ask again, and clearing local storage must not erase it.
 */
export function useLegalAcceptance(enabled: boolean) {
  return useQuery({
    queryKey: ["legal-acceptance", LEGAL_VERSION] as const,
    enabled,
    // A user who has accepted will not un-accept during a visit, and one who
    // has just accepted invalidates this explicitly.
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_accepted_legal", {
        v: LEGAL_VERSION,
      });
      if (error) throw error;
      return data as boolean;
    },
  });
}

export function useAcceptLegal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("Not signed in");

      // Both documents in one statement, so a failure cannot leave an account
      // having accepted one of the two.
      const { error } = await supabase.from("legal_acceptances").insert(
        REQUIRED_DOCUMENTS.map((document) => ({
          user_id: userId,
          document,
          version: LEGAL_VERSION,
        })),
      );
      // Accepting twice is not an error: the unique constraint means a second
      // attempt, from a second tab or a retried click, is already satisfied.
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["legal-acceptance"] }),
  });
}
