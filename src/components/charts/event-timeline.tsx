// Per-task timeline of logged events (errors, hesitations) plotted at
// their within-task timestamps. Pure SVG — no chart library needed.

export interface TimelineEvent {
  t: number | null;
  label?: string | null;
}

// Normalized 0..1 position of an event on the track, clamped so events
// logged after the recorded duration (timer kept running) stay visible.
export function timelinePosition(t: number, duration: number): number {
  if (duration <= 0) return 0;
  return Math.min(1, Math.max(0, t / duration));
}

// The track must cover every event even when a timestamp exceeds the
// stored task duration (e.g. events logged while the timer was paused).
export function effectiveDuration(
  duration: number | null,
  events: TimelineEvent[],
): number {
  const maxEvent = events.reduce(
    (m, e) => (e.t != null && e.t > m ? e.t : m),
    0,
  );
  return Math.max(duration ?? 0, maxEvent, 1);
}

const TRACK_H = 34;
const PAD_X = 8;

export function EventTimeline({
  durationSeconds,
  errors,
  hesitations,
}: {
  durationSeconds: number | null;
  errors: TimelineEvent[];
  hesitations: TimelineEvent[];
}) {
  const all = [...errors, ...hesitations];
  const duration = effectiveDuration(durationSeconds, all);

  return (
    <svg
      viewBox={`0 0 400 ${TRACK_H}`}
      className="h-9 w-full"
      role="img"
      aria-label={`Task timeline: ${errors.length} errors, ${hesitations.length} hesitations over ${duration.toFixed(0)} seconds`}
    >
      {/* track */}
      <line
        x1={PAD_X}
        y1={TRACK_H / 2}
        x2={400 - PAD_X}
        y2={TRACK_H / 2}
        stroke="var(--color-border)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* start / end labels */}
      <text x={PAD_X} y={TRACK_H - 2} fontSize={7} fill="var(--color-muted-foreground)">
        0s
      </text>
      <text
        x={400 - PAD_X}
        y={TRACK_H - 2}
        fontSize={7}
        textAnchor="end"
        fill="var(--color-muted-foreground)"
      >
        {duration.toFixed(0)}s
      </text>

      {hesitations.map(
        (h, i) =>
          h.t != null && (
            <circle
              key={`h${i}`}
              cx={PAD_X + timelinePosition(h.t, duration) * (400 - 2 * PAD_X)}
              cy={TRACK_H / 2}
              r={4}
              fill="#f59e0b"
            >
              <title>{`Hesitation @ ${h.t.toFixed(1)}s${h.label ? ` — ${h.label}` : ""}`}</title>
            </circle>
          ),
      )}
      {errors.map(
        (e, i) =>
          e.t != null && (
            <rect
              key={`e${i}`}
              x={PAD_X + timelinePosition(e.t, duration) * (400 - 2 * PAD_X) - 4}
              y={TRACK_H / 2 - 4}
              width={8}
              height={8}
              transform={`rotate(45 ${PAD_X + timelinePosition(e.t, duration) * (400 - 2 * PAD_X)} ${TRACK_H / 2})`}
              fill="#ef4444"
            >
              <title>{`Error @ ${e.t.toFixed(1)}s${e.label ? ` — ${e.label}` : ""}`}</title>
            </rect>
          ),
      )}
    </svg>
  );
}
