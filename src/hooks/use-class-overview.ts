import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  classOverview,
  type ClassData,
  type EvaluatorRow,
  type FindingRow,
  type GroupRow,
  type InspectionRow,
  type RaterScoreRow,
  type SessionRow,
  type TaskResultRow,
} from "@/lib/class-overview";
import type { TemplateWithRelations } from "@/types";

/**
 * Everything the class view needs for one organization.
 *
 * The reads go through row-level security as the signed-in owner rather than
 * through a single database function. A function would have to bypass those
 * policies and restate them, including the rule that an inspection's findings
 * stay closed until every pass is in. Reading as the owner means the view can
 * only ever show what the owner is already allowed to see.
 *
 * A class of a dozen projects is a few hundred rows, so the aggregation runs in
 * the browser, in the pure module it is tested through.
 */

const TEMPLATE_RELATIONS =
  "*, task_groups(*), template_tasks(*, task_questions(*)), template_error_types(*), template_questions(*), template_participant_fields(*), template_codes(*, answer_codes(*))";

async function rows<T>(
  promise: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T[]> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export function useClassOverview(orgId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["class-overview", orgId],
    enabled: !!orgId && enabled,
    queryFn: async () => {
      const [templates, groups, sessions] = await Promise.all([
        rows<TemplateWithRelations>(
          supabase.from("templates").select(TEMPLATE_RELATIONS).eq("org_id", orgId!).order("name"),
        ),
        rows<GroupRow>(
          supabase
            .from("org_groups")
            .select("id, name, repo_url, org_group_members(user_id, member_email)")
            .eq("org_id", orgId!),
        ),
        rows<SessionRow>(
          supabase
            .from("test_sessions")
            .select("id, template_id, status, is_pilot, consent_accepted_at, task_order_strategy, completed_at")
            .eq("org_id", orgId!),
        ),
      ]);

      const templateIds = templates.map((t) => t.id);
      const completedIds = sessions.filter((s) => s.status === "completed").map((s) => s.id);

      // An empty `in` list is a wasted round trip that returns nothing.
      const none = <T>() => Promise.resolve([] as T[]);

      const [raterScores, notes, reflections, inspections] = await Promise.all([
        completedIds.length
          ? rows<RaterScoreRow>(
              supabase
                .from("rater_scores")
                .select("session_id, task_id, rater_id, rater_email, completion_status, action_count, error_count, hesitation_count, seq_rating")
                .in("session_id", completedIds),
            )
          : none<RaterScoreRow>(),
        completedIds.length
          ? rows<{ session_id: string }>(
              supabase.from("observer_notes").select("session_id").in("session_id", completedIds),
            )
          : none<{ session_id: string }>(),
        completedIds.length
          ? rows<{ session_id: string; submitted_at: string | null }>(
              supabase
                .from("session_reflections")
                .select("session_id, submitted_at")
                .in("session_id", completedIds),
            )
          : none<{ session_id: string; submitted_at: string | null }>(),
        templateIds.length
          ? rows<InspectionRow>(
              supabase
                .from("inspections")
                .select("id, template_id, status, created_at")
                .in("template_id", templateIds),
            )
          : none<InspectionRow>(),
      ]);

      // Primary results are only needed where there is a co-rating to compare.
      const coRatedIds = [...new Set(raterScores.map((r) => r.session_id))];
      const inspectionIds = inspections.map((i) => i.id);

      const [taskResults, evaluators, findings] = await Promise.all([
        coRatedIds.length
          ? rows<TaskResultRow>(
              supabase
                .from("task_results")
                .select("session_id, task_id, completion_status, action_count, error_count, hesitation_count, seq_rating")
                .in("session_id", coRatedIds),
            )
          : none<TaskResultRow>(),
        inspectionIds.length
          ? rows<EvaluatorRow>(
              supabase
                .from("inspection_evaluators")
                .select("id, inspection_id, submitted_at")
                .in("inspection_id", inspectionIds),
            )
          : none<EvaluatorRow>(),
        inspectionIds.length
          ? rows<FindingRow>(
              supabase
                .from("inspection_findings")
                .select("inspection_id, evaluator_id, problem_id, severity")
                .in("inspection_id", inspectionIds),
            )
          : none<FindingRow>(),
      ]);

      const data: ClassData = {
        templates,
        groups,
        sessions,
        taskResults,
        raterScores,
        observedSessionIds: [...new Set(notes.map((n) => n.session_id))],
        reflections,
        inspections,
        evaluators,
        findings,
      };
      return classOverview(data);
    },
  });
}
