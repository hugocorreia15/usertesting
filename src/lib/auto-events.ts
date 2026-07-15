// Auto-captured interaction event aggregation shared by dashboards and tests.

import type { AutoEvent } from "@/types";

export interface AutoEventSummary {
  total: number;
  byType: { click: number; keydown: number; navigation: number };
  /** minutes since session start (or first event when start unknown) -> counts */
  timeline: { minute: number; click: number; keydown: number; navigation: number }[];
  firstAt: string | null;
  lastAt: string | null;
}

// Buckets events into whole minutes offset from the session start,
// falling back to the earliest event when the start is unknown. Every
// bucket from 0 to the last event's minute is emitted (zero-filled) so
// charts render gaps honestly; events before the session start clamp
// to minute 0.
export function summarizeAutoEvents(
  events: AutoEvent[],
  sessionStartedAt?: string | null,
): AutoEventSummary {
  if (events.length === 0) {
    return {
      total: 0,
      byType: { click: 0, keydown: 0, navigation: 0 },
      timeline: [],
      firstAt: null,
      lastAt: null,
    };
  }

  const times = events.map((e) => new Date(e.occurred_at).getTime());
  const earliest = Math.min(...times);
  const latest = Math.max(...times);

  const start =
    sessionStartedAt != null ? new Date(sessionStartedAt).getTime() : earliest;

  const byType = { click: 0, keydown: 0, navigation: 0 };
  const buckets = new Map<number, typeof byType>();
  let lastMinute = 0;

  events.forEach((e, i) => {
    byType[e.event_type] += 1;
    const minute = Math.max(0, Math.floor((times[i] - start) / 60_000));
    lastMinute = Math.max(lastMinute, minute);
    let bucket = buckets.get(minute);
    if (!bucket) {
      bucket = { click: 0, keydown: 0, navigation: 0 };
      buckets.set(minute, bucket);
    }
    bucket[e.event_type] += 1;
  });

  const timeline = Array.from({ length: lastMinute + 1 }, (_, minute) => ({
    minute,
    ...(buckets.get(minute) ?? { click: 0, keydown: 0, navigation: 0 }),
  }));

  return {
    total: events.length,
    byType,
    timeline,
    firstAt: events[times.indexOf(earliest)].occurred_at,
    lastAt: events[times.indexOf(latest)].occurred_at,
  };
}
