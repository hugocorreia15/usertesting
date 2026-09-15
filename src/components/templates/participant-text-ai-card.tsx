import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  useAiConsentClause,
  useAppendConsentClause,
  useSetParticipantTextAi,
} from "@/hooks/use-session-summary-support";
import type { Template } from "@/types";

/**
 * Whether a model may read what participants wrote, decided per study.
 *
 * Separate from the organization setting on purpose. The organization decides
 * whether student work may be sent at all; only the person running a study can
 * know what its participants were told. The database refuses to turn this on
 * until the consent text carries the clause, and refuses every session whose
 * participant accepted before it did, so a study that has already run can
 * never be swept in by a later tick.
 */
export function ParticipantTextAiCard({
  template,
  isOwner,
  orgEnabled,
}: {
  template: Template;
  /** Only an organization owner may change this. */
  isOwner: boolean;
  /** The organization enabled model suggestions at all. */
  orgEnabled: boolean;
}) {
  const { data: clause } = useAiConsentClause(orgEnabled);
  const setEnabled = useSetParticipantTextAi();
  const appendClause = useAppendConsentClause();

  if (!orgEnabled || !isOwner) return null;

  const consent = template.consent_text ?? "";
  const hasClause = !!clause && consent.includes(clause);
  const on = !!template.ai_participant_text_enabled;

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Participant answers in the summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-muted-foreground">
          The session summary always reads what your team wrote. This decides
          whether it may also read what participants wrote. It applies only to
          sessions whose participant accepted a consent text containing the
          clause below, so sessions already run stay out of it permanently.
        </p>

        {!hasClause && (
          <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
            <p className="text-xs">
              This study's consent text does not say anything about automated
              processing, so this cannot be turned on. The sentence participants
              need to see is:
            </p>
            <p className="rounded bg-muted/50 p-2 text-xs italic">{clause}</p>
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer"
              disabled={!clause || appendClause.isPending}
              tooltip="Add the sentence to the end of this study's consent text"
              onClick={() =>
                appendClause.mutate(
                  { templateId: template.id, consentText: consent, clause: clause! },
                  {
                    onSuccess: () => toast.success("Added to the consent text"),
                    onError: (e: unknown) =>
                      toast.error(e instanceof Error ? e.message : "Could not update"),
                  },
                )
              }
            >
              Add it to the consent text
            </Button>
            <p className="text-xs text-muted-foreground">
              Participants who already took part will not see it, and are
              excluded whatever you do here.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 rounded-md border px-4 py-3">
          <div className="space-y-0.5">
            <Label htmlFor="participant_text_ai">Send participant answers</Label>
            <p className="text-xs text-muted-foreground">
              {on
                ? "On for sessions that consented after it was turned on."
                : "Off. Only what your team wrote is sent."}
            </p>
          </div>
          <Checkbox
            id="participant_text_ai"
            checked={on}
            disabled={!hasClause || setEnabled.isPending}
            onCheckedChange={(next) =>
              setEnabled.mutate(
                { templateId: template.id, enable: next === true },
                {
                  onError: (e: unknown) =>
                    toast.error(e instanceof Error ? e.message : "Could not change this"),
                },
              )
            }
          />
        </div>

        {template.ai_participant_text_from && (
          <p className="text-xs text-muted-foreground">
            Eligible from{" "}
            {new Date(template.ai_participant_text_from).toLocaleString()}. Sessions
            that consented before that are never included, even if this is
            switched off and on again.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
