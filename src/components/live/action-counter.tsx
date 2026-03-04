import { useRef, useEffect } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, Plus } from "lucide-react";

interface ActionCounterProps {
  count: number;
  optimalActions: number | null;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function ActionCounter({
  count,
  optimalActions,
  onIncrement,
  onDecrement,
}: ActionCounterProps) {
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (countRef.current) {
      gsap.fromTo(
        countRef.current,
        { scale: 1.2 },
        { scale: 1, duration: 0.15, ease: "power2.out" },
      );
    }
  }, [count]);

  const deviation =
    optimalActions != null ? count - optimalActions : null;

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onDecrement}
            disabled={count <= 0}
            className="h-12 w-12 border-accent/50 hover:border-accent hover:bg-accent/10"
          >
            <Minus className="h-5 w-5" />
          </Button>
          <span
            ref={countRef}
            className="min-w-[3ch] text-center font-mono text-4xl font-bold text-primary"
          >
            {count}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={onIncrement}
            className="h-12 w-12 border-accent/50 hover:border-accent hover:bg-accent/10"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        {deviation != null && (
          <p
            className={`mt-2 text-center text-sm ${
              deviation > 0
                ? "text-red-500"
                : deviation === 0
                  ? "text-green-500"
                  : "text-muted-foreground"
            }`}
          >
            {deviation > 0 ? `+${deviation}` : deviation} from optimal
          </p>
        )}
      </CardContent>
    </Card>
  );
}
