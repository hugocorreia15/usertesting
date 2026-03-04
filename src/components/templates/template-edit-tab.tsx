import {
  TemplateForm,
  type TemplateFormData,
} from "@/components/templates/template-form";
import { useUpdateTemplate } from "@/hooks/use-templates";
import type { TemplateWithRelations } from "@/types";
import { toast } from "sonner";

interface TemplateEditTabProps {
  template: TemplateWithRelations;
}

export function TemplateEditTab({ template }: TemplateEditTabProps) {
  const updateTemplate = useUpdateTemplate();

  const handleSubmit = async (data: TemplateFormData) => {
    try {
      await updateTemplate.mutateAsync({
        id: template.id,
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
      toast.success("Template updated");
    } catch {
      toast.error("Failed to update template");
    }
  };

  return (
    <TemplateForm
      initial={template}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
    />
  );
}
