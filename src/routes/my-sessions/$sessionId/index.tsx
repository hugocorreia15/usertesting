import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useParticipantSession } from "@/hooks/use-participant-sessions";
import { useUpdateInterviewAnswer, useUpsertSusAnswer } from "@/hooks/use-sessions";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SUS_QUESTIONS, SUS_SCALE_LABELS, calculateSusScore, getSusLabel } from "@/lib/sus";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  CircleDot,
  SkipForward,
  MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/my-sessions/$sessionId/")({
  component: ParticipantSessionDetail,
});

const statusIcon: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  partial: <CircleDot className="h-4 w-4 text-yellow-500" />,
  failure: <XCircle className="h-4 w-4 text-red-500" />,
  skipped: <SkipForward className="h-4 w-4 text-muted-foreground" />,
};

function ParticipantSessionDetail() {
  const { sessionId } = Route.useParams();
  const { data: session, isLoading } = useParticipantSession(sessionId);

  if (isLoading) return <p className="p-6 text-muted-foreground">Loading...</p>;
  if (!session) return <p className="p-6 text-muted-foreground">Session not found.</p>;

  const templateName = session.templates?.name ?? "Session";

  return (
    <PageWrapper title={templateName} description={`Status: ${session.status.replace("_", " ")}`}>
      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="interview">
            Interview
            {session.interview_answers?.some((a) => !a.answer_text) && (
              <span className="ml-1.5 h-2 w-2 rounded-full bg-orange-400 inline-block" />
            )}
          </TabsTrigger>
          <TabsTrigger value="sus">SUS</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <TasksTab session={session} />
        </TabsContent>

        <TabsContent value="interview" className="mt-4">
          <InterviewTab session={session} />
        </TabsContent>

        <TabsContent value="sus" className="mt-4">
          <SusTab session={session} />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}

// ── Tasks Tab (read-only) ──────────────────────────────

function TasksTab({ session }: { session: any }) {
  const tasks = session.task_results ?? [];
  const templateTasks = (session.templates as any)?.template_tasks ?? [];

  // Sort task results by template task sort_order
  const sortedTasks = [...tasks].sort((a: any, b: any) => {
    const aOrder = a.template_tasks?.sort_order ?? templateTasks.find((t: any) => t.id === a.task_id)?.sort_order ?? 0;
    const bOrder = b.template_tasks?.sort_order ?? templateTasks.find((t: any) => t.id === b.task_id)?.sort_order ?? 0;
    return aOrder - bOrder;
  });

  if (sortedTasks.length === 0) {
    return (
      <Card className="bg-transparent backdrop-blur-md">
        <CardContent className="py-8 text-center text-muted-foreground">
          No tasks assigned yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sortedTasks.map((tr: any, i: number) => {
        const task = tr.template_tasks ?? templateTasks.find((t: any) => t.id === tr.task_id);
        return (
          <Card key={tr.id} className="bg-transparent backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {tr.completion_status ? statusIcon[tr.completion_status] : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {i + 1}. {task?.name ?? "Task"}
                  </p>
                  {task?.description && (
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  )}
                  {tr.completion_status && (
                    <Badge variant="outline" className="mt-2 capitalize">
                      {tr.completion_status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Interview Tab ──────────────────────────────────────

function InterviewTab({ session }: { session: any }) {
  const answers = session.interview_answers ?? [];
  const questions = (session.templates as any)?.template_questions ?? [];
  const updateAnswer = useUpdateInterviewAnswer();

  // Match answers with questions
  const sortedQuestions = [...questions].sort((a: any, b: any) => a.sort_order - b.sort_order);

  if (sortedQuestions.length === 0) {
    return (
      <Card className="bg-transparent backdrop-blur-md">
        <CardContent className="py-8 text-center text-muted-foreground">
          No interview questions for this session.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedQuestions.map((q: any, i: number) => {
        const answer = answers.find((a: any) => a.question_id === q.id);
        return (
          <InterviewQuestionCard
            key={q.id}
            index={i + 1}
            question={q.question_text}
            answer={answer}
            onSave={async (text: string) => {
              if (!answer) return;
              await updateAnswer.mutateAsync({ id: answer.id, answer_text: text });
              toast.success("Answer saved");
            }}
          />
        );
      })}
    </div>
  );
}

function InterviewQuestionCard({
  index,
  question,
  answer,
  onSave,
}: {
  index: number;
  question: string;
  answer: any;
  onSave: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState(answer?.answer_text ?? "");
  const [saving, setSaving] = useState(false);
  const hasChanged = text !== (answer?.answer_text ?? "");

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(text);
    } catch {
      toast.error("Failed to save answer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <p className="font-medium text-sm">
            {index}. {question}
          </p>
          {!answer?.answer_text && (
            <span className="h-2 w-2 rounded-full bg-orange-400 shrink-0 mt-1.5" />
          )}
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your answer here..."
          rows={3}
        />
        {hasChanged && (
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── SUS Tab ────────────────────────────────────────────

function SusTab({ session }: { session: any }) {
  const existingAnswers = session.sus_answers ?? [];
  const susScore = calculateSusScore(existingAnswers);
  const hasSus = susScore !== null;

  if (hasSus) {
    return (
      <Card className="bg-transparent backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">SUS Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">{susScore.toFixed(1)}</div>
            <Badge variant="secondary" className="text-base">
              {getSusLabel(susScore)}
            </Badge>
          </div>
          <div className="space-y-2">
            {SUS_QUESTIONS.map((q, i) => {
              const answer = existingAnswers.find((a: any) => a.question_number === i + 1);
              return (
                <div key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground truncate flex-1">
                    {i + 1}. {q}
                  </span>
                  <Badge variant="outline">{answer?.score ?? "-"}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return <SusForm sessionId={session.id} existingAnswers={existingAnswers} />;
}

function SusForm({ sessionId, existingAnswers }: { sessionId: string; existingAnswers: any[] }) {
  const upsertSus = useUpsertSusAnswer();
  const [ratings, setRatings] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    for (const a of existingAnswers) {
      initial[a.question_number] = a.score;
    }
    return initial;
  });

  const handleRate = async (questionNumber: number, score: number) => {
    setRatings((prev) => ({ ...prev, [questionNumber]: score }));
    try {
      await upsertSus.mutateAsync({ session_id: sessionId, question_number: questionNumber, score });
    } catch {
      toast.error("Failed to save answer");
    }
  };

  const answeredCount = Object.keys(ratings).length;
  const score = answeredCount === 10 ? calculateSusScore(
    Object.entries(ratings).map(([q, s]) => ({ question_number: Number(q), score: s })),
  ) : null;

  return (
    <div className="space-y-4">
      <Card className="bg-transparent backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">System Usability Scale (SUS)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Rate your agreement with each statement (1 = Strongly Disagree, 5 = Strongly Agree).
            Your answers are saved automatically.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {SUS_QUESTIONS.map((question, i) => {
            const qNum = i + 1;
            return (
              <div key={qNum} className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">
                  {qNum}. {question}
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Button
                      key={s}
                      variant={ratings[qNum] === s ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-9 min-w-9 transition-all duration-200",
                        ratings[qNum] === s && "ring-2 ring-primary ring-offset-2",
                      )}
                      onClick={() => handleRate(qNum, s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>{SUS_SCALE_LABELS[0]}</span>
                  <span>{SUS_SCALE_LABELS[4]}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {score !== null && (
        <Card className="bg-transparent backdrop-blur-md border-green-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
            <div>
              <p className="font-medium">Questionnaire complete!</p>
              <p className="text-sm text-muted-foreground">
                Your SUS score: <span className="font-bold">{score.toFixed(1)}</span> — {getSusLabel(score)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {score === null && (
        <p className="text-sm text-muted-foreground text-center">
          {answeredCount}/10 questions answered
        </p>
      )}
    </div>
  );
}
