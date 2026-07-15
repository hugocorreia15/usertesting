import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAutoEvents } from "@/hooks/use-auto-events";
import { summarizeAutoEvents } from "@/lib/auto-events";
import { Activity, ExternalLink } from "lucide-react";

interface AutoEventsPanelProps {
  sessionId: string;
  joinCode: string | null;
  /** evaluator-logged actions so far (saved tasks + current counter) */
  evaluatorActionTotal: number;
}

// Live overlay comparing auto-captured events (avalux-instrument.js in
// the system under test) with the evaluator's manual action counts.
export function AutoEventsPanel({
  sessionId,
  joinCode,
  evaluatorActionTotal,
}: AutoEventsPanelProps) {
  const [open, setOpen] = useState(false);
  const { data: events } = useAutoEvents(open ? sessionId : undefined, {
    refetchInterval: 5000,
  });
  const summary = summarizeAutoEvents(events ?? []);

  const demoUrl =
    joinCode != null
      ? `/instrument-demo.html?url=${encodeURIComponent(
          import.meta.env.VITE_SUPABASE_URL,
        )}&key=${encodeURIComponent(
          import.meta.env.VITE_SUPABASE_ANON_KEY,
        )}&code=${encodeURIComponent(joinCode)}`
      : null;

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardContent className="space-y-2 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen((o) => !o)}
            className="text-muted-foreground"
          >
            <Activity className="mr-2 h-4 w-4" />
            Auto-instrumentation {open ? "▾" : "▸"}
          </Button>
          {open && demoUrl && (
            <a
              href={demoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Open demo page
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {open && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Metric label="Auto clicks" value={summary.byType.click} />
            <Metric label="Auto keys" value={summary.byType.keydown} />
            <Metric label="Auto navs" value={summary.byType.navigation} />
            <Metric label="Auto total" value={summary.total} />
            <Metric label="Manual actions" value={evaluatorActionTotal} />
          </div>
        )}
        {open && summary.total === 0 && (
          <p className="text-xs text-muted-foreground">
            No events yet — embed{" "}
            <code className="rounded bg-muted px-1">avalux-instrument.js</code>{" "}
            in the system under test (or use the demo page) with this
            session's join code.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-lg font-bold leading-tight">{value}</p>
    </div>
  );
}
