import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/page-wrapper";
import {
  TemplateForm,
  type TemplateFormData,
} from "@/components/templates/template-form";
import { useCreateTemplate } from "@/hooks/use-templates";
import { toast } from "sonner";

export const Route = createFileRoute("/templates/new")({
  component: NewTemplatePage,
});

function NewTemplatePage() {
  const navigate = useNavigate();
  const createTemplate = useCreateTemplate();

  const handleSubmit = async (data: TemplateFormData) => {
    try {
      const template = await createTemplate.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        is_public: data.is_public,
        groups: data.groups.map((g, i) => ({
          id: g.key,
          name: g.name,
          sort_order: i,
        })),
        tasks: data.tasks
          .filter((t) => t.name.trim())
          .map((t, i) => ({
            id: t.key,
            group_id: t.group_key || null,
            name: t.name,
            description: t.description || null,
            optimal_time_seconds: t.optimal_time_seconds
              ? parseInt(t.optimal_time_seconds)
              : null,
            optimal_actions: t.optimal_actions
              ? parseInt(t.optimal_actions)
              : null,
            sort_order: i,
            task_questions: t.task_questions
              .filter((q) => q.question_text.trim())
              .map((q, qi) => ({
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options.length > 0 ? q.options.filter((o) => o.trim()) : null,
                rating_min: q.question_type === "rating" && q.rating_min ? parseInt(q.rating_min) : null,
                rating_max: q.question_type === "rating" && q.rating_max ? parseInt(q.rating_max) : null,
                sort_order: qi,
              })),
          })),
        error_types: data.error_types
          .filter((e) => e.code.trim() && e.label.trim())
          .map((e) => ({ code: e.code, label: e.label })),
        questions: data.questions
          .filter((q) => q.question_text.trim())
          .map((q, i) => ({ question_text: q.question_text, sort_order: i })),
      });
      toast.success("Template created");
      navigate({ to: "/templates/$templateId", params: { templateId: template.id } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as any)?.message ?? "Unknown error";
      console.error("Template create failed:", err);
      toast.error(`Failed to create template: ${msg}`);
    }
  };

  return (
    <PageWrapper title="New Template" description="Create a usability test template">
      <TemplateForm onSubmit={handleSubmit} submitLabel="Create Template" />
    </PageWrapper>
  );
}
