// Teams / organizations (P2.7). Membership drives the additive RLS
// policies from migration 041: org templates are member-editable, org
// sessions member-readable. Invites are short secret codes accepted
// through the accept_org_invite SECURITY DEFINER RPC.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  Organization,
  OrganizationWithRelations,
  TemplateMember,
  OrgGroup,
  OrgGroupMember,
} from "@/types";

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
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: ["template-members", input.template_id] });
      qc.invalidateQueries({ queryKey: ["org-templates"] });
    },
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
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: ["template-members", input.template_id] });
      qc.invalidateQueries({ queryKey: ["org-templates"] });
    },
  });
}

// ── Org detail page data: the org's projects ("groups") ──
// One row per org-shared template with its assigned students and a
// session count. RLS shapes this per viewer: owners/members get every
// project, students only their own — the page works for both.

export interface OrgTemplateRow {
  id: string;
  name: string;
  description: string | null;
  repo_url: string | null;
  user_id: string | null;
  template_members: { template_id: string; user_id: string }[];
  test_sessions: { count: number }[];
}

export function useOrgTemplates(orgId: string | undefined) {
  return useQuery({
    queryKey: ["org-templates", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select(
          "id, name, description, repo_url, user_id, template_members(template_id, user_id), test_sessions(count)",
        )
        .eq("org_id", orgId!)
        .order("name");
      if (error) throw error;
      return data as unknown as OrgTemplateRow[];
    },
  });
}

// ── First-class org groups (migration 047) ──

export function useOrgGroups(orgId: string | undefined) {
  return useQuery({
    queryKey: ["org-groups", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_groups")
        .select("*, org_group_members(user_id, member_email)")
        .eq("org_id", orgId!)
        .order("name");
      if (error) throw error;
      return data as (OrgGroup & {
        org_group_members: { user_id: string; member_email: string | null }[];
      })[];
    },
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { org_id: string; name: string }) => {
      const { data, error } = await supabase
        .from("org_groups")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as OrgGroup;
    },
    onSuccess: (_d, input) =>
      qc.invalidateQueries({ queryKey: ["org-groups", input.org_id] }),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; org_id: string }) => {
      const { error } = await supabase
        .from("org_groups")
        .delete()
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: ["org-groups", input.org_id] });
      qc.invalidateQueries({ queryKey: ["org-templates", input.org_id] });
    },
  });
}

export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ["org-group", groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_groups")
        .select("*, org_group_members(*)")
        .eq("id", groupId!)
        .single();
      if (error) throw error;
      return data as OrgGroup & { org_group_members: OrgGroupMember[] };
    },
  });
}

export function useGroupTemplates(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group-templates", groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("id, name, description, repo_url, user_id, test_sessions(count)")
        .eq("org_group_id", groupId!)
        .order("name");
      if (error) throw error;
      return data as unknown as {
        id: string;
        name: string;
        description: string | null;
        repo_url: string | null;
        user_id: string | null;
        test_sessions: { count: number }[];
      }[];
    },
  });
}

export function useAddGroupMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      group_id: string;
      user_id: string;
      member_email: string | null;
    }) => {
      const { error } = await supabase.from("org_group_members").insert(input);
      if (error) throw error;
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: ["org-group", input.group_id] });
      qc.invalidateQueries({ queryKey: ["org-groups"] });
    },
  });
}

export function useRemoveGroupMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { group_id: string; user_id: string }) => {
      const { error } = await supabase
        .from("org_group_members")
        .delete()
        .eq("group_id", input.group_id)
        .eq("user_id", input.user_id);
      if (error) throw error;
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: ["org-group", input.group_id] });
      qc.invalidateQueries({ queryKey: ["org-groups"] });
    },
  });
}

// Attach (or detach with group_id null) a template to a group.
export function useSetTemplateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      template_id: string;
      group_id: string | null;
    }) => {
      const { data, error } = await supabase.rpc("set_template_group", {
        template_id_in: input.template_id,
        group_id_in: input.group_id,
      });
      if (error) throw error;
      if (data !== true)
        throw new Error("Could not change the template's group");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group-templates"] });
      qc.invalidateQueries({ queryKey: ["org-templates"] });
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

// Owner changes a member's role (owner/member/student).
export function useSetMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      org_id: string;
      user_id: string;
      role: "owner" | "member" | "student";
    }) => {
      const { data, error } = await supabase.rpc("set_member_role", {
        org_id_in: input.org_id,
        user_id_in: input.user_id,
        role_in: input.role,
      });
      if (error) throw error;
      if (data !== true)
        throw new Error("Could not change role (last owner cannot be demoted)");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}
