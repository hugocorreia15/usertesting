import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  Template,
  TemplateWithRelations,
  TemplateTask,
  TemplateErrorType,
  TemplateQuestion,
} from "@/types";

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Template[];
    },
  });
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["templates", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select(
          "*, template_tasks(*), template_error_types(*), template_questions(*)",
        )
        .eq("id", id!)
        .single();
      if (error) throw error;
      // Sort nested arrays
      const template = data as TemplateWithRelations;
      template.template_tasks.sort((a, b) => a.sort_order - b.sort_order);
      template.template_questions.sort((a, b) => a.sort_order - b.sort_order);
      return template;
    },
  });
}

interface CreateTemplateInput {
  name: string;
  description?: string;
  is_public?: boolean;
  tasks: Omit<TemplateTask, "id" | "template_id" | "created_at">[];
  error_types: Omit<TemplateErrorType, "id" | "template_id" | "created_at">[];
  questions: Omit<TemplateQuestion, "id" | "template_id" | "created_at">[];
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const userId = await getCurrentUserId();
      const { data: template, error: tErr } = await supabase
        .from("templates")
        .insert({
          name: input.name,
          description: input.description || null,
          user_id: userId,
          is_public: input.is_public ?? false,
        })
        .select()
        .single();
      if (tErr) throw tErr;

      if (input.tasks.length > 0) {
        const { error } = await supabase
          .from("template_tasks")
          .insert(
            input.tasks.map((t) => ({ ...t, template_id: template.id })),
          );
        if (error) throw error;
      }
      if (input.error_types.length > 0) {
        const { error } = await supabase
          .from("template_error_types")
          .insert(
            input.error_types.map((e) => ({ ...e, template_id: template.id })),
          );
        if (error) throw error;
      }
      if (input.questions.length > 0) {
        const { error } = await supabase
          .from("template_questions")
          .insert(
            input.questions.map((q) => ({ ...q, template_id: template.id })),
          );
        if (error) throw error;
      }
      return template as Template;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

interface UpdateTemplateInput extends CreateTemplateInput {
  id: string;
  is_public?: boolean;
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateTemplateInput) => {
      const { error: tErr } = await supabase
        .from("templates")
        .update({
          name: input.name,
          description: input.description || null,
          is_public: input.is_public ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id);
      if (tErr) throw tErr;

      // Replace all nested records
      await supabase
        .from("template_tasks")
        .delete()
        .eq("template_id", input.id);
      await supabase
        .from("template_error_types")
        .delete()
        .eq("template_id", input.id);
      await supabase
        .from("template_questions")
        .delete()
        .eq("template_id", input.id);

      if (input.tasks.length > 0) {
        const { error } = await supabase
          .from("template_tasks")
          .insert(
            input.tasks.map((t) => ({ ...t, template_id: input.id })),
          );
        if (error) throw error;
      }
      if (input.error_types.length > 0) {
        const { error } = await supabase
          .from("template_error_types")
          .insert(
            input.error_types.map((e) => ({ ...e, template_id: input.id })),
          );
        if (error) throw error;
      }
      if (input.questions.length > 0) {
        const { error } = await supabase
          .from("template_questions")
          .insert(
            input.questions.map((q) => ({ ...q, template_id: input.id })),
          );
        if (error) throw error;
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      qc.invalidateQueries({ queryKey: ["templates", vars.id] });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}
