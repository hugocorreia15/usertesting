import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TaskListEditor,
  type TaskItem,
  type TaskGroupItem,
} from "@/components/templates/task-list-editor";
import {
  ErrorTypeEditor,
  type ErrorTypeItem,
} from "@/components/templates/error-type-editor";
import {
  QuestionEditor,
  type QuestionItem,
} from "@/components/templates/question-editor";
import type { TemplateWithRelations, TemplateTaskWithQuestions } from "@/types";
import { toast } from "sonner";

interface TemplateFormProps {
  initial?: TemplateWithRelations;
  onSubmit: (data: TemplateFormData) => Promise<void>;
  submitLabel: string;
}

export interface TemplateFormData {
  name: string;
  description: string;
  is_public: boolean;
  groups: TaskGroupItem[];
  tasks: TaskItem[];
  error_types: ErrorTypeItem[];
  questions: QuestionItem[];
}

export function TemplateForm({
  initial,
  onSubmit,
  submitLabel,
}: TemplateFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  // Build a group_id → group_key lookup from initial data
  const [taskGroups, setTaskGroups] = useState<TaskGroupItem[]>(() => {
    if (!initial?.task_groups) return [];
    return initial.task_groups
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((g) => ({
        key: g.id,
        name: g.name,
        sort_order: g.sort_order,
      }));
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    if (!initial?.template_tasks) return [];
    return initial.template_tasks.map((t) => {
      const twq = t as TemplateTaskWithQuestions;
      return {
        key: t.id,
        name: t.name,
        description: t.description ?? "",
        group_key: t.group_id ?? "",
        optimal_time_seconds: t.optimal_time_seconds?.toString() ?? "",
        optimal_actions: t.optimal_actions?.toString() ?? "",
        sort_order: t.sort_order,
        task_questions: (twq.task_questions ?? [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((q) => ({
            key: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: (q.options as string[]) ?? [],
            rating_min: q.rating_min?.toString() ?? "1",
            rating_max: q.rating_max?.toString() ?? "5",
            sort_order: q.sort_order,
          })),
      };
    });
  });

  const [errorTypes, setErrorTypes] = useState<ErrorTypeItem[]>(
    initial?.template_error_types.map((e) => ({
      key: e.id,
      code: e.code,
      label: e.label,
    })) ?? [],
  );
  const [questions, setQuestions] = useState<QuestionItem[]>(
    initial?.template_questions.map((q) => ({
      key: q.id,
      question_text: q.question_text,
      sort_order: q.sort_order,
    })) ?? [],
  );
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        name,
        description,
        is_public: isPublic,
        groups: taskGroups,
        tasks,
        error_types: errorTypes,
        questions,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-transparent backdrop-blur-md">
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. E-commerce Checkout Test"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this test"
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div className="space-y-0.5">
              <Label htmlFor="is_public">Visibility</Label>
              <p className="text-sm text-muted-foreground">
                {isPublic ? "Anyone can view this template" : "Only you can view this template"}
              </p>
            </div>
            <Button
              id="is_public"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPublic(!isPublic)}
            >
              <Badge variant={isPublic ? "default" : "outline"} className="pointer-events-none">
                {isPublic ? "Public" : "Private"}
              </Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-transparent backdrop-blur-md">
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskListEditor
            groups={taskGroups}
            onGroupsChange={setTaskGroups}
            tasks={tasks}
            onChange={setTasks}
          />
        </CardContent>
      </Card>

      <Card className="bg-transparent backdrop-blur-md">
        <CardHeader>
          <CardTitle>Error Types</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorTypeEditor items={errorTypes} onChange={setErrorTypes} />
        </CardContent>
      </Card>

      <Card className="bg-transparent backdrop-blur-md">
        <CardHeader>
          <CardTitle>Interview Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionEditor items={questions} onChange={setQuestions} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
