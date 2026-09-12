import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScanSearch, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  useCreateInspection,
  useHeuristicSets,
  useInspections,
  useSetRequireInspection,
} from "@/hooks/use-inspections";
import type { InspectionSubjectKind, TemplateWithRelations } from "@/types";
import type { OrgRole } from "@/lib/review-gate";

const STATUS_LABEL: Record<string, string> = {
  collecting: "Passes in progress",
  consolidating: "Merging findings",
  closed: "Closed",
};

/**
 * Heuristic inspection, on the study it belongs to.
 *
 * This is the stage before a usability test: evaluators inspect the design, or
 * a comparable product, against a set of heuristics, and the merged problem
 * list is what the test's tasks are then written to confirm.
 */
export function InspectionListCard({
  template,
  role,
  canEdit,
}: {
  template: TemplateWithRelations;
  role: OrgRole;
  canEdit: boolean;
}) {
  const { user } = useAuth();
  const { data: inspections } = useInspections(template.id);
  const { data: sets } = useHeuristicSets();
  const create = useCreateInspection();
  const setRequired = useSetRequireInspection();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<InspectionSubjectKind>("own");
  const [setId, setSetId] = useState<string>("");

  const builtin = sets?.find((s) => s.is_builtin);
  const chosenSet = setId || builtin?.id || "";

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <ScanSearch className="h-4 w-4 text-primary" />
          Heuristic inspection
          {template.require_inspection && (
            <Badge variant="secondary">Required before review</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {(inspections?.length ?? 0) === 0 && !open && (
          <p className="text-muted-foreground">
            Nothing inspected yet. Inspection needs no participants and no
            ethical approval, and the problems it turns up are what a session's
            tasks are written to confirm. A team with no prototype yet can
            inspect a comparable product instead.
          </p>
        )}

        {inspections && inspections.length > 0 && (
          <ul className="space-y-2">
            {inspections.map((i) => (
              <li key={i.id}>
                <Link
                  to="/inspections/$inspectionId"
                  params={{ inspectionId: i.id }}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 hover:bg-muted/50"
                >
                  <span>
                    {i.subject_name}
                    <span className="block text-xs text-muted-foreground">
                      {i.subject_kind === "own"
                        ? "Your own design"
                        : "A comparable product"}
                    </span>
                  </span>
                  <Badge variant={i.status === "closed" ? "secondary" : "outline"}>
                    {STATUS_LABEL[i.status] ?? i.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {canEdit && !open && (
          <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Start an inspection
          </Button>
        )}

        {canEdit && open && (
          <div className="space-y-3 rounded-md border p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="subject">What is being inspected</Label>
                <Input
                  id="subject"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Our prototype v2, or a competitor's app"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kind</Label>
                <Select
                  value={kind}
                  onValueChange={(v) => setKind(v as InspectionSubjectKind)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="own">Our own design</SelectItem>
                    <SelectItem value="comparator">A comparable product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="url">Where it lives (optional)</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Heuristics</Label>
                <Select value={chosenSet} onValueChange={setSetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a set" />
                  </SelectTrigger>
                  <SelectContent>
                    {sets?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={!name.trim() || !user || create.isPending}
                onClick={() =>
                  create.mutate(
                    {
                      templateId: template.id,
                      subjectName: name.trim(),
                      subjectKind: kind,
                      subjectUrl: url.trim() || null,
                      heuristicSetId: chosenSet || null,
                      userId: user!.id,
                    },
                    {
                      onSuccess: () => {
                        setName("");
                        setUrl("");
                        setOpen(false);
                        toast.success("Inspection started");
                      },
                      onError: (e: unknown) =>
                        toast.error(e instanceof Error ? e.message : "Could not start"),
                    },
                  )
                }
              >
                Start
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="cursor-pointer"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Everyone on the study can join as an evaluator. Each works alone
              until they submit, which is what makes the agreement figure at the
              end mean anything.
            </p>
          </div>
        )}

        {role === "owner" && template.org_id && (
          <label className="flex cursor-pointer items-start gap-2 border-t pt-3 text-xs">
            <input
              type="checkbox"
              className="mt-0.5 cursor-pointer"
              checked={template.require_inspection}
              disabled={setRequired.isPending}
              onChange={(e) =>
                setRequired.mutate(
                  { templateId: template.id, required: e.target.checked },
                  {
                    onError: (err: unknown) =>
                      toast.error(
                        err instanceof Error ? err.message : "Could not update",
                      ),
                  },
                )
              }
            />
            <span>
              Require a merged inspection before this protocol can be sent for
              review. Opt-in, like the review itself: turn it on for the studies
              where the inspection is part of the assignment.
            </span>
          </label>
        )}
      </CardContent>
    </Card>
  );
}
