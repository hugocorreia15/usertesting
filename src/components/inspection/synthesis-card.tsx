import { useState } from "react";
import { toast } from "sonner";
import { FlaskConical, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpButton } from "@/components/help/help-button";
import { useSessionsByTemplate } from "@/hooks/use-sessions";
import {
  useAddTestProblem,
  useDeleteTestProblem,
  useSetProblemOutcome,
  useSynthesis,
  useToggleEvidence,
} from "@/hooks/use-synthesis";
import { summarizeSynthesis, type TestOutcome } from "@/lib/synthesis";
import { SEVERITY, severityShort } from "@/components/inspection/severity";
import type { InspectionProblem, ProblemEvidence } from "@/types";
import { cn } from "@/lib/utils";

const OUTCOMES: { value: TestOutcome; label: string }[] = [
  { value: "untested", label: "Not tested yet" },
  { value: "confirmed", label: "Participants hit it" },
  { value: "not_observed", label: "Not observed" },
];

interface SessionChip {
  id: string;
  label: string;
}

/**
 * The last stage of an inspection: which predicted problems participants
 * actually ran into, and what testing found that nobody predicted.
 */
export function SynthesisCard({
  inspectionId,
  templateId,
  problems,
}: {
  inspectionId: string;
  templateId: string;
  problems: InspectionProblem[];
}) {
  const { data } = useSynthesis(templateId);
  const { data: sessions } = useSessionsByTemplate(templateId);
  const setOutcome = useSetProblemOutcome();
  const toggle = useToggleEvidence();
  const addProblem = useAddTestProblem();
  const deleteProblem = useDeleteTestProblem();
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("");

  // Pilots rehearse the protocol and are not evidence about the design.
  const chips: SessionChip[] = (sessions ?? [])
    .filter((s) => s.status === "completed" && !s.is_pilot)
    .map((s, i) => ({ id: s.id, label: s.participants?.name ?? `Session ${i + 1}` }));

  const evidence = data?.evidence ?? [];
  const testProblems = data?.testProblems ?? [];
  const summary = summarizeSynthesis({
    outcomes: problems.map((p) => p.test_outcome),
    testOnlyCount: testProblems.length,
  });
  const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)}%`);

  const evidenceFor = (match: (e: ProblemEvidence) => boolean) => evidence.filter(match);

  const sessionToggles = (
    rows: ProblemEvidence[],
    target: { inspectionProblemId?: string; testProblemId?: string },
  ) =>
    chips.length === 0 ? (
      <p className="text-xs text-muted-foreground">No completed sessions to point to yet.</p>
    ) : (
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => {
          const existing = rows.find((e) => e.session_id === c.id) ?? null;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={!!existing}
              disabled={toggle.isPending}
              onClick={() =>
                toggle.mutate(
                  { templateId, sessionId: c.id, existingId: existing?.id ?? null, ...target },
                  { onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not save") },
                )
              }
              className={cn(
                "cursor-pointer rounded-full border px-2 py-0.5 text-xs transition-colors",
                existing
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    );

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <FlaskConical className="h-4 w-4 text-primary" />
          After testing
          <HelpButton section="inspection" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <p className="text-xs text-muted-foreground">
          Once sessions have run, mark which predicted problems participants
          actually ran into, and tick the sessions that show it. Not observed is
          not the same as wrong: a handful of sessions can miss a real problem.
        </p>

        <div className="grid gap-3 rounded-md border bg-muted/30 p-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Predicted problems participants hit</p>
            <p className="text-lg font-semibold tabular-nums">
              {pct(summary.predictedAndConfirmed)}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {summary.confirmed} of {summary.confirmed + summary.notObserved} tested
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Problems testing showed that were predicted</p>
            <p className="text-lg font-semibold tabular-nums">
              {pct(summary.confirmedAndPredicted)}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {summary.confirmed} of {summary.confirmed + summary.testOnly}
              </span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            The first says how well the inspection predicted; the second, how
            much it missed. An inspection usually does better on one than the
            other, and which one is the point to discuss.
            {summary.untested > 0 ? ` ${summary.untested} predicted problems are not tested yet and count in neither.` : ""}
          </p>
        </div>

        <div className="space-y-2">
          <p className="font-medium">Predicted by the inspection ({problems.length})</p>
          <ul className="space-y-2">
            {problems.map((p) => {
              const rows = evidenceFor((e) => e.inspection_problem_id === p.id);
              return (
                <li key={p.id} className="space-y-2 rounded-md border p-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>{p.title}</span>
                    <Select
                      value={p.test_outcome}
                      onValueChange={(v) =>
                        setOutcome.mutate(
                          { inspectionId, problemId: p.id, outcome: v as TestOutcome },
                          { onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not save") },
                        )
                      }
                    >
                      <SelectTrigger className="h-8 w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OUTCOMES.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {p.test_outcome === "confirmed" && sessionToggles(rows, { inspectionProblemId: p.id })}
                  {p.test_outcome === "confirmed" && rows.length === 0 && chips.length > 0 && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Tick at least one session, so the claim rests on something
                      that can be opened.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-2 border-t pt-4">
          <p className="font-medium">Found only in testing ({testProblems.length})</p>
          <ul className="space-y-2">
            {testProblems.map((t) => {
              const rows = evidenceFor((e) => e.test_problem_id === t.id);
              return (
                <li key={t.id} className="space-y-2 rounded-md border p-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {t.title}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {severityShort(t.severity)}
                      </Badge>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      tooltip="Remove this problem"
                      onClick={() => deleteProblem.mutate({ templateId, id: t.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {sessionToggles(rows, { testProblemId: t.id })}
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-56 flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A problem participants hit that nobody predicted"
              />
            </div>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY.map((s) => (
                  <SelectItem key={s.value} value={String(s.value)}>
                    {s.value}. {s.short}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              tooltip={title.trim() ? "Add it to the list" : "Describe the problem first"}
              disabled={!title.trim() || addProblem.isPending}
              onClick={() =>
                addProblem.mutate(
                  { templateId, title: title.trim(), severity: severity === "" ? null : Number(severity) },
                  {
                    onSuccess: () => {
                      setTitle("");
                      setSeverity("");
                    },
                    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not add"),
                  },
                )
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
