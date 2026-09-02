#!/usr/bin/env node
/**
 * Proves that an anonymous client holding only the public anon key cannot read
 * participant or session data.
 *
 * Run before and after applying migration 048:
 *   node scripts/verify-anon-rls.mjs
 *
 * Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env.local.
 * Read-only: it issues GETs and never writes.
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local");
  process.exit(2);
}

async function get(path, headers = {}) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, ...headers },
  });
  const body = await res.json().catch(() => null);
  return Array.isArray(body) ? body : [];
}

/** Tables no anonymous caller should ever read without a matching code. */
const MUST_BE_EMPTY = [
  "participants",
  "participant_field_values",
  "test_sessions",
  "task_results",
  "task_question_answers",
  "sus_answers",
  "instrument_answers",
  "interview_answers",
  "session_invitations",
];

/** Definition tables: only rows belonging to a public template may appear. */
const TEMPLATE_CHILDREN = [
  "template_tasks",
  "task_groups",
  "template_questions",
  "template_participant_fields",
  "template_error_types",
];

let failures = 0;
const pass = (m) => console.log(`  \x1b[32mPASS\x1b[0m  ${m}`);
const fail = (m) => {
  failures++;
  console.log(`  \x1b[31mFAIL\x1b[0m  ${m}`);
};

console.log("\nAnonymous client, no join or invite code supplied\n");

for (const table of MUST_BE_EMPTY) {
  const rows = await get(`${table}?select=*&limit=50`);
  rows.length === 0
    ? pass(`${table} returns nothing`)
    : fail(`${table} leaked ${rows.length} row(s) — columns: ${Object.keys(rows[0]).slice(0, 6).join(", ")}`);
}

const templates = await get("templates?select=id,name,is_public&limit=100");
const priv = templates.filter((t) => !t.is_public);
priv.length === 0
  ? pass(`templates returns only public ones (${templates.length} row(s))`)
  : fail(
      `templates leaked ${priv.length} private template(s): ${priv
        .map((t) => t.name)
        .slice(0, 5)
        .join(", ")}`,
    );

const publicIds = new Set(templates.filter((t) => t.is_public).map((t) => t.id));
for (const table of TEMPLATE_CHILDREN) {
  const rows = await get(`${table}?select=template_id&limit=100`);
  const strays = rows.filter((r) => r.template_id && !publicIds.has(r.template_id));
  strays.length === 0
    ? pass(`${table} exposes nothing outside public templates`)
    : fail(`${table} leaked ${strays.length} row(s) from non-public templates`);
}

// task_questions hangs off template_tasks, not templates, so it needs the
// parent embedded rather than a template_id column of its own.
{
  const rows = await get("task_questions?select=id,template_tasks(template_id)&limit=100");
  const strays = rows.filter(
    (r) => r.template_tasks && !publicIds.has(r.template_tasks.template_id),
  );
  strays.length === 0
    ? pass("task_questions exposes nothing outside public templates")
    : fail(`task_questions leaked ${strays.length} row(s) from non-public templates`);
}

console.log(
  failures === 0
    ? "\n\x1b[32mAll checks passed.\x1b[0m Anonymous callers see nothing they do not hold a code for.\n"
    : `\n\x1b[31m${failures} check(s) failed.\x1b[0m\n`,
);
process.exit(failures === 0 ? 0 : 1);
