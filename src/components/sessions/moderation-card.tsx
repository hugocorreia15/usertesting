import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { HelpButton } from "@/components/help/help-button";
import { summarizeModeration, type ModerationEvent } from "@/lib/moderation";
import type { TaskResultWithRelations } from "@/types";

const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;

/**
 * How the session was run: the corrections made while logging it, and results
 * that suggest something was not logged. Shown to anyone who can read the
 * session, because the numbers in the results table depend on it.
 */
export function ModerationCard({
  events,
  taskResults,
}: {
  events: ModerationEvent[];
  taskResults: TaskResultWithRelations[];
}) {
  const s = summarizeModeration({
    events,
    results: taskResults.map((tr) => ({
      task_id: tr.task_id,
      task_name: tr.template_tasks.name,
      is_practice: tr.template_tasks.is_practice,
      completion_status: tr.completion_status,
      action_count: tr.action_count,
      error_count: tr.error_count,
      hesitation_count: tr.hesitation_count,
    })),
  });

  const nothingNotable =
    s.recorded &&
    s.undos.total === 0 &&
    s.resets.length === 0 &&
    s.stepBacks === 0 &&
    s.timerResets === 0 &&
    s.skipped.length === 0 &&
    s.silentSuccesses.length === 0;

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          How the session was run
          <HelpButton section="reflection" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!s.recorded && (
          <p className="text-muted-foreground">
            Corrections were not recorded for this session. It was run before
            correction logging existed, or without the live cockpit, so the
            absence of undos and resets here says nothing either way.
          </p>
        )}

        {nothingNotable && (
          <p className="text-muted-foreground">
            Logged without corrections: nothing undone, no task reset or
            revisited, and every measured task has something counted.
          </p>
        )}

        {s.recorded && (s.undos.total > 0 || s.stepBacks > 0 || s.timerResets > 0) && (
          <div className="flex flex-wrap gap-2">
            {s.undos.error > 0 && (
              <Badge variant="outline">{plural(s.undos.error, "logged error")} undone</Badge>
            )}
            {s.undos.hesitation > 0 && (
              <Badge variant="outline">{plural(s.undos.hesitation, "logged hesitation")} undone</Badge>
            )}
            {s.undos.action > 0 && (
              <Badge variant="outline">{plural(s.undos.action, "action count")} undone</Badge>
            )}
            {s.stepBacks > 0 && (
              <Badge variant="outline">went back a task {plural(s.stepBacks, "time")}</Badge>
            )}
            {s.timerResets > 0 && (
              <Badge variant="outline">timer reset {plural(s.timerResets, "time")}</Badge>
            )}
          </div>
        )}

        {s.resets.length > 0 && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
            <p className="font-medium">
              {s.resets.length === 1 ? "A task was reset" : `${s.resets.length} task resets`}
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {s.resets.map((r, i) => (
                <li key={i}>
                  {r.taskName}
                  {r.timerSeconds != null ? `, ${r.timerSeconds}s in` : ""}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">
              The participant attempted it twice. Its recorded time and errors
              describe only the second attempt, which the report should say.
            </p>
          </div>
        )}

        {s.skipped.length > 0 && (
          <p className="text-xs">
            <span className="font-medium">Skipped:</span> {s.skipped.join(", ")}.
          </p>
        )}

        {s.silentSuccesses.length > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Marked successful with nothing counted: {s.silentSuccesses.join(", ")}.
            A task rarely takes no actions at all; check whether logging was
            running.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
