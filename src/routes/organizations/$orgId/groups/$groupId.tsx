import { createFileRoute, Link } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useMyOrgs } from "@/hooks/use-orgs";
import { useMyTemplates } from "@/hooks/use-templates";
import {
  useGroup,
  useGroupTemplates,
  useAddGroupMember,
  useRemoveGroupMember,
  useSetTemplateGroup,
} from "@/hooks/use-orgs";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  FolderKanban,
  Github,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/organizations/$orgId/groups/$groupId")({
  component: GroupDetailPage,
});

function displayName(email: string | null | undefined, userId: string) {
  return email || `${userId.slice(0, 8)}…`;
}

function GroupDetailPage() {
  const { orgId, groupId } = Route.useParams();
  const { user } = useAuth();
  const { data: orgs, isLoading: orgsLoading } = useMyOrgs();
  const { data: group, isLoading: groupLoading } = useGroup(groupId);
  const { data: templates } = useGroupTemplates(groupId);
  const { data: myTemplates } = useMyTemplates();

  const addMember = useAddGroupMember();
  const removeMember = useRemoveGroupMember();
  const setTemplateGroup = useSetTemplateGroup();

  if (orgsLoading || groupLoading)
    return <p className="p-6 text-muted-foreground">Loading...</p>;

  const org = orgs?.find((o) => o.id === orgId);
  if (!org || !group) {
    return (
      <div className="mx-auto max-w-lg pt-12">
        <Card className="bg-transparent backdrop-blur-md">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Group not found</p>
            <Button variant="outline" asChild>
              <Link to="/organizations">All organizations</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const myRole = org.organization_members.find(
    (m) => m.user_id === user?.id,
  )?.role;
  const isOwner = myRole === "owner" || org.organization_invites.length > 0;

  const memberIds = new Set(group.org_group_members.map((m) => m.user_id));
  const addable = org.organization_members.filter((m) => !memberIds.has(m.user_id));

  // Templates the owner may attach: their own, not already in this group.
  const attachable = (myTemplates ?? []).filter(
    (t) => t.org_group_id !== groupId,
  );

  return (
    <PageWrapper
      title={group.name}
      description={`${org.name} · ${group.org_group_members.length} members · ${templates?.length ?? 0} templates`}
      actions={
        <Button variant="outline" asChild>
          <Link to="/organizations/$orgId" params={{ orgId }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {org.name}
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Templates */}
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              <FolderKanban className="h-3.5 w-3.5" />
              Group templates
            </h2>
            {isOwner && (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Attach template
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel>Your templates</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {attachable.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">
                        No templates to attach. Create one first, then attach
                        it here.
                      </p>
                    ) : (
                      attachable.map((t) => (
                        <DropdownMenuCheckboxItem
                          key={t.id}
                          checked={false}
                          onSelect={(e) => e.preventDefault()}
                          onCheckedChange={() =>
                            setTemplateGroup.mutate(
                              { template_id: t.id, group_id: groupId },
                              {
                                onSuccess: () =>
                                  toast.success(`Attached "${t.name}"`),
                                onError: (err) => toast.error(err.message),
                              },
                            )
                          }
                        >
                          <span className="truncate">{t.name}</span>
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/templates/new">
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    New template
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {(templates?.length ?? 0) === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
              No templates in this group yet.
              {isOwner
                ? " Attach one of your templates, or create a new one and attach it."
                : ""}
            </p>
          ) : (
            <div className="space-y-2">
              {templates!.map((t) => (
                <Card key={t.id} className="bg-transparent backdrop-blur-md">
                  <CardContent className="flex flex-wrap items-center gap-2 py-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/templates/$templateId"
                        params={{ templateId: t.id }}
                        className="truncate font-medium hover:underline"
                      >
                        {t.name}
                      </Link>
                      {t.description && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {t.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {t.test_sessions?.[0]?.count ?? 0} sessions
                    </Badge>
                    {t.repo_url && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <a href={t.repo_url} target="_blank" rel="noreferrer" aria-label="Repository">
                          <Github className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <Link to="/templates/$templateId" params={{ templateId: t.id }} aria-label="Open template">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        aria-label={`Detach ${t.name}`}
                        onClick={() =>
                          setTemplateGroup.mutate(
                            { template_id: t.id, group_id: null },
                            {
                              onSuccess: () => toast.success("Detached from group"),
                              onError: (err) => toast.error(err.message),
                            },
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Members */}
        <div className="min-w-0">
          <Card className="bg-transparent backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <CardTitle className="text-base">
                Members ({group.org_group_members.length})
              </CardTitle>
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserPlus className="mr-1 h-3.5 w-3.5" />
                      Add
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Organization members</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {addable.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">
                        Everyone is already in this group.
                      </p>
                    ) : (
                      addable.map((m) => (
                        <DropdownMenuCheckboxItem
                          key={m.user_id}
                          checked={false}
                          onSelect={(e) => e.preventDefault()}
                          onCheckedChange={() =>
                            addMember.mutate(
                              {
                                group_id: groupId,
                                user_id: m.user_id,
                                member_email: m.member_email,
                              },
                              {
                                onError: () => toast.error("Failed to add"),
                              },
                            )
                          }
                        >
                          <span className="truncate">
                            {displayName(m.member_email, m.user_id)}
                            <span className="ml-1 text-xs text-muted-foreground capitalize">
                              ({m.role})
                            </span>
                          </span>
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardHeader>
            <CardContent>
              {group.org_group_members.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No members yet.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {group.org_group_members.map((m) => (
                    <li
                      key={m.user_id}
                      className="flex items-center gap-2 rounded-md border px-3 py-1.5"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {displayName(m.member_email, m.user_id)}
                      </span>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          aria-label="Remove from group"
                          onClick={() =>
                            removeMember.mutate({
                              group_id: groupId,
                              user_id: m.user_id,
                            })
                          }
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
