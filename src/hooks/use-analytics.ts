import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { calculateSusScore } from "@/lib/sus";
import type {
  TemplateWithRelations,
  TestSessionWithRelations,
} from "@/types";

export interface TaskCompletionDatum {
  taskName: string;
  success: number;
  partial: number;
  failure: number;
}

export interface TimeEfficiencyDatum {
  taskName: string;
  avgTime: number;
  optimalTime: number | null;
  avgActions: number;
  optimalActions: number | null;
}

export interface ErrorByTypeDatum {
  name: string;
  count: number;
}

export interface ErrorByTaskDatum {
  taskName: string;
  errorCount: number;
}

export interface AnalyticsSummary {
  totalSessions: number;
  avgCompletionRate: number;
  avgTaskTime: number;
  totalErrors: number;
  avgSusScore: number | null;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  taskCompletion: TaskCompletionDatum[];
  timeEfficiency: TimeEfficiencyDatum[];
  errorsByType: ErrorByTypeDatum[];
  errorsByTask: ErrorByTaskDatum[];
}

function computeAnalytics(
  template: TemplateWithRelations,
  sessions: TestSessionWithRelations[],
): AnalyticsData {
  const tasks = [...template.template_tasks].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const errorTypes = template.template_error_types;

  // Task completion data
  const taskCompletion: TaskCompletionDatum[] = tasks.map((task) => {
    const results = sessions.flatMap((s) =>
      s.task_results.filter((r) => r.task_id === task.id),
    );
    return {
      taskName: task.name,
      success: results.filter((r) => r.completion_status === "success").length,
      partial: results.filter((r) => r.completion_status === "partial").length,
      failure: results.filter((r) => r.completion_status === "failure").length,
    };
  });

  // Time & efficiency data
  const timeEfficiency: TimeEfficiencyDatum[] = tasks.map((task) => {
    const results = sessions.flatMap((s) =>
      s.task_results.filter(
        (r) => r.task_id === task.id && r.time_seconds != null,
      ),
    );
    const avgTime =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.time_seconds!, 0) / results.length
        : 0;
    const resultsWithActions = results.filter((r) => r.action_count != null);
    const avgActions =
      resultsWithActions.length > 0
        ? resultsWithActions.reduce((sum, r) => sum + r.action_count!, 0) /
          resultsWithActions.length
        : 0;
    return {
      taskName: task.name,
      avgTime: Math.round(avgTime * 10) / 10,
      optimalTime: task.optimal_time_seconds,
      avgActions: Math.round(avgActions * 10) / 10,
      optimalActions: task.optimal_actions,
    };
  });

  // Errors by type
  const errorTypeCount = new Map<string, number>();
  for (const session of sessions) {
    for (const result of session.task_results) {
      for (const error of result.error_logs) {
        const typeId = error.error_type_id;
        if (typeId) {
          errorTypeCount.set(typeId, (errorTypeCount.get(typeId) || 0) + 1);
        }
      }
    }
  }
  const errorsByType: ErrorByTypeDatum[] = errorTypes
    .map((et) => ({
      name: `${et.code}: ${et.label}`,
      count: errorTypeCount.get(et.id) || 0,
    }))
    .filter((d) => d.count > 0);

  // Errors by task
  const errorsByTask: ErrorByTaskDatum[] = tasks.map((task) => {
    const totalErrors = sessions.reduce((sum, s) => {
      const result = s.task_results.find((r) => r.task_id === task.id);
      return sum + (result ? result.error_count : 0);
    }, 0);
    return { taskName: task.name, errorCount: totalErrors };
  });

  // Summary
  const allResults = sessions.flatMap((s) => s.task_results);
  const completedResults = allResults.filter(
    (r) => r.completion_status === "success",
  );
  const resultsWithStatus = allResults.filter(
    (r) => r.completion_status != null,
  );
  const avgCompletionRate =
    resultsWithStatus.length > 0
      ? Math.round((completedResults.length / resultsWithStatus.length) * 100)
      : 0;
  const resultsWithTime = allResults.filter((r) => r.time_seconds != null);
  const avgTaskTime =
    resultsWithTime.length > 0
      ? Math.round(
          (resultsWithTime.reduce((s, r) => s + r.time_seconds!, 0) /
            resultsWithTime.length) *
            10,
        ) / 10
      : 0;
  const totalErrors = allResults.reduce((s, r) => s + r.error_count, 0);

  // SUS scores
  const susScores = sessions
    .map((s) => calculateSusScore(s.sus_answers || []))
    .filter((s): s is number => s != null);
  const avgSusScore =
    susScores.length > 0
      ? Math.round(
          (susScores.reduce((a, b) => a + b, 0) / susScores.length) * 10,
        ) / 10
      : null;

  return {
    summary: {
      totalSessions: sessions.length,
      avgCompletionRate,
      avgTaskTime,
      totalErrors,
      avgSusScore,
    },
    taskCompletion,
    timeEfficiency,
    errorsByType,
    errorsByTask,
  };
}

export function useTemplateAnalytics(templateId: string | undefined) {
  return useQuery({
    queryKey: ["analytics", templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const { data: template, error: tErr } = await supabase
        .from("templates")
        .select(
          "*, template_tasks(*), template_error_types(*), template_questions(*)",
        )
        .eq("id", templateId!)
        .single();
      if (tErr) throw tErr;

      const { data: sessions, error: sErr } = await supabase
        .from("test_sessions")
        .select(
          "*, templates(*), participants(*), task_results(*, template_tasks(*), error_logs(*), hesitation_logs(*)), interview_answers(*), sus_answers(*)",
        )
        .eq("template_id", templateId!)
        .eq("status", "completed");
      if (sErr) throw sErr;

      return computeAnalytics(
        template as TemplateWithRelations,
        sessions as TestSessionWithRelations[],
      );
    },
  });
}
