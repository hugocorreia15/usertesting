import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTemplate, useDeleteTemplate, useDuplicateTemplate } from "@/hooks/use-templates";
import { useSessionsByTemplateWithRelations, useSessionsRealtime } from "@/hooks/use-sessions";
import { exportTemplatePdf } from "@/lib/export-template-pdf";
import { exportReportPdf } from "@/lib/export-report-pdf";
import { exportDataZip, exportDataJson } from "@/lib/export-data";
import { fetchAutoEventsForSessions } from "@/hooks/use-auto-events";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplateOverviewTab } from "@/components/templates/template-overview-tab";
import { TemplateSessionsTab } from "@/components/templates/template-sessions-tab";
import { TemplateParticipantsTab } from "@/components/templates/template-participants-tab";
import { TemplateEditTab } from "@/components/templates/template-edit-tab";
import { CodeBookEditor } from "@/components/coding/code-book-editor";
import { CodeMatrix } from "@/components/coding/code-matrix";
import { Download, FileBarChart, Trash2, Plus, Database, Copy, Building2, Check } from "lucide-react";
import { useMyOrgs, useSetTemplateOrg } from "@/hooks/use-orgs";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/templates/$templateId/")({
  component: TemplateDetailPage,
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: (search.tab as string) || undefined,
  }),
});

function TemplateDetailPage() {
  const { templateId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const { data: template, isLoading: templateLoading } =
    useTemplate(templateId);
  const { data: sessions, isLoading: sessionsLoading } =
    useSessionsByTemplateWithRelations(templateId);
  useSessionsRealtime();
  const deleteTemplate = useDeleteTemplate();
  const { user } = useAuth();
  const { data: orgs } = useMyOrgs();
  const setTemplateOrg = useSetTemplateOrg();
  const duplicateTemplate = useDuplicateTemplate();

  const [exportingReport, setExportingReport] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExportReport = async () => {
    if (!template || !sessions || sessions.length === 0) {
      toast.info("No sessions to export");
      return;
    }
    setExportingReport(true);
    try {
      exportReportPdf(template, sessions);
    } catch {
      toast.error("Failed to export report");
    } finally {
      setExportingReport(false);
    }
  };

  const handleExportData = async (format: "csv" | "json") => {
    if (!template || !sessions || sessions.length === 0) {
      toast.info("No sessions to export");
      return;
    }
    try {
      const autoEvents = await fetchAutoEventsForSessions(
        sessions.map((s) => s.id),
      ).catch(() => []);
      if (format === "csv") exportDataZip(template, sessions, autoEvents);
      else exportDataJson(template, sessions, autoEvents);
    } catch {
      toast.error("Failed to export data");
    }
  };

  if (templateLoading)
    return <p className="p-6 text-muted-foreground">Loading...</p>;
  if (!template)
    return <p className="p-6 text-muted-foreground">Template not found.</p>;

  const sessionCount = sessions?.length ?? 0;
  const uniqueParticipantCount = sessions
    ? new Set(sessions.map((s) => s.participant_id)).size
    : 0;

  return (
    <PageWrapper
      title={template.name}
      description={template.description || undefined}
      actions={
        <>
          {user?.id === template.user_id && (orgs?.length ?? 0) > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Building2 className="mr-2 h-4 w-4" />
                  {orgs?.find((o) => o.id === template.org_id)?.name ??
                    "Not shared"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    setTemplateOrg.mutate(
                      { template_id: templateId, org_id: null },
                      {
                        onSuccess: () => toast.success("Template is private"),
                        onError: (e) => toast.error(e.message),
                      },
                    )
                  }
                >
                  {!template.org_id && <Check className="mr-2 h-4 w-4" />}
                  Not shared (only me)
                </DropdownMenuItem>
                {orgs?.map((o) => (
                  <DropdownMenuItem
                    key={o.id}
                    onClick={() =>
                      setTemplateOrg.mutate(
                        { template_id: templateId, org_id: o.id },
                        {
                          onSuccess: () =>
                            toast.success(`Shared with ${o.name}`),
                          onError: (e) => toast.error(e.message),
                        },
                      )
                    }
                  >
                    {template.org_id === o.id && (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    {o.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="outline"
            disabled={duplicateTemplate.isPending}
            onClick={() =>
              duplicateTemplate.mutate(templateId, {
                onSuccess: (newId) => {
                  toast.success("Template duplicated");
                  navigate({
                    to: "/templates/$templateId",
                    params: { templateId: newId },
                  });
                },
                onError: () => toast.error("Failed to duplicate template"),
              })
            }
          >
            <Copy className="mr-2 h-4 w-4" />
            {duplicateTemplate.isPending ? "Duplicating..." : "Duplicate"}
          </Button>
          <Button
            variant="outline"
            onClick={() => exportTemplatePdf(template)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            disabled={exportingReport}
            onClick={handleExportReport}
          >
            <FileBarChart className="mr-2 h-4 w-4" />
            {exportingReport ? "Exporting..." : "Export Report"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Database className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportData("csv")}>
                CSV tables (.zip)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportData("json")}>
                JSON (single file)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    >
      <Tabs defaultValue={tab || "overview"}>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <TabsList className="!h-auto w-full flex-wrap justify-start gap-1 p-1.5 sm:w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">
              Sessions ({sessionCount})
            </TabsTrigger>
            <TabsTrigger value="participants">
              Participants ({uniqueParticipantCount})
            </TabsTrigger>
            <TabsTrigger value="coding">Coding</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link
                to="/sessions/new"
                search={{ templateId }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Session
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-destructive hover:text-white hover:border-destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="mt-6">
          <TemplateOverviewTab templateId={templateId} />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          {sessionsLoading ? (
            <p className="text-muted-foreground">Loading sessions...</p>
          ) : (
            <TemplateSessionsTab sessions={sessions ?? []} />
          )}
        </TabsContent>

        <TabsContent value="participants" className="mt-6">
          {sessionsLoading ? (
            <p className="text-muted-foreground">Loading participants...</p>
          ) : (
            <TemplateParticipantsTab sessions={sessions ?? []} />
          )}
        </TabsContent>

        <TabsContent value="coding" className="mt-6 space-y-6">
          <CodeBookEditor templateId={templateId} />
          {sessionsLoading ? (
            <p className="text-muted-foreground">Loading sessions...</p>
          ) : (
            <CodeMatrix
              codes={template.template_codes ?? []}
              sessions={sessions ?? []}
            />
          )}
        </TabsContent>

        <TabsContent value="edit" className="mt-6">
          <TemplateEditTab template={template} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete template"
        description={`Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
        onConfirm={() => {
          deleteTemplate.mutate(templateId, {
            onSuccess: () => {
              toast.success("Template deleted");
              navigate({ to: "/templates" });
            },
            onError: () => toast.error("Failed to delete template"),
          });
        }}
      />
    </PageWrapper>
  );
}
