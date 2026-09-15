// Summarise what a study found across its sessions.
//
// The inspection function merges findings across evaluators. This merges
// observations across sessions, which is the same problem with the evidence
// spread differently, so it keeps the same three properties:
//
// 1. It reads as the caller, with the caller's own Authorization header and
//    never the service-role key, so row-level security applies exactly as it
//    does in the app.
//
// 2. It sends two tiers, and the second one is earned. Tier A is what the team
//    wrote: observer notes, moderation events, and the problems already
//    entered. Tier B is what participants wrote, and it is included only for
//    the sessions that `sessions_with_participant_text_ai` returns, which are
//    the sessions whose participant accepted a consent text carrying the
//    clause. Nothing decides that here; the database does.
//
// 3. It decides nothing. It returns the model's raw answer for the browser to
//    validate against rows it already holds.
//
// Configuration is shared with inspection-suggest: AI_API_KEY, AI_API_URL,
// AI_MODEL, AI_JSON_MODE.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { chatBody, extractJson } from "../inspection-suggest/prompt.ts";
import {
  buildSummaryPrompt,
  MAX_OBSERVATIONS,
  type Observation,
} from "./prompt.ts";

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

  let templateId: string;
  try {
    const body = await req.json();
    templateId = String(body.template_id ?? "");
    if (!templateId) throw new Error("missing");
  } catch {
    return json({ error: "Give a template_id" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } } },
  );

  const { data: enabled, error: enabledError } = await supabase.rpc("template_ai_enabled", {
    tid: templateId,
  });
  if (enabledError) return json({ error: enabledError.message }, 400);
  if (!enabled) {
    return json(
      { error: "Suggestions are off for this organization. An owner can turn them on in its settings." },
      403,
    );
  }

  // The anchoring rule: the team writes something of its own first.
  const { data: started } = await supabase.rpc("template_synthesis_started", { tid: templateId });
  if (!started) {
    return json(
      { error: "Write at least one problem of your own before asking for a summary" },
      409,
    );
  }

  const { data: template } = await supabase
    .from("templates")
    .select("id, name, heuristic_set_id")
    .eq("id", templateId)
    .maybeSingle();
  if (!template) return json({ error: "Study not found" }, 404);

  const { data: sessions } = await supabase
    .from("test_sessions")
    .select("id, is_pilot, status")
    .eq("template_id", templateId)
    .order("created_at");

  // Pilots are excluded from every other study-level aggregate.
  const real = (sessions ?? []).filter((s: { is_pilot: boolean }) => !s.is_pilot);
  if (real.length === 0) return json({ error: "This study has no sessions yet" }, 409);

  // 1-based session numbers, so the model can say "seen in sessions 2 and 5"
  // without ever being told who was in them.
  const numberOf = new Map<string, number>(real.map((s: { id: string }, i: number) => [s.id, i + 1]));
  const ids = real.map((s: { id: string }) => s.id);

  const observations: Observation[] = [];
  // Parallel to `observations`, carrying the session each one came from. The
  // prompt never sees a session id, only a number.
  const origin = new Map<string, { sessionId: string; source: Observation["source"] }>();

  // ── Tier A: what the team wrote ───────────────────────────
  const { data: notes } = await supabase
    .from("observer_notes")
    .select("id, session_id, note, task_index")
    .in("session_id", ids);

  for (const n of notes ?? []) {
    observations.push({
      id: n.id,
      source: "note",
      session: numberOf.get(n.session_id) ?? 0,
      task: n.task_index === null ? null : `task ${n.task_index + 1}`,
      text: n.note,
    });
    origin.set(n.id, { sessionId: n.session_id, source: "note" });
  }

  const { data: events } = await supabase
    .from("moderation_events")
    .select("id, session_id, kind, task_index")
    .in("session_id", ids)
    .neq("kind", "logging_started");

  for (const e of events ?? []) {
    observations.push({
      id: e.id,
      source: "event",
      session: numberOf.get(e.session_id) ?? 0,
      task: e.task_index === null ? null : `task ${e.task_index + 1}`,
      text: `the moderator recorded ${String(e.kind).replace(/_/g, " ")}`,
    });
    origin.set(e.id, { sessionId: e.session_id, source: "event" });
  }

  // ── Tier B: what participants wrote, where consent allows ─
  const { data: allowedRows } = await supabase.rpc("sessions_with_participant_text_ai", {
    tid: templateId,
  });
  const allowed = new Set<string>(
    (allowedRows ?? []).map((r: { session_id: string }) => r.session_id),
  );

  if (allowed.size > 0) {
    const { data: results } = await supabase
      .from("task_results")
      .select("id, session_id")
      .in("session_id", [...allowed]);

    const sessionOfResult = new Map<string, string>(
      (results ?? []).map((r: { id: string; session_id: string }) => [r.id, r.session_id]),
    );

    if (sessionOfResult.size > 0) {
      const { data: answers } = await supabase
        .from("task_question_answers")
        .select("id, task_result_id, answer_text")
        .in("task_result_id", [...sessionOfResult.keys()])
        .not("answer_text", "is", null);

      for (const a of answers ?? []) {
        const sid = sessionOfResult.get(a.task_result_id);
        // Belt and braces: a row whose session is not in the allowed set never
        // gets here, but it costs nothing to say so.
        if (!sid || !allowed.has(sid)) continue;
        if (!a.answer_text?.trim()) continue;
        observations.push({
          id: a.id,
          source: "participant",
          session: numberOf.get(sid) ?? 0,
          task: null,
          text: a.answer_text,
        });
        origin.set(a.id, { sessionId: sid, source: "participant" });
      }
    }
  }

  if (observations.length < 3) {
    return json(
      { error: "There is not enough written down yet to summarise" },
      409,
    );
  }

  const { data: existing } = await supabase
    .from("test_problems")
    .select("title")
    .eq("template_id", templateId);

  const { data: heuristics } = await supabase
    .from("heuristics")
    .select("code, name")
    .eq("set_id", template.heuristic_set_id ?? "")
    .order("sort_order");

  const sending = observations.slice(0, MAX_OBSERVATIONS);
  const sentList = sending.map((o) => ({
    id: o.id,
    sessionId: origin.get(o.id)?.sessionId ?? "",
    source: o.source,
  }));

  const prompt = buildSummaryPrompt({
    studyName: template.name,
    observations: sending,
    existingProblems: (existing ?? []).map((p: { title: string }) => p.title),
    heuristicList: (heuristics ?? [])
      .map((h: { code: string | null; name: string }) => `${h.code ?? "?"} = ${h.name}`)
      .join("; "),
    sessionCount: real.length,
  });

  const url = Deno.env.get("AI_API_URL") ?? "https://api.openai.com/v1/chat/completions";
  const model = Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";
  const jsonMode = (Deno.env.get("AI_JSON_MODE") ?? "auto").toLowerCase();

  const ask = (withJsonMode: boolean) =>
    fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(chatBody({ model, prompt, jsonMode: withJsonMode })),
    });

  let answer: string;
  try {
    let response = await ask(jsonMode !== "off");
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

  return json({
    model,
    raw,
    // What was sent, ids and sessions only, no text. The browser validates the
    // model's answer against this list, so an invented id cannot reach the
    // database, and it needs the session of each observation to attach evidence
    // to an accepted problem. The consent rule is not enforced here: the rows
    // above came from sessions_with_participant_text_ai, which is the database
    // answering that question.
    sent: sentList.map((o) => ({ id: o.id, session_id: o.sessionId, source: o.source })),
    observations_sent: Math.min(observations.length, MAX_OBSERVATIONS),
    // So the interface can say plainly what went and what did not.
    participant_sessions_included: allowed.size,
    sessions_total: real.length,
  });
});
