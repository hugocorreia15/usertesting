// Read-only spectator view (P2 observer notes): mirrors a live session's
// progress for anyone with read access (org members, professor, students)
// and lets them attach timestamped observer notes. Never writes to the
// session itself — notes are a parallel qualitative record.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/hooks/use-sessions";
import {
  useObserverNotes,
  useCreateObserverNote,
  useDeleteObserverNote,
} from "@/hooks/use-observer-notes";
import { useAuth } from "@/hooks/use-auth";
import type { TaskResultWithRelations, TestSessionWithRelations } from "@/types";
import {
  Eye,
  FileText,
  CheckCircle2,
  Hourglass,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sessions/$sessionId/observe")({
  component: ObserveSessionPage,
});

// useSession() doesn't take query options, so live refresh is done by
// invalidating its exact queryKey (["sessions", id]) on a 3s interval.
function useLiveSession(sessionId: string) {
  const qc = useQueryClient();
  useEffect(() => {
    const interval = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["sessions", sessionId] });
    }, 3000);
    return () => clearInterval(interval);
  }, [qc, sessionId]);
  return useSession(sessionId);
}

const STATUS_CHIP_CLASSES: Record<string, string> = {
  success:
    "border-green-600/40 bg-green-500/10 text-green-600 dark:text-green-400",
  partial:
    "border-amber-600/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  failure: "border-red-600/40 bg-red-500/10 text-red-600 dark:text-red-400",
  skipped:
    "border-slate-500/40 bg-slate-500/10 text-slate-600 dark:text-slate-400",
  pending: "text-muted-foreground",
};

function StatusChip({
  status,
}: {
  status: TaskResultWithRelations["completion_status"];
}) {
  const key = status ?? "pending";
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", STATUS_CHIP_CLASSES[key])}
    >
      {key}
    </Badge>
  );
}

function formatNoteTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs >= 0 && diffMs < 60_000) return "just now";
  if (diffMs >= 0 && diffMs < 3_600_000)
    return `${Math.floor(diffMs / 60_000)}m ago`;
  const hm = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toDateString() === now.toDateString()
    ? hm
    : `${d.toLocaleDateString()} ${hm}`;
}

function ObserveSessionPage() {
  const { sessionId } = Route.useParams();
  const { data: session, isLoading } = useLiveSession(sessionId);

  if (isLoading)
    return <p className="p-6 text-muted-foreground">Loading...</p>;
  if (!session)
    return <p className="p-6 text-muted-foreground">Session not found.</p>;

  const taskResults =
    session.task_results
      ?.slice()
      .sort((a, b) => a.sort_order - b.sort_order) ?? [];
  const inProgress = session.status === "in_progress";

  return (
    <PageWrapper
      title={`Observing: ${session.templates.name}`}
      description={`${session.participants.name} — evaluator ${session.evaluator_name}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {session.status.replace("_", " ")}
          </Badge>
          <Button asChild variant="outline">
            <Link to="/sessions/$sessionId" params={{ sessionId }}>
              <FileText className="mr-2 h-4 w-4" />
              Session details
            </Link>
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-4 py-3 backdrop-blur-md">
        <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Spectator view — you are not affecting the session.
        </p>
      </div>

      <CurrentTaskCard session={session} taskResults={taskResults} />

      <div className="overflow-x-auto rounded-md border bg-transparent backdrop-blur-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time (s)</TableHead>
              <TableHead>Actions</TableHead>
              <TableHead>Errors</TableHead>
              <TableHead>Hesitations</TableHead>
              <TableHead>SEQ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taskResults.map((tr, i) => {
              const isCurrent = inProgress && i === session.current_task_index;
              return (
                <TableRow
                  key={tr.id}
                  className={cn(isCurrent && "bg-primary/10 hover:bg-primary/10")}
                >
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">
                    {tr.template_tasks.name}
                    {tr.template_tasks.is_practice && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        practice
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={tr.completion_status} />
                  </TableCell>
                  <TableCell>
                    {tr.time_seconds != null
                      ? Number(tr.time_seconds).toFixed(1)
                      : "—"}
                  </TableCell>
                  <TableCell>{tr.action_count ?? "—"}</TableCell>
                  <TableCell
                    className={cn(
                      tr.error_count > 0 &&
                        "font-semibold text-red-600 dark:text-red-400",
                    )}
                  >
                    {tr.error_count}
                  </TableCell>
                  <TableCell>{tr.hesitation_count}</TableCell>
                  <TableCell>{tr.seq_rating ?? "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ObserverNotesSection
        sessionId={sessionId}
        currentTaskIndex={inProgress ? session.current_task_index : null}
      />
    </PageWrapper>
  );
}

function CurrentTaskCard({
  session,
  taskResults,
}: {
  session: TestSessionWithRelations;
  taskResults: TaskResultWithRelations[];
}) {
  if (session.status === "planned") {
    return (
      <Card className="bg-transparent backdrop-blur-md">
        <CardContent className="flex items-center gap-3 py-4">
          <Hourglass className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Waiting for the session to start...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (session.status === "completed") {
    return (
      <Card className="bg-transparent backdrop-blur-md">
        <CardContent className="flex items-center gap-3 py-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-sm">This session is completed.</p>
        </CardContent>
      </Card>
    );
  }

  const current = taskResults[session.current_task_index];

  return (
    <Card className="border-primary/30 bg-transparent backdrop-blur-md">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">
            Task {session.current_task_index + 1} of {taskResults.length}
          </CardTitle>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            Live
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {current ? (
          <>
            <p className="font-medium">
              {current.template_tasks.name}
              {current.template_tasks.is_practice && (
                <Badge variant="outline" className="ml-2 text-xs">
                  practice
                </Badge>
              )}
            </p>
            {current.template_tasks.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {current.template_tasks.description}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            The evaluator is between tasks.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ObserverNotesSection({
  sessionId,
  currentTaskIndex,
}: {
  sessionId: string;
  currentTaskIndex: number | null;
}) {
  const { user } = useAuth();
  const { data: notes } = useObserverNotes(sessionId, {
    refetchInterval: 5000,
  });
  const createNote = useCreateObserverNote();
  const deleteNote = useDeleteObserverNote();
  const [draft, setDraft] = useState("");

  const handleSubmit = async () => {
    const note = draft.trim();
    if (!note) return;
    try {
      await createNote.mutateAsync({
        session_id: sessionId,
        note,
        task_index: currentTaskIndex,
      });
      setDraft("");
    } catch {
      toast.error("Failed to add note");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote.mutateAsync({ id, session_id: sessionId });
    } catch {
      toast.error("Failed to delete note");
    }
  };

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader>
        <CardTitle>Observer Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              currentTaskIndex != null
                ? `Add a note for task ${currentTaskIndex + 1}...`
                : "Add a note..."
            }
            rows={3}
          />
          <Button
            className="self-end"
            disabled={!draft.trim() || createNote.isPending}
            onClick={handleSubmit}
          >
            {createNote.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add note"
            )}
          </Button>
        </div>

        {!notes || notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No observer notes yet.
          </p>
        ) : (
          <div className="space-y-2">
            {notes.map((n) => (
              <div
                key={n.id}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate font-medium">
                      {n.author_email || `${n.author_id.slice(0, 8)}…`}
                    </span>
                    {n.task_index != null && (
                      <Badge variant="outline" className="text-xs">
                        task {n.task_index + 1}
                      </Badge>
                    )}
                    <span>{formatNoteTime(n.created_at)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{n.note}</p>
                </div>
                {user?.id === n.author_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={deleteNote.isPending}
                    onClick={() => handleDelete(n.id)}
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
