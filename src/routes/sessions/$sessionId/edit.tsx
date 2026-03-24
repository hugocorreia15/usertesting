import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  useSession,
  useUpdateTaskResult,
  useUpdateInterviewAnswer,
  useUpdateSession,
  useUpsertSusAnswer,
  useUpsertTaskQuestionAnswer,
} from "@/hooks/use-sessions";
import { COMPLETION_STATUS, SEQ_SCALE } from "@/lib/constants";
import { SUS_QUESTIONS } from "@/lib/sus";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Save } from "lucide-react";
import { MediaCapture } from "@/components/live/media-capture";
import type { TaskQuestion, TaskQuestionAnswer } from "@/types";

export const Route = createFileRoute("/sessions/$sessionId/edit")({
  component: SessionEditPage,
});

function SessionEditPage() {
  const { sessionId } = Route.useParams();
  const { data: session, isLoading } = useSession(sessionId);
  const updateTaskResult = useUpdateTaskResult();
  const updateInterviewAnswer = useUpdateInterviewAnswer();
  const updateSession = useUpdateSession();
  const upsertSusAnswer = useUpsertSusAnswer();
  const upsertTaskQuestionAnswer = useUpsertTaskQuestionAnswer();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  if (isLoading) return <p className="p-6 text-muted-foreground">Loading...</p>;
  if (!session) return <p className="p-6 text-muted-foreground">Session not found.</p>;

  const taskResults = session.task_results?.sort(
    (a, b) => a.sort_order - b.sort_order,
  ) ?? [];

  const toggle = (id: string) =>
    setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const handleSaveTask = async (
    trId: string,
    updates: {
      completion_status?: string;
      time_seconds?: number | null;
      action_count?: number | null;
      seq_rating?: number | null;
      notes?: string;
    },
  ) => {
    try {
      await updateTaskResult.mutateAsync({ id: trId, ...updates } as any);
      toast.success("Task result saved");
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await updateSession.mutateAsync({
        id: sessionId,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      toast.success("Session marked as completed");
    } catch {
      toast.error("Failed to update session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper
      title="Edit Session Data"
      description={`${session.templates.name} — ${session.participants.name}`}
      actions={
        <Button onClick={handleComplete} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          Mark Completed
        </Button>
      }
    >
      <div className="space-y-3">
        {taskResults.map((tr, i) => (
          <TaskResultEditor
            key={tr.id}
            index={i}
            taskResult={tr}
            expanded={!!expanded[tr.id]}
            onToggle={() => toggle(tr.id)}
            onSave={(updates) => handleSaveTask(tr.id, updates)}
            onSaveQuestionAnswer={(questionId, data) =>
              upsertTaskQuestionAnswer.mutateAsync({
                task_result_id: tr.id,
                question_id: questionId,
                ...data,
              })
            }
          />
        ))}
      </div>

      {session.interview_answers.length > 0 && (
        <Card className="bg-transparent backdrop-blur-md">
          <CardHeader>
            <CardTitle>Interview Answers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.interview_answers.map((a, i) => (
              <InterviewAnswerEditor
                key={a.id}
                index={i}
                answer={a}
                onSave={(text) =>
                  updateInterviewAnswer.mutateAsync({
                    id: a.id,
                    answer_text: text,
                  })
                }
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="bg-transparent backdrop-blur-md">
        <CardHeader>
          <CardTitle>SUS Questionnaire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SUS_QUESTIONS.map((question, i) => {
            const qNum = i + 1;
            const existing = session.sus_answers?.find(
              (a) => a.question_number === qNum,
            );
            return (
              <SusAnswerEditor
                key={qNum}
                questionNumber={qNum}
                questionText={question}
                currentScore={existing?.score ?? null}
                onSave={(score) =>
                  upsertSusAnswer.mutateAsync({
                    session_id: sessionId,
                    question_number: qNum,
                    score,
                  })
                }
              />
            );
          })}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}

function TaskResultEditor({
  index,
  taskResult,
  expanded,
  onToggle,
  onSave,
  onSaveQuestionAnswer,
}: {
  index: number;
  taskResult: any;
  expanded: boolean;
  onToggle: () => void;
  onSave: (updates: any) => Promise<void>;
  onSaveQuestionAnswer: (
    questionId: string,
    data: {
      answer_text?: string | null;
      selected_options?: string[] | null;
      rating_value?: number | null;
      media_url?: string | null;
    },
  ) => Promise<void>;
}) {
  const [status, setStatus] = useState(taskResult.completion_status || "");
  const [time, setTime] = useState(
    taskResult.time_seconds?.toString() ?? "",
  );
  const [actions, setActions] = useState(
    taskResult.action_count?.toString() ?? "",
  );
  const [seq, setSeq] = useState(taskResult.seq_rating?.toString() ?? "");
  const [notes, setNotes] = useState(taskResult.notes ?? "");

  const taskQuestions: TaskQuestion[] = taskResult.template_tasks?.task_questions ?? [];
  const questionAnswers: TaskQuestionAnswer[] = taskResult.task_question_answers ?? [];

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <div
        className="flex cursor-pointer items-center gap-3 p-4"
        onClick={onToggle}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className="font-medium">
          {index + 1}. {taskResult.template_tasks.name}
        </span>
        {status && (
          <span className="ml-auto text-sm capitalize text-muted-foreground">
            {status}
          </span>
        )}
      </div>
      {expanded && (
        <CardContent className="space-y-4 border-t pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {COMPLETION_STATUS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time (seconds)</Label>
              <Input
                type="number"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Actions</Label>
              <Input
                type="number"
                value={actions}
                onChange={(e) => setActions(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>SEQ (1-7)</Label>
              <Select value={seq} onValueChange={setSeq}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {SEQ_SCALE.map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {taskQuestions.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-semibold">Task Questions</Label>
              {[...taskQuestions]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((q) => (
                  <EditableQuestionAnswer
                    key={q.id}
                    question={q}
                    existing={questionAnswers.find((a) => a.question_id === q.id)}
                    storagePath={`${taskResult.session_id}/${taskResult.id}/${q.id}`}
                    onSave={(data) => onSaveQuestionAnswer(q.id, data)}
                  />
                ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() =>
                onSave({
                  completion_status: status || null,
                  time_seconds: time ? parseFloat(time) : null,
                  action_count: actions ? parseInt(actions) : null,
                  seq_rating: seq ? parseInt(seq) : null,
                  notes: notes || null,
                })
              }
            >
              Save Task
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function EditableQuestionAnswer({
  question,
  existing,
  storagePath,
  onSave,
}: {
  question: TaskQuestion;
  existing?: TaskQuestionAnswer;
  storagePath: string;
  onSave: (data: {
    answer_text?: string | null;
    selected_options?: string[] | null;
    rating_value?: number | null;
    media_url?: string | null;
  }) => Promise<void>;
}) {
  const [text, setText] = useState(existing?.answer_text ?? "");
  const [selected, setSelected] = useState<string[]>(
    (existing?.selected_options as string[]) ?? [],
  );
  const [rating, setRating] = useState<number | null>(existing?.rating_value ?? null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(existing?.media_url ?? null);
  const options = (question.options as string[]) ?? [];
  const isMedia = question.question_type === "audio" || question.question_type === "video" || question.question_type === "photo";

  const save = (data: {
    answer_text?: string | null;
    selected_options?: string[] | null;
    rating_value?: number | null;
    media_url?: string | null;
  }) => {
    onSave(data);
  };

  return (
    <div className="space-y-2 rounded-md border p-3">
      <Label className="text-sm">{question.question_text}</Label>

      {question.question_type === "open" && (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          onBlur={() => {
            if (text !== (existing?.answer_text ?? "")) {
              save({ answer_text: text });
            }
          }}
        />
      )}

      {question.question_type === "single_choice" && (
        <RadioGroup
          value={selected[0] ?? ""}
          onValueChange={(v) => {
            setSelected([v]);
            save({ selected_options: [v] });
          }}
        >
          {options.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <RadioGroupItem value={opt} id={`edit-${question.id}-${opt}`} />
              <Label htmlFor={`edit-${question.id}-${opt}`} className="font-normal text-sm">
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {question.question_type === "multiple_choice" && (
        <div className="space-y-2">
          {options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) => {
                    const next = c
                      ? [...selected, opt]
                      : selected.filter((o) => o !== opt);
                    setSelected(next);
                    save({ selected_options: next });
                  }}
                  id={`edit-${question.id}-${opt}`}
                />
                <Label htmlFor={`edit-${question.id}-${opt}`} className="font-normal text-sm">
                  {opt}
                </Label>
              </div>
            );
          })}
        </div>
      )}

      {question.question_type === "rating" && (
        <div className="flex gap-1">
          {(() => {
            const min = question.rating_min ?? 1;
            const max = question.rating_max ?? 5;
            const buttons = [];
            for (let i = min; i <= max; i++) {
              buttons.push(
                <Button
                  key={i}
                  type="button"
                  variant={rating === i ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => {
                    setRating(i);
                    save({ rating_value: i });
                  }}
                >
                  {i}
                </Button>,
              );
            }
            return buttons;
          })()}
        </div>
      )}

      {isMedia && (
        <MediaCapture
          type={question.question_type as "audio" | "video" | "photo"}
          value={mediaUrl}
          onChange={(url) => {
            setMediaUrl(url);
            save({ media_url: url });
          }}
          storagePath={storagePath}
        />
      )}
    </div>
  );
}

function InterviewAnswerEditor({
  index,
  answer,
  onSave,
}: {
  index: number;
  answer: any;
  onSave: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState(answer.answer_text ?? "");

  return (
    <div className="space-y-2">
      <Label>Question {index + 1}</Label>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        onBlur={() => {
          if (text !== (answer.answer_text ?? "")) {
            onSave(text);
          }
        }}
      />
    </div>
  );
}

function SusAnswerEditor({
  questionNumber,
  questionText,
  currentScore,
  onSave,
}: {
  questionNumber: number;
  questionText: string;
  currentScore: number | null;
  onSave: (score: number) => Promise<void>;
}) {
  const [score, setScore] = useState(currentScore?.toString() ?? "");

  return (
    <div className="flex items-center gap-4">
      <p className="flex-1 text-sm">
        <span className="font-medium">{questionNumber}.</span> {questionText}
      </p>
      <Select
        value={score}
        onValueChange={(val) => {
          setScore(val);
          onSave(parseInt(val));
        }}
      >
        <SelectTrigger className="w-20">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5].map((n) => (
            <SelectItem key={n} value={n.toString()}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
