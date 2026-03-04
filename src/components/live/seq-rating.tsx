import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SEQ_SCALE } from "@/lib/constants";

interface SeqRatingProps {
  open: boolean;
  onSelect: (rating: number) => void;
}

export function SeqRating({ open, onSelect }: SeqRatingProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Single Ease Question</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Overall, how easy or difficult was this task?
        </p>
        <div className="flex justify-between gap-2 py-4">
          {SEQ_SCALE.map((n) => (
            <Button
              key={n}
              variant="outline"
              className="h-12 w-12 text-lg transition-all duration-200 hover:text-primary hover:border-accent hover:bg-primary/5"
              onClick={() => onSelect(n)}
            >
              {n}
            </Button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Very difficult</span>
          <span>Very easy</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
