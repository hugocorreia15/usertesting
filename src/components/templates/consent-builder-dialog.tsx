import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CONSENT_CLAUSES,
  clausesPresentIn,
  composeConsent,
  recommendedClauseIds,
} from "@/lib/consent-clauses";
import { useAiConsentClause } from "@/hooks/use-session-summary-support";

/**
 * Build a consent text from the pieces it is normally made of.
 *
 * Most of a consent text is the same in every study: taking part is voluntary,
 * you may stop, results are reported without names. Only the purpose really
 * changes. Ticking the standard parts leaves the study specific sentence as the
 * only thing anyone has to write, and makes an omission visible rather than
 * invisible.
 *
 * The clause about automated processing is read from the database, so what is
 * inserted is exactly what set_participant_text_ai() later checks for.
 *
 * The body is a separate component on purpose. Radix mounts dialog content only
 * while the dialog is open, so the query for that clause runs when someone
 * opens this and never merely because a form containing it was rendered.
 */
export function ConsentBuilderDialog({
  value,
  onApply,
  orgDefault,
}: {
  value: string;
  onApply: (text: string) => void;
  orgDefault?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="cursor-pointer"
          tooltip="Build the text from the parts a consent form is normally made of"
        >
          <FileText className="mr-1.5 h-3.5 w-3.5" />
          Build it
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <ConsentBuilderBody
          value={value}
          orgDefault={orgDefault}
          onApply={(text) => {
            onApply(text);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

/** Everything that a consent text is not is the study's own sentence. */
function purposeWithin(value: string, aiClause: string | null | undefined): string {
  const withoutAi = aiClause ? value.split(aiClause).join(" ") : value;
  return CONSENT_CLAUSES.reduce((acc, c) => acc.split(c.sentence).join(" "), withoutAi)
    .replace(/\s+/g, " ")
    .trim();
}

function ConsentBuilderBody({
  value,
  onApply,
  onCancel,
  orgDefault,
}: {
  value: string;
  onApply: (text: string) => void;
  onCancel: () => void;
  orgDefault?: string | null;
}) {
  const { data: aiClause } = useAiConsentClause();

  // Mounting coincides with opening, so the initial state is the study as it
  // stands: what is already written stays ticked, and a study with nothing yet
  // starts from the clauses whose absence is always an oversight.
  const present = clausesPresentIn(value);
  const [selected, setSelected] = useState<string[]>(
    present.length > 0 || value.trim() ? present : recommendedClauseIds(),
  );
  const [purpose, setPurpose] = useState(() => purposeWithin(value, aiClause));
  const [withAi, setWithAi] = useState(false);
  const [contact, setContact] = useState("");
  const [aiSeen, setAiSeen] = useState(false);

  // The clause arrives after the first render. Reconcile once, without an
  // effect: it is derived state, and only the first sighting can change it.
  if (aiClause && !aiSeen) {
    setAiSeen(true);
    setWithAi(value.includes(aiClause));
    setPurpose(purposeWithin(value, aiClause));
  }

  const preview = useMemo(
    () => composeConsent({ purpose, selected, aiClause: withAi ? aiClause : null, contact }),
    [purpose, selected, withAi, aiClause, contact],
  );

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <>
      <DialogHeader>
        <DialogTitle>Consent text</DialogTitle>
        <DialogDescription>
          Most of this is the same in every study. Write what your study is
          about, tick the rest, and read the result as a participant would.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="consent_purpose">What this study is about</Label>
          <Textarea
            id="consent_purpose"
            rows={2}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="We are testing a booking site for a public library, to find where it is confusing."
          />
          <p className="text-xs text-muted-foreground">
            In plain words. A participant who cannot follow this has not
            consented to anything.
          </p>
        </div>

        <div className="space-y-2">
          <Label>What participants are told</Label>
          <div className="space-y-2 rounded-md border p-3">
            {CONSENT_CLAUSES.map((clause) => (
              <label key={clause.id} className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={selected.includes(clause.id)}
                  onCheckedChange={() => toggle(clause.id)}
                  className="mt-0.5"
                />
                <span>
                  {clause.label}
                  {clause.hint && (
                    <span className="block text-xs text-muted-foreground">{clause.hint}</span>
                  )}
                </span>
              </label>
            ))}

            <label className="flex items-start gap-2 border-t pt-2 text-sm">
              <Checkbox
                checked={withAi}
                disabled={!aiClause}
                onCheckedChange={(c) => setWithAi(c === true)}
                className="mt-0.5"
              />
              <span>
                Their written answers may be read by a language model
                <span className="block text-xs text-muted-foreground">
                  Needed before this study can include participant answers in a
                  session summary. Tick it before running sessions: it applies
                  only to people who actually see it.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="consent_contact">Who to contact (optional)</Label>
          <Input
            id="consent_contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="ana@university.edu"
          />
        </div>

        <div className="space-y-1">
          <Label>What a participant will read</Label>
          <p className="min-h-16 whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm">
            {preview || "Nothing yet. Tick something above."}
          </p>
        </div>

        {orgDefault?.trim() && orgDefault.trim() !== value.trim() && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="cursor-pointer"
            tooltip="Replace everything above with the text your organization set as its default"
            onClick={() => onApply(orgDefault.trim())}
          >
            Use the organization's default instead
          </Button>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" className="cursor-pointer" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          className="cursor-pointer"
          disabled={!preview}
          tooltip="Put this in the consent field. Nothing is saved until you save the template."
          onClick={() => onApply(preview)}
        >
          Use this text
        </Button>
      </DialogFooter>
    </>
  );
}
