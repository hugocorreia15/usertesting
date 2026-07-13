import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Participant, TemplateParticipantField } from "@/types";
import { useAuth } from "@/hooks/use-auth";

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
        .eq("is_anonymous", false)
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

type CreateParticipantInput = Omit<Participant, "id" | "created_at" | "user_id" | "auth_user_id" | "is_anonymous">;

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

// ── Template-defined custom participant fields ──

export interface ParticipantFieldGroup {
  template_id: string;
  template_name: string;
  fields: TemplateParticipantField[];
}

export interface ParticipantCustomFieldsData {
  groups: ParticipantFieldGroup[];
  values: Record<string, string>;
}

export function useParticipantCustomFields(participantId: string | undefined) {
  return useQuery({
    queryKey: ["participant-custom-fields", participantId],
    enabled: !!participantId,
    queryFn: async (): Promise<ParticipantCustomFieldsData> => {
      const { data: sessions } = await supabase
        .from("test_sessions")
        .select("template_id, templates(id, name)")
        .eq("participant_id", participantId!);

      const names = new Map<string, string>();
      for (const s of sessions ?? []) {
        const rel = s.templates as unknown;
        const tpl = (Array.isArray(rel) ? rel[0] : rel) as
          | { id: string; name: string }
          | null
          | undefined;
        if (tpl) names.set(s.template_id, tpl.name);
      }
      const templateIds = [...names.keys()];
      if (templateIds.length === 0) return { groups: [], values: {} };

      const { data: fields } = await supabase
        .from("template_participant_fields")
        .select("*")
        .in("template_id", templateIds)
        .order("sort_order");

      const { data: values } = await supabase
        .from("participant_field_values")
        .select("*")
        .eq("participant_id", participantId!);

      const valueMap: Record<string, string> = {};
      for (const v of values ?? []) valueMap[v.field_id] = v.value ?? "";

      const groups: ParticipantFieldGroup[] = templateIds
        .map((tid) => ({
          template_id: tid,
          template_name: names.get(tid)!,
          fields: ((fields ?? []) as TemplateParticipantField[]).filter(
            (f) => f.template_id === tid,
          ),
        }))
        .filter((g) => g.fields.length > 0);

      return { groups, values: valueMap };
    },
  });
}

export function useSaveParticipantFieldValues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      participant_id: string;
      values: { field_id: string; value: string }[];
    }) => {
      if (input.values.length === 0) return;
      const { error } = await supabase
        .from("participant_field_values")
        .upsert(
          input.values.map((v) => ({
            participant_id: input.participant_id,
            field_id: v.field_id,
            value: v.value,
          })),
          { onConflict: "participant_id,field_id" },
        );
      if (error) throw error;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({
        queryKey: ["participant-custom-fields", vars.participant_id],
      }),
  });
}

export function useInviteParticipant() {
  const qc = useQueryClient();
  const { inviteParticipant } = useAuth();
  return useMutation({
    mutationFn: async (input: { email: string; participantId: string; name: string }) => {
      return inviteParticipant(input.email, input.participantId, input.name);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["participants"] });
      qc.invalidateQueries({ queryKey: ["participants", vars.participantId] });
    },
  });
}
