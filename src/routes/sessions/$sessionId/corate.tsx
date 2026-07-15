import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/use-sessions";
import {
  useRaterScores,
  useUpsertRaterScore,
} from "@/hooks/use-rater-scores";
import { useAuth } from "@/hooks/use-auth";
import { Scale, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { RaterScore } from "@/types";

export const Route = createFileRoute("/sessions/$sessionId/corate")({
  component: CoRatePage,
});

const STATUSES = ["success", "partial", "failure", "skipped"] as const;
type Status = (typeof STATUSES)[number];

const statusStyle: Record<Status, string> = {
  success: "bg-green-600 hover:bg-green-700 text-white",
  partial: "bg-yellow-600 hover:bg-yellow-700 text-white",
  failure: "bg-red-600 hover:bg-red-700 text-white",
  skipped: "bg-muted-foreground/70 hover:bg-muted-foreground text-white",
};

function CoRatePage() {
  const { sessionId } = Route.useParams();
  const { user } = useAuth();
  const { data: session, isLoading } = useSession(sessionId);
  const { data: allScores } = useRaterScores(sessionId);

  if (isLoading)
    return <p className="p-6 text-muted-foreground">Loading...</p>;
  if (!session)
    return <p className="p-6 text-muted-foreground">Session not found.</p>;

  const myScores = (allScores ?? []).filter((s) => s.rater_id === user?.id);
  const myByTask = new Map(myScores.map((s) => [s.task_id, s]));

  const tasks = [...(session.task_results ?? [])]
    .filter((tr) => !tr.template_tasks.is_practice)
    .sort((a, b) => a.sort_order - b.sort_order);

  const scored = tasks.filter((tr) => {
    const s = myByTask.get(tr.task_id);
    return (
      s &&
      (s.completion_status != null ||
        s.action_count != null ||
        s.error_count != null ||
        s.hesitation_count != null ||
        s.seq_rating != null)
    );
  }).length;

  return (
    <PageWrapper
      title={`Co-rate: ${session.templates.name}`}
      description={`${session.participants.name} — primary evaluator ${session.evaluator_name}`}
      actions={
        <Button variant="outline" asChild>
          <Link to="/sessions/$sessionId" params={{ sessionId }}>
            Session details
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed bg-muted/30 px-4 py-3">
          <Scale className="h-5 w-5 shrink-0 text-primary" />
          <p className="min-w-0 text-sm text-muted-foreground">
            Independent scoring — record your own judgment of each task. Your
            scores are compared against the primary evaluator's for inter-rater
            reliability; you are not changing their data.
          </p>
          <Badge variant="secondary" className="ml-auto shrink-0">
            {scored}/{tasks.length} scored
          </Badge>
        </div>

        {tasks.map((tr, i) => (
          <TaskRatingCard
            key={tr.id}
            sessionId={sessionId}
            taskId={tr.task_id}
            index={i}
            name={tr.template_tasks.name}
            existing={myByTask.get(tr.task_id)}
          />
        ))}
      </div>
    </PageWrapper>
  );
}

function TaskRatingCard({
  sessionId,
  taskId,
  index,
  name,
  existing,
}: {
  sessionId: string;
  taskId: string;
  index: number;
  name: string;
  existing: RaterScore | undefined;
}) {
  const upsert = useUpsertRaterScore();
  const [status, setStatus] = useState<Status | null>(
    (existing?.completion_status as Status) ?? null,
  );
  const [actions, setActions] = useState(
    existing?.action_count?.toString() ?? "",
  );
  const [errors, setErrors] = useState(existing?.error_count?.toString() ?? "");
  const [hesitations, setHesitations] = useState(
    existing?.hesitation_count?.toString() ?? "",
  );
  const [seq, setSeq] = useState<number | null>(existing?.seq_rating ?? null);
  const [saved, setSaved] = useState(false);

  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  const save = () => {
    upsert.mutate(
      {
        session_id: sessionId,
        task_id: taskId,
        completion_status: status,
        action_count: num(actions),
        error_count: num(errors),
        hesitation_count: num(hesitations),
        seq_rating: seq,
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
        onError: () => toast.error("Failed to save score"),
      },
    );
  };

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardContent className="space-y-4 pt-5">
        <p className="font-semibold">
          {index + 1}. {name}
        </p>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Completion</Label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Button
                key={s}
                type="button"
                size="sm"
                variant={status === s ? "default" : "outline"}
                className={cn("capitalize", status === s && statusStyle[s])}
                onClick={() => setStatus(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor={`a-${taskId}`} className="text-xs text-muted-foreground">
              Actions
            </Label>
            <Input
              id={`a-${taskId}`}
              type="number"
              min={0}
              value={actions}
              onChange={(e) => setActions(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`e-${taskId}`} className="text-xs text-muted-foreground">
              Errors
            </Label>
            <Input
              id={`e-${taskId}`}
              type="number"
              min={0}
              value={errors}
              onChange={(e) => setErrors(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`h-${taskId}`} className="text-xs text-muted-foreground">
              Hesitations
            </Label>
            <Input
              id={`h-${taskId}`}
              type="number"
              min={0}
              value={hesitations}
              onChange={(e) => setHesitations(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">SEQ (1–7)</Label>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Button
                key={n}
                type="button"
                size="sm"
                variant={seq === n ? "default" : "outline"}
                className="h-9 w-9"
                aria-label={`SEQ ${n} of 7`}
                aria-pressed={seq === n}
                onClick={() => setSeq(n)}
              >
                {n}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              Saved
            </span>
          )}
          <Button onClick={save} disabled={upsert.isPending} size="sm">
            {upsert.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
