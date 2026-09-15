import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CircleDot, Github, LayoutList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpButton } from "@/components/help/help-button";
import { useClassOverview } from "@/hooks/use-class-overview";
import { REVIEW_STATUS_LABEL } from "@/lib/review-gate";
import type { Attention, ProjectStatus, Ratio } from "@/lib/class-overview";
import { cn } from "@/lib/utils";

/**
 * One row per project, for the organization's owner. The point is the weekly
 * loop: which teams need something from you, and which have not produced the
 * evidence their protocol is supposed to produce, without opening each one.
 */
export function ClassOverview({ orgId }: { orgId: string }) {
  const { data, isLoading, error } = useClassOverview(orgId);

  return (
    <Card data-animate-card className="bg-transparent backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <LayoutList className="h-4 w-4 text-primary" />
          Class overview
          <HelpButton section="class-overview" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {isLoading && <p className="text-muted-foreground">Reading every project...</p>}
        {error && (
          <p className="text-destructive">
            Could not load the class overview: {(error as Error).message}
          </p>
        )}
        {data && data.projects.length === 0 && (
          <p className="text-muted-foreground">
            No projects yet. Share a template with this organization and it
            appears here.
          </p>
        )}
        {data && data.projects.length > 0 && (
          <>
            <Summary summary={data.summary} />
            <ProjectTable projects={data.projects} />
            <p className="text-xs text-muted-foreground">
              Counts leave out pilot sessions, which rehearse a protocol before
              it is approved. Each column is the evidence a learning objective
              asks for, where the platform records it.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Summary({
  summary,
}: {
  summary: NonNullable<ReturnType<typeof useClassOverview>["data"]>["summary"];
}) {
  const items: { label: string; value: number; tone: "action" | "warn" | "plain" }[] = [
    { label: "waiting for your review", value: summary.awaitingReview, tone: "action" },
    { label: "with protocol warnings", value: summary.withWarnings, tone: "warn" },
    { label: "with sessions missing consent", value: summary.consentGaps, tone: "warn" },
    { label: "with no sessions yet", value: summary.noSessions, tone: "plain" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary">
        {summary.projects} {summary.projects === 1 ? "project" : "projects"}
      </Badge>
      {items
        .filter((i) => i.value > 0)
        .map((i) => (
          <Badge
            key={i.label}
            variant={i.tone === "action" ? "default" : "outline"}
            className={cn(i.tone === "warn" && "border-amber-500/50 text-amber-700 dark:text-amber-400")}
          >
            {i.value} {i.label}
          </Badge>
        ))}
    </div>
  );
}

const COLUMNS: { key: string; label: string; tip: string }[] = [
  { key: "inspection", label: "Inspection", tip: "Heuristic inspection before testing: passes in, or merged with the evaluators' agreement." },
  { key: "protocol", label: "Protocol", tip: "Warnings the protocol review still raises: leading tasks, missing success criteria or baselines." },
  { key: "review", label: "Review", tip: "Instructor review status. Sessions run before approval are pilots." },
  { key: "sessions", label: "Sessions", tip: "Completed sessions, not counting pilots." },
  { key: "consent", label: "Consent", tip: "Completed sessions with consent on file." },
  { key: "order", label: "Order", tip: "Sessions with shuffled or Latin square task order. Only expected from four measured tasks." },
  { key: "corated", label: "Co-rated", tip: "Sessions scored by a second rater, and the mean Cohen's kappa on completion." },
  { key: "observed", label: "Observed", tip: "Sessions where someone else took observer notes." },
  { key: "reflected", label: "Reflected", tip: "Sessions with at least one submitted reflection." },
];

function ProjectTable({ projects }: { projects: ProjectStatus[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-48">Project</TableHead>
            {/* What to do comes before the evidence, so it is never the column
                that scrolls out of view. */}
            <TableHead className="min-w-56">Needs attention</TableHead>
            {COLUMNS.map((c) => (
              <TableHead key={c.key} className="whitespace-nowrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="cursor-help underline decoration-dotted underline-offset-4">
                      {c.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{c.tip}</TooltipContent>
                </Tooltip>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((p) => (
            <TableRow key={p.templateId} className="align-top">
              <TableCell>
                <span className="flex items-center gap-1.5">
                  <Link
                    to="/templates/$templateId"
                    params={{ templateId: p.templateId }}
                    className="font-medium hover:underline"
                  >
                    {p.name}
                  </Link>
                  {p.repoUrl && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={p.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Repository for ${p.name}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Github className="h-3.5 w-3.5" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>Open the code in a new tab</TooltipContent>
                    </Tooltip>
                  )}
                </span>
                {p.groupName && (
                  <span className="block text-xs text-muted-foreground">
                    {p.groupName}
                    {p.students.length > 0 ? `: ${p.students.map((s) => s.split("@")[0]).join(", ")}` : ""}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <AttentionList items={p.attention} />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <InspectionCell inspection={p.inspection} />
              </TableCell>
              <TableCell>
                {p.protocolWarnings === 0 ? (
                  <Good>Clean</Good>
                ) : (
                  <Warn>
                    {p.protocolWarnings} {p.protocolWarnings === 1 ? "warning" : "warnings"}
                  </Warn>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {p.review.mode === "off" ? (
                  <Muted>Off</Muted>
                ) : p.review.status === "approved" ? (
                  <Good>Approved</Good>
                ) : p.review.status === "submitted" ? (
                  <span className="font-medium text-primary">Awaiting you</span>
                ) : (
                  <Muted>{REVIEW_STATUS_LABEL[p.review.status]}</Muted>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">
                {p.sessions.completed}
                {p.sessions.pilots > 0 && (
                  <span className="block text-xs text-muted-foreground">
                    +{p.sessions.pilots} pilot{p.sessions.pilots === 1 ? "" : "s"}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <RatioCell ratio={p.consent} required />
              </TableCell>
              <TableCell>
                {p.counterbalanced.applicable ? (
                  <RatioCell ratio={p.counterbalanced} required />
                ) : (
                  <Muted>n/a</Muted>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <RatioCell ratio={p.coRated} />
                {p.coRated.meanKappa !== null && (
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    κ {p.coRated.meanKappa.toFixed(2)}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <RatioCell ratio={p.observed} />
              </TableCell>
              <TableCell>
                <RatioCell ratio={p.reflected} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InspectionCell({ inspection }: { inspection: ProjectStatus["inspection"] }) {
  if (inspection.state === "none") return <Muted>None</Muted>;
  if (inspection.state === "collecting") {
    return (
      <span className="tabular-nums">
        {inspection.submitted}/{inspection.evaluators} passes
      </span>
    );
  }
  return (
    <span className="tabular-nums">
      <Good>Merged</Good>
      <span className="block text-xs text-muted-foreground">
        {inspection.problems} problems
        {inspection.agreement !== null ? `, ${Math.round(inspection.agreement * 100)}% agree` : ""}
      </span>
    </span>
  );
}

/** "2/3": complete in green, partial in amber, nothing yet muted. */
function RatioCell({ ratio, required = false }: { ratio: Ratio; required?: boolean }) {
  if (ratio.of === 0) return <Muted>–</Muted>;
  const text = `${ratio.done}/${ratio.of}`;
  if (ratio.done === ratio.of) return <Good>{text}</Good>;
  if (ratio.done === 0 && !required) return <Muted>{text}</Muted>;
  return <Warn>{text}</Warn>;
}

function AttentionList({ items }: { items: Attention[] }) {
  if (items.length === 0) return <Good>Nothing to chase</Good>;
  return (
    <ul className="space-y-1">
      {items.map((a) => (
        <li key={a.text} className="flex items-start gap-1.5 text-xs">
          {a.level === "info" ? (
            <CircleDot className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <AlertTriangle
              className={cn(
                "mt-0.5 h-3 w-3 shrink-0",
                a.level === "action" ? "text-primary" : "text-amber-600 dark:text-amber-400",
              )}
            />
          )}
          <span className={cn(a.level === "action" && "font-medium text-primary")}>{a.text}</span>
        </li>
      ))}
    </ul>
  );
}

const Good = ({ children }: { children: ReactNode }) => (
  <span className="tabular-nums text-green-700 dark:text-green-400">{children}</span>
);
const Warn = ({ children }: { children: ReactNode }) => (
  <span className="tabular-nums text-amber-700 dark:text-amber-400">{children}</span>
);
const Muted = ({ children }: { children: ReactNode }) => (
  <span className="text-muted-foreground">{children}</span>
);
