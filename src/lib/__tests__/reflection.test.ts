import { describe, expect, it } from "vitest";
import {
  MIN_ANSWER_LENGTH,
  REFLECTION_PROMPTS,
  reflectionComplete,
  reflectionEvidence,
} from "../reflection";
import type { ObserverNote } from "@/types";

const long = "x".repeat(MIN_ANSWER_LENGTH);

const result = (over: Partial<{
  task_id: string;
  completion_status: "success" | "partial" | "failure" | "skipped" | null;
  time_seconds: number | null;
  error_count: number;
  hesitation_count: number;
  seq_rating: number | null;
}> = {}) => ({
  task_id: "t1",
  completion_status: "success" as const,
  time_seconds: 30,
  error_count: 0,
  hesitation_count: 0,
  seq_rating: 6,
  ...over,
});

const tasks = [
  { id: "t1", name: "Find the thermostat", optimal_time_seconds: 30 },
  { id: "t2", name: "Schedule the heating", optimal_time_seconds: 60 },
  { id: "t3", name: "Warm-up", optimal_time_seconds: 10, is_practice: true },
];

const note = (author_id: string, text = "gave a hint"): ObserverNote => ({
  id: `${author_id}-${text}`,
  session_id: "s1",
  author_id,
  author_email: null,
  note: text,
  task_index: 0,
  created_at: "",
});

describe("REFLECTION_PROMPTS", () => {
  it("asks exactly the three fixed questions", () => {
    expect(REFLECTION_PROMPTS.map((p) => p.key)).toEqual([
      "surprised",
      "protocol_change",
      "may_have_led",
    ]);
  });
});

describe("reflectionComplete", () => {
  it("needs every answer to be more than a placeholder", () => {
    expect(
      reflectionComplete({ surprised: long, protocol_change: long, may_have_led: long }),
    ).toBe(true);
    expect(
      reflectionComplete({ surprised: long, protocol_change: long, may_have_led: "no" }),
    ).toBe(false);
    expect(reflectionComplete({ surprised: long })).toBe(false);
  });

  it("does not count whitespace as an answer", () => {
    const pad = " ".repeat(MIN_ANSWER_LENGTH + 5);
    expect(
      reflectionComplete({ surprised: pad, protocol_change: long, may_have_led: long }),
    ).toBe(false);
  });
});

describe("reflectionEvidence", () => {
  it("is quiet when nothing notable happened and nobody else took notes", () => {
    const e = reflectionEvidence({
      results: [result()],
      tasks,
      notes: [],
      viewerId: "me",
    });
    expect(e.moments).toEqual([]);
    expect(e.quiet).toBe(true);
  });

  it("names why a task is worth looking back at", () => {
    const e = reflectionEvidence({
      results: [
        result({ task_id: "t2", completion_status: "failure", hesitation_count: 2, time_seconds: 150 }),
      ],
      tasks,
      notes: [],
      viewerId: "me",
    });
    expect(e.moments).toHaveLength(1);
    expect(e.moments[0].taskName).toBe("Schedule the heating");
    expect(e.moments[0].reason).toContain("not completed");
    expect(e.moments[0].reason).toContain("2 hesitations");
    expect(e.moments[0].reason).toContain("2.5 times the expected time");
  });

  it("flags an easy rating on a task that went badly", () => {
    const e = reflectionEvidence({
      results: [result({ completion_status: "partial", seq_rating: 7 })],
      tasks,
      notes: [],
      viewerId: "me",
    });
    expect(e.moments[0].reason).toContain("rated easy (7 of 7) despite the outcome");
  });

  it("orders the most notable task first", () => {
    const e = reflectionEvidence({
      results: [
        result({ task_id: "t1", hesitation_count: 1 }),
        result({ task_id: "t2", completion_status: "failure", error_count: 3 }),
      ],
      tasks,
      notes: [],
      viewerId: "me",
    });
    expect(e.moments.map((m) => m.taskId)).toEqual(["t2", "t1"]);
  });

  it("ignores practice tasks, which exist to go wrong", () => {
    const e = reflectionEvidence({
      results: [result({ task_id: "t3", completion_status: "failure" })],
      tasks,
      notes: [],
      viewerId: "me",
    });
    expect(e.moments).toEqual([]);
  });

  it("keeps the list short enough to be read", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({
      id: `k${i}`,
      name: `Task ${i}`,
      optimal_time_seconds: null,
    }));
    const e = reflectionEvidence({
      results: many.map((t) => result({ task_id: t.id, error_count: 1 })),
      tasks: many,
      notes: [],
      viewerId: "me",
    });
    expect(e.moments).toHaveLength(5);
  });

  it("shows other people's notes but not the reflecting user's own", () => {
    const e = reflectionEvidence({
      results: [result()],
      tasks,
      notes: [note("me", "my own"), note("peer", "said 'try the menu'")],
      viewerId: "me",
    });
    expect(e.peerNotes.map((n) => n.author_id)).toEqual(["peer"]);
    expect(e.quiet).toBe(false);
  });

  it("does not treat a missing optimal time as slow", () => {
    const e = reflectionEvidence({
      results: [result({ task_id: "t1", time_seconds: 999 })],
      tasks: [{ id: "t1", name: "No baseline", optimal_time_seconds: null }],
      notes: [],
      viewerId: "me",
    });
    expect(e.moments).toEqual([]);
  });
});
