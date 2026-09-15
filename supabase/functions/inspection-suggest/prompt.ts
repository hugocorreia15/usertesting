// The request this feature sends, and the parsing of what comes back.
//
// Kept apart from index.ts, and free of any Deno or Supabase import, so that
// scripts/verify/ai-provider.ts can send a provider the very same request the
// deployed function sends. A test that rebuilds the prompt in its own words
// proves the test works, not the feature.

/** Enough to judge a finding, short enough to keep a request affordable. */
export const MAX_FINDINGS = 200;
export const MAX_TEXT = 400;

export const SYSTEM_PROMPT =
  "You group usability findings. You never invent identifiers and you answer with JSON only, with no code fence and no commentary.";

export interface PromptFinding {
  id: string;
  description: string;
  location?: string | null;
}

export function buildPrompt(input: {
  subjectName: string;
  findings: readonly PromptFinding[];
  /** "H1 = Visibility of system status; H2 = ..." or empty. */
  heuristicList: string;
}): string {
  const list = input.findings
    .map((f) => {
      const where = f.location ? ` [${f.location.slice(0, 80)}]` : "";
      return `- id: ${f.id}${where} :: ${f.description.slice(0, MAX_TEXT)}`;
    })
    .join("\n");

  return [
    `Findings from an independent heuristic inspection of "${input.subjectName}".`,
    "Several evaluators worked alone, so the same problem often appears more than once in different words.",
    "",
    "Group the findings that describe the SAME underlying problem. Rules:",
    "- Use only the ids given below. Never invent an id.",
    "- Put each id in at most one group. A problem only one evaluator found is a group of one.",
    "- Write a title as one short sentence describing the problem, not the fix.",
    input.heuristicList
      ? `- Choose heuristic_code from exactly this set: ${input.heuristicList}`
      : "- Set heuristic_code to null.",
    "- severity is an integer 0 to 4, or null if the findings disagree.",
    "",
    "Answer with JSON only:",
    '{"clusters":[{"title":"...","finding_ids":["..."],"heuristic_code":"H1","severity":3}]}',
    "",
    "Findings:",
    list,
  ].join("\n");
}

/** The body sent to any OpenAI-compatible chat completions endpoint. */
export function chatBody(input: { model: string; prompt: string; jsonMode: boolean }) {
  return {
    model: input.model,
    temperature: 0,
    ...(input.jsonMode ? { response_format: { type: "json_object" } } : {}),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: input.prompt },
    ],
  };
}

/**
 * Models often wrap JSON in a code fence or add a sentence before it, and a
 * provider that does not support response_format has nothing holding it to the
 * format at all. Take the outermost braces rather than failing on decoration.
 */
export function extractJson(text: string): unknown {
  const withoutFences = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(withoutFences);
  } catch {
    const first = withoutFences.indexOf("{");
    const last = withoutFences.lastIndexOf("}");
    if (first === -1 || last <= first) throw new Error("no JSON object in the answer");
    return JSON.parse(withoutFences.slice(first, last + 1));
  }
}
