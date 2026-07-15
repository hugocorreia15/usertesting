// Organization detail (P2.7): one place showing an org's people and its
// project "groups" — a group is an org-shared template plus the students
// assigned to it. RLS shapes the data per viewer: owners/members see every
// project, students only their own, invites only reach owners.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import {
  useMyOrgs,
  useOrgTemplates,
  useAssignTemplateMember,
  useUnassignTemplateMember,
  useCreateInvite,
  useRevokeInvite,
  useRemoveMember,
  type OrgTemplateRow,
} from "@/hooks/use-orgs";
import type { OrganizationMember, OrganizationWithRelations } from "@/types";
import {
  ArrowLeft,
  Building2,
  Check,
  Copy,
  Github,
  Link2,
  LogOut,
  Plus,
  Trash2,
  UserCheck,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/organizations/$orgId")({
  component: OrgDetailPage,
});

function roleBadgeVariant(
  role: OrganizationMember["role"],
): "default" | "secondary" | "outline" {
  if (role === "owner") return "default";
  if (role === "student") return "outline";
  return "secondary";
}

function displayName(email: string | null | undefined, userId: string) {
  return email || `${userId.slice(0, 8)}…`;
}

function OrgDetailPage() {
  const { orgId } = Route.useParams();
  const { user } = useAuth();
  const { data: orgs, isLoading: orgsLoading } = useMyOrgs();
  const { data: projects, isLoading: projectsLoading } = useOrgTemplates(orgId);

  if (orgsLoading)
    return <p className="p-6 text-muted-foreground">Loading...</p>;

  const org = orgs?.find((o) => o.id === orgId);
  if (!org) {
    // Not found or not a member (RLS hides orgs I don't belong to).
    return (
      <div className="mx-auto max-w-md pt-12">
        <Card className="bg-transparent backdrop-blur-md">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Organization not found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                It may have been deleted, or you are not a member of it.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/organizations">
                <ArrowLeft className="mr-2 h-4 w-4" />
                All organizations
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userId = user?.id ?? "";
  const myRole =
    org.organization_members.find((m) => m.user_id === userId)?.role ??
    "member";
  // Invites are RLS-filtered to owners, so a non-empty array also means owner.
  const isOwner = myRole === "owner" || org.organization_invites.length > 0;

  const memberCount = org.organization_members.length;
  const projectCount = projects?.length ?? 0;

  const emailByUser = new Map(
    org.organization_members.map((m) => [m.user_id, m.member_email]),
  );
  const students = org.organization_members.filter(
    (m) => m.role === "student",
  );
  const assignedStudentIds = new Set(
    (projects ?? []).flatMap((p) =>
      p.template_members.map((tm) => tm.user_id),
    ),
  );

  return (
    <PageWrapper
      title={org.name}
      description={`${memberCount} ${memberCount === 1 ? "member" : "members"} · ${projectCount} ${projectCount === 1 ? "project" : "projects"}`}
      actions={
        <Button variant="outline" asChild>
          <Link to="/organizations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All organizations
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
            Project groups
          </h2>

          {projectsLoading && (
            <p className="text-sm text-muted-foreground">Loading projects...</p>
          )}

          {!projectsLoading && projectCount === 0 && (
            <EmptyState
              variant="templates"
              title="No project groups yet"
              description={`Projects appear here when a template is shared with ${org.name}. Open a template's detail page and share it with this organization to create a group.`}
            />
          )}

          {projects?.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              org={org}
              students={students}
              emailByUser={emailByUser}
              isOwner={isOwner}
            />
          ))}
        </div>

        <div className="min-w-0 space-y-6">
          <MembersCard
            org={org}
            userId={userId}
            isOwner={isOwner}
            showUnassigned={isOwner && !projectsLoading}
            assignedStudentIds={assignedStudentIds}
          />
          {isOwner && <InvitesCard org={org} />}
        </div>
      </div>
    </PageWrapper>
  );
}

function ProjectCard({
  project,
  org,
  students,
  emailByUser,
  isOwner,
}: {
  project: OrgTemplateRow;
  org: OrganizationWithRelations;
  students: OrganizationMember[];
  emailByUser: Map<string, string | null>;
  isOwner: boolean;
}) {
  const assignMember = useAssignTemplateMember();
  const unassignMember = useUnassignTemplateMember();

  const sessionCount = project.test_sessions?.[0]?.count ?? 0;
  const assigned = project.template_members;

  return (
    <Card data-animate-card className="bg-transparent backdrop-blur-md">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">
            <Link
              to="/templates/$templateId"
              params={{ templateId: project.id }}
              className="block truncate hover:underline"
            >
              {project.name}
            </Link>
          </CardTitle>
          {project.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {project.repo_url && (
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <a
                href={project.repo_url}
                target="_blank"
                rel="noreferrer"
                aria-label="Open repository"
              >
                {project.repo_url.includes("github") ? (
                  <Github className="h-3.5 w-3.5" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
              </a>
            </Button>
          )}
          <Badge variant="secondary" className="whitespace-nowrap">
            {sessionCount} {sessionCount === 1 ? "session" : "sessions"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
            Assigned students
          </p>
          {assigned.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No students assigned
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {assigned.map((tm) => (
                <Badge
                  key={tm.user_id}
                  variant="outline"
                  className="max-w-full font-normal"
                >
                  <span className="truncate">
                    {displayName(emailByUser.get(tm.user_id), tm.user_id)}
                  </span>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <UserCheck className="mr-2 h-4 w-4" />
                Assign students
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuLabel>
                Students assigned to this project
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {students.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  No students in {org.name} yet — invite them with a student
                  invite code first.
                </p>
              ) : (
                students.map((m) => {
                  const isAssigned = assigned.some(
                    (tm) => tm.user_id === m.user_id,
                  );
                  return (
                    <DropdownMenuCheckboxItem
                      key={m.user_id}
                      checked={isAssigned}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={() => {
                        const input = {
                          template_id: project.id,
                          user_id: m.user_id,
                        };
                        if (isAssigned)
                          unassignMember.mutate(input, {
                            onError: () => toast.error("Failed to unassign"),
                          });
                        else
                          assignMember.mutate(input, {
                            onError: () => toast.error("Failed to assign"),
                          });
                      }}
                    >
                      <span className="truncate">
                        {displayName(m.member_email, m.user_id)}
                      </span>
                    </DropdownMenuCheckboxItem>
                  );
                })
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );
}

function MembersCard({
  org,
  userId,
  isOwner,
  showUnassigned,
  assignedStudentIds,
}: {
  org: OrganizationWithRelations;
  userId: string;
  isOwner: boolean;
  showUnassigned: boolean;
  assignedStudentIds: Set<string>;
}) {
  const navigate = useNavigate();
  const removeMember = useRemoveMember();
  const [removeTarget, setRemoveTarget] = useState<OrganizationMember | null>(
    null,
  );
  const [leaveOpen, setLeaveOpen] = useState(false);

  const staff = [
    ...org.organization_members.filter((m) => m.role !== "student"),
  ].sort((a, b) => (a.role === b.role ? 0 : a.role === "owner" ? -1 : 1));
  const students = org.organization_members.filter(
    (m) => m.role === "student",
  );

  const renderRow = (m: OrganizationMember) => {
    const isMe = m.user_id === userId;
    return (
      <li
        key={m.user_id}
        className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-1.5"
      >
        <span className="min-w-0 flex-1 truncate text-sm">
          {displayName(m.member_email, m.user_id)}
          {isMe && <span className="text-muted-foreground"> (you)</span>}
        </span>
        {showUnassigned &&
          m.role === "student" &&
          !assignedStudentIds.has(m.user_id) && (
            <Badge
              variant="outline"
              className="shrink-0 border-dashed text-[10px] font-normal text-muted-foreground"
            >
              unassigned
            </Badge>
          )}
        <Badge
          variant={roleBadgeVariant(m.role)}
          className="shrink-0 capitalize text-xs"
        >
          {m.role}
        </Badge>
        {isMe ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => setLeaveOpen(true)}
          >
            <LogOut className="mr-1 h-3.5 w-3.5" />
            Leave
          </Button>
        ) : isOwner ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${m.member_email || "member"}`}
            disabled={removeMember.isPending}
            onClick={() => setRemoveTarget(m)}
          >
            <UserMinus className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </li>
    );
  };

  return (
    <Card data-animate-card className="bg-transparent backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Members ({org.organization_members.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-1.5">{staff.map(renderRow)}</ul>

        {students.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Students
            </p>
            <ul className="space-y-1.5">{students.map(renderRow)}</ul>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove member"
        description={`Remove "${removeTarget?.member_email || removeTarget?.user_id.slice(0, 8)}" from ${org.name}? They will lose access to everything shared with this organization.`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (!removeTarget) return;
          removeMember.mutate(
            { org_id: org.id, user_id: removeTarget.user_id },
            {
              onSuccess: () => toast.success("Member removed"),
              onError: (e) =>
                toast.error(e.message || "Failed to remove member"),
            },
          );
        }}
      />

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Leave organization"
        description={`Leave "${org.name}"? You will lose access to templates, sessions and coding shared with this organization.`}
        confirmLabel="Leave"
        onConfirm={() => {
          removeMember.mutate(
            { org_id: org.id, user_id: userId },
            {
              onSuccess: () => {
                toast.success("Left organization");
                navigate({ to: "/organizations" });
              },
              onError: (e) =>
                toast.error(e.message || "Failed to leave organization"),
            },
          );
        }}
      />
    </Card>
  );
}

function InvitesCard({ org }: { org: OrganizationWithRelations }) {
  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "student">("member");

  const pendingInvites = org.organization_invites.filter(
    (i) => !i.accepted_at,
  );

  const handleGenerateInvite = () => {
    createInvite.mutate(
      {
        org_id: org.id,
        label: inviteLabel.trim() || undefined,
        role: inviteRole,
      },
      {
        onSuccess: async (invite) => {
          setInviteLabel("");
          try {
            await navigator.clipboard.writeText(invite.code);
            toast.success(`Invite code ${invite.code} copied to clipboard`);
          } catch {
            toast.success(`Invite code created: ${invite.code}`);
          }
        },
        onError: (e) => toast.error(e.message || "Failed to create invite"),
      },
    );
  };

  return (
    <Card data-animate-card className="bg-transparent backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pending invites</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingInvites.length === 0 && (
          <p className="text-sm text-muted-foreground">No pending invites</p>
        )}
        {pendingInvites.map((invite) => (
          <div
            key={invite.id}
            className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-1.5"
          >
            <InviteCode code={invite.code} />
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {invite.label || ""}
            </span>
            <Badge
              variant={invite.role === "student" ? "outline" : "secondary"}
              className="shrink-0 capitalize text-xs"
            >
              {invite.role}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              aria-label="Revoke invite"
              disabled={revokeInvite.isPending}
              onClick={() =>
                revokeInvite.mutate(invite.id, {
                  onSuccess: () => toast.success("Invite revoked"),
                  onError: () => toast.error("Failed to revoke invite"),
                })
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerateInvite();
          }}
          className="flex flex-wrap items-center gap-2 border-t pt-3"
        >
          <Input
            value={inviteLabel}
            onChange={(e) => setInviteLabel(e.target.value)}
            placeholder="Label (optional)"
            className="h-8 min-w-0 flex-1 text-sm"
            aria-label="Invite label"
          />
          <select
            value={inviteRole}
            onChange={(e) =>
              setInviteRole(e.target.value as "member" | "student")
            }
            aria-label="Invite role"
            className="h-8 shrink-0 rounded-md border bg-transparent px-2 text-sm"
          >
            <option value="member">Member (full access)</option>
            <option value="student">Student (assigned projects only)</option>
          </select>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={createInvite.isPending}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            {createInvite.isPending ? "Generating..." : "Generate invite"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-1">
      <span className="truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
        {code}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        aria-label="Copy invite code"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}
