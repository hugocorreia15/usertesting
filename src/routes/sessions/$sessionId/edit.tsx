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
import {
  useSession,
  useUpdateTaskResult,
  useUpdateInterviewAnswer,
  useUpdateSession,
  useUpsertSusAnswer,
} from "@/hooks/use-sessions";
import { COMPLETION_STATUS, SEQ_SCALE } from "@/lib/constants";
import { SUS_QUESTIONS } from "@/lib/sus";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Save } from "lucide-react";

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

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  if (isLoading) return <p className="p-6 text-muted-foreground">Loading...</p>;
  if (!session) return <p className="p-6 text-muted-foreground">Session not found.</p>;

  const taskResults = session.task_results?.sort(
    (a, b) => a.template_tasks.sort_order - b.template_tasks.sort_order,
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
}: {
  index: number;
  taskResult: any;
  expanded: boolean;
  onToggle: () => void;
  onSave: (updates: any) => Promise<void>;
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
