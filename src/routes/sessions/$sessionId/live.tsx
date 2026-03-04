import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useSession, useUpdateTaskResult, useCreateErrorLog, useCreateHesitationLog, useUpdateSession, useCreateSusAnswers } from "@/hooks/use-sessions";
import { useTemplate } from "@/hooks/use-templates";
import { useTimer } from "@/hooks/use-timer";
import { TaskNavigator } from "@/components/live/task-navigator";
import { TimerDisplay } from "@/components/live/timer-display";
import { ActionCounter } from "@/components/live/action-counter";
import { ErrorLogger } from "@/components/live/error-logger";
import { HesitationLogger } from "@/components/live/hesitation-logger";
import { SeqRating } from "@/components/live/seq-rating";
import { SusQuestionnaire } from "@/components/live/sus-questionnaire";
import { toast } from "sonner";
import type { CompletionStatus } from "@/lib/constants";

export const Route = createFileRoute("/sessions/$sessionId/live")({
  component: LiveSessionPage,
});

function LiveSessionPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { data: session, isLoading } = useSession(sessionId);
  const { data: template } = useTemplate(session?.template_id);

  const timer = useTimer();
  const updateTaskResult = useUpdateTaskResult();
  const createErrorLog = useCreateErrorLog();
  const createHesitationLog = useCreateHesitationLog();
  const updateSession = useUpdateSession();
  const createSusAnswers = useCreateSusAnswers();

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [actionCount, setActionCount] = useState(0);
  const [errorCounts, setErrorCounts] = useState<Record<string, number>>({});
  const [hesitationCount, setHesitationCount] = useState(0);
  const [showSeq, setShowSeq] = useState(false);
  const [showSus, setShowSus] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<CompletionStatus | null>(null);

  if (isLoading || !session || !template) {
    return <p className="p-6 text-muted-foreground">Loading session...</p>;
  }

  const tasks = template.template_tasks;
  const taskResults = session.task_results?.sort(
    (a, b) => a.template_tasks.sort_order - b.template_tasks.sort_order,
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
    advanceToNext();
  };

  const advanceToNext = () => {
    const nextIndex = currentTaskIndex + 1;
    if (nextIndex >= tasks.length) {
      // All tasks done — show SUS questionnaire before completing
      setShowSus(true);
      return;
    }
    setCurrentTaskIndex(nextIndex);
    setActionCount(0);
    setErrorCounts({});
    setHesitationCount(0);
    setPendingStatus(null);
    timer.reset();
  };

  const handleSusSubmit = async (
    answers: { question_number: number; score: number }[],
  ) => {
    setShowSus(false);
    await createSusAnswers.mutateAsync({
      session_id: sessionId,
      answers,
    });
    updateSession.mutate({
      id: sessionId,
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    toast.success("Session completed!");
    navigate({ to: "/sessions/$sessionId", params: { sessionId } });
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

  const currentTask = tasks[currentTaskIndex];

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <TaskNavigator
        tasks={tasks}
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
      <SusQuestionnaire open={showSus} onSubmit={handleSusSubmit} />
    </div>
  );
}
