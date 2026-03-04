import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Participant } from "@/types";

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function useParticipants() {
  return useQuery({
    queryKey: ["participants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Participant[];
    },
  });
}

export function useParticipant(id: string | undefined) {
  return useQuery({
    queryKey: ["participants", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Participant;
    },
  });
}

type CreateParticipantInput = Omit<Participant, "id" | "created_at" | "user_id">;

export function useCreateParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateParticipantInput) => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from("participants")
        .insert({ ...input, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data as Participant;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["participants"] }),
  });
}

export function useUpdateParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Participant) => {
      const { id, created_at, ...updates } = input;
      const { error } = await supabase
        .from("participants")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["participants"] });
      qc.invalidateQueries({ queryKey: ["participants", vars.id] });
    },
  });
}

export function useDeleteParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["participants"] }),
  });
}
