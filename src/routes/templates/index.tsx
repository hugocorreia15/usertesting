import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useTemplates,
  useDeleteTemplate,
  useDuplicateTemplate,
  templateCounts,
} from "@/hooks/use-templates";
import {
  TemplateCardFacts,
  TemplateAttention,
  factsFor,
} from "@/components/templates/template-card-facts";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Pencil, Copy, FileText, Download, FileBarChart, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { exportTemplatePdf } from "@/lib/export-template-pdf";
import { exportReportPdf } from "@/lib/export-report-pdf";
import type { TemplateWithRelations, TestSessionWithRelations } from "@/types";

export const Route = createFileRoute("/templates/")({
  component: TemplatesPage,
});

/** A labelled value in the preview, so the grid reads as a table would. */
function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wider text-muted-foreground/70">{label}</p>
      <p className="truncate text-sm">{children}</p>
    </div>
  );
}

function TemplatesPage() {
  const { data: templates, isLoading } = useTemplates();
  const deleteTemplate = useDeleteTemplate();
  const duplicateTemplate = useDuplicateTemplate();
  const navigate = useNavigate();

  const handleDuplicate = (id: string) => {
    duplicateTemplate.mutate(id, {
      onSuccess: (newId) => {
        toast.success("Template duplicated");
        navigate({
          to: "/templates/$templateId",
          params: { templateId: newId },
        });
      },
      onError: () => toast.error("Failed to duplicate template"),
    });
  };
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);

  return (
    <PageWrapper help="templates"
      title="Templates"
      description="Manage your usability test templates"
      actions={
        <Button asChild>
          <Link to="/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      }
    >
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {templates && templates.length === 0 && (
        <EmptyState
          variant="templates"
          title="No templates yet"
          description="Create your first usability test template to get started with structured testing."
          action={
            <Button asChild>
              <Link to="/templates/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Link>
            </Button>
          }
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates?.map((t) => (
          <Card
            key={t.id}
            className="group relative cursor-pointer bg-transparent backdrop-blur-md transition-all duration-200 hover:bg-muted/50 hover:-translate-y-0.5"
            onClick={() => setPreviewTemplate(t)}
          >
            <CardHeader>
              <CardTitle className="text-base">{t.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {t.description || "No description"}
              </p>

              <TemplateCardFacts facts={factsFor(t, templateCounts(t))} />

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span title={`Created ${new Date(t.created_at).toLocaleString()}`}>
                  Created {new Date(t.created_at).toLocaleDateString()}
                </span>
                <span aria-hidden>·</span>
                <span>{t.is_public ? "Public" : "Private"}</span>
                {t.org_id && (
                  <>
                    <span aria-hidden>·</span>
                    <span>Shared with an organization</span>
                  </>
                )}
              </div>
            </CardContent>
            <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
              <Button tooltip="Open template"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate({
                    to: "/templates/$templateId",
                    params: { templateId: t.id },
                  });
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button tooltip="Duplicate template"
                variant="ghost"
                size="icon"
                disabled={duplicateTemplate.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicate(t.id);
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button tooltip="Delete template"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(t);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>{previewTemplate?.name}</DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Description
              </p>
              <p className="mt-1 text-sm text-foreground">
                {previewTemplate?.description || "No description"}
              </p>
            </div>
            {previewTemplate && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                    Where it has got to
                  </p>
                  <TemplateCardFacts
                    facts={factsFor(previewTemplate, templateCounts(previewTemplate))}
                  />
                  <TemplateAttention
                    facts={factsFor(previewTemplate, templateCounts(previewTemplate))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <Detail label="Consent step">
                    {previewTemplate.consent_text?.trim() ? "Set" : "None"}
                  </Detail>
                  <Detail label="Review">
                    {previewTemplate.review_mode === "off"
                      ? "Not required"
                      : `${previewTemplate.review_mode}, ${String(
                          previewTemplate.review_status,
                        ).replace(/_/g, " ")}`}
                  </Detail>
                  <Detail label="Questionnaires">
                    {previewTemplate.instruments?.length
                      ? previewTemplate.instruments.join(", ").toUpperCase()
                      : "None"}
                  </Detail>
                  <Detail label="Visibility">
                    {previewTemplate.is_public ? "Public" : "Private"}
                    {previewTemplate.org_id ? ", shared with an organization" : ""}
                  </Detail>
                  {previewTemplate.repo_url && (
                    <Detail label="Repository">
                      <a
                        href={previewTemplate.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        {previewTemplate.repo_url.replace(/^https?:\/\//, "")}
                      </a>
                    </Detail>
                  )}
                  <Detail label="Created">
                    {new Date(previewTemplate.created_at).toLocaleDateString()}
                  </Detail>
                </div>
              </>
            )}
          </div>
          <Separator />
          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setPreviewTemplate(null);
                    navigate({
                      to: "/templates/$templateId",
                      params: { templateId: previewTemplate.id },
                    });
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={exporting}
                  onClick={async () => {
                    setExporting(true);
                    try {
                      const { data, error } = await supabase
                        .from("templates")
                        .select("*, template_tasks(*), template_error_types(*), template_questions(*)")
                        .eq("id", previewTemplate.id)
                        .single();
                      if (error) throw error;
                      const full = data as TemplateWithRelations;
                      full.template_tasks.sort((a, b) => a.sort_order - b.sort_order);
                      full.template_questions.sort((a, b) => a.sort_order - b.sort_order);
                      exportTemplatePdf(full);
                    } catch {
                      toast.error("Failed to export PDF");
                    } finally {
                      setExporting(false);
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exporting ? "Exporting..." : "Export PDF"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={exportingReport}
                  onClick={async () => {
                    setExportingReport(true);
                    try {
                      // Fetch full template
                      const { data: tplData, error: tplError } = await supabase
                        .from("templates")
                        .select("*, template_tasks(*), template_error_types(*), template_questions(*)")
                        .eq("id", previewTemplate.id)
                        .single();
                      if (tplError) throw tplError;
                      const full = tplData as TemplateWithRelations;
                      full.template_tasks.sort((a, b) => a.sort_order - b.sort_order);
                      full.template_questions.sort((a, b) => a.sort_order - b.sort_order);

                      // Fetch sessions
                      const { data: sessData, error: sessError } = await supabase
                        .from("test_sessions")
                        .select(
                          "*, templates(*), participants(*), task_results(*, template_tasks(*), error_logs(*), hesitation_logs(*)), interview_answers(*), sus_answers(*)",
                        )
                        .eq("template_id", previewTemplate.id);
                      if (sessError) throw sessError;
                      const sessions = sessData as TestSessionWithRelations[];
                      if (sessions.length === 0) {
                        toast.info("No sessions to export");
                        return;
                      }
                      exportReportPdf(full, sessions);
                    } catch {
                      toast.error("Failed to export report");
                    } finally {
                      setExportingReport(false);
                    }
                  }}
                >
                  <FileBarChart className="mr-2 h-4 w-4" />
                  {exportingReport ? "Exporting..." : "Export Report"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-destructive hover:text-white hover:border-destructive"
                  onClick={() => {
                    setPreviewTemplate(null);
                    setDeleteTarget(previewTemplate);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
              <DialogClose asChild>
                <Button variant="ghost" size="sm">
                  Close
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete template"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => {
          deleteTemplate.mutate(deleteTarget.id, {
            onSuccess: () => toast.success("Template deleted"),
            onError: () => toast.error("Failed to delete template"),
          });
        }}
      />
    </PageWrapper>
  );
}
