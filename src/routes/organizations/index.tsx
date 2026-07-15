import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import {
  useMyOrgs,
  useCreateOrg,
  useDeleteOrg,
  useCreateInvite,
  useRevokeInvite,
  useAcceptInvite,
  useRemoveMember,
} from "@/hooks/use-orgs";
import type {
  OrganizationMember,
  OrganizationWithRelations,
} from "@/types";
import {
  Check,
  Copy,
  KeyRound,
  LogOut,
  Plus,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/organizations/")({
  component: OrganizationsPage,
});

function OrganizationsPage() {
  const { user } = useAuth();
  const { data: orgs, isLoading } = useMyOrgs();
  const createOrg = useCreateOrg();
  const [createOpen, setCreateOpen] = useState(false);
  const [orgName, setOrgName] = useState("");

  const handleCreate = () => {
    const name = orgName.trim();
    if (!name) return;
    createOrg.mutate(name, {
      onSuccess: () => {
        toast.success("Organization created");
        setOrgName("");
        setCreateOpen(false);
      },
      onError: (e) => toast.error(e.message || "Failed to create organization"),
    });
  };

  return (
    <PageWrapper
      title="Organizations"
      description="Share templates, sessions and qualitative coding with your team"
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      }
    >
      {isLoading && <p className="text-muted-foreground">Loading...</p>}

      {orgs && orgs.length === 0 && (
        <EmptyState
          variant="participants"
          title="No organizations yet"
          description="Organizations let evaluators share templates, sessions and qualitative coding with their team. Create one, or join a teammate's organization with an invite code."
          action={
            <div className="flex flex-col items-center gap-3">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Organization
              </Button>
              <JoinInviteForm />
            </div>
          }
        />
      )}

      {orgs && orgs.length > 0 && (
        <>
          <JoinInviteForm />
          <div className="grid gap-4 lg:grid-cols-2">
            {orgs.map((org) => (
              <OrgCard key={org.id} org={org} userId={user?.id ?? ""} />
            ))}
          </div>
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New organization</DialogTitle>
            <DialogDescription>
              Members can share templates, sessions and coding across the team.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="space-y-4"
          >
            <Input
              autoFocus
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name"
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!orgName.trim() || createOrg.isPending}
              >
                {createOrg.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

function JoinInviteForm() {
  const acceptInvite = useAcceptInvite();
  const [code, setCode] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = code.trim();
        if (!trimmed) return;
        acceptInvite.mutate(trimmed, {
          onSuccess: () => {
            toast.success("Joined organization");
            setCode("");
          },
          onError: (e) =>
            toast.error(e.message || "Failed to join organization"),
        });
      }}
      className="flex w-full max-w-sm items-center gap-2"
    >
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Invite code"
        className="min-w-0 flex-1 font-mono"
        aria-label="Invite code"
      />
      <Button
        type="submit"
        variant="outline"
        className="shrink-0"
        disabled={!code.trim() || acceptInvite.isPending}
      >
        <KeyRound className="mr-2 h-4 w-4" />
        {acceptInvite.isPending ? "Joining..." : "Join"}
      </Button>
    </form>
  );
}

function OrgCard({
  org,
  userId,
}: {
  org: OrganizationWithRelations;
  userId: string;
}) {
  const removeMember = useRemoveMember();
  const deleteOrg = useDeleteOrg();
  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();

  const [removeTarget, setRemoveTarget] = useState<OrganizationMember | null>(
    null,
  );
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "student">("member");

  const myMembership = org.organization_members.find(
    (m) => m.user_id === userId,
  );
  const myRole = myMembership?.role ?? "member";
  // Invites are RLS-filtered to owners, so a non-empty array also means owner.
  const isOwner = myRole === "owner" || org.organization_invites.length > 0;
  const pendingInvites = org.organization_invites.filter((i) => !i.accepted_at);
  const memberCount = org.organization_members.length;

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
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="min-w-0">
          <CardTitle className="truncate text-base">{org.name}</CardTitle>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant={myRole === "owner" ? "default" : "secondary"}
            className="capitalize"
          >
            {myRole}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link to="/organizations/$orgId" params={{ orgId: org.id }}>
              Open
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
            Members
          </p>
          <ul className="space-y-1.5">
            {org.organization_members.map((m) => {
              const isMe = m.user_id === userId;
              return (
                <li
                  key={m.user_id}
                  className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-1.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {m.member_email || `${m.user_id.slice(0, 8)}…`}
                    {isMe && (
                      <span className="text-muted-foreground"> (you)</span>
                    )}
                  </span>
                  <Badge
                    variant={
                      m.role === "owner"
                        ? "default"
                        : m.role === "student"
                          ? "outline"
                          : "secondary"
                    }
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
            })}
          </ul>
        </div>

        {isOwner && (
          <div className="space-y-1.5 border-t pt-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Pending invites
            </p>
            {pendingInvites.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No pending invites
              </p>
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
              className="flex flex-wrap items-center gap-2 pt-1"
            >
              <Input
                value={inviteLabel}
                onChange={(e) => setInviteLabel(e.target.value)}
                placeholder="Label (optional)"
                className="h-8 min-w-0 flex-1 text-sm"
                aria-label="Invite label"
              />
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as "member" | "student")}
              >
                <SelectTrigger
                  size="sm"
                  aria-label="Invite role"
                  className="shrink-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member (full access)</SelectItem>
                  <SelectItem value="student">
                    Student (assigned projects only)
                  </SelectItem>
                </SelectContent>
              </Select>
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
          </div>
        )}

        {isOwner && (
          <div className="border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete organization
            </Button>
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
              onError: (e) => toast.error(e.message || "Failed to remove member"),
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
              onSuccess: () => toast.success("Left organization"),
              onError: (e) =>
                toast.error(e.message || "Failed to leave organization"),
            },
          );
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete organization"
        description={`Delete "${org.name}"? Templates shared with this organization will revert to private and members will lose shared access. This action cannot be undone.`}
        onConfirm={() => {
          deleteOrg.mutate(org.id, {
            onSuccess: () => toast.success("Organization deleted"),
            onError: (e) =>
              toast.error(e.message || "Failed to delete organization"),
          });
        }}
      />
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
