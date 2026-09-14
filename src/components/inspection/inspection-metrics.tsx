import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import { summarizeInspection, type InspectionPass } from "@/lib/inspection";

/**
 * What the merge revealed. This is the teaching payload of the whole module:
 * a student sees, on their own data, that independent evaluators of one
 * interface disagree, and that adding evaluators keeps finding new problems
 * well past the point they expected.
 */
export function InspectionMetrics({
  passes,
  evaluatorLabel,
}: {
  passes: InspectionPass[];
  evaluatorLabel: (id: string) => string;
}) {
  const s = summarizeInspection(passes);

  if (s.totalProblems === 0) {
    return (
      <Card className="bg-transparent backdrop-blur-md">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Nothing to measure yet. The statistics appear once the passes are in
          and findings have been merged into problems.
        </CardContent>
      </Card>
    );
  }

  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const maxExpected = Math.max(...s.curve.map((p) => p.expected), 1);

  return (
    <div className="space-y-4">
      <Card className="bg-transparent backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            What the passes showed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Evaluators" value={String(s.evaluators)} />
            <Stat label="Distinct problems" value={String(s.totalProblems)} />
            <Stat
              label="Found by one person only"
              value={`${s.uniqueProblems} (${pct(s.uniqueShare)})`}
            />
            <Stat
              label="Any-two agreement"
              value={s.anyTwo.value === null ? "n/a" : pct(s.anyTwo.value)}
            />
          </dl>

          {s.anyTwo.value !== null && (
            <p className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
              Your average agreement between any two evaluators is{" "}
              <strong>{pct(s.anyTwo.value)}</strong>, {s.anyTwo.label}. Hertzum
              and Jacobsen reviewed eleven studies of cognitive walkthrough,
              heuristic evaluation and thinking-aloud and found this figure
              between 5% and 65%, for experienced evaluators as much as for
              novices. Low overlap is the normal result, not a sign that
              somebody did the exercise badly.
            </p>
          )}

          {s.uniqueShare > 0.5 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              More than half of the problems were seen by only one person. Ask
              what each of you was looking at that the others were not.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-transparent backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-base">How many evaluators is enough?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-xs text-muted-foreground">
            Each bar is the number of problems that a group of that size would
            be expected to find, averaged over every possible group of that
            size drawn from your team.
          </p>

          <ul className="space-y-1">
            {s.curve.map((p) => (
              <li key={p.evaluators} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">
                  {p.evaluators} {p.evaluators === 1 ? "evaluator" : "evaluators"}
                </span>
                <span className="h-4 flex-1 overflow-hidden rounded bg-muted">
                  <span
                    className="block h-full rounded bg-primary/70"
                    style={{ width: `${(p.expected / maxExpected) * 100}%` }}
                  />
                </span>
                <span className="w-24 shrink-0 text-right text-xs tabular-nums">
                  {p.expected.toFixed(1)} ({pct(p.share)})
                </span>
              </li>
            ))}
          </ul>

          <p className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
            A single evaluator found {pct(s.detectionRate)} of what the group
            found between them. Applying the same problem-discovery model the
            field uses for participant counts, reaching 75% of the problems
            takes{" "}
            <strong>
              {s.evaluatorsFor75 === null ? "more than can be estimated" : s.evaluatorsFor75}
            </strong>{" "}
            evaluators and 90% takes{" "}
            <strong>
              {s.evaluatorsFor90 === null ? "more than can be estimated" : s.evaluatorsFor90}
            </strong>
            . This is where the usual advice to use three to five evaluators
            comes from, and you have just derived it from your own data rather
            than taken it on trust.
          </p>
        </CardContent>
      </Card>

      {s.severity.n > 0 && (
        <Card className="bg-transparent backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base">Agreement on how bad it is</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="Problems rated by two or more" value={String(s.severity.n)} />
              <Stat label="Rated identically" value={pct(s.severity.exact)} />
              <Stat label="Mean spread" value={s.severity.meanRange.toFixed(2)} />
            </dl>
            {s.severity.severityDisputes > 0 && (
              <p className="text-xs">
                <Badge variant="outline" className="mr-2">
                  {s.severity.severityDisputes} to discuss
                </Badge>
                On these, one of you called the problem minor and another called
                it major or worse. That is a disagreement about whether to spend
                development time at all, and it is worth settling out loud.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-transparent backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-base">Who found what</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-xs">
            {s.anyTwo.pairs.map((p) => (
              <li key={`${p.a}-${p.b}`} className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {evaluatorLabel(p.a)} and {evaluatorLabel(p.b)}
                </span>
                <span className="tabular-nums">
                  {p.shared} shared of {p.collective} between them
                  {p.jaccard !== null ? ` (${pct(p.jaccard)})` : ""}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
