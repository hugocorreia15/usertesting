// The request the cross-session summary sends, and the shape it asks for.
//
// Free of any Deno or Supabase import so the same builder can be exercised
// from Node. See ../inspection-suggest/prompt.ts for the same arrangement.

export const MAX_OBSERVATIONS = 300;
export const MAX_TEXT = 300;

export const SYSTEM_PROMPT =
  "You group observations from usability test sessions. You never invent identifiers and you answer with JSON only, with no code fence and no commentary.";

export interface Observation {
  id: string;
  /** "note", "event" or "participant". Shown to the model so it can weigh them. */
  source: "note" | "event" | "participant";
  /** 1-based, so the model can say a problem appeared in several sessions. */
  session: number;
  task?: string | null;
  text: string;
}

export function buildSummaryPrompt(input: {
  studyName: string;
  observations: readonly Observation[];
  /** Problems the team already wrote. The model must not propose these again. */
  existingProblems: readonly string[];
  heuristicList: string;
  sessionCount: number;
}): string {
  const lines = input.observations
    .map((o) => {
      const where = o.task ? ` [${o.task.slice(0, 60)}]` : "";
      return `- id: ${o.id} (session ${o.session}, ${o.source})${where} :: ${o.text.slice(0, MAX_TEXT)}`;
    })
    .join("\n");

  const already = input.existingProblems.length
    ? [
        "",
        "The team has already written these problems. Do not propose them again;",
        "propose only what is not yet covered:",
        ...input.existingProblems.map((p) => `- ${p.slice(0, 160)}`),
      ].join("\n")
    : "";

  return [
    `Observations from ${input.sessionCount} usability test sessions of "${input.studyName}".`,
    "Each session was a different participant doing the same tasks, so one problem usually",
    "shows up in several sessions, described differently each time.",
    already,
    "",
    "Group the observations that point to the SAME underlying problem. Rules:",
    "- Use only the ids given below. Never invent an id.",
    "- Put each id in at most one group.",
    "- A problem seen in more than one session matters more than one seen once, but report both.",
    "- Write a title as one short sentence describing the problem, not the fix.",
    input.heuristicList
      ? `- Choose heuristic_code from exactly this set: ${input.heuristicList}`
      : "- Set heuristic_code to null.",
    "- severity is an integer 0 to 4, or null if the observations disagree.",
    "",
    "Answer with JSON only:",
    '{"clusters":[{"title":"...","finding_ids":["..."],"heuristic_code":"H1","severity":3}]}',
    "",
    "Observations:",
    lines,
  ].join("\n");
}
