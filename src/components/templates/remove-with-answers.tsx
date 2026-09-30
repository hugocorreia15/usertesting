import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * A remove button that says what removing something answered actually does.
 *
 * Since migration 063 this destroys nothing: a question participants have
 * answered is archived rather than deleted, keeping its wording and every
 * answer for reports and exports. It still leaves the protocol, so sessions
 * from here on will not ask it, and that is worth confirming rather than doing
 * on one click.
 *
 * With nothing recorded against it, which is the ordinary case while a
 * protocol is still being written, it removes immediately and asks nothing.
 */
export function RemoveWithAnswers({
  label,
  noun,
  count,
  onRemove,
}: {
  /** What is being removed, quoted back so the dialog is unambiguous. */
  label: string;
  /** "answer", "logged error": what the count counts. */
  noun: string;
  count: number;
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const plural = count === 1 ? noun : `${noun}s`;
  const named = label.trim() ? `"${label.trim()}"` : "this item";

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={count > 0 ? `Remove ${label}, ${count} ${plural} recorded` : `Remove ${label}`}
        className={
          count > 0
            ? "text-amber-600 hover:text-destructive dark:text-amber-400"
            : "text-muted-foreground hover:text-destructive"
        }
        tooltip={
          count > 0
            ? `${count} ${plural} recorded. Removing this keeps them and stops asking it.`
            : "Remove"
        }
        onClick={() => (count > 0 ? setConfirming(true) : onRemove())}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <ConfirmDialog
        open={confirming}
        onOpenChange={(o) => !o && setConfirming(false)}
        title="Remove it from the protocol?"
        description={
          `${named} has ${count} ${plural} recorded against it. ` +
          `${count === 1 ? "That answer is" : "Those answers are"} kept: it is archived rather than deleted, ` +
          `so your reports and exports still include ${count === 1 ? "it" : "them"}. ` +
          `Sessions from now on will not ask it.`
        }
        confirmLabel="Remove from the protocol"
        onConfirm={() => {
          onRemove();
          setConfirming(false);
        }}
      />
    </>
  );
}
