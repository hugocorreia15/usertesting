import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ConsentBuilderDialog } from "@/components/templates/consent-builder-dialog";
import { consentGaps } from "@/lib/consent-clauses";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  useApplyOrgDefaults,
  useDeleteOrg,
  useUpdateOrg,
} from "@/hooks/use-orgs";
import { REVIEW_MODES, type ReviewMode } from "@/lib/review-gate";
import { INSTRUMENT_KEYS, INSTRUMENTS, SUS_KEY } from "@/lib/instruments";
import type { OrganizationWithRelations } from "@/types";

/**
 * Organization settings, owner only.
 *
 * The three defaults are inherited by a project when it is shared into the
 * organization. Changing one here does not rewrite projects already shared,
 * because silently forcing approval onto a running study would be worse than
 * the setting appearing not to apply; "Apply to existing projects" retrofits
 * deliberately and says how many it touched.
 */
export function OrgSettingsDialog({
  org,
  projectCount,
}: {
  org: OrganizationWithRelations;
  projectCount: number;
}) {
  const navigate = useNavigate();
  const updateOrg = useUpdateOrg();
  const applyDefaults = useApplyOrgDefaults();
  const deleteOrg = useDeleteOrg();

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [name, setName] = useState(org.name);
  const [reviewMode, setReviewMode] = useState<ReviewMode>(
    org.default_review_mode,
  );
  const [consent, setConsent] = useState(org.default_consent_text ?? "");
  const [instruments, setInstruments] = useState<string[]>(
    org.default_instruments ?? [],
  );

  const [aiEnabled, setAiEnabled] = useState(org.ai_suggestions_enabled);

  const [applyReview, setApplyReview] = useState(false);
  const [applyConsent, setApplyConsent] = useState(false);
  const [applyInstruments, setApplyInstruments] = useState(false);
  const anyToApply = applyReview || applyConsent || applyInstruments;

  const busy = updateOrg.isPending || applyDefaults.isPending;

  const toggleInstrument = (key: string, on: boolean) =>
    setInstruments((prev) =>
      on ? [...prev, key] : prev.filter((k) => k !== key),
    );

  const save = async () => {
    if (!name.trim()) {
      toast.error("The organization needs a name");
      return;
    }
    try {
      await updateOrg.mutateAsync({
        orgId: org.id,
        name: name.trim(),
        default_review_mode: reviewMode,
        default_consent_text: consent.trim() || null,
        default_instruments: instruments,
        ai_suggestions_enabled: aiEnabled,
      });
      if (anyToApply) {
        const touched = await applyDefaults.mutateAsync({
          orgId: org.id,
          review: applyReview,
          consent: applyConsent,
          instruments: applyInstruments,
        });
        toast.success(
          `Settings saved and applied to ${touched} ${touched === 1 ? "project" : "projects"}`,
        );
      } else {
        toast.success("Settings saved");
      }
      setApplyReview(false);
      setApplyConsent(false);
      setApplyInstruments(false);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save settings");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Organization settings</DialogTitle>
            <DialogDescription>
              Defaults apply to a project when it is shared with this
              organization. Existing projects keep their own settings unless
              you apply them below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-review">Instructor review</Label>
              <Select
                value={reviewMode}
                onValueChange={(v) => setReviewMode(v as ReviewMode)}
              >
                <SelectTrigger id="org-review">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {REVIEW_MODES.find((m) => m.value === reviewMode)?.hint}
              </p>
              {projectCount > 0 && (
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={applyReview}
                    onCheckedChange={(c) => setApplyReview(c === true)}
                  />
                  Apply to the {projectCount} existing{" "}
                  {projectCount === 1 ? "project" : "projects"}
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label>Questionnaires</Label>
              <p className="text-xs text-muted-foreground">
                Administered at the end of a session. Setting them here keeps
                results comparable across teams.
              </p>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={instruments.includes(SUS_KEY)}
                  onCheckedChange={(c) => toggleInstrument(SUS_KEY, c === true)}
                />
                SUS
              </label>
              {INSTRUMENT_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={instruments.includes(key)}
                    onCheckedChange={(c) => toggleInstrument(key, c === true)}
                  />
                  {INSTRUMENTS[key].name}
                </label>
              ))}
              {projectCount > 0 && (
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={applyInstruments}
                    onCheckedChange={(c) => setApplyInstruments(c === true)}
                  />
                  Apply to the {projectCount} existing{" "}
                  {projectCount === 1 ? "project" : "projects"}
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label>Model suggestions</Label>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={aiEnabled}
                  onCheckedChange={(c) => setAiEnabled(c === true)}
                  className="mt-0.5"
                />
                <span>
                  Let teams ask a model to propose how their inspection findings
                  group into problems.
                </span>
              </label>
              <p className="text-xs text-muted-foreground">
                Off by default. Only the findings your students wrote are sent,
                never participant answers, notes, reflections, or names, and only
                once every evaluator has submitted, so nobody can read a model's
                list before writing their own. Nothing is applied automatically:
                a team accepts a grouping, and what it accepts is recorded as
                assisted.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="org-consent">Consent text</Label>
                <ConsentBuilderDialog value={consent} onApply={setConsent} />
              </div>
              <Textarea
                id="org-consent"
                rows={5}
                value={consent}
                onChange={(e) => setConsent(e.target.value)}
                placeholder="Shown to participants on the join form before any data is collected. A shared class text saves every team writing their own."
              />
              {consent.trim() && consentGaps(consent).length > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Every team starting from this text would be missing something
                  participants usually need: {consentGaps(consent).join(", ")}.
                </p>
              )}
              {projectCount > 0 && (
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={applyConsent}
                    onCheckedChange={(c) => setApplyConsent(c === true)}
                  />
                  Apply to the {projectCount} existing{" "}
                  {projectCount === 1 ? "project" : "projects"}, replacing
                  their consent text
                </label>
              )}
            </div>

            <div className="border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete organization
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={busy}>
              {anyToApply && <Wand2 className="mr-2 h-4 w-4" />}
              {busy ? "Saving..." : anyToApply ? "Save and apply" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete organization"
        description={`Delete "${org.name}"? Projects shared with it revert to private and members lose shared access. No project or session data is deleted. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() =>
          deleteOrg.mutate(org.id, {
            onSuccess: () => {
              toast.success("Organization deleted");
              navigate({ to: "/organizations" });
            },
            onError: () => toast.error("Failed to delete organization"),
          })
        }
      />
    </>
  );
}
