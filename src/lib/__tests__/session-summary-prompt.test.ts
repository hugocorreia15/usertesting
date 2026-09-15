import { describe, it, expect } from "vitest";
import {
  buildSummaryPrompt,
  MAX_TEXT,
  type Observation,
} from "../../../supabase/functions/session-summary/prompt";

const obs: Observation[] = [
  { id: "n1", source: "note", session: 1, task: "task 2", text: "Hesitated at checkout" },
  { id: "n2", source: "note", session: 3, task: null, text: "Could not find the basket" },
  { id: "p1", source: "participant", session: 3, task: null, text: "I gave up looking" },
];

describe("buildSummaryPrompt", () => {
  it("numbers sessions rather than naming them, so no identity is sent", () => {
    const p = buildSummaryPrompt({
      studyName: "Library",
      observations: obs,
      existingProblems: [],
      heuristicList: "",
      sessionCount: 4,
    });
    expect(p).toContain("session 1");
    expect(p).toContain("session 3");
    // Nothing that could identify a session or a person.
    expect(p).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  });

  it("marks which observations came from a participant", () => {
    const p = buildSummaryPrompt({
      studyName: "Library",
      observations: obs,
      existingProblems: [],
      heuristicList: "",
      sessionCount: 4,
    });
    expect(p).toContain("(session 3, participant)");
    expect(p).toContain("(session 1, note)");
  });

  it("tells the model what the team already wrote, so it proposes only the rest", () => {
    const p = buildSummaryPrompt({
      studyName: "Library",
      observations: obs,
      existingProblems: ["Checkout button is hidden"],
      heuristicList: "",
      sessionCount: 4,
    });
    expect(p).toContain("Do not propose them again");
    expect(p).toContain("Checkout button is hidden");
  });

  it("says nothing about existing problems when there are none", () => {
    const p = buildSummaryPrompt({
      studyName: "Library",
      observations: obs,
      existingProblems: [],
      heuristicList: "",
      sessionCount: 4,
    });
    expect(p).not.toContain("Do not propose them again");
  });

  it("falls back to null rather than an invented heuristic code", () => {
    const p = buildSummaryPrompt({
      studyName: "Library",
      observations: obs,
      existingProblems: [],
      heuristicList: "",
      sessionCount: 4,
    });
    expect(p).toContain("Set heuristic_code to null");
  });

  it("truncates a long answer instead of sending all of it", () => {
    const long: Observation[] = [
      { id: "p9", source: "participant", session: 1, task: null, text: "y".repeat(900) },
    ];
    const p = buildSummaryPrompt({
      studyName: "Library",
      observations: long,
      existingProblems: [],
      heuristicList: "",
      sessionCount: 1,
    });
    expect(p).toContain("y".repeat(MAX_TEXT));
    expect(p).not.toContain("y".repeat(MAX_TEXT + 1));
  });

  it("names every id, since the model may use no others", () => {
    const p = buildSummaryPrompt({
      studyName: "Library",
      observations: obs,
      existingProblems: [],
      heuristicList: "H1 = Status",
      sessionCount: 4,
    });
    for (const o of obs) expect(p).toContain(`id: ${o.id}`);
    expect(p).toContain("Never invent an id");
  });
});
