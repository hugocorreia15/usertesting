import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * A remove button that stops when removal would destroy participant data.
 *
 * Removing a question or an error type from a protocol deletes every answer or
 * logged error recorded against it, in every session already run, through the
 * cascade on its id. Nothing about the editor shows that, and the loss is
 * silent and permanent, so the count is put in front of the person doing it.
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
            ? `${count} ${plural} recorded. Removing this deletes them.`
            : "Remove"
        }
        onClick={() => (count > 0 ? setConfirming(true) : onRemove())}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <ConfirmDialog
        open={confirming}
        onOpenChange={(o) => !o && setConfirming(false)}
        title={`Delete ${count} ${plural}?`}
        description={
          `${named} already has ${count} ${plural} recorded against it across your sessions. ` +
          `Removing it from the protocol deletes ${count === 1 ? "that record" : "those records"} ` +
          `when you save, in every session, and they cannot be recovered. ` +
          `To keep the data, leave it in the protocol and stop using it instead.`
        }
        confirmLabel={`Remove and delete ${count} ${plural}`}
        variant="destructive"
        onConfirm={() => {
          onRemove();
          setConfirming(false);
        }}
      />
    </>
  );
}
