import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { SessionInvitation } from "@/types";

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function useMyInvitations() {
  return useQuery({
    queryKey: ["invitations"],
    queryFn: async () => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from("session_invitations")
        .select("*, templates(name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (SessionInvitation & { templates: { name: string } })[];
    },
  });
}

interface CreateInvitationInput {
  template_id: string;
  evaluator_name: string;
  selected_task_ids: string[];
  collected_fields: string[];
  max_responses?: number;
  expires_at?: string;
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInvitationInput) => {
      const userId = await getCurrentUserId();
      const code = crypto.randomUUID().slice(0, 8);
      const { data, error } = await supabase
        .from("session_invitations")
        .insert({
          code,
          template_id: input.template_id,
          user_id: userId,
          evaluator_name: input.evaluator_name,
          selected_task_ids: input.selected_task_ids,
          collected_fields: input.collected_fields,
          max_responses: input.max_responses ?? null,
          expires_at: input.expires_at ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as SessionInvitation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invitations"] }),
  });
}

export function useInvitationByCode(code: string | undefined) {
  return useQuery({
    queryKey: ["invitations", "code", code],
    enabled: !!code,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_invitations")
        .select("*, templates(*, template_tasks(*))")
        .eq("code", code!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data as SessionInvitation & {
        templates: import("@/types").TemplateWithRelations;
      };
    },
  });
}

interface JoinSessionInput {
  invitation: SessionInvitation;
  participant: {
    name: string;
    email?: string;
    age?: number;
    gender?: string;
    occupation?: string;
    tech_proficiency?: "low" | "medium" | "high";
    notes?: string;
  };
}

export function useJoinSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: JoinSessionInput) => {
      const { invitation, participant } = input;

      const collectsName = invitation.collected_fields.includes("name");
      const isAnonymous = !collectsName;
      const participantName = collectsName
        ? participant.name
        : `Participant-${crypto.randomUUID().slice(0, 6)}`;

      // 1. Create participant under the evaluator's user_id
      const { data: newParticipant, error: pErr } = await supabase
        .from("participants")
        .insert({
          ...participant,
          name: participantName,
          user_id: invitation.user_id,
          is_anonymous: isAnonymous,
        })
        .select()
        .single();
      if (pErr) throw pErr;

      // 2. Create test session with unique join code
      const joinCode = crypto.randomUUID().slice(0, 8);
      const { data: session, error: sErr } = await supabase
        .from("test_sessions")
        .insert({
          template_id: invitation.template_id,
          participant_id: newParticipant.id,
          evaluator_name: invitation.evaluator_name,
          user_id: invitation.user_id,
          status: "planned",
          join_code: joinCode,
        })
        .select()
        .single();
      if (sErr) throw sErr;

      // 3. Create task_results skeleton from selected_task_ids
      if (invitation.selected_task_ids.length > 0) {
        const { error: trErr } = await supabase.from("task_results").insert(
          invitation.selected_task_ids.map((taskId, index) => ({
            session_id: session.id,
            task_id: taskId,
            sort_order: index,
          })),
        );
        if (trErr) throw trErr;
      }

      // 4. Create interview_answers skeleton
      const { data: questions } = await supabase
        .from("template_questions")
        .select("id")
        .eq("template_id", invitation.template_id)
        .order("sort_order");

      if (questions && questions.length > 0) {
        const { error: iaErr } = await supabase
          .from("interview_answers")
          .insert(
            questions.map((q) => ({
              session_id: session.id,
              question_id: q.id,
            })),
          );
        if (iaErr) throw iaErr;
      }

      // 5. Increment response_count and deactivate if limit reached
      const newCount = invitation.response_count + 1;
      const updates: Record<string, unknown> = { response_count: newCount };
      if (invitation.max_responses && newCount >= invitation.max_responses) {
        updates.is_active = false;
      }
      const { error: uErr } = await supabase
        .from("session_invitations")
        .update(updates)
        .eq("id", invitation.id);
      if (uErr) throw uErr;

      return session;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useDeactivateInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("session_invitations")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invitations"] }),
  });
}
