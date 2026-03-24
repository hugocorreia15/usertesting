import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { COLORS, PIE_COLORS, CHART_TOOLTIP_STYLE } from "@/lib/chart-constants";
import { useSession, useDeleteSession } from "@/hooks/use-sessions";
import { PenLine, Play, Copy, Check, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SUS_QUESTIONS, calculateSusScore, getSusLabel } from "@/lib/sus";

export const Route = createFileRoute("/sessions/$sessionId/")({
  component: SessionDetailPage,
});

function timeColor(seconds: number | null, optimal: number | null) {
  if (seconds == null || optimal == null) return "";
  return seconds <= optimal ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
}

function errorColor(count: number) {
  return count > 0 ? "text-red-600 dark:text-red-400 font-semibold" : "";
}

function seqColor(rating: number | null) {
  if (rating == null) return "";
  if (rating >= 5) return "text-green-600 dark:text-green-400";
  if (rating >= 3) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function SessionDetailPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { data: session, isLoading } = useSession(sessionId);

  if (isLoading) return <p className="p-6 text-muted-foreground">Loading...</p>;
  if (!session) return <p className="p-6 text-muted-foreground">Session not found.</p>;

  const taskResults = session.task_results?.sort(
    (a, b) => a.sort_order - b.sort_order,
  ) ?? [];

  return (
    <PageWrapper
      title={session.templates.name}
      description={`${session.participants.name} — ${session.evaluator_name}`}
      actions={
        <div className="flex gap-2">
          {session.status !== "completed" && (
            <Button asChild>
              <Link
                to="/sessions/$sessionId/live"
                params={{ sessionId }}
              >
                <Play className="mr-2 h-4 w-4" />
                Live Mode
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link
              to="/sessions/$sessionId/edit"
              params={{ sessionId }}
            >
              <PenLine className="mr-2 h-4 w-4" />
              Edit Data
            </Link>
          </Button>
          <DeleteSessionDialog
            sessionId={sessionId}
            onDeleted={() => navigate({ to: "/sessions" })}
          />
        </div>
      }
    >
      {session.join_code && (
        <JoinCodeBanner joinCode={session.join_code} />
      )}

      <div className="flex gap-2">
        <Badge variant="secondary" className="capitalize">
          {session.status.replace("_", " ")}
        </Badge>
        {session.started_at && (
          <Badge variant="outline">
            Started: {new Date(session.started_at).toLocaleString()}
          </Badge>
        )}
        {session.completed_at && (
          <Badge variant="outline">
            Completed: {new Date(session.completed_at).toLocaleString()}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Task Results</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="errors">Error Log</TabsTrigger>
          <TabsTrigger value="hesitations">Hesitations</TabsTrigger>
          <TabsTrigger value="interview">Interview</TabsTrigger>
          <TabsTrigger value="sus">SUS</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <div className="space-y-6">
            <div className="rounded-md border bg-transparent backdrop-blur-md">
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
                  {taskResults.map((tr, i) => (
                    <TableRow key={tr.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">
                        {tr.template_tasks.name}
                      </TableCell>
                      <TableCell className="capitalize">
                        {tr.completion_status || "—"}
                      </TableCell>
                      <TableCell className={cn(timeColor(
                        tr.time_seconds != null ? Number(tr.time_seconds) : null,
                        tr.template_tasks.optimal_time_seconds ?? null,
                      ))}>
                        {tr.time_seconds != null
                          ? Number(tr.time_seconds).toFixed(1)
                          : "—"}
                      </TableCell>
                      <TableCell>{tr.action_count ?? "—"}</TableCell>
                      <TableCell className={cn(errorColor(tr.error_count))}>
                        {tr.error_count}
                      </TableCell>
                      <TableCell>{tr.hesitation_count}</TableCell>
                      <TableCell className={cn(seqColor(tr.seq_rating))}>
                        {tr.seq_rating ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <SessionCharts taskResults={taskResults} />
          </div>
        </TabsContent>

        <TabsContent value="questions">
          <Card className="bg-transparent backdrop-blur-md">
            <CardContent>
              {taskResults.every(
                (tr) => (tr.task_question_answers?.length ?? 0) === 0,
              ) ? (
                <p className="text-muted-foreground">No question answers recorded yet.</p>
              ) : (
                <div className="space-y-6">
                  {taskResults
                    .filter((tr) => (tr.task_question_answers?.length ?? 0) > 0)
                    .map((tr) => (
                      <div key={tr.id} className="space-y-2">
                        <p className="text-sm font-semibold">
                          {tr.template_tasks.name}
                        </p>
                        {[...(tr.template_tasks.task_questions ?? [])]
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((q) => {
                            const answer = tr.task_question_answers?.find(
                              (a) => a.question_id === q.id,
                            );
                            if (!answer) return null;
                            return (
                              <div
                                key={q.id}
                                className="rounded-md border p-3"
                              >
                                <p className="text-sm font-medium">
                                  {q.question_text}
                                </p>
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {q.question_type === "open" &&
                                    (answer.answer_text || "No answer")}
                                  {(q.question_type === "single_choice" ||
                                    q.question_type === "multiple_choice") &&
                                    ((answer.selected_options as string[]) ?? []).join(
                                      ", ",
                                    )}
                                  {q.question_type === "rating" &&
                                    (answer.rating_value != null
                                      ? `${answer.rating_value} / ${q.rating_max ?? 5}`
                                      : "No rating")}
                                  {q.question_type === "audio" &&
                                    (answer.media_url ? (
                                      <audio src={answer.media_url} controls className="mt-1 h-10 w-full" />
                                    ) : (
                                      "No audio recorded"
                                    ))}
                                  {q.question_type === "video" &&
                                    (answer.media_url ? (
                                      <video src={answer.media_url} controls className="mt-1 w-full max-h-48 rounded-md bg-black" />
                                    ) : (
                                      "No video recorded"
                                    ))}
                                  {q.question_type === "photo" &&
                                    (answer.media_url ? (
                                      <img src={answer.media_url} alt="Captured" className="mt-1 w-full max-h-48 rounded-md object-cover" />
                                    ) : (
                                      "No photo captured"
                                    ))}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card className="bg-transparent backdrop-blur-md">
            <CardContent>
              {taskResults.flatMap((tr) =>
                tr.error_logs.map((e) => ({
                  ...e,
                  taskName: tr.template_tasks.name,
                })),
              ).length === 0 ? (
                <p className="text-muted-foreground">No errors logged.</p>
              ) : (
                <div className="space-y-2">
                  {taskResults.flatMap((tr) =>
                    tr.error_logs.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {tr.template_tasks.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {e.description || "No description"}
                          </p>
                        </div>
                        {e.timestamp_seconds != null && (
                          <Badge variant="outline">
                            {Number(e.timestamp_seconds).toFixed(1)}s
                          </Badge>
                        )}
                      </div>
                    )),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hesitations">
          <Card className="bg-transparent backdrop-blur-md">
            <CardContent>
              {taskResults.flatMap((tr) => tr.hesitation_logs).length === 0 ? (
                <p className="text-muted-foreground">No hesitations logged.</p>
              ) : (
                <div className="space-y-2">
                  {taskResults.flatMap((tr) =>
                    tr.hesitation_logs.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {tr.template_tasks.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {h.note || "No note"}
                          </p>
                        </div>
                        {h.timestamp_seconds != null && (
                          <Badge variant="outline">
                            {Number(h.timestamp_seconds).toFixed(1)}s
                          </Badge>
                        )}
                      </div>
                    )),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interview">
          <Card className="bg-transparent backdrop-blur-md">
            <CardContent>
              {session.interview_answers.length === 0 ? (
                <p className="text-muted-foreground">No interview questions.</p>
              ) : (
                <div className="space-y-4">
                  {session.interview_answers.map((a, i) => (
                    <div key={a.id}>
                      <p className="text-sm font-medium">Q{i + 1}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {a.answer_text || "No answer recorded"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sus">
          <Card className="bg-transparent backdrop-blur-md">
            <CardContent>
              {(!session.sus_answers || session.sus_answers.length === 0) ? (
                <p className="text-muted-foreground">No SUS questionnaire completed.</p>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const susScore = calculateSusScore(session.sus_answers);
                    const label = susScore != null ? getSusLabel(susScore) : null;
                    return (
                      <>
                        {susScore != null && (
                          <div className="flex items-center gap-3 rounded-lg border p-4">
                            <div>
                              <p className="text-sm text-muted-foreground">SUS Score</p>
                              <p className={cn(
                                "text-3xl font-bold",
                                susScore >= 68 ? "text-green-600 dark:text-green-400" :
                                susScore >= 51 ? "text-amber-600 dark:text-amber-400" :
                                "text-red-600 dark:text-red-400",
                              )}>
                                {susScore.toFixed(1)}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-sm">
                              {label}
                            </Badge>
                          </div>
                        )}
                        <div className="space-y-2">
                          {[...session.sus_answers]
                            .sort((a, b) => a.question_number - b.question_number)
                            .map((a) => (
                              <div
                                key={a.id}
                                className="flex items-center justify-between rounded-md border p-3"
                              >
                                <p className="text-sm">
                                  <span className="font-medium">Q{a.question_number}.</span>{" "}
                                  {SUS_QUESTIONS[a.question_number - 1]}
                                </p>
                                <Badge variant="outline">{a.score}/5</Badge>
                              </div>
                            ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}

function JoinCodeBanner({ joinCode }: { joinCode: string }) {
  const [copied, setCopied] = useState(false);
  const joinUrl = `${window.location.origin}/join/${joinCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-transparent backdrop-blur-md border-primary/30">
      <CardContent className="flex items-center gap-3 py-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            Participant Join Link
          </p>
          <p className="text-sm font-mono truncate">{joinUrl}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="mr-1 h-3 w-3" />
          ) : (
            <Copy className="mr-1 h-3 w-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </CardContent>
    </Card>
  );
}

function DeleteSessionDialog({
  sessionId,
  onDeleted,
}: {
  sessionId: string;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const deleteSession = useDeleteSession();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Session</DialogTitle>
          <DialogDescription>
            This will permanently delete this session and all its data (task
            results, answers, logs). This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteSession.isPending}
            onClick={async () => {
              try {
                await deleteSession.mutateAsync(sessionId);
                toast.success("Session deleted");
                setOpen(false);
                onDeleted();
              } catch {
                toast.error("Failed to delete session");
              }
            }}
          >
            {deleteSession.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SessionCharts({
  taskResults,
}: {
  taskResults: import("@/types").TaskResultWithRelations[];
}) {
  if (taskResults.length === 0) return null;

  // --- Completion status distribution (pie) ---
  const statusCounts: Record<string, number> = {};
  for (const tr of taskResults) {
    const s = tr.completion_status || "pending";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  const completionPieData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // --- Time: actual vs optimal ---
  const timeData = taskResults.map((tr) => ({
    taskName: tr.template_tasks.name,
    actual: tr.time_seconds != null ? Number(tr.time_seconds) : 0,
    optimal: tr.template_tasks.optimal_time_seconds ?? 0,
  }));

  // --- Actions: actual vs optimal ---
  const actionData = taskResults.map((tr) => ({
    taskName: tr.template_tasks.name,
    actual: tr.action_count ?? 0,
    optimal: tr.template_tasks.optimal_actions ?? 0,
  }));

  // --- Errors & Hesitations per task ---
  const issuesData = taskResults.map((tr) => ({
    taskName: tr.template_tasks.name,
    errors: tr.error_count,
    hesitations: tr.hesitation_count,
  }));

  // --- SEQ ratings per task ---
  const seqData = taskResults
    .filter((tr) => tr.seq_rating != null)
    .map((tr) => ({
      taskName: tr.template_tasks.name,
      seq: tr.seq_rating!,
    }));

  // --- Radar chart: normalized task performance ---
  const radarData = taskResults.map((tr) => {
    const optTime = tr.template_tasks.optimal_time_seconds;
    const optActions = tr.template_tasks.optimal_actions;
    const timeEff =
      optTime && tr.time_seconds != null
        ? Math.min(100, Math.round((optTime / Number(tr.time_seconds)) * 100))
        : 0;
    const actionEff =
      optActions && tr.action_count != null
        ? Math.min(100, Math.round((optActions / tr.action_count) * 100))
        : 0;
    const seqNorm = tr.seq_rating != null ? Math.round((tr.seq_rating / 7) * 100) : 0;
    const errorScore = Math.max(0, 100 - tr.error_count * 25);
    return {
      task: tr.template_tasks.name,
      "Time Efficiency": timeEff,
      "Action Efficiency": actionEff,
      "SEQ Score": seqNorm,
      "Error Free": errorScore,
    };
  });

  // --- Error type distribution (pie) from error_logs ---
  const errorTypeCounts: Record<string, number> = {};
  for (const tr of taskResults) {
    for (const e of tr.error_logs) {
      const type = e.error_type_id ?? "unknown";
      errorTypeCounts[type] = (errorTypeCounts[type] || 0) + 1;
    }
  }
  const hasErrors = Object.keys(errorTypeCounts).length > 0;

  return (
    <div className="space-y-6">
      {/* Row 1: Completion pie + SEQ ratings */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-transparent backdrop-blur-md">
          <CardHeader>
            <CardTitle>Task Completion Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={completionPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={(props: any) =>
                    `${props.name} (${props.value})`
                  }
                  labelLine
                >
                  {completionPieData.map((entry, i) => {
                    const colorMap: Record<string, string> = {
                      Success: COLORS.success,
                      Partial: COLORS.secondary,
                      Failure: COLORS.failure,
                      Skipped: "#94a3b8",
                      Pending: "#64748b",
                    };
                    return (
                      <Cell
                        key={i}
                        fill={colorMap[entry.name] || PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    );
                  })}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {seqData.length > 0 && (
          <Card className="bg-transparent backdrop-blur-md">
            <CardHeader>
              <CardTitle>SEQ Ratings per Task</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={seqData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="taskName"
                    tick={{ fontSize: 10 }}
                    angle={-30}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0, 7]} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar
                    dataKey="seq"
                    fill={COLORS.quaternary}
                    name="SEQ (1–7)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 2: Time vs Optimal + Actions vs Optimal */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-transparent backdrop-blur-md">
          <CardHeader>
            <CardTitle>Time vs Optimal (seconds)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="taskName"
                  tick={{ fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend />
                <Bar
                  dataKey="actual"
                  fill={COLORS.primary}
                  name="Actual Time"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="optimal"
                  fill={COLORS.secondary}
                  name="Optimal Time"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-transparent backdrop-blur-md">
          <CardHeader>
            <CardTitle>Actions vs Optimal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={actionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="taskName"
                  tick={{ fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  height={80}
                />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend />
                <Bar
                  dataKey="actual"
                  fill={COLORS.tertiary}
                  name="Actual Actions"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="optimal"
                  fill={COLORS.secondary}
                  name="Optimal Actions"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Errors & Hesitations + Error type pie (if available) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-transparent backdrop-blur-md">
          <CardHeader>
            <CardTitle>Errors & Hesitations per Task</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={issuesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="taskName"
                  tick={{ fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  height={80}
                />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend />
                <Bar
                  dataKey="errors"
                  fill={COLORS.failure}
                  name="Errors"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="hesitations"
                  fill={COLORS.quaternary}
                  name="Hesitations"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {hasErrors && (
          <Card className="bg-transparent backdrop-blur-md">
            <CardHeader>
              <CardTitle>Errors by Task</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={taskResults
                    .filter((tr) => tr.error_count > 0)
                    .map((tr) => ({
                      taskName: tr.template_tasks.name,
                      errorCount: tr.error_count,
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="taskName"
                    tick={{ fontSize: 10 }}
                    angle={-30}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar
                    dataKey="errorCount"
                    fill={COLORS.failure}
                    name="Errors"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 4: Radar — Task Performance Overview */}
      {radarData.length > 0 && radarData.some(
        (d) => d["Time Efficiency"] > 0 || d["Action Efficiency"] > 0 || d["SEQ Score"] > 0,
      ) && (
        <Card className="bg-transparent backdrop-blur-md">
          <CardHeader>
            <CardTitle>Task Performance Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="task" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar
                  name="Time Efficiency"
                  dataKey="Time Efficiency"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.15}
                />
                <Radar
                  name="Action Efficiency"
                  dataKey="Action Efficiency"
                  stroke={COLORS.secondary}
                  fill={COLORS.secondary}
                  fillOpacity={0.15}
                />
                <Radar
                  name="SEQ Score"
                  dataKey="SEQ Score"
                  stroke={COLORS.quaternary}
                  fill={COLORS.quaternary}
                  fillOpacity={0.15}
                />
                <Radar
                  name="Error Free"
                  dataKey="Error Free"
                  stroke={COLORS.failure}
                  fill={COLORS.failure}
                  fillOpacity={0.1}
                />
                <Legend />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
