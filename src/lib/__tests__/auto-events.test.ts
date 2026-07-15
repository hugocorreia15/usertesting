import { describe, it, expect } from "vitest";
import { summarizeAutoEvents } from "../auto-events";
import type { AutoEvent } from "@/types";

function ev(
  eventType: AutoEvent["event_type"],
  occurredAt: string,
  id = occurredAt,
): AutoEvent {
  return {
    id,
    session_id: "s1",
    event_type: eventType,
    occurred_at: occurredAt,
    path: null,
    detail: null,
    created_at: occurredAt,
  };
}

describe("summarizeAutoEvents", () => {
  it("counts events by type", () => {
    const summary = summarizeAutoEvents(
      [
        ev("click", "2026-07-14T10:00:05Z"),
        ev("click", "2026-07-14T10:00:10Z"),
        ev("keydown", "2026-07-14T10:00:20Z"),
        ev("navigation", "2026-07-14T10:00:30Z"),
      ],
      "2026-07-14T10:00:00Z",
    );
    expect(summary.total).toBe(4);
    expect(summary.byType).toEqual({ click: 2, keydown: 1, navigation: 1 });
    expect(summary.firstAt).toBe("2026-07-14T10:00:05Z");
    expect(summary.lastAt).toBe("2026-07-14T10:00:30Z");
  });

  it("zero-fills every minute bucket up to the last event", () => {
    const summary = summarizeAutoEvents(
      [
        ev("click", "2026-07-14T10:00:30Z"), // minute 0
        ev("keydown", "2026-07-14T10:03:10Z"), // minute 3
      ],
      "2026-07-14T10:00:00Z",
    );
    expect(summary.timeline).toEqual([
      { minute: 0, click: 1, keydown: 0, navigation: 0 },
      { minute: 1, click: 0, keydown: 0, navigation: 0 },
      { minute: 2, click: 0, keydown: 0, navigation: 0 },
      { minute: 3, click: 0, keydown: 1, navigation: 0 },
    ]);
  });

  it("clamps events before the session start to minute 0", () => {
    const summary = summarizeAutoEvents(
      [
        ev("click", "2026-07-14T09:58:00Z"), // 2 min before start
        ev("navigation", "2026-07-14T10:01:30Z"), // minute 1
      ],
      "2026-07-14T10:00:00Z",
    );
    expect(summary.timeline).toEqual([
      { minute: 0, click: 1, keydown: 0, navigation: 0 },
      { minute: 1, click: 0, keydown: 0, navigation: 1 },
    ]);
  });

  it("falls back to the first event when session start is unknown", () => {
    const events = [
      ev("click", "2026-07-14T10:07:15Z"),
      ev("keydown", "2026-07-14T10:09:20Z"),
    ];
    for (const start of [undefined, null] as const) {
      const summary = summarizeAutoEvents(events, start);
      expect(summary.timeline).toEqual([
        { minute: 0, click: 1, keydown: 0, navigation: 0 },
        { minute: 1, click: 0, keydown: 0, navigation: 0 },
        { minute: 2, click: 0, keydown: 1, navigation: 0 },
      ]);
    }
  });

  it("returns an empty summary for no events", () => {
    const summary = summarizeAutoEvents([], "2026-07-14T10:00:00Z");
    expect(summary).toEqual({
      total: 0,
      byType: { click: 0, keydown: 0, navigation: 0 },
      timeline: [],
      firstAt: null,
      lastAt: null,
    });
  });
});
