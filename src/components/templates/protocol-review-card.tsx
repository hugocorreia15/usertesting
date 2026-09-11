import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ExternalLink,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  reviewTemplate,
  summarizeReview,
  type ReviewFinding,
} from "@/lib/protocol-review";
import type { TemplateWithRelations } from "@/types";

/**
 * Advisory review of a template against common protocol-design mistakes.
 * Shown before any session exists, because that is when it can still change
 * the study. Nothing here blocks running a session.
 */
export function ProtocolReviewCard({
  template,
}: {
  template: TemplateWithRelations;
}) {
  const findings = useMemo(() => reviewTemplate(template), [template]);
  const { warnings, notes } = summarizeReview(findings);

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Protocol review
          {warnings > 0 && (
            <Badge variant="destructive" className="ml-1">
              {warnings} warning{warnings === 1 ? "" : "s"}
            </Badge>
          )}
          {notes > 0 && (
            <Badge variant="secondary">
              {notes} note{notes === 1 ? "" : "s"}
            </Badge>
          )}
          {findings.length === 0 && (
            <Badge variant="outline" className="border-green-500/40 text-green-700 dark:text-green-400">
              No issues found
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {findings.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Every task states a goal and a baseline, errors are typed, and a
            questionnaire is administered.
          </p>
        ) : (
          <ul className="divide-y">
            {findings.map((f) => (
              <FindingRow key={f.id} finding={f} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function FindingRow({ finding }: { finding: ReviewFinding }) {
  const [open, setOpen] = useState(false);
  const warn = finding.severity === "warn";

  return (
    <li className="py-2.5 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-2.5 text-left"
      >
        {warn ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        ) : (
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{finding.title}</span>
          <span className="block text-xs text-muted-foreground">
            {finding.detail}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="ml-6.5 mt-2 space-y-1.5 rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
          <p>
            <span className="font-medium">Why it matters. </span>
            {finding.why}
          </p>
          <Link
            to="/help"
            hash={finding.help}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Read more in Help
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}
    </li>
  );
}
