import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTemplate, useDeleteTemplate } from "@/hooks/use-templates";
import { useSessionsByTemplateWithRelations, useSessionsRealtime } from "@/hooks/use-sessions";
import { exportTemplatePdf } from "@/lib/export-template-pdf";
import { exportReportPdf } from "@/lib/export-report-pdf";
import { TemplateOverviewTab } from "@/components/templates/template-overview-tab";
import { TemplateSessionsTab } from "@/components/templates/template-sessions-tab";
import { TemplateParticipantsTab } from "@/components/templates/template-participants-tab";
import { TemplateEditTab } from "@/components/templates/template-edit-tab";
import { Download, FileBarChart, Trash2, Plus } from "lucide-react";
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
        </>
      }
    >
      <Tabs defaultValue={tab || "overview"}>
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">
              Sessions ({sessionCount})
            </TabsTrigger>
            <TabsTrigger value="participants">
              Participants ({uniqueParticipantCount})
            </TabsTrigger>
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
