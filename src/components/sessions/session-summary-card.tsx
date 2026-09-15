import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useAcceptSummaryCluster,
  useRequestSummary,
  useResolveSummary,
  useSessionSummaries,
  type SentObservation,
} from "@/hooks/use-session-summary";
import { describeDiscarded } from "@/lib/ai-suggestions";

/**
 * What the sessions found, proposed rather than decided.
 *
 * Shown only once the team has written at least one problem of its own, which
 * the database enforces too. A problem seen in several sessions is worth more
 * than one seen once, so the count of sessions is the thing put in front of
 * the reader.
 */
export function SessionSummaryCard({
  templateId,
  enabled,
  participantTextOn,
  heuristics,
  problemsWritten,
}: {
  templateId: string;
  /** The organization opted in. Off by default. */
  enabled: boolean;
  /** This study also opted in to sending what participants wrote. */
  participantTextOn: boolean;
  heuristics: { id: string; code: string | null; name: string }[];
  /** How many problems the team has entered itself. */
  problemsWritten: number;
}) {
  const { data: summaries } = useSessionSummaries(templateId, enabled);
  const request = useRequestSummary();
  const accept = useAcceptSummaryCluster();
  const resolve = useResolveSummary();
  const [accepted, setAccepted] = useState<Set<number>>(new Set());

  if (!enabled) return null;

  const open = (summaries ?? []).find((s) => s.status === "open");
  const observations = ((open?.payload as { observations?: SentObservation[] })?.observations ??
    []) as SentObservation[];
  const heuristicIdByCode = Object.fromEntries(
    heuristics.filter((h) => h.code).map((h) => [h.code as string, h.id]),
  );

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          What these sessions point to
          {open?.model && (
            <Badge variant="outline" className="font-normal">
              {open.model}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-xs text-muted-foreground">
          A model reads what your team wrote across every session, the observer
          notes and the moderator's corrections, and proposes which observations
          point to one problem.{" "}
          {participantTextOn
            ? "This study also sends what participants wrote, for the sessions whose participant agreed to it."
            : "What participants wrote is not sent."}{" "}
          It decides nothing. Anything you accept is recorded as assisted.
        </p>

        {!open && (
          <Button
            size="sm"
            disabled={problemsWritten === 0 || request.isPending}
            tooltip={
              problemsWritten === 0
                ? "Write at least one problem of your own first. A summary is for what you might have missed, not for what you have not looked at."
                : "Read every session and propose the problems they point to"
            }
            onClick={() =>
              request.mutate(
                {
                  templateId,
                  heuristicCodes: heuristics.map((h) => h.code ?? "").filter(Boolean),
                },
                {
                  onSuccess: (r) =>
                    toast.success(
                      r.participant_sessions_included
                        ? `Read ${r.sessions_total} sessions, ${r.participant_sessions_included} including participant answers`
                        : `Read ${r.sessions_total ?? 0} sessions`,
                    ),
                  onError: (e: unknown) =>
                    toast.error(e instanceof Error ? e.message : "Could not ask for a summary"),
                },
              )
            }
          >
            {request.isPending ? "Reading the sessions..." : "Summarise the sessions"}
          </Button>
        )}

        {open && (
          <div className="space-y-3">
            {describeDiscarded(open.payload.discarded ?? []) && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {describeDiscarded(open.payload.discarded ?? [])} Read each one
                before accepting it.
              </p>
            )}

            <ul className="space-y-2">
              {open.payload.clusters.map((cluster, i) => {
                const sessions = new Set(
                  cluster.findingIds
                    .map((id) => observations.find((o) => o.id === id)?.session_id)
                    .filter(Boolean),
                );
                const fromParticipants = cluster.findingIds.some(
                  (id) => observations.find((o) => o.id === id)?.source === "participant",
                );
                const done = accepted.has(i);
                return (
                  <li key={i} className="rounded-md border p-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{cluster.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {sessions.size === 1
                            ? "1 session"
                            : `${sessions.size} sessions`}
                          {cluster.heuristicCode ? `, ${cluster.heuristicCode}` : ""}
                          {cluster.severity !== null ? `, severity ${cluster.severity}` : ""}
                          {fromParticipants ? ", partly from what participants wrote" : ""}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        disabled={done || accept.isPending}
                        tooltip={
                          done
                            ? "Already added to your problem list"
                            : "Add this to the problem list, with these sessions as evidence"
                        }
                        onClick={() =>
                          accept.mutate(
                            { templateId, cluster, observations, heuristicIdByCode },
                            {
                              onSuccess: () => {
                                setAccepted((a) => new Set(a).add(i));
                                toast.success("Added to the problem list");
                              },
                              onError: (e: unknown) =>
                                toast.error(e instanceof Error ? e.message : "Could not accept"),
                            },
                          )
                        }
                      >
                        {done ? "Added" : "Accept"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button
                size="sm"
                variant="ghost"
                className="cursor-pointer"
                tooltip="Keep the proposal on record and stop showing it"
                onClick={() => resolve.mutate({ templateId, id: open.id, status: "accepted" })}
              >
                Done with these
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="cursor-pointer"
                tooltip="Record that your team rejected this proposal"
                onClick={() => resolve.mutate({ templateId, id: open.id, status: "dismissed" })}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {(summaries?.length ?? 0) > 0 && !open && (
          <p className="text-xs text-muted-foreground">
            {summaries!.length} earlier{" "}
            {summaries!.length === 1 ? "summary" : "summaries"}, kept as made.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
