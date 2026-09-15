// Suggest how an inspection's findings merge into problems, and which
// heuristic each one violates. Runs as a Supabase Edge Function so that a
// self-hosted deployment gets it along with the rest of the project, and so
// that the model key never reaches a browser.
//
// THREE PROPERTIES THIS FUNCTION MUST KEEP
//
// 1. It reads as the caller. The Supabase client is built with the caller's own
//    Authorization header and never with the service-role key, so row-level
//    security applies exactly as it does in the app. An inspection still
//    collecting passes returns the caller's own findings only, which is not
//    enough to merge, and the request fails as it should.
//
// 2. It sends only what students wrote. Finding descriptions, locations,
//    severities and heuristic codes go to the model. No participant text, no
//    names, no emails, no session data, no reflections.
//
// 3. It decides nothing. It returns the model's raw answer; the client
//    validates it against findings it holds and stores the result as a
//    suggestion a person then accepts or dismisses.
//
// Configuration (supabase secrets set ...):
//   AI_API_KEY    required, the provider key
//   AI_API_URL    optional, any OpenAI-compatible chat completions endpoint.
//                 Defaults to OpenAI. Point it at a gateway, another provider,
//                 or a local model to keep text on your own infrastructure.
//   AI_MODEL      optional, defaults to gpt-4o-mini
//   AI_JSON_MODE  optional: auto (default), on, or off. Several providers,
//                 including Google's and Groq's OpenAI-compatible endpoints, do
//                 not document response_format and may reject it outright, so
//                 auto retries once without it.

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

/** Enough to judge a finding, short enough to keep a request affordable. */
const MAX_FINDINGS = 200;
const MAX_TEXT = 400;

/**
 * Models often wrap JSON in a code fence or add a sentence before it. Take the
 * outermost braces rather than failing on decoration.
 */
function extractJson(text: string): unknown {
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

interface Finding {
  id: string;
  description: string;
  location: string | null;
  severity: number | null;
  heuristic_id: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Sign in first" }, 401);

  const apiKey = Deno.env.get("AI_API_KEY");
  if (!apiKey) {
    return json(
      { error: "This deployment has no model configured. Set AI_API_KEY to enable suggestions." },
      501,
    );
  }

  let inspectionId: string;
  try {
    const body = await req.json();
    inspectionId = String(body.inspection_id ?? "");
    if (!inspectionId) throw new Error("missing");
  } catch {
    return json({ error: "Give an inspection_id" }, 400);
  }

  // As the caller, never as the service role.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } } },
  );

  const { data: enabled, error: enabledError } = await supabase.rpc("inspection_ai_enabled", {
    iid: inspectionId,
  });
  if (enabledError) return json({ error: enabledError.message }, 400);
  if (!enabled) {
    return json(
      { error: "Suggestions are off for this organization. An owner can turn them on in its settings." },
      403,
    );
  }

  const { data: inspection, error: inspectionError } = await supabase
    .from("inspections")
    .select("id, status, subject_name, subject_kind, heuristic_set_id")
    .eq("id", inspectionId)
    .maybeSingle();
  if (inspectionError) return json({ error: inspectionError.message }, 400);
  if (!inspection) return json({ error: "Inspection not found" }, 404);
  if (inspection.status === "collecting") {
    return json({ error: "Wait until every pass is in before merging" }, 409);
  }

  const { data: findings, error: findingsError } = await supabase
    .from("inspection_findings")
    .select("id, description, location, severity, heuristic_id")
    .eq("inspection_id", inspectionId)
    .limit(MAX_FINDINGS);
  if (findingsError) return json({ error: findingsError.message }, 400);
  if (!findings || findings.length < 2) {
    return json({ error: "There is nothing to merge yet" }, 409);
  }

  const { data: heuristics } = await supabase
    .from("heuristics")
    .select("code, name")
    .eq("set_id", inspection.heuristic_set_id ?? "")
    .order("sort_order");

  const list = (findings as Finding[])
    .map((f) => {
      const where = f.location ? ` [${f.location.slice(0, 80)}]` : "";
      return `- id: ${f.id}${where} :: ${f.description.slice(0, MAX_TEXT)}`;
    })
    .join("\n");

  const heuristicList = (heuristics ?? [])
    .map((h: { code: string | null; name: string }) => `${h.code ?? "?"} = ${h.name}`)
    .join("; ");

  const prompt = [
    `Findings from an independent heuristic inspection of "${inspection.subject_name}".`,
    "Several evaluators worked alone, so the same problem often appears more than once in different words.",
    "",
    "Group the findings that describe the SAME underlying problem. Rules:",
    "- Use only the ids given below. Never invent an id.",
    "- Put each id in at most one group. A problem only one evaluator found is a group of one.",
    "- Write a title as one short sentence describing the problem, not the fix.",
    heuristicList ? `- Choose heuristic_code from exactly this set: ${heuristicList}` : "- Set heuristic_code to null.",
    "- severity is an integer 0 to 4, or null if the findings disagree.",
    "",
    "Answer with JSON only:",
    '{"clusters":[{"title":"...","finding_ids":["..."],"heuristic_code":"H1","severity":3}]}',
    "",
    "Findings:",
    list,
  ].join("\n");

  const url = Deno.env.get("AI_API_URL") ?? "https://api.openai.com/v1/chat/completions";
  const model = Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";

  const jsonMode = (Deno.env.get("AI_JSON_MODE") ?? "auto").toLowerCase();

  const ask = (withJsonMode: boolean) =>
    fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0,
        ...(withJsonMode ? { response_format: { type: "json_object" } } : {}),
        messages: [
          {
            role: "system",
            content:
              "You group usability findings. You never invent identifiers and you answer with JSON only, with no code fence and no commentary.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

  let answer: string;
  try {
    let response = await ask(jsonMode !== "off");
    // Providers that do not accept response_format reject the whole request.
    // One retry without it is the difference between working and not on most
    // free tiers.
    if (!response.ok && response.status === 400 && jsonMode === "auto") {
      response = await ask(false);
    }
    if (!response.ok) {
      const detail = await response.text();
      return json(
        { error: `The model refused the request (${response.status})`, detail: detail.slice(0, 300) },
        502,
      );
    }
    const payload = await response.json();
    answer = payload?.choices?.[0]?.message?.content ?? "";
  } catch (error) {
    return json({ error: `Could not reach the model: ${(error as Error).message}` }, 502);
  }

  let raw: unknown;
  try {
    raw = extractJson(answer);
  } catch {
    return json({ error: "The model did not return JSON", detail: answer.slice(0, 200) }, 502);
  }

  // The client validates this against the findings it holds before storing it.
  return json({ model, raw, findings_sent: findings.length });
});
