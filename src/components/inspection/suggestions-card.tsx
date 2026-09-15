import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useAcceptCluster,
  useAiSuggestions,
  useRequestSuggestions,
  useResolveSuggestion,
} from "@/hooks/use-ai-suggestions";
import { describeDiscarded } from "@/lib/ai-suggestions";
import type { InspectionFinding } from "@/types";

/**
 * Proposed groupings, shown only where the team could already read every
 * finding: during consolidation, after every pass is in. The model never
 * writes anything. A person accepts a grouping, which creates the same rows
 * they would have created by hand, marked as assisted.
 */
export function SuggestionsCard({
  inspectionId,
  enabled,
  findings,
  heuristics,
}: {
  inspectionId: string;
  /** The organization opted in. Off by default. */
  enabled: boolean;
  findings: InspectionFinding[];
  heuristics: { id: string; code: string | null; name: string }[];
}) {
  const { data: suggestions } = useAiSuggestions(inspectionId, enabled);
  const request = useRequestSuggestions();
  const accept = useAcceptCluster();
  const resolve = useResolveSuggestion();

  if (!enabled) return null;

  const open = (suggestions ?? []).find((s) => s.status === "open");
  const unmerged = findings.filter((f) => !f.problem_id);
  const byId = new Map(findings.map((f) => [f.id, f]));
  const heuristicIdByCode = Object.fromEntries(
    heuristics.filter((h) => h.code).map((h) => [h.code as string, h.id]),
  );

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Suggested groupings
          {open?.model && (
            <Badge variant="outline" className="font-normal">
              {open.model}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-xs text-muted-foreground">
          A model reads the findings your team wrote and proposes which describe
          the same problem. It cannot see your sessions or your participants, it
          decides nothing, and anything you accept is recorded as assisted so
          your report can say which work was your own.
        </p>

        {!open && (
          <Button
            size="sm"
            disabled={unmerged.length < 2 || request.isPending}
            tooltip={
              unmerged.length < 2
                ? "There are fewer than two findings left to group"
                : "Send the findings your team wrote and get proposed groupings back"
            }
            onClick={() =>
              request.mutate(
                {
                  inspectionId,
                  findingIds: findings.map((f) => f.id),
                  heuristicCodes: heuristics.map((h) => h.code ?? "").filter(Boolean),
                },
                {
                  onError: (e: unknown) =>
                    toast.error(e instanceof Error ? e.message : "Could not ask for suggestions"),
                },
              )
            }
          >
            {request.isPending ? "Reading the findings..." : "Suggest groupings"}
          </Button>
        )}

        {open && (
          <div className="space-y-3">
            {describeDiscarded(open.payload.discarded ?? []) && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {describeDiscarded(open.payload.discarded ?? [])} Read each
                grouping before accepting it.
              </p>
            )}

            <ul className="space-y-2">
              {open.payload.clusters.map((cluster, i) => {
                const rows = cluster.findingIds
                  .map((id) => byId.get(id))
                  .filter((f): f is InspectionFinding => !!f);
                const alreadyMerged = rows.every((f) => f.problem_id);
                return (
                  <li key={i} className="rounded-md border p-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{cluster.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {rows.length} {rows.length === 1 ? "finding" : "findings"}
                          {cluster.heuristicCode ? `, ${cluster.heuristicCode}` : ""}
                          {cluster.severity !== null ? `, severity ${cluster.severity}` : ""}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        disabled={alreadyMerged || accept.isPending}
                        tooltip={
                          alreadyMerged
                            ? "These findings are already part of a problem"
                            : "Create this problem and attach these findings"
                        }
                        onClick={() =>
                          accept.mutate(
                            { inspectionId, cluster, heuristicIdByCode },
                            {
                              onSuccess: () => toast.success("Added to the problem list"),
                              onError: (e: unknown) =>
                                toast.error(e instanceof Error ? e.message : "Could not accept"),
                            },
                          )
                        }
                      >
                        Accept
                      </Button>
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {rows.map((f) => (
                        <li key={f.id} className="text-xs text-muted-foreground">
                          {f.description}
                        </li>
                      ))}
                    </ul>
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
                onClick={() =>
                  resolve.mutate({ inspectionId, id: open.id, status: "accepted" })
                }
              >
                Done with these
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="cursor-pointer"
                tooltip="Record that your team rejected this proposal"
                onClick={() =>
                  resolve.mutate({ inspectionId, id: open.id, status: "dismissed" })
                }
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {(suggestions?.length ?? 0) > 0 && !open && (
          <p className="text-xs text-muted-foreground">
            {suggestions!.length} earlier{" "}
            {suggestions!.length === 1 ? "proposal" : "proposals"}, kept as made.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
