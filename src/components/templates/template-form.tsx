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
import {
  ParticipantFieldEditor,
  type ParticipantFieldItem,
} from "@/components/templates/participant-field-editor";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { INSTRUMENT_KEYS, INSTRUMENTS, SUS_KEY } from "@/lib/instruments";
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
  repo_url: string;
  is_public: boolean;
  groups: TaskGroupItem[];
  tasks: TaskItem[];
  error_types: ErrorTypeItem[];
  questions: QuestionItem[];
  participant_fields: ParticipantFieldItem[];
  instruments: string[];
}

const SECTION_IDS = [
  "basics",
  "tasks",
  "errors",
  "interview",
  "participant",
  "questionnaires",
] as const;
type SectionId = (typeof SECTION_IDS)[number];

export function TemplateForm({
  initial,
  onSubmit,
  submitLabel,
}: TemplateFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [repoUrl, setRepoUrl] = useState(initial?.repo_url ?? "");

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
        is_practice: t.is_practice ?? false,
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
  const [participantFields, setParticipantFields] = useState<
    ParticipantFieldItem[]
  >(
    [...(initial?.template_participant_fields ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((f) => ({
        key: f.id,
        label: f.label,
        field_type: f.field_type,
        options: (f.options as string[]) ?? [],
        rating_min: f.rating_min ?? 1,
        rating_max: f.rating_max ?? 5,
        sort_order: f.sort_order,
      })),
  );
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? false);
  const [instruments, setInstruments] = useState<string[]>(
    initial?.instruments ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<SectionId>("basics");

  const formData: TemplateFormData = {
    name,
    description,
    repo_url: repoUrl.trim(),
    is_public: isPublic,
    groups: taskGroups,
    tasks,
    error_types: errorTypes,
    questions,
    participant_fields: participantFields,
    instruments,
  };

  // Compared against the form as it loaded, so the save bar can say whether
  // there is anything to save. Re-baselined after a successful save.
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(formData),
  );
  const dirty = JSON.stringify(formData) !== savedSnapshot;

  const sections: { id: SectionId; label: string; count?: number }[] = [
    { id: "basics", label: "Basics" },
    { id: "tasks", label: "Tasks", count: tasks.length },
    { id: "errors", label: "Error Types", count: errorTypes.length },
    { id: "interview", label: "Interview", count: questions.length },
    {
      id: "participant",
      label: "Participant Fields",
      count: participantFields.length,
    },
    {
      id: "questionnaires",
      label: "Questionnaires",
      count: instruments.length,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      // The name lives on Basics, which may not be the open section.
      setSection("basics");
      toast.error("Template name is required");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(formData);
      setSavedSnapshot(JSON.stringify(formData));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-4">
      <Tabs
        value={section}
        onValueChange={(v) => setSection(v as SectionId)}
        className="space-y-4"
      >
        {/* Pill styling keeps this readable as sub-navigation rather than
            competing with the template's own tab row above it. */}
        <TabsList className="!h-auto w-full flex-wrap justify-start gap-1 rounded-full bg-muted/60 p-1.5">
          {sections.map((s) => (
            <TabsTrigger
              key={s.id}
              value={s.id}
              className="gap-1.5 rounded-full px-3.5 py-1.5 text-sm"
            >
              {s.label}
              {s.count !== undefined && s.count > 0 && (
                <span className="rounded-full bg-primary/10 px-1.5 text-xs font-semibold text-primary">
                  {s.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="basics">
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
              <div className="space-y-2">
                <Label htmlFor="repo_url">Repository URL (optional)</Label>
                <Input
                  id="repo_url"
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/org/project"
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="is_public">Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    {isPublic
                      ? "Anyone can view this template"
                      : "Only you can view this template"}
                  </p>
                </div>
                <Button
                  id="is_public"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPublic(!isPublic)}
                >
                  <Badge
                    variant={isPublic ? "default" : "outline"}
                    className="pointer-events-none"
                  >
                    {isPublic ? "Public" : "Private"}
                  </Badge>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
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
        </TabsContent>

        <TabsContent value="errors">
          <Card className="bg-transparent backdrop-blur-md">
            <CardHeader>
              <CardTitle>Error Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ErrorTypeEditor items={errorTypes} onChange={setErrorTypes} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interview">
          <Card className="bg-transparent backdrop-blur-md">
            <CardHeader>
              <CardTitle>Interview Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionEditor items={questions} onChange={setQuestions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participant">
          <Card className="bg-transparent backdrop-blur-md">
            <CardHeader>
              <CardTitle>Participant Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <ParticipantFieldEditor
                items={participantFields}
                onChange={setParticipantFields}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questionnaires">
          <Card className="bg-transparent backdrop-blur-md">
            <CardHeader>
              <CardTitle>Questionnaires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Standardized instruments the participant answers at the end of a
                session.
              </p>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={instruments.includes(SUS_KEY)}
                  onCheckedChange={(checked) =>
                    setInstruments((prev) =>
                      checked
                        ? [...prev, SUS_KEY]
                        : prev.filter((k) => k !== SUS_KEY),
                    )
                  }
                />
                SUS — System Usability Scale
                <span className="text-xs text-muted-foreground">
                  — perceived usability, 10 items
                </span>
              </label>
              {INSTRUMENT_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={instruments.includes(key)}
                    onCheckedChange={(checked) =>
                      setInstruments((prev) =>
                        checked ? [...prev, key] : prev.filter((k) => k !== key),
                      )
                    }
                  />
                  {INSTRUMENTS[key].name}
                  <span className="text-xs text-muted-foreground">
                    {key === "nasa_tlx"
                      ? "— perceived workload, 6 subscales"
                      : "— UX pragmatic/hedonic quality, 8 items"}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save stays reachable from every section instead of living under the
          full task list. */}
      <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-3 border-t bg-background/80 px-1 py-3 backdrop-blur-md">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {dirty ? (
            <>
              <span
                aria-hidden
                className="h-2 w-2 rounded-full bg-amber-500"
              />
              Unsaved changes
            </>
          ) : (
            "All changes saved"
          )}
        </p>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
