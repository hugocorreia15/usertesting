import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { COLORS, CHART_TOOLTIP_STYLE } from "@/lib/chart-constants";
import { TOP_LEGEND_PROPS } from "@/components/charts/chart-axis";
import { useAutoEvents } from "@/hooks/use-auto-events";
import { summarizeAutoEvents } from "@/lib/auto-events";

interface AutoEventsSummaryProps {
  sessionId: string;
  sessionStartedAt: string | null;
  evaluatorActionTotal: number;
}

// Auto-captured event trace (avalux-instrument.js) vs the evaluator's
// manual counts. Renders nothing for sessions without instrumentation.
export function AutoEventsSummary({
  sessionId,
  sessionStartedAt,
  evaluatorActionTotal,
}: AutoEventsSummaryProps) {
  const { data: events } = useAutoEvents(sessionId);
  if (!events || events.length === 0) return null;

  const summary = summarizeAutoEvents(events, sessionStartedAt);

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-base">Auto-captured events</CardTitle>
        <p className="text-sm text-muted-foreground">
          Events streamed by the instrumentation snippet embedded in the
          system under test, next to the evaluator's manual counts.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Metric label="Auto clicks" value={summary.byType.click} />
          <Metric label="Auto keys" value={summary.byType.keydown} />
          <Metric label="Auto navigations" value={summary.byType.navigation} />
          <Metric label="Auto total" value={summary.total} />
          <Metric label="Manual actions" value={evaluatorActionTotal} />
        </div>

        {summary.timeline.length > 1 && (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={summary.timeline}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="minute"
                fontSize={11}
                label={{
                  value: "minutes into session",
                  position: "insideBottom",
                  offset: -2,
                  fontSize: 10,
                }}
              />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend {...TOP_LEGEND_PROPS} />
              <Bar dataKey="click" name="Clicks" stackId="a" fill={COLORS.primary} />
              <Bar dataKey="keydown" name="Keys" stackId="a" fill={COLORS.secondary} />
              <Bar dataKey="navigation" name="Navigations" stackId="a" fill={COLORS.partial} />
            </BarChart>
          </ResponsiveContainer>
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
