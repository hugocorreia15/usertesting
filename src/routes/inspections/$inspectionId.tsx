import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  useAddFinding,
  useAssignFindingToProblem,
  useCloseCollection,
  useCreateProblem,
  useDeleteFinding,
  useDeriveTaskFromProblem,
  useHeuristicSets,
  useInspection,
  useJoinInspection,
  useSubmitPass,
} from "@/hooks/use-inspections";
import { InspectionMetrics } from "@/components/inspection/inspection-metrics";
import { SynthesisCard } from "@/components/inspection/synthesis-card";
import { SuggestionsCard } from "@/components/inspection/suggestions-card";
import { useMyOrgs } from "@/hooks/use-orgs";
import { useTemplate } from "@/hooks/use-templates";
import { SEVERITY, severityShort } from "@/components/inspection/severity";
import type { InspectionPass } from "@/lib/inspection";
import type { InspectionFinding } from "@/types";

export const Route = createFileRoute("/inspections/$inspectionId")({
  component: InspectionPage,
});

function InspectionPage() {
  const { inspectionId } = Route.useParams();
  const { user } = useAuth();
  const { data, isLoading } = useInspection(inspectionId);
  const { data: sets } = useHeuristicSets();
  // Model suggestions are off unless the study's organization opted in.
  const { data: template } = useTemplate(data?.inspection.template_id);
  const { data: orgs } = useMyOrgs();
  const aiEnabled = !!orgs?.find((o) => o.id === template?.org_id)?.ai_suggestions_enabled;

  const join = useJoinInspection();
  const submit = useSubmitPass();
  const closeCollection = useCloseCollection();

  if (isLoading || !data) {
    return (
      <PageWrapper help="inspection" title="Inspection">
        <p className="text-sm text-muted-foreground">Loading inspection...</p>
      </PageWrapper>
    );
  }

  const { inspection, evaluators, findings, problems } = data;
  const me = evaluators.find((e) => e.user_id === user?.id);
  const mySubmitted = !!me?.submitted_at;
  const collecting = inspection.status === "collecting";
  const heuristics =
    sets?.find((s) => s.id === inspection.heuristic_set_id)?.heuristics ?? [];

  const myFindings = findings.filter((f) => f.evaluator_id === me?.id);
  const othersFindings = findings.filter((f) => f.evaluator_id !== me?.id);
  const submittedCount = evaluators.filter((e) => e.submitted_at).length;

  const label = (evaluatorId: string) => {
    const e = evaluators.find((x) => x.id === evaluatorId);
    if (!e) return "someone";
    if (e.user_id === user?.id) return "you";
    return `evaluator ${evaluators.indexOf(e) + 1}`;
  };

  // Only findings that have been merged into a problem carry an identity the
  // statistics can compare. Unmerged ones are still one person's wording.
  const passes: InspectionPass[] = evaluators.map((e) => {
    const mine = findings.filter((f) => f.evaluator_id === e.id && f.problem_id);
    const severity: Record<string, number> = {};
    for (const f of mine) {
      if (f.problem_id && f.severity !== null) severity[f.problem_id] = f.severity;
    }
    return {
      evaluatorId: e.id,
      problemIds: mine.map((f) => f.problem_id!) as string[],
      severity,
    };
  });

  return (
    <PageWrapper help="inspection" title={inspection.subject_name}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              to="/templates/$templateId"
              params={{ templateId: inspection.template_id }}
              className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to the study
            </Link>
            <p className="text-sm text-muted-foreground">
              {inspection.subject_kind === "own"
                ? "Inspecting your own design"
                : "Inspecting a comparable product"}
              {inspection.subject_url ? ` at ${inspection.subject_url}` : ""}
            </p>
          </div>
          <Badge variant={collecting ? "outline" : "secondary"} className="gap-1">
            {collecting ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {collecting
              ? `Independent passes: ${submittedCount} of ${evaluators.length} in`
              : inspection.status === "consolidating"
                ? "Merging findings"
                : "Closed"}
          </Badge>
        </div>

        {collecting && (
          <Card className="border-primary/30 bg-transparent backdrop-blur-md">
            <CardContent className="p-4 text-sm leading-relaxed">
              <p className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  Work alone until you submit. You cannot see anyone else's
                  findings yet, and they cannot see yours. This is not etiquette:
                  reading a teammate's list first would anchor you to it, and the
                  agreement figure at the end would measure nothing.
                </span>
              </p>
            </CardContent>
          </Card>
        )}

        {!me && collecting && user && (
          <Card className="bg-transparent backdrop-blur-md">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <span>You are not one of the evaluators on this inspection.</span>
              <Button
                size="sm"
                onClick={() =>
                  join.mutate(
                    { inspectionId, userId: user.id },
                    {
                      onSuccess: () => toast.success("You joined as an evaluator"),
                      onError: (e: unknown) =>
                        toast.error(e instanceof Error ? e.message : "Could not join"),
                    },
                  )
                }
              >
                Join as an evaluator
              </Button>
            </CardContent>
          </Card>
        )}

        {me && collecting && !mySubmitted && (
          <PassEditor
            inspectionId={inspectionId}
            evaluatorId={me.id}
            findings={myFindings}
            heuristics={heuristics}
            onSubmit={() =>
              submit.mutate(inspectionId, {
                onSuccess: () =>
                  toast.success("Pass submitted. It is now frozen."),
                onError: (e: unknown) =>
                  toast.error(e instanceof Error ? e.message : "Could not submit"),
              })
            }
            submitting={submit.isPending}
          />
        )}

        {me && collecting && mySubmitted && (
          <Card className="bg-transparent backdrop-blur-md">
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                Your pass is in, with {myFindings.length}{" "}
                {myFindings.length === 1 ? "finding" : "findings"}.
              </p>
              <p className="text-muted-foreground">
                It is frozen now, so the comparison is over what you found on
                your own. Waiting for{" "}
                {evaluators.length - submittedCount} more.
              </p>
            </CardContent>
          </Card>
        )}

        {collecting && submittedCount < evaluators.length && (
          <CloseCollectionButton
            onConfirm={() =>
              closeCollection.mutate(inspectionId, {
                onSuccess: () => toast.success("Collection closed"),
                onError: (e: unknown) =>
                  toast.error(e instanceof Error ? e.message : "Could not close"),
              })
            }
            remaining={evaluators.length - submittedCount}
          />
        )}

        {!collecting && (
          <SuggestionsCard
            inspectionId={inspectionId}
            enabled={aiEnabled}
            findings={findings}
            heuristics={heuristics}
          />
        )}

        {!collecting && (
          <Consolidation
            inspectionId={inspectionId}
            templateId={inspection.template_id}
            findings={findings}
            problems={problems}
            label={label}
          />
        )}

        {!collecting && <InspectionMetrics passes={passes} evaluatorLabel={label} />}

        {!collecting && problems.length > 0 && (
          <SynthesisCard
            inspectionId={inspectionId}
            templateId={inspection.template_id}
            problems={problems}
          />
        )}

        {collecting && othersFindings.length > 0 && (
          <Card className="bg-transparent backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base">
                Other submitted passes ({othersFindings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {othersFindings.map((f) => (
                  <li key={f.id} className="rounded-md border p-2">
                    <span className="text-xs text-muted-foreground">
                      {label(f.evaluator_id)}, {severityShort(f.severity)}
                    </span>
                    <p>{f.description}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}

function CloseCollectionButton({
  onConfirm,
  remaining,
}: {
  onConfirm: () => void;
  remaining: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        tooltip="For an evaluator who will not finish: freezes every unsubmitted pass as it stands"
        onClick={() => setOpen(true)}
      >
        End collection without waiting
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="End collection now?"
        description={`${remaining} ${
          remaining === 1 ? "evaluator has" : "evaluators have"
        } not submitted. Their passes will be frozen exactly as they stand and cannot be added to afterwards. Only do this if they are not going to finish.`}
        confirmLabel="End collection"
        onConfirm={onConfirm}
      />
    </>
  );
}

function PassEditor({
  inspectionId,
  evaluatorId,
  findings,
  heuristics,
  onSubmit,
  submitting,
}: {
  inspectionId: string;
  evaluatorId: string;
  findings: InspectionFinding[];
  heuristics: { id: string; code: string | null; name: string }[];
  onSubmit: () => void;
  submitting: boolean;
}) {
  const add = useAddFinding();
  const del = useDeleteFinding();
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [heuristicId, setHeuristicId] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const canAdd = description.trim().length > 0;

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-base">Your pass</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-3 rounded-md border p-3">
          <div className="space-y-1.5">
            <Label htmlFor="desc">What is the problem?</Label>
            <Textarea
              id="desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what a user would struggle with, not the fix."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="loc">Where</Label>
              <Input
                id="loc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Checkout, step 2"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Heuristic</Label>
              <Select value={heuristicId} onValueChange={setHeuristicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Which one" />
                </SelectTrigger>
                <SelectContent>
                  {heuristics.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.code ? `${h.code}. ` : ""}
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="How bad" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY.map((s) => (
                    <SelectItem key={s.value} value={String(s.value)}>
                      {s.value}. {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            size="sm"
            disabled={!canAdd || add.isPending}
            onClick={() =>
              add.mutate(
                {
                  inspectionId,
                  evaluatorId,
                  description: description.trim(),
                  location: location.trim() || null,
                  heuristicId: heuristicId || null,
                  severity: severity === "" ? null : Number(severity),
                },
                {
                  onSuccess: () => {
                    setDescription("");
                    setLocation("");
                    setSeverity("");
                  },
                  onError: (e: unknown) =>
                    toast.error(e instanceof Error ? e.message : "Could not add"),
                },
              )
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add finding
          </Button>
        </div>

        {findings.length === 0 ? (
          <p className="text-muted-foreground">
            No findings yet. Walk the interface heuristic by heuristic rather
            than screen by screen; it turns up different problems.
          </p>
        ) : (
          <ul className="space-y-2">
            {findings.map((f) => (
              <li
                key={f.id}
                className="flex items-start justify-between gap-3 rounded-md border p-2"
              >
                <div>
                  <p>{f.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.location ? `${f.location}. ` : ""}
                    {severityShort(f.severity)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => del.mutate({ inspectionId, findingId: f.id })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t pt-3">
          <Button
            size="sm"
            tooltip={
              findings.length === 0
                ? "Add at least one finding first"
                : "Freeze your pass and unlock the passes of others who have submitted"
            }
            disabled={submitting || findings.length === 0}
            onClick={() => setConfirmSubmit(true)}
          >
            <Send className="mr-2 h-4 w-4" />
            Submit my pass
          </Button>
          <span className="text-xs text-muted-foreground">
            Submitting is final. You will be able to read the others, and none
            of you can edit afterwards.
          </span>
        </div>

        <ConfirmDialog
          open={confirmSubmit}
          onOpenChange={setConfirmSubmit}
          title="Submit your pass?"
          description={`Your ${findings.length} ${
            findings.length === 1 ? "finding" : "findings"
          } will be frozen. You cannot add, edit or remove any of them afterwards, because the agreement statistic only means something if it compares what each of you found alone.`}
          confirmLabel="Submit and freeze"
          onConfirm={onSubmit}
        />
      </CardContent>
    </Card>
  );
}

function Consolidation({
  inspectionId,
  templateId,
  findings,
  problems,
  label,
}: {
  inspectionId: string;
  templateId: string;
  findings: InspectionFinding[];
  problems: { id: string; title: string; agreed_severity: number | null }[];
  label: (evaluatorId: string) => string;
}) {
  const createProblem = useCreateProblem();
  const assign = useAssignFindingToProblem();
  const derive = useDeriveTaskFromProblem();
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const unmerged = useMemo(
    () => findings.filter((f) => !f.problem_id),
    [findings],
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-base">Merge into one problem list</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-xs text-muted-foreground">
          Two people describing the same problem in different words is one
          problem. Decide together, then give it a single agreed severity. Only
          merged problems are counted in the statistics, because only they have
          an identity that can be compared across passes.
        </p>

        {unmerged.length > 0 && (
          <div className="space-y-3 rounded-md border p-3">
            <p className="font-medium">
              Not yet merged ({unmerged.length})
            </p>
            <ul className="space-y-1">
              {unmerged.map((f) => (
                <li key={f.id}>
                  <label className="flex cursor-pointer items-start gap-2 rounded p-1 hover:bg-muted/50">
                    <input
                      type="checkbox"
                      className="mt-1 cursor-pointer"
                      checked={selected.has(f.id)}
                      onChange={() => toggle(f.id)}
                    />
                    <span>
                      {f.description}
                      <span className="block text-xs text-muted-foreground">
                        {label(f.evaluator_id)}, {severityShort(f.severity)}
                        {f.location ? `, ${f.location}` : ""}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-end gap-2 border-t pt-3">
              <div className="min-w-48 flex-1 space-y-1.5">
                <Label htmlFor="ptitle">Agreed wording</Label>
                <Input
                  id="ptitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="One sentence you all accept"
                />
              </div>
              <Button
                size="sm"
                tooltip={
                  selected.size === 0
                    ? "Tick the findings that describe the same problem"
                    : !title.trim()
                      ? "Write one wording you all accept"
                      : "Combine the ticked findings into one problem"
                }
                disabled={!title.trim() || selected.size === 0 || createProblem.isPending}
                onClick={() =>
                  createProblem.mutate(
                    {
                      inspectionId,
                      title: title.trim(),
                      agreedSeverity: null,
                      heuristicId: null,
                      findingIds: [...selected],
                    },
                    {
                      onSuccess: () => {
                        setTitle("");
                        setSelected(new Set());
                        toast.success("Merged");
                      },
                      onError: (e: unknown) =>
                        toast.error(e instanceof Error ? e.message : "Could not merge"),
                    },
                  )
                }
              >
                Merge {selected.size > 0 ? `${selected.size} ` : ""}into a problem
              </Button>
            </div>
          </div>
        )}

        {problems.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium">The problem list ({problems.length})</p>
            <ul className="space-y-2">
              {problems.map((p, i) => {
                const merged = findings.filter((f) => f.problem_id === p.id);
                return (
                  <li key={p.id} className="rounded-md border p-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p>{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Found by {merged.length}{" "}
                          {merged.length === 1 ? "evaluator" : "evaluators"}
                          {merged.length === 1 ? ", and nobody else saw it" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {merged.length === 1 && (
                          <Badge variant="outline" className="text-xs">
                            unique
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          tooltip="Add this problem as a task on the study, linked back to this inspection"
                          disabled={derive.isPending}
                          onClick={() =>
                            derive.mutate(
                              {
                                inspectionId,
                                templateId,
                                problem: p as never,
                                sortOrder: i,
                              },
                              {
                                onSuccess: () =>
                                  toast.success("Added as a task on the study"),
                                onError: (e: unknown) =>
                                  toast.error(
                                    e instanceof Error ? e.message : "Could not add",
                                  ),
                              },
                            )
                          }
                        >
                          Test this in a session
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {unmerged.length === 0 && problems.length === 0 && (
          <p className="text-muted-foreground">Nothing was found to merge.</p>
        )}

        {assign.isError && (
          <p className="text-xs text-destructive">Could not move that finding.</p>
        )}
      </CardContent>
    </Card>
  );
}
