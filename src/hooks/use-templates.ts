import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  Template,
  TemplateWithRelations,
  TaskGroup,
  TemplateTask,
  TemplateErrorType,
  TemplateQuestion,
  TaskQuestion,
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

export function useMyTemplates() {
  return useQuery({
    queryKey: ["templates", "mine"],
    queryFn: async () => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("user_id", userId)
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
          "*, task_groups(*), template_tasks(*, task_questions(*)), template_error_types(*), template_questions(*)",
        )
        .eq("id", id!)
        .single();
      if (error) throw error;
      const template = data as TemplateWithRelations;
      template.task_groups.sort((a, b) => a.sort_order - b.sort_order);
      template.template_tasks.sort((a, b) => a.sort_order - b.sort_order);
      template.template_questions.sort((a, b) => a.sort_order - b.sort_order);
      return template;
    },
  });
}

// ── Input types ──────────────────────────────────────

interface GroupInput {
  id: string;
  name: string;
  sort_order: number;
}

type TaskQuestionInput = Omit<TaskQuestion, "id" | "task_id" | "created_at">;

interface TaskInput {
  id: string;
  group_id: string | null;
  name: string;
  description: string | null;
  optimal_time_seconds: number | null;
  optimal_actions: number | null;
  sort_order: number;
  task_questions?: TaskQuestionInput[];
}

interface CreateTemplateInput {
  name: string;
  description?: string;
  is_public?: boolean;
  groups: GroupInput[];
  tasks: TaskInput[];
  error_types: Omit<TemplateErrorType, "id" | "template_id" | "created_at">[];
  questions: Omit<TemplateQuestion, "id" | "template_id" | "created_at">[];
}

// ── Create ──────────────────────────────────────

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const userId = await getCurrentUserId();

      // 1. Insert template
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

      // 2. Insert groups
      if (input.groups.length > 0) {
        const { error } = await supabase.from("task_groups").insert(
          input.groups.map((g) => ({
            id: g.id,
            template_id: template.id,
            name: g.name,
            sort_order: g.sort_order,
          })),
        );
        if (error) throw error;
      }

      // 3. Insert tasks
      if (input.tasks.length > 0) {
        const { data: insertedTasks, error } = await supabase
          .from("template_tasks")
          .insert(
            input.tasks.map(({ task_questions, id, ...t }) => ({
              id,
              ...t,
              template_id: template.id,
            })),
          )
          .select();
        if (error) throw error;

        // 4. Insert task questions
        const allQuestions = (insertedTasks ?? []).flatMap((inserted) => {
          const source = input.tasks.find((t) => t.id === inserted.id);
          return (source?.task_questions ?? []).map((q) => ({
            ...q,
            task_id: inserted.id,
          }));
        });
        if (allQuestions.length > 0) {
          const { error: qErr } = await supabase.from("task_questions").insert(allQuestions);
          if (qErr) throw qErr;
        }
      }

      // 5. Insert error types
      if (input.error_types.length > 0) {
        const { error } = await supabase
          .from("template_error_types")
          .insert(input.error_types.map((e) => ({ ...e, template_id: template.id })));
        if (error) throw error;
      }

      // 6. Insert questions
      if (input.questions.length > 0) {
        const { error } = await supabase
          .from("template_questions")
          .insert(input.questions.map((q) => ({ ...q, template_id: template.id })));
        if (error) throw error;
      }

      return template as Template;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

// ── Update (upsert) ──────────────────────────────────────

interface UpdateTemplateInput extends CreateTemplateInput {
  id: string;
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateTemplateInput) => {
      // 1. Update template metadata
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

      // 2. Sync groups (upsert + delete removed)
      await syncGroups(input.id, input.groups);

      // 3. Sync tasks (upsert + delete removed)
      await syncTasks(input.id, input.tasks);

      // 4. Sync error types (simple delete + insert — no session references)
      await syncErrorTypes(input.id, input.error_types);

      // 5. Sync interview questions (simple delete + insert)
      await syncQuestions(input.id, input.questions);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      qc.invalidateQueries({ queryKey: ["templates", vars.id] });
    },
  });
}

async function syncGroups(templateId: string, groups: GroupInput[]) {
  if (groups.length > 0) {
    const { error } = await supabase.from("task_groups").upsert(
      groups.map((g) => ({
        id: g.id,
        template_id: templateId,
        name: g.name,
        sort_order: g.sort_order,
      })),
    );
    if (error) throw error;
  }

  // Delete groups no longer in the list
  const keepIds = groups.map((g) => g.id);
  const { data: existing } = await supabase
    .from("task_groups")
    .select("id")
    .eq("template_id", templateId);
  const toDelete = (existing ?? []).filter((g) => !keepIds.includes(g.id)).map((g) => g.id);
  if (toDelete.length > 0) {
    const { error } = await supabase.from("task_groups").delete().in("id", toDelete);
    if (error) throw error;
  }
}

async function syncTasks(templateId: string, tasks: TaskInput[]) {
  // Get existing task IDs
  const { data: existing } = await supabase
    .from("template_tasks")
    .select("id")
    .eq("template_id", templateId);
  const existingIds = new Set((existing ?? []).map((t) => t.id));

  // Separate existing vs new tasks
  const toUpdate = tasks.filter((t) => existingIds.has(t.id));
  const toInsert = tasks.filter((t) => !existingIds.has(t.id));
  const newIds = new Set(tasks.map((t) => t.id));
  const toDeleteIds = [...existingIds].filter((id) => !newIds.has(id));

  // Update existing tasks
  for (const task of toUpdate) {
    const { task_questions, id, ...fields } = task;
    const { error } = await supabase
      .from("template_tasks")
      .update({ ...fields, template_id: templateId })
      .eq("id", id);
    if (error) throw error;
  }

  // Insert new tasks
  if (toInsert.length > 0) {
    const { error } = await supabase.from("template_tasks").insert(
      toInsert.map(({ task_questions, ...t }) => ({ ...t, template_id: templateId })),
    );
    if (error) throw error;
  }

  // Delete removed tasks
  if (toDeleteIds.length > 0) {
    const { error } = await supabase.from("template_tasks").delete().in("id", toDeleteIds);
    if (error) throw error;
  }

  // Sync task questions for all tasks
  for (const task of tasks) {
    await syncTaskQuestions(task.id, task.task_questions ?? []);
  }
}

async function syncTaskQuestions(taskId: string, questions: TaskQuestionInput[]) {
  // Simple approach: delete all and reinsert for this task
  // task_question_answers has CASCADE on question_id, so this is safe
  const { error: delErr } = await supabase
    .from("task_questions")
    .delete()
    .eq("task_id", taskId);
  if (delErr) throw delErr;

  if (questions.length > 0) {
    const { error } = await supabase.from("task_questions").insert(
      questions.map((q) => ({ ...q, task_id: taskId })),
    );
    if (error) throw error;
  }
}

async function syncErrorTypes(
  templateId: string,
  errorTypes: Omit<TemplateErrorType, "id" | "template_id" | "created_at">[],
) {
  const { error: delErr } = await supabase
    .from("template_error_types")
    .delete()
    .eq("template_id", templateId);
  if (delErr) throw delErr;

  if (errorTypes.length > 0) {
    const { error } = await supabase
      .from("template_error_types")
      .insert(errorTypes.map((e) => ({ ...e, template_id: templateId })));
    if (error) throw error;
  }
}

async function syncQuestions(
  templateId: string,
  questions: Omit<TemplateQuestion, "id" | "template_id" | "created_at">[],
) {
  const { error: delErr } = await supabase
    .from("template_questions")
    .delete()
    .eq("template_id", templateId);
  if (delErr) throw delErr;

  if (questions.length > 0) {
    const { error } = await supabase
      .from("template_questions")
      .insert(questions.map((q) => ({ ...q, template_id: templateId })));
    if (error) throw error;
  }
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
