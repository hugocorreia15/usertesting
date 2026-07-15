// Teams / organizations (P2.7). Membership drives the additive RLS
// policies from migration 041: org templates are member-editable, org
// sessions member-readable. Invites are short secret codes accepted
// through the accept_org_invite SECURITY DEFINER RPC.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Organization, OrganizationWithRelations, TemplateMember } from "@/types";

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export function useMyOrgs() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      // RLS scopes rows: orgs I belong to, members of those orgs,
      // invites only where I am an owner.
      const { data, error } = await supabase
        .from("organizations")
        .select("*, organization_members(*), organization_invites(*)")
        .order("created_at");
      if (error) throw error;
      return data as OrganizationWithRelations[];
    },
  });
}

export function useCreateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const user = await getCurrentUser();
      const { data: org, error } = await supabase
        .from("organizations")
        .insert({ name, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      const { error: mErr } = await supabase.from("organization_members").insert({
        org_id: org.id,
        user_id: user.id,
        role: "owner",
        member_email: user.email ?? null,
      });
      if (mErr) throw mErr;
      return org as Organization;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organizations"] }),
  });
}

export function useDeleteOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      org_id: string;
      label?: string;
      role?: "member" | "student";
    }) => {
      const user = await getCurrentUser();
      const code = crypto.randomUUID().slice(0, 8);
      const { data, error } = await supabase
        .from("organization_invites")
        .insert({
          org_id: input.org_id,
          code,
          label: input.label || null,
          role: input.role ?? "member",
          invited_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organizations"] }),
  });
}

export function useRevokeInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("organization_invites")
        .delete()
        .eq("id", inviteId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organizations"] }),
  });
}

export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc("accept_org_invite", {
        invite_code: code.trim(),
      });
      if (error) throw error;
      if (data !== true) throw new Error("Invalid or already used invite code");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { org_id: string; user_id: string }) => {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("org_id", input.org_id)
        .eq("user_id", input.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

// Share / unshare a template with an org. The RPC also moves the
// template's existing sessions so historical data is shared too.
export function useSetTemplateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { template_id: string; org_id: string | null }) => {
      const { data, error } = await supabase.rpc("set_template_org", {
        template_id_in: input.template_id,
        org_id_in: input.org_id,
      });
      if (error) throw error;
      if (data !== true)
        throw new Error("Only the template creator can change sharing");
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      qc.invalidateQueries({ queryKey: ["templates", input.template_id] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

// ── Project members (student scoping, migration 042) ──
// Org owners assign 'student' members to specific templates; students
// only ever see the org templates they are assigned to.

export function useTemplateMembers(templateId: string | undefined) {
  return useQuery({
    queryKey: ["template-members", templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_members")
        .select("*")
        .eq("template_id", templateId!);
      if (error) throw error;
      return data as TemplateMember[];
    },
  });
}

export function useAssignTemplateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { template_id: string; user_id: string }) => {
      const { error } = await supabase.from("template_members").insert(input);
      if (error) throw error;
    },
    onSuccess: (_d, input) =>
      qc.invalidateQueries({ queryKey: ["template-members", input.template_id] }),
  });
}

export function useUnassignTemplateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { template_id: string; user_id: string }) => {
      const { error } = await supabase
        .from("template_members")
        .delete()
        .eq("template_id", input.template_id)
        .eq("user_id", input.user_id);
      if (error) throw error;
    },
    onSuccess: (_d, input) =>
      qc.invalidateQueries({ queryKey: ["template-members", input.template_id] }),
  });
}
