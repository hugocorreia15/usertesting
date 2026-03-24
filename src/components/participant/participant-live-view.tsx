import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MediaCapture } from "@/components/live/media-capture";
import { SusQuestionnaire } from "@/components/live/sus-questionnaire";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import {
  useParticipantLiveSession,
  useSubmitParticipantAnswers,
  useCreateParticipantSusAnswers,
  type ParticipantLiveTaskResult,
} from "@/hooks/use-participant-sessions";
import type { TaskQuestion } from "@/types";

interface ParticipantLiveViewProps {
  sessionId: string;
}

export function ParticipantLiveView({ sessionId }: ParticipantLiveViewProps) {
  const { data: session, isLoading } = useParticipantLiveSession(sessionId);
  const submitAnswers = useSubmitParticipantAnswers();
  const createSusAnswers = useCreateParticipantSusAnswers();
  const [answeredTaskIds, setAnsweredTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [susSubmitted, setSusSubmitted] = useState(false);

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center gap-2 pt-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  // Session completed — only show "done" if participant already filled SUS
  const susAlreadyDone = (session.sus_answers?.length ?? 0) > 0 || susSubmitted;
  if (session.status === "completed" && susAlreadyDone) {
    return (
      <Card className="mx-auto max-w-md bg-transparent backdrop-blur-md">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="text-lg font-medium">Session Complete</p>
          <p className="text-center text-sm text-muted-foreground">
            Thank you for participating! You can close this page.
          </p>
        </CardContent>
      </Card>
    );
  }

  const taskResults = [...(session.task_results ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const totalTasks = taskResults.length;

  // Waiting for session to start
  if (session.status === "planned") {
    return (
      <Card className="mx-auto max-w-md bg-transparent backdrop-blur-md">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <Clock className="h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="text-lg font-medium">Waiting for Evaluator</p>
          <p className="text-center text-sm text-muted-foreground">
            The evaluator hasn't started the session yet. This page will update
            automatically when they begin.
          </p>
          <p className="text-xs text-muted-foreground">
            {totalTasks} task{totalTasks !== 1 ? "s" : ""} scheduled
          </p>
        </CardContent>
      </Card>
    );
  }

  // In progress — find task needing participant answers
  const pendingTask = taskResults.find((tr) => {
    // Observer must have finished this task (has seq_rating or completion_status)
    if (!tr.completion_status) return false;
    // Skip if already answered in this session
    if (answeredTaskIds.has(tr.id)) return false;
    // Must have questions
    const questions = tr.template_tasks?.task_questions ?? [];
    if (questions.length === 0) return false;
    // Check if any questions are unanswered
    const answers = tr.task_question_answers ?? [];
    return answers.length < questions.length;
  });

  const completedByObserver = taskResults.filter(
    (tr) => tr.completion_status,
  ).length;
  const answeredByParticipant = taskResults.filter((tr) => {
    const questions = tr.template_tasks?.task_questions ?? [];
    if (questions.length === 0) return true; // no questions = nothing to do
    const answers = tr.task_question_answers ?? [];
    return answers.length >= questions.length || answeredTaskIds.has(tr.id);
  }).length;

  const handleSubmit = async (
    taskResult: ParticipantLiveTaskResult,
    answers: Record<
      string,
      {
        question_id: string;
        answer_text?: string | null;
        selected_options?: string[] | null;
        rating_value?: number | null;
        media_url?: string | null;
      }
    >,
  ) => {
    await submitAnswers.mutateAsync({
      task_result_id: taskResult.id,
      answers: Object.values(answers),
    });
    setAnsweredTaskIds((prev) => new Set(prev).add(taskResult.id));
  };

  // Only show SUS after observer has marked the session as completed
  const sessionCompleted = session.status === "completed";
  const allQuestionsAnswered = !pendingTask && sessionCompleted;
  const hasSusAnswers = (session.sus_answers?.length ?? 0) > 0 || susSubmitted;
  const shouldShowSus = allQuestionsAnswered && !hasSusAnswers;

  const handleSusSubmit = async (
    answers: { question_number: number; score: number }[],
  ) => {
    setSusSubmitted(true);
    await createSusAnswers.mutateAsync({
      session_id: sessionId,
      answers,
    });
  };

  if (!pendingTask) {
    // SUS completed — thank you screen
    if (hasSusAnswers) {
      return (
        <Card className="mx-auto max-w-md bg-transparent backdrop-blur-md">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">Thank You!</p>
            <p className="text-center text-sm text-muted-foreground">
              You have completed all tasks and the questionnaire. You can close this page.
            </p>
          </CardContent>
        </Card>
      );
    }

    // All tasks + questions done → show SUS
    if (shouldShowSus) {
      return (
        <SusQuestionnaire
          onSubmit={handleSusSubmit}
          submitting={createSusAnswers.isPending}
        />
      );
    }

    // Waiting for observer to finish more tasks
    return (
      <Card className="mx-auto max-w-md bg-transparent backdrop-blur-md">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Waiting for Next Task</p>
          <p className="text-center text-sm text-muted-foreground">
            The evaluator is working on the session. Questions will appear here
            as tasks are completed.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>
              Tasks completed: {completedByObserver}/{totalTasks}
            </span>
            <span>
              Answered: {answeredByParticipant}/{totalTasks}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show questions for the pending task
  const questions = [
    ...(pendingTask.template_tasks?.task_questions ?? []),
  ].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            Task {pendingTask.sort_order + 1} of {totalTasks}
          </p>
          <h2 className="text-xl font-semibold">
            {pendingTask.template_tasks.name}
          </h2>
          {pendingTask.template_tasks.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {pendingTask.template_tasks.description}
            </p>
          )}
        </div>
        <Badge variant="secondary">
          {completedByObserver}/{totalTasks} tasks done
        </Badge>
      </div>

      <TaskQuestionForm
        questions={questions}
        storagePath={`${session.user_id}/${session.id}/${pendingTask.id}`}
        submitting={submitAnswers.isPending}
        onSubmit={(answers) => handleSubmit(pendingTask, answers)}
      />
    </div>
  );
}

// ── Inline question form (not a dialog) ──

function TaskQuestionForm({
  questions,
  storagePath,
  submitting,
  onSubmit,
}: {
  questions: TaskQuestion[];
  storagePath: string;
  submitting: boolean;
  onSubmit: (
    answers: Record<
      string,
      {
        question_id: string;
        answer_text?: string | null;
        selected_options?: string[] | null;
        rating_value?: number | null;
        media_url?: string | null;
      }
    >,
  ) => void;
}) {
  type AnswerData = {
    question_id: string;
    answer_text?: string | null;
    selected_options?: string[] | null;
    rating_value?: number | null;
    media_url?: string | null;
  };

  const [answers, setAnswers] = useState<Record<string, AnswerData>>(() => {
    const init: Record<string, AnswerData> = {};
    for (const q of questions) {
      init[q.id] = { question_id: q.id };
    }
    return init;
  });

  const update = (
    id: string,
    data: Partial<(typeof answers)[string]>,
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...data },
    }));
  };

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-lg">Questions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {questions.map((q) => (
          <QuestionField
            key={q.id}
            question={q}
            value={answers[q.id]}
            storagePath={`${storagePath}/${q.id}`}
            onChange={(data) => update(q.id, data)}
          />
        ))}

        <div className="flex justify-end pt-2">
          <Button
            onClick={() => onSubmit(answers)}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Answers"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionField({
  question,
  value,
  storagePath,
  onChange,
}: {
  question: TaskQuestion;
  value: {
    question_id: string;
    answer_text?: string | null;
    selected_options?: string[] | null;
    rating_value?: number | null;
    media_url?: string | null;
  };
  storagePath: string;
  onChange: (data: Partial<typeof value>) => void;
}) {
  const options = (question.options as string[]) ?? [];
  const isMedia =
    question.question_type === "audio" ||
    question.question_type === "video" ||
    question.question_type === "photo";

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{question.question_text}</Label>

      {question.question_type === "open" && (
        <Textarea
          placeholder="Your answer..."
          value={value.answer_text ?? ""}
          onChange={(e) => onChange({ answer_text: e.target.value })}
          rows={2}
        />
      )}

      {question.question_type === "single_choice" && (
        <RadioGroup
          value={value.selected_options?.[0] ?? ""}
          onValueChange={(v) => onChange({ selected_options: [v] })}
        >
          {options.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <RadioGroupItem
                value={opt}
                id={`p-${question.id}-${opt}`}
              />
              <Label
                htmlFor={`p-${question.id}-${opt}`}
                className="font-normal"
              >
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {question.question_type === "multiple_choice" && (
        <div className="space-y-2">
          {options.map((opt) => {
            const selected = value.selected_options ?? [];
            const checked = selected.includes(opt);
            return (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) => {
                    const next = c
                      ? [...selected, opt]
                      : selected.filter((o) => o !== opt);
                    onChange({ selected_options: next });
                  }}
                  id={`p-${question.id}-${opt}`}
                />
                <Label
                  htmlFor={`p-${question.id}-${opt}`}
                  className="font-normal"
                >
                  {opt}
                </Label>
              </div>
            );
          })}
        </div>
      )}

      {question.question_type === "rating" && (
        <div className="flex items-center gap-2">
          {(() => {
            const min = question.rating_min ?? 1;
            const max = question.rating_max ?? 5;
            const buttons = [];
            for (let i = min; i <= max; i++) {
              buttons.push(
                <Button
                  key={i}
                  type="button"
                  variant={
                    value.rating_value === i ? "default" : "outline"
                  }
                  size="sm"
                  className="h-9 w-9"
                  onClick={() => onChange({ rating_value: i })}
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
          value={value.media_url ?? null}
          onChange={(url) => onChange({ media_url: url })}
          storagePath={storagePath}
        />
      )}
    </div>
  );
}
