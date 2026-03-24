import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession, useUpdateTaskResult, useCreateErrorLog, useCreateHesitationLog, useUpdateSession, useUpsertTaskQuestionAnswer } from "@/hooks/use-sessions";
import { useTemplate } from "@/hooks/use-templates";
import { useTimer } from "@/hooks/use-timer";
import { TaskNavigator } from "@/components/live/task-navigator";
import { TimerDisplay } from "@/components/live/timer-display";
import { ActionCounter } from "@/components/live/action-counter";
import { ErrorLogger } from "@/components/live/error-logger";
import { HesitationLogger } from "@/components/live/hesitation-logger";
import { SeqRating } from "@/components/live/seq-rating";
import { TaskQuestionsDialog, type TaskQuestionAnswerData } from "@/components/live/task-questions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { CompletionStatus } from "@/lib/constants";

export const Route = createFileRoute("/sessions/$sessionId/live")({
  component: LiveSessionPage,
});

function LiveSessionPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: session, isLoading } = useSession(sessionId);
  const { data: template } = useTemplate(session?.template_id);

  const timer = useTimer();
  const updateTaskResult = useUpdateTaskResult();
  const createErrorLog = useCreateErrorLog();
  const createHesitationLog = useCreateHesitationLog();
  const updateSession = useUpdateSession();
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [actionCount, setActionCount] = useState(0);
  const [errorCounts, setErrorCounts] = useState<Record<string, number>>({});
  const [hesitationCount, setHesitationCount] = useState(0);
  const [showSeq, setShowSeq] = useState(false);
  const [showTaskQuestions, setShowTaskQuestions] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<CompletionStatus | null>(null);
  const [waitingForSus, setWaitingForSus] = useState(false);
  const upsertTaskQuestionAnswer = useUpsertTaskQuestionAnswer();

  // Auto-start session when observer opens live page
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (session && session.status === "planned" && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      updateSession.mutate({
        id: session.id,
        status: "in_progress",
        started_at: new Date().toISOString(),
      });
    }
  }, [session, updateSession]);

  // Poll for SUS completion when waiting
  const susCompleted = (session?.sus_answers?.length ?? 0) >= 10;

  useEffect(() => {
    if (!waitingForSus || susCompleted) return;
    // Poll session every 3 seconds to detect SUS completion
    const interval = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["sessions", sessionId] });
    }, 3000);
    return () => clearInterval(interval);
  }, [waitingForSus, susCompleted, qc, sessionId]);

  // When SUS is completed while waiting, navigate to session detail
  useEffect(() => {
    if (waitingForSus && susCompleted) {
      toast.success("SUS questionnaire completed! Session finished.");
      navigate({ to: "/sessions/$sessionId", params: { sessionId } });
    }
  }, [waitingForSus, susCompleted, navigate, sessionId]);

  if (isLoading || !session || !template) {
    return <p className="p-6 text-muted-foreground">Loading session...</p>;
  }

  // Show waiting screen after all tasks are done
  if (waitingForSus && !susCompleted) {
    return (
      <div className="mx-auto max-w-md p-4 pt-20">
        <Card className="bg-transparent backdrop-blur-md">
          <CardContent className="flex flex-col items-center gap-5 pt-8 pb-8">
            <ClipboardCheck className="h-14 w-14 text-primary" />
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">All Tasks Completed</h2>
              <p className="text-sm text-muted-foreground">
                Waiting for the participant to complete the SUS questionnaire...
              </p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Listening for responses</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.success("Session completed!");
                navigate({ to: "/sessions/$sessionId", params: { sessionId } });
              }}
            >
              Skip waiting
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const taskResults = session.task_results?.sort(
    (a, b) => a.sort_order - b.sort_order,
  ) ?? [];

  const currentTaskResult = taskResults[currentTaskIndex];

  const handleComplete = (status: CompletionStatus) => {
    timer.pause();
    setPendingStatus(status);
    setShowSeq(true);
  };

  const handleSkip = async () => {
    timer.pause();
    if (currentTaskResult) {
      await updateTaskResult.mutateAsync({
        id: currentTaskResult.id,
        completion_status: "skipped",
        time_seconds: timer.seconds,
        action_count: actionCount,
      });
    }
    advanceToNext();
  };

  const handleSeqSelect = async (rating: number) => {
    setShowSeq(false);
    if (currentTaskResult && pendingStatus) {
      const totalErrors = Object.values(errorCounts).reduce((a, b) => a + b, 0);
      await updateTaskResult.mutateAsync({
        id: currentTaskResult.id,
        completion_status: pendingStatus,
        time_seconds: parseFloat(timer.seconds.toFixed(1)),
        action_count: actionCount,
        error_count: totalErrors,
        hesitation_count: hesitationCount,
        seq_rating: rating,
      });
    }
    // If session has a join_code, participant answers questions on their side
    if (session.join_code) {
      advanceToNext();
      return;
    }
    // Otherwise (direct mode), show task questions to the observer
    const taskQuestions = currentTaskResult?.template_tasks?.task_questions ?? [];
    if (taskQuestions.length > 0) {
      setShowTaskQuestions(true);
    } else {
      advanceToNext();
    }
  };

  const handleTaskQuestionsSubmit = async (answers: TaskQuestionAnswerData[]) => {
    setShowTaskQuestions(false);
    if (currentTaskResult) {
      for (const answer of answers) {
        await upsertTaskQuestionAnswer.mutateAsync({
          task_result_id: currentTaskResult.id,
          ...answer,
        });
      }
    }
    advanceToNext();
  };

  const advanceToNext = () => {
    const nextIndex = currentTaskIndex + 1;
    if (nextIndex >= taskResults.length) {
      // All tasks done — mark completed, wait for participant SUS
      updateSession.mutate({
        id: sessionId,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      setWaitingForSus(true);
      return;
    }
    setCurrentTaskIndex(nextIndex);
    setActionCount(0);
    setErrorCounts({});
    setHesitationCount(0);
    setPendingStatus(null);
    timer.reset();
  };

  const handleLogError = (errorTypeId: string) => {
    setErrorCounts((prev) => ({
      ...prev,
      [errorTypeId]: (prev[errorTypeId] || 0) + 1,
    }));
    if (currentTaskResult) {
      createErrorLog.mutate({
        task_result_id: currentTaskResult.id,
        error_type_id: errorTypeId,
        timestamp_seconds: parseFloat(timer.seconds.toFixed(1)),
        description: null,
      });
    }
  };

  const handleLogHesitation = () => {
    setHesitationCount((c) => c + 1);
    if (currentTaskResult) {
      createHesitationLog.mutate({
        task_result_id: currentTaskResult.id,
        timestamp_seconds: parseFloat(timer.seconds.toFixed(1)),
        note: null,
      });
    }
  };

  const currentTask = currentTaskResult?.template_tasks;

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <TaskNavigator
        tasks={taskResults.map((tr) => tr.template_tasks)}
        currentIndex={currentTaskIndex}
        onComplete={handleComplete}
        onSkip={handleSkip}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center justify-center rounded-lg border border-primary/20 bg-card p-6 glow-sm shadow-lg shadow-primary/5">
          <TimerDisplay
            seconds={timer.seconds}
            isRunning={timer.isRunning}
            onStart={timer.start}
            onPause={timer.pause}
            onReset={timer.reset}
          />
        </div>

        <ActionCounter
          count={actionCount}
          optimalActions={currentTask?.optimal_actions ?? null}
          onIncrement={() => setActionCount((c) => c + 1)}
          onDecrement={() => setActionCount((c) => Math.max(0, c - 1))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ErrorLogger
          errorTypes={template.template_error_types}
          errorCounts={errorCounts}
          onLogError={handleLogError}
        />
        <HesitationLogger
          count={hesitationCount}
          onLog={handleLogHesitation}
        />
      </div>

      <SeqRating open={showSeq} onSelect={handleSeqSelect} />
      <TaskQuestionsDialog
        open={showTaskQuestions}
        questions={currentTaskResult?.template_tasks?.task_questions ?? []}
        storagePath={`${session.user_id}/${sessionId}/${currentTaskResult?.id}`}
        onSubmit={handleTaskQuestionsSubmit}
      />
    </div>
  );
}
