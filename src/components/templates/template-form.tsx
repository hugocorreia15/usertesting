import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TaskListEditor,
  type TaskItem,
} from "@/components/templates/task-list-editor";
import {
  ErrorTypeEditor,
  type ErrorTypeItem,
} from "@/components/templates/error-type-editor";
import {
  QuestionEditor,
  type QuestionItem,
} from "@/components/templates/question-editor";
import type { TemplateWithRelations } from "@/types";
import { toast } from "sonner";

interface TemplateFormProps {
  initial?: TemplateWithRelations;
  onSubmit: (data: TemplateFormData) => Promise<void>;
  submitLabel: string;
}

export interface TemplateFormData {
  name: string;
  description: string;
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
  const [tasks, setTasks] = useState<TaskItem[]>(
    initial?.template_tasks.map((t) => ({
      key: t.id,
      name: t.name,
      description: t.description ?? "",
      complexity: t.complexity,
      optimal_time_seconds: t.optimal_time_seconds?.toString() ?? "",
      optimal_actions: t.optimal_actions?.toString() ?? "",
      sort_order: t.sort_order,
    })) ?? [],
  );
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
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ name, description, tasks, error_types: errorTypes, questions });
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
        </CardContent>
      </Card>

      <Card className="bg-transparent backdrop-blur-md">
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskListEditor tasks={tasks} onChange={setTasks} />
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
