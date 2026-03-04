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
        tasks: data.tasks
          .filter((t) => t.name.trim())
          .map((t, i) => ({
            name: t.name,
            description: t.description || null,
            complexity: t.complexity,
            optimal_time_seconds: t.optimal_time_seconds
              ? parseInt(t.optimal_time_seconds)
              : null,
            optimal_actions: t.optimal_actions
              ? parseInt(t.optimal_actions)
              : null,
            sort_order: i,
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
    } catch {
      toast.error("Failed to create template");
    }
  };

  return (
    <PageWrapper title="New Template" description="Create a usability test template">
      <TemplateForm onSubmit={handleSubmit} submitLabel="Create Template" />
    </PageWrapper>
  );
}
