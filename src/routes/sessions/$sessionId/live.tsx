import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession, useUpdateTaskResult, useCreateErrorLog, useCreateHesitationLog, useDeleteErrorLog, useDeleteHesitationLog, useUpdateSession, useUpsertTaskQuestionAnswer, useResetTaskResult } from "@/hooks/use-sessions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { participantStillAnswering } from "@/lib/session-gating";
import { instrumentsComplete } from "@/lib/instruments";
import { setSessionContext } from "@/lib/monitoring";
import { useTemplate } from "@/hooks/use-templates";
import { useTimer } from "@/hooks/use-timer";
import { TaskNavigator } from "@/components/live/task-navigator";
import { TimerDisplay } from "@/components/live/timer-display";
import { ActionCounter } from "@/components/live/action-counter";
import { ErrorLogger } from "@/components/live/error-logger";
import { HesitationLogger } from "@/components/live/hesitation-logger";
import { SeqRating } from "@/components/live/seq-rating";
import { TaskQuestionsDialog, type TaskQuestionAnswerData } from "@/components/live/task-questions";
import { AutoEventsPanel } from "@/components/live/auto-events-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardCheck, CheckCircle2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { CompletionStatus } from "@/lib/constants";

export const Route = createFileRoute("/sessions/$sessionId/live")({
  component: LiveSessionPage,
});

type UndoEntry =
  | { kind: "action" }
  | { kind: "error"; errorTypeId: string; logId: string }
  | { kind: "hesitation"; logId: string };

function LiveSessionPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: session, isLoading } = useSession(sessionId);
  const { data: template } = useTemplate(session?.template_id);

  const updateTaskResult = useUpdateTaskResult();
  const createErrorLog = useCreateErrorLog();
  const createHesitationLog = useCreateHesitationLog();
  const deleteErrorLog = useDeleteErrorLog();
  const deleteHesitationLog = useDeleteHesitationLog();
  const updateSession = useUpdateSession();
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  // Timer state survives tab reloads/crashes, keyed per session+task.
  const timer = useTimer(`avalux-live-timer-${sessionId}-${currentTaskIndex}`);
  const [actionCount, setActionCount] = useState(0);
  const [errorCounts, setErrorCounts] = useState<Record<string, number>>({});
  const [hesitationCount, setHesitationCount] = useState(0);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [showSeq, setShowSeq] = useState(false);
  const [showTaskQuestions, setShowTaskQuestions] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<CompletionStatus | null>(null);
  const [waitingForSus, setWaitingForSus] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const upsertTaskQuestionAnswer = useUpsertTaskQuestionAnswer();
  const resetTaskResult = useResetTaskResult();

  // Keyboard shortcuts dispatch through a ref so the listener is bound
  // once; the handler body is reassigned each render below (after the
  // logging handlers are defined).
  const shortcutHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => shortcutHandler.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Monitoring context: opaque ids only (no participant data)
  useEffect(() => {
    if (session) {
      setSessionContext({
        sessionId: session.id,
        templateId: session.template_id,
        role: "evaluator",
      });
    }
  }, [session]);

  // Resume at the evaluator's persisted task pointer (once, on load)
  const hasInitIndex = useRef(false);
  useEffect(() => {
    if (session && !hasInitIndex.current) {
      hasInitIndex.current = true;
      if (typeof session.current_task_index === "number") {
        setCurrentTaskIndex(session.current_task_index);
      }
    }
  }, [session]);

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

  // Block advancing while the participant is still answering a prior
  // task's questions; poll so we notice the moment they finish.
  const blockedForParticipant = participantStillAnswering(session);

  useEffect(() => {
    if (!blockedForParticipant) return;
    const interval = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["sessions", sessionId] });
    }, 3000);
    return () => clearInterval(interval);
  }, [blockedForParticipant, qc, sessionId]);

  const prevBlocked = useRef(false);
  useEffect(() => {
    if (blockedForParticipant && !prevBlocked.current) {
      toast.info(
        "Participant is answering the previous task's questions — please wait.",
      );
    } else if (!blockedForParticipant && prevBlocked.current) {
      toast.success("Participant is ready — you can continue to the next task.");
    }
    prevBlocked.current = blockedForParticipant;
  }, [blockedForParticipant]);

  // Poll for SUS completion when waiting
  // The session finishes when SUS AND every extra instrument the
  // template administers (NASA-TLX, UEQ-S) are fully answered.
  const susCompleted =
    (session?.sus_answers?.length ?? 0) >= 10 &&
    instrumentsComplete(
      template?.instruments ?? [],
      session?.instrument_answers ?? [],
    );

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
      toast.success("Questionnaires completed! Session finished.");
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
                Waiting for the participant to complete the questionnaires...
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
    if (blockedForParticipant) return;
    timer.pause();
    setPendingStatus(status);
    setShowSeq(true);
  };

  const handleSkip = async () => {
    if (blockedForParticipant) return;
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
    updateSession.mutate({ id: sessionId, current_task_index: nextIndex });
    setActionCount(0);
    setErrorCounts({});
    setHesitationCount(0);
    setUndoStack([]);
    setPendingStatus(null);
    timer.reset();
  };

  const resetLiveCounters = () => {
    setActionCount(0);
    setErrorCounts({});
    setHesitationCount(0);
    setUndoStack([]);
    setPendingStatus(null);
    setShowSeq(false);
    setShowTaskQuestions(false);
    timer.reset();
  };

  // Go back one task. The previous task's saved result and answers
  // are preserved in the DB; only the live counters start fresh.
  const handlePrevious = () => {
    const prevIndex = Math.max(0, currentTaskIndex - 1);
    if (prevIndex === currentTaskIndex) return;
    setCurrentTaskIndex(prevIndex);
    updateSession.mutate({ id: sessionId, current_task_index: prevIndex });
    resetLiveCounters();
  };

  // Wipe the current task back to unattempted (metrics, answers, logs).
  const handleReset = async () => {
    if (currentTaskResult) {
      await resetTaskResult.mutateAsync(currentTaskResult.id);
    }
    resetLiveCounters();
    toast.success("Task reset");
  };

  const handleAction = () => {
    setActionCount((c) => c + 1);
    setUndoStack((s) => [...s, { kind: "action" }]);
  };

  const handleLogError = async (errorTypeId: string) => {
    setErrorCounts((prev) => ({
      ...prev,
      [errorTypeId]: (prev[errorTypeId] || 0) + 1,
    }));
    if (currentTaskResult) {
      try {
        const log = await createErrorLog.mutateAsync({
          task_result_id: currentTaskResult.id,
          error_type_id: errorTypeId,
          timestamp_seconds: parseFloat(timer.seconds.toFixed(1)),
          description: null,
        });
        setUndoStack((s) => [...s, { kind: "error", errorTypeId, logId: log.id }]);
      } catch {
        toast.error("Failed to log error");
      }
    }
  };

  const handleLogHesitation = async () => {
    setHesitationCount((c) => c + 1);
    if (currentTaskResult) {
      try {
        const log = await createHesitationLog.mutateAsync({
          task_result_id: currentTaskResult.id,
          timestamp_seconds: parseFloat(timer.seconds.toFixed(1)),
          note: null,
        });
        setUndoStack((s) => [...s, { kind: "hesitation", logId: log.id }]);
      } catch {
        toast.error("Failed to log hesitation");
      }
    }
  };

  const handleUndo = () => {
    const entry = undoStack[undoStack.length - 1];
    if (!entry) return;
    setUndoStack((s) => s.slice(0, -1));
    if (entry.kind === "action") {
      setActionCount((c) => Math.max(0, c - 1));
      toast.info("Action undone");
    } else if (entry.kind === "error") {
      setErrorCounts((prev) => ({
        ...prev,
        [entry.errorTypeId]: Math.max(0, (prev[entry.errorTypeId] || 0) - 1),
      }));
      deleteErrorLog.mutate(entry.logId);
      toast.info("Error undone");
    } else {
      setHesitationCount((c) => Math.max(0, c - 1));
      deleteHesitationLog.mutate(entry.logId);
      toast.info("Hesitation undone");
    }
  };

  const currentTask = currentTaskResult?.template_tasks;
  const errorTypes = template?.template_error_types ?? [];

  // Cockpit shortcuts: logging must not require looking away from the
  // participant. Disabled while typing or while any dialog is open.
  const shortcutsActive =
    !showSeq && !showTaskQuestions && !showResetConfirm && !waitingForSus;
  shortcutHandler.current = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (
      t &&
      (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
    )
      return;
    if (!shortcutsActive) return;

    const key = e.key.toLowerCase();
    if (key === "a") {
      handleAction();
    } else if (key === "h") {
      handleLogHesitation();
    } else if (key === "z" || key === "u") {
      handleUndo();
    } else if (/^[1-9]$/.test(key)) {
      const et = errorTypes[parseInt(key, 10) - 1];
      if (et) handleLogError(et.id);
    } else {
      return;
    }
    e.preventDefault();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <TaskNavigator
        tasks={taskResults.map((tr) => tr.template_tasks)}
        currentIndex={currentTaskIndex}
        onComplete={handleComplete}
        onSkip={handleSkip}
        onPrevious={handlePrevious}
        onReset={() => setShowResetConfirm(true)}
        blocked={blockedForParticipant}
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
          onIncrement={handleAction}
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

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Shortcuts: <kbd className="rounded border px-1">A</kbd> action ·{" "}
          <kbd className="rounded border px-1">1</kbd>–
          <kbd className="rounded border px-1">9</kbd> errors ·{" "}
          <kbd className="rounded border px-1">H</kbd> hesitation ·{" "}
          <kbd className="rounded border px-1">Z</kbd> undo
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={undoStack.length === 0}
          onClick={handleUndo}
        >
          <Undo2 className="mr-1 h-4 w-4" />
          Undo last{" "}
          {undoStack.length > 0 ? undoStack[undoStack.length - 1].kind : "event"}
        </Button>
      </div>

      <AutoEventsPanel
        sessionId={sessionId}
        joinCode={session.join_code}
        evaluatorActionTotal={
          taskResults.reduce((sum, tr) => sum + (tr.action_count ?? 0), 0) +
          actionCount
        }
      />

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset this task?"
        description="This permanently clears the timer, action/error/hesitation counts, SEQ rating and any answers for this task. This cannot be undone."
        confirmLabel="Reset Task"
        onConfirm={handleReset}
      />

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
