import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useTemplateAnalytics } from "@/hooks/use-analytics";
import { COLORS, PIE_COLORS, CHART_TOOLTIP_STYLE } from "@/lib/chart-constants";
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
  ResponsiveContainer,
} from "recharts";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Star,
} from "lucide-react";

interface TemplateOverviewTabProps {
  templateId: string;
}

export function TemplateOverviewTab({ templateId }: TemplateOverviewTabProps) {
  const { data: analytics, isLoading } = useTemplateAnalytics(templateId);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!analytics || analytics.summary.totalSessions === 0) {
    return (
      <EmptyState
        variant="sessions"
        title="No completed sessions"
        description="Complete some test sessions for this template to see analytics."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card data-animate-card className="bg-transparent backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Sessions
            </CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {analytics.summary.totalSessions}
            </p>
          </CardContent>
        </Card>
        <Card data-animate-card className="bg-transparent backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Completion Rate
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {analytics.summary.avgCompletionRate}%
            </p>
          </CardContent>
        </Card>
        <Card data-animate-card className="bg-transparent backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Task Time
            </CardTitle>
            <Clock className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {analytics.summary.avgTaskTime}s
            </p>
          </CardContent>
        </Card>
        <Card data-animate-card className="bg-transparent backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Errors
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {analytics.summary.totalErrors}
            </p>
          </CardContent>
        </Card>
        <Card data-animate-card className="bg-transparent backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg SUS Score
            </CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {analytics.summary.avgSusScore != null
                ? analytics.summary.avgSusScore
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Completion Chart */}
      <Card className="bg-transparent backdrop-blur-md">
        <CardHeader>
          <CardTitle>Task Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.taskCompletion}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="taskName"
                tick={{ fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                height={80}
              />
              <YAxis allowDecimals={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend />
              <Bar
                dataKey="success"
                stackId="a"
                fill={COLORS.success}
                name="Success"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="partial"
                stackId="a"
                fill={COLORS.partial}
                name="Partial"
              />
              <Bar
                dataKey="failure"
                stackId="a"
                fill={COLORS.failure}
                name="Failure"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Time & Efficiency */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-transparent backdrop-blur-md">
          <CardHeader>
            <CardTitle>Time per Task (seconds)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.timeEfficiency}>
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
                  dataKey="avgTime"
                  fill={COLORS.primary}
                  name="Avg Time"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="optimalTime"
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
            <CardTitle>Actions per Task</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.timeEfficiency}>
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
                  dataKey="avgActions"
                  fill={COLORS.tertiary}
                  name="Avg Actions"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="optimalActions"
                  fill={COLORS.secondary}
                  name="Optimal Actions"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Error Analysis */}
      <div className="grid gap-4 lg:grid-cols-2">
        {analytics.errorsByType.length > 0 && (
          <Card className="bg-transparent backdrop-blur-md">
            <CardHeader>
              <CardTitle>Errors by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.errorsByType}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    nameKey="name"
                    label={(props: any) =>
                      `${props.name} (${((props.percent ?? 0) * 100).toFixed(0)}%)`
                    }
                    labelLine
                  >
                    {analytics.errorsByType.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card className="bg-transparent backdrop-blur-md">
          <CardHeader>
            <CardTitle>Errors by Task</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.errorsByTask}>
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
      </div>
    </div>
  );
}
