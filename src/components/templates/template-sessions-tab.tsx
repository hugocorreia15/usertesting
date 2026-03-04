import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { COLORS, CHART_TOOLTIP_STYLE } from "@/lib/chart-constants";
import { calculateSusScore, getSusLabel } from "@/lib/sus";
import type { TestSessionWithRelations } from "@/types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ExternalLink } from "lucide-react";

const statusStyles: Record<string, string> = {
  planned:
    "ring-1 ring-amber-400/30 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
  in_progress:
    "ring-1 ring-indigo-400/30 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20",
  completed:
    "ring-1 ring-emerald-400/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
};

interface TemplateSessionsTabProps {
  sessions: TestSessionWithRelations[];
}

function CompletionDonut({ session }: { session: TestSessionWithRelations }) {
  const results = session.task_results;
  const success = results.filter((r) => r.completion_status === "success").length;
  const partial = results.filter((r) => r.completion_status === "partial").length;
  const failure = results.filter((r) => r.completion_status === "failure").length;
  const remaining = results.length - success - partial - failure;

  const data = [
    { name: "Success", value: success },
    { name: "Partial", value: partial },
    { name: "Failure", value: failure },
    ...(remaining > 0 ? [{ name: "Pending", value: remaining }] : []),
  ].filter((d) => d.value > 0);

  const colors = [COLORS.success, COLORS.partial, COLORS.failure, "#d1d5db"];

  if (data.length === 0) {
    return (
      <div className="flex h-[150px] items-center justify-center text-xs text-muted-foreground">
        No task data
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">Completion</p>
      <ResponsiveContainer width="100%" height={130}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={50}
            dataKey="value"
            label={(props: any) =>
                `${props.name}`
            }
            labelLine
            nameKey="name"
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={
                  entry.name === "Success"
                    ? colors[0]
                    : entry.name === "Partial"
                      ? colors[1]
                      : entry.name === "Failure"
                        ? colors[2]
                        : colors[3]
                }
              />
            ))}
          </Pie>
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function SessionAverages({ session }: { session: TestSessionWithRelations }) {
  const results = session.task_results;
  if (results.length === 0) {
    return (
      <div className="flex h-[150px] items-center justify-center text-xs text-muted-foreground">
        No task data
      </div>
    );
  }

  const timeTasks = results.filter((r) => r.time_seconds != null);
  const avgTime =
    timeTasks.length > 0
      ? timeTasks.reduce((s, r) => s + Number(r.time_seconds), 0) / timeTasks.length
      : null;

  const optTimeTasks = timeTasks.filter(
    (r) => r.template_tasks.optimal_time_seconds != null,
  );
  const timeEfficiency =
    optTimeTasks.length > 0
      ? Math.round(
          (optTimeTasks.reduce(
            (s, r) => s + r.template_tasks.optimal_time_seconds! / Number(r.time_seconds!),
            0,
          ) /
            optTimeTasks.length) *
            100,
        )
      : null;

  const actionTasks = results.filter((r) => r.action_count != null);
  const avgActions =
    actionTasks.length > 0
      ? (actionTasks.reduce((s, r) => s + r.action_count!, 0) / actionTasks.length).toFixed(1)
      : null;

  const seqTasks = results.filter((r) => r.seq_rating != null);
  const avgSeq =
    seqTasks.length > 0
      ? (seqTasks.reduce((s, r) => s + r.seq_rating!, 0) / seqTasks.length).toFixed(1)
      : null;

  const effColor =
    timeEfficiency != null
      ? timeEfficiency >= 80
        ? "text-green-600 dark:text-green-400"
        : timeEfficiency >= 50
          ? "text-amber-600 dark:text-amber-400"
          : "text-red-600 dark:text-red-400"
      : "";

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">Averages</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground">Avg Time</p>
          <p className="text-lg font-bold leading-tight">
            {avgTime != null ? `${avgTime.toFixed(1)}s` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Time Efficiency</p>
          <p className={`text-lg font-bold leading-tight ${effColor}`}>
            {timeEfficiency != null ? `${timeEfficiency}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Avg Actions</p>
          <p className="text-lg font-bold leading-tight">
            {avgActions ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Avg SEQ</p>
          <p className="text-lg font-bold leading-tight">
            {avgSeq != null ? `${avgSeq}/7` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TemplateSessionsTab({ sessions }: TemplateSessionsTabProps) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        variant="sessions"
        title="No sessions"
        description="No test sessions have been created for this template yet."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sessions.map((session) => {
        const totalErrors = session.task_results.reduce(
          (sum, r) => sum + r.error_count,
          0,
        );
        const totalHesitations = session.task_results.reduce(
          (sum, r) => sum + r.hesitation_count,
          0,
        );
        const susScore = calculateSusScore(session.sus_answers || []);

        return (
          <Card key={session.id} className="flex flex-col bg-transparent backdrop-blur-md">
            {/* Header */}
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
              <div className="space-y-1">
                <p className="font-semibold leading-none">
                  {session.participants?.name ?? "Unknown"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Evaluator: {session.evaluator_name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[session.status] || ""}`}
                >
                  {session.status.replace("_", " ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(session.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-4">
              {/* Mini charts */}
              <div className="grid grid-cols-2 gap-4">
                <CompletionDonut session={session} />
                <SessionAverages session={session} />
              </div>

              {/* Metrics row */}
              <div className="flex items-center gap-4 border-t pt-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Errors: </span>
                  <span className="font-medium">{totalErrors}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Hesitations: </span>
                  <span className="font-medium">{totalHesitations}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">SUS: </span>
                  <span className="font-medium">
                    {susScore != null
                      ? `${susScore} (${getSusLabel(susScore)})`
                      : "—"}
                  </span>
                </div>
                <div className="ml-auto">
                  <Link
                    to="/sessions/$sessionId"
                    params={{ sessionId: session.id }}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
