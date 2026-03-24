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
      toast.success("Template updated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as any)?.message ?? "Unknown error";
      console.error("Template update failed:", err);
      toast.error(`Failed to update template: ${msg}`);
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
