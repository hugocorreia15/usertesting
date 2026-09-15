import { describe, it, expect } from "vitest";
import {
  buildPrompt,
  chatBody,
  extractJson,
} from "../../../supabase/functions/inspection-suggest/prompt";

/**
 * The parsing here runs on whatever a model returns, from providers that do not
 * support JSON mode at all. Decoration around the object is the normal case,
 * not the edge case.
 */
describe("extractJson", () => {
  it("reads a plain object", () => {
    expect(extractJson('{"clusters":[]}')).toEqual({ clusters: [] });
  });

  it("reads through a code fence", () => {
    expect(extractJson('```json\n{"clusters":[{"title":"x"}]}\n```')).toEqual({
      clusters: [{ title: "x" }],
    });
  });

  it("reads through a bare fence with no language", () => {
    expect(extractJson('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("reads through a sentence before and after the object", () => {
    expect(
      extractJson('Sure! Here are the groupings:\n{"a":1}\nLet me know if you want changes.'),
    ).toEqual({ a: 1 });
  });

  it("keeps braces that are inside strings", () => {
    expect(extractJson('{"title":"Use {braces} carefully"}')).toEqual({
      title: "Use {braces} carefully",
    });
  });

  it("throws when there is no object at all", () => {
    expect(() => extractJson("I cannot help with that.")).toThrow();
  });

  it("throws rather than returning half an object", () => {
    expect(() => extractJson('{"clusters":[{"title":')).toThrow();
  });
});

describe("buildPrompt", () => {
  const findings = [
    { id: "f1", description: "No feedback on upload", location: "Upload" },
    { id: "f2", description: "Silent failure", location: null },
  ];

  it("names every finding id, since the model may use no others", () => {
    const p = buildPrompt({ subjectName: "App", findings, heuristicList: "H1 = Status" });
    expect(p).toContain("id: f1");
    expect(p).toContain("id: f2");
  });

  it("carries the location only when there is one", () => {
    const p = buildPrompt({ subjectName: "App", findings, heuristicList: "" });
    expect(p).toContain("[Upload]");
    expect(p).not.toContain("[null]");
  });

  it("tells the model to use null when the inspection has no heuristic set", () => {
    const p = buildPrompt({ subjectName: "App", findings, heuristicList: "" });
    expect(p).toContain("Set heuristic_code to null");
  });

  it("truncates a description rather than sending an essay", () => {
    const long = { id: "f3", description: "x".repeat(900), location: null };
    const p = buildPrompt({ subjectName: "App", findings: [long], heuristicList: "" });
    expect(p).toContain("x".repeat(400));
    expect(p).not.toContain("x".repeat(401));
  });
});

describe("chatBody", () => {
  it("omits response_format when JSON mode is off, because some providers reject it", () => {
    const body = chatBody({ model: "m", prompt: "p", jsonMode: false });
    expect(body).not.toHaveProperty("response_format");
  });

  it("asks for JSON when it is on", () => {
    const body = chatBody({ model: "m", prompt: "p", jsonMode: true });
    expect(body.response_format).toEqual({ type: "json_object" });
  });

  it("pins temperature so two runs on the same findings agree", () => {
    expect(chatBody({ model: "m", prompt: "p", jsonMode: true }).temperature).toBe(0);
  });
});
