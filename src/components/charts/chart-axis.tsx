// Shared axis/legend configuration for task-name charts.
// Every rotated-label bar chart previously reserved 80px for full-length
// task names and let the default bottom legend collide with them; these
// helpers truncate ticks (full name on hover) and move legends on top.

export function truncateLabel(value: string, max = 14): string {
  return value.length > max ? value.slice(0, max - 1) + "…" : value;
}

interface TickProps {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
}

// Custom tick: recharts ignores XAxis angle/textAnchor when a tick
// element is supplied, so the rotation lives here.
export function AngledTick({ x = 0, y = 0, payload }: TickProps) {
  const value = String(payload?.value ?? "");
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        dy={4}
        textAnchor="end"
        transform="rotate(-30)"
        fill="var(--color-muted-foreground)"
        fontSize={10}
      >
        <title>{value}</title>
        {truncateLabel(value)}
      </text>
    </g>
  );
}

// Radar charts place angle-axis labels around the perimeter; keep them
// horizontal but truncated, with the full name on hover.
export function PolarTick({
  x = 0,
  y = 0,
  payload,
  textAnchor,
}: TickProps & { textAnchor?: "start" | "middle" | "end" | "inherit" }) {
  const value = String(payload?.value ?? "");
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor={textAnchor ?? "middle"}
      fill="var(--color-muted-foreground)"
      fontSize={10}
    >
      <title>{value}</title>
      {truncateLabel(value, 12)}
    </text>
  );
}

export const TASK_AXIS_PROPS = {
  dataKey: "taskName",
  interval: 0,
  height: 60,
  tickMargin: 6,
  tick: <AngledTick />,
} as const;

// Task charts keep every tick; on narrow screens the chart scrolls
// horizontally instead of decimating labels (same convention as the
// app's tables). No visual change above the min width.
export function ChartScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">{children}</div>
    </div>
  );
}

export const CHART_MARGIN = { top: 4, right: 16, bottom: 4, left: 0 };

export const TOP_LEGEND_PROPS = {
  verticalAlign: "top",
  height: 28,
  wrapperStyle: { paddingBottom: 8 },
} as const;
