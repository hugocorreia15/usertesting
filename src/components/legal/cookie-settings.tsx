import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  acceptAll,
  allows,
  readConsent,
  rejectAll,
  writeConsent,
  type OptionalPurpose,
} from "@/lib/consent-preferences";
import { useConsent } from "@/hooks/use-consent";

const PURPOSES: {
  id: OptionalPurpose;
  label: string;
  body: string;
}[] = [
  {
    id: "monitoring",
    label: "Error monitoring",
    body: "Reports faults to Sentry so they can be fixed. It is configured to send no personal data and no recordings of your session; what it attaches are opaque identifiers that mean nothing without this platform's own database.",
  },
  {
    id: "embeds",
    label: "Embedded video",
    body: "Lets the walkthrough on the help page load its player, which means your browser contacts YouTube or Vimeo. Leaving this off shows a placeholder with a button instead, so you can still choose to load it once.",
  },
];

/** The settings themselves, shared by the banner and the policy page. */
function ConsentForm({
  onDone,
  showReject = true,
}: {
  onDone: () => void;
  showReject?: boolean;
}) {
  const current = readConsent();
  const [choices, setChoices] = useState<Record<OptionalPurpose, boolean>>({
    monitoring: allows(current, "monitoring"),
    embeds: allows(current, "embeds"),
  });

  const save = (next: Record<OptionalPurpose, boolean>) => {
    writeConsent(next);
    onDone();
  };

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
          Signing in, your language and theme, and the live session timer are
          strictly necessary and are not listed here, because the service cannot
          work without them. None of them tracks you. The{" "}
          <Link className="underline" to="/legal/cookies" onClick={onDone}>
            cookie policy
          </Link>{" "}
          lists every one by name.
        </div>

        {PURPOSES.map((p) => (
          <label key={p.id} className="flex items-start gap-3">
            <Checkbox
              checked={choices[p.id]}
              onCheckedChange={(c) =>
                setChoices((s) => ({ ...s, [p.id]: c === true }))
              }
              className="mt-0.5"
            />
            <span>
              <Label className="cursor-pointer">{p.label}</Label>
              <span className="mt-1 block text-xs text-muted-foreground">{p.body}</span>
            </span>
          </label>
        ))}
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        {showReject && (
          <Button
            variant="ghost"
            className="cursor-pointer"
            tooltip="Record that you declined both. Nothing optional will run."
            onClick={() => save(rejectAll())}
          >
            Reject optional
          </Button>
        )}
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => save(choices)}
        >
          Save choices
        </Button>
        <Button className="cursor-pointer" onClick={() => save(acceptAll())}>
          Accept all
        </Button>
      </DialogFooter>
    </>
  );
}

/** Opens the settings from anywhere: the footer, or the cookie policy. */
export function CookieSettingsButton({
  variant = "outline",
  label = "Cookie settings",
  onSaved,
}: {
  variant?: "outline" | "link" | "ghost";
  label?: string;
  /** So a banner containing this can close once a choice is made in it. */
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={variant} className="cursor-pointer">
          <Cookie className="mr-1.5 h-3.5 w-3.5" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cookie settings</DialogTitle>
          <DialogDescription>
            Two things here are optional. Both are off until you say otherwise,
            and you can change this at any time.
          </DialogDescription>
        </DialogHeader>
        <ConsentForm
          onDone={() => {
            setOpen(false);
            onSaved?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Asked once, on the first visit, and never again once answered either way.
 *
 * Rejecting is one click and sits beside accepting, because consent that is
 * harder to refuse than to give is not freely given. Nothing optional runs
 * while this is open.
 */
export function CookieBanner() {
  const { pending } = useConsent();

  if (!pending) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 p-4 shadow-lg backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          This site stores only what it needs to work. Error monitoring and the
          embedded walkthrough video are optional and currently off.{" "}
          <Link className="underline" to="/legal/cookies">
            What is stored
          </Link>
          .
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="cursor-pointer"
            onClick={() => writeConsent(rejectAll())}
          >
            Reject optional
          </Button>
          <CookieSettingsButton variant="outline" label="Choose" />
          <Button
            size="sm"
            className="cursor-pointer"
            onClick={() => writeConsent(acceptAll())}
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
