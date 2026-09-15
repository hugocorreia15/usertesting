#!/usr/bin/env -S npx tsx
/**
 * Checks a model provider before any of it is deployed.
 *
 *   npx tsx scripts/verify/ai-provider.mts
 *
 * Answers four questions, in the order they can bite you:
 *
 *   1. Does the key work at all, and what does the provider say it is worth?
 *   2. Is the model you chose free, or will it be billed?
 *   3. Does the exact request the edge function sends come back usable, with
 *      and without JSON mode?
 *   4. Did that request cost anything? Measured, not assumed.
 *
 * It sends invented findings about an invented app. No study, no participant
 * and no student text is read, so it is safe to run against any provider you
 * are still deciding about.
 *
 * Pass --models to list the free models on OpenRouter instead of testing one.
 *
 * Reads AI_API_KEY, AI_API_URL, AI_MODEL, AI_JSON_MODE from the environment or
 * from .env.local. Exits non-zero if the feature would not work.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { buildPrompt, chatBody, extractJson } from "../../supabase/functions/inspection-suggest/prompt";
// The app's own validator, the same code the browser runs before anything is
// stored. Imported through the default binding because src/ is transpiled as
// CommonJS here (the root package.json is not a module, and making it one
// would break the PostCSS and Tailwind configs).
import * as validator from "../../src/lib/ai-suggestions";
const { validateMergeSuggestion } = (validator as { default?: typeof validator }).default ?? validator;

// ── configuration ────────────────────────────────────────────────────────────

function loadEnvFile(): Record<string, string> {
  let dir = dirname(fileURLToPath(import.meta.url));
  const candidates = [resolve(process.cwd(), ".env.local")];
  for (let i = 0; i < 5; i++) {
    candidates.push(join(dir, ".env.local"));
    dir = dirname(dir);
  }
  const found = candidates.find((c) => existsSync(c));
  if (!found) return {};
  return Object.fromEntries(
    readFileSync(found, "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      }),
  );
}

const fileEnv = loadEnvFile();
const cfg = (name: string, fallback = "") =>
  process.env[name] ?? fileEnv[name] ?? fallback;

const API_KEY = cfg("AI_API_KEY");
const API_URL = cfg("AI_API_URL", "https://api.openai.com/v1/chat/completions");
const MODEL = cfg("AI_MODEL", "gpt-4o-mini");
const JSON_MODE = cfg("AI_JSON_MODE", "auto").toLowerCase();

const ok = (s: string) => `\x1b[32mPASS\x1b[0m  ${s}`;
const bad = (s: string) => `\x1b[31mFAIL\x1b[0m  ${s}`;
const warn = (s: string) => `\x1b[33mNOTE\x1b[0m  ${s}`;
const failures: string[] = [];
const fail = (s: string) => {
  failures.push(s);
  console.log(bad(s));
};

if (!API_KEY) {
  console.error(
    "No AI_API_KEY. Put it in .env.local or pass it inline:\n" +
      "  AI_API_KEY=... AI_API_URL=... AI_MODEL=... npx tsx scripts/verify/ai-provider.mts",
  );
  process.exit(2);
}

const isOpenRouter = API_URL.includes("openrouter.ai");
const origin = new URL(API_URL).origin;

// ── --models: what can this key actually ask for ─────────────────────────────

// A key is not bound to a model. Omitting one falls back to an account default
// set in a web page, which is the last place a class should discover it.
if (process.argv.includes("--models")) {
  if (!isOpenRouter) {
    console.error(
      "--models only works against OpenRouter. Other providers list their models in their own console.",
    );
    process.exit(2);
  }
  const r = await fetch(`${origin}/api/v1/models`);
  const body = await r.json();
  const all = (body?.data ?? []) as {
    id: string;
    name: string;
    context_length?: number;
    pricing?: { prompt?: string; completion?: string };
    architecture?: { input_modalities?: string[]; output_modalities?: string[] };
  }[];

  const free = all
    .filter((m) => Number(m.pricing?.prompt ?? 1) + Number(m.pricing?.completion ?? 1) === 0)
    // Zero per-token pricing is not the same as free. A music or image model is
    // billed per second or per picture, and shows zero here. Only a model that
    // takes text and answers with nothing but text can do this job anyway.
    .filter((m) => {
      const out = m.architecture?.output_modalities ?? ["text"];
      const inp = m.architecture?.input_modalities ?? ["text"];
      return inp.includes("text") && out.length === 1 && out[0] === "text";
    })
    .sort((a, b) => (b.context_length ?? 0) - (a.context_length ?? 0));

  console.log(`\n${free.length} free models of ${all.length} listed. Largest context first:\n`);
  for (const m of free.slice(0, 30)) {
    const ctx = m.context_length ? `${Math.round(m.context_length / 1000)}k` : "?";
    console.log(`  ${m.id.padEnd(52)} ${ctx.padStart(6)}  ${m.name}`);
  }
  console.log(
    "\nPut one of the ids in AI_MODEL, then run this script again without --models\n" +
      "to check it can actually do the grouping.\n",
  );
  process.exit(0);
}

console.log(`\nEndpoint  ${API_URL}`);
console.log(`Model     ${MODEL}`);
console.log(`JSON mode ${JSON_MODE}`);
console.log(`Key       ${API_KEY.slice(0, 8)}...${API_KEY.slice(-4)} (${API_KEY.length} chars)\n`);

// A key pasted into a field that already held a prefix comes out doubled. The
// provider answers 401 and says nothing useful, so catch it before the call.
const prefixes = API_KEY.match(/sk-or-v1-|sk-or-|sk-proj-|sk-/g) ?? [];
if (prefixes.length > 1) {
  console.log(
    warn(
      `The key starts with a prefix ${prefixes.length} times ("${prefixes.join('", "')}"). ` +
        "That usually means it was pasted on top of one already there. An OpenRouter key " +
        "begins with sk-or-v1- exactly once.",
    ),
  );
}


// ── 1. what the provider says about this key ─────────────────────────────────

/** OpenRouter reports lifetime spend per key, which is how step 4 measures cost. */
async function openRouterKey(): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(`${origin}/api/v1/key`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!r.ok) return null;
    const body = await r.json();
    return body?.data ?? body;
  } catch {
    return null;
  }
}

let spendBefore: number | null = null;

if (isOpenRouter) {
  const key = await openRouterKey();
  if (!key) {
    fail("The key was rejected by OpenRouter. Check that you copied all of it.");
  } else {
    const usage = Number(key.usage ?? 0);
    const limit = key.limit === null || key.limit === undefined ? null : Number(key.limit);
    spendBefore = usage;
    console.log(ok(`The key is valid. Spent so far: $${usage.toFixed(4)}`));
    console.log(
      limit === null
        ? warn("No credit limit set on this key, so it draws on the account balance.")
        : warn(`Credit limit on this key: $${limit.toFixed(2)}.`),
    );
    if (usage === 0 && !MODEL.endsWith(":free")) {
      console.log(
        warn(
          "An unfunded OpenRouter account gets 50 requests a day on :free models. " +
            "This model id does not end in :free, so it will be billed.",
        ),
      );
    }
  }
}

// ── 2. free or billed ────────────────────────────────────────────────────────

if (isOpenRouter) {
  try {
    const r = await fetch(`${origin}/api/v1/models`);
    const body = await r.json();
    const entry = (body?.data ?? []).find((m: { id: string }) => m.id === MODEL);
    if (!entry) {
      fail(
        `OpenRouter does not list a model called "${MODEL}". ` +
          "Copy the id from openrouter.ai/models, including the organization prefix.",
      );
    } else {
      const p = entry.pricing ?? {};
      const perToken = Number(p.prompt ?? 0) + Number(p.completion ?? 0);
      if (perToken === 0) {
        console.log(ok(`"${MODEL}" is priced at zero. This is a free model.`));
      } else {
        const perMillion = perToken * 1_000_000;
        console.log(
          warn(
            `"${MODEL}" is billed: about $${perMillion.toFixed(2)} per million tokens ` +
              "(prompt and completion combined). Use a model id ending in :free to avoid charges.",
          ),
        );
      }
    }
  } catch (e) {
    console.log(warn(`Could not read the model list: ${(e as Error).message}`));
  }
} else {
  console.log(
    warn(
      "This provider does not publish per-key pricing, so whether you are on a free tier " +
        "is an account-level question. Check its console, and check whether its free tier " +
        "trains on what you send.",
    ),
  );
}

// ── 3. the exact request the edge function sends ─────────────────────────────

// Invented, so this can be run against a provider you have not decided to trust.
const FINDINGS = [
  { id: "f1", description: "The upload button gives no feedback after being pressed, so I pressed it three times.", location: "Upload screen" },
  { id: "f2", description: "Nothing happens visually when you submit a file. I could not tell if it worked.", location: "Upload" },
  { id: "f3", description: "The error message says 'Error 2', which means nothing to a user.", location: "Upload screen" },
  { id: "f4", description: "There is no way back from the confirmation page except the browser button.", location: "Confirmation" },
  { id: "f5", description: "Date field accepts 31/02 without complaint.", location: "Booking form" },
];
const HEURISTICS = [
  "H1 = Visibility of system status",
  "H5 = Error prevention",
  "H9 = Help users recognize, diagnose, and recover from errors",
].join("; ");

const prompt = buildPrompt({
  subjectName: "Biblioteca Municipal (fictional)",
  findings: FINDINGS,
  heuristicList: HEURISTICS,
});

async function ask(jsonMode: boolean) {
  const started = Date.now();
  const r = await fetch(API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(chatBody({ model: MODEL, prompt, jsonMode })),
  });
  const text = await r.text();
  return { status: r.status, text, ms: Date.now() - started };
}

let answer = "";
let usedJsonMode = false;
let usage: Record<string, number> | undefined;

{
  const wanted = JSON_MODE !== "off";
  let res = await ask(wanted);
  usedJsonMode = wanted;

  if (res.status === 400 && JSON_MODE === "auto") {
    console.log(
      warn("The provider rejected response_format, which AI_JSON_MODE=auto expects. Retrying without it."),
    );
    res = await ask(false);
    usedJsonMode = false;
  }

  if (res.status !== 200) {
    fail(`The provider answered ${res.status}: ${res.text.slice(0, 300)}`);
    if (res.status === 401) console.log("      The key is wrong or revoked.");
    if (res.status === 402) console.log("      No credits. On OpenRouter, use a model id ending in :free.");
    if (res.status === 404) console.log("      The model id is wrong for this endpoint.");
    if (res.status === 429) console.log("      Rate limited. On an unfunded OpenRouter account that is 50 a day.");
  } else {
    const payload = JSON.parse(res.text);
    answer = payload?.choices?.[0]?.message?.content ?? "";
    usage = payload?.usage;
    console.log(
      ok(
        `The model answered in ${res.ms} ms` +
          (usedJsonMode ? " with JSON mode on." : " without JSON mode.") +
          (JSON_MODE === "auto" && !usedJsonMode
            ? " Set AI_JSON_MODE=off to skip the wasted first call."
            : ""),
      ),
    );
  }
}

// ── 4. is the answer usable, judged by the code that will judge it ───────────

if (answer) {
  // Whether the answer was clean or had to be dug out matters: it is the
  // difference between a model that honours JSON mode and one that is merely
  // being asked nicely.
  let clean = true;
  try {
    JSON.parse(answer.trim());
  } catch {
    clean = false;
  }

  let raw: unknown;
  try {
    raw = extractJson(answer);
    console.log(
      ok(
        clean
          ? "The answer is clean JSON."
          : "The answer had a code fence or commentary around it, which the function strips.",
      ),
    );
  } catch {
    fail(`The answer is not JSON. First 200 characters:\n      ${answer.slice(0, 200)}`);
  }

  if (raw !== undefined) {
    // The same validator the browser runs before anything is stored.
    const validated = validateMergeSuggestion(raw, {
      findingIds: FINDINGS.map((f) => f.id),
      heuristicCodes: ["H1", "H5", "H9"],
    });

    if (validated.clusters.length === 0) {
      fail("Nothing survived validation. This model is not usable for the feature.");
    } else {
      console.log(ok(`${validated.clusters.length} groupings survived validation:`));
      for (const c of validated.clusters) {
        const codes = [c.heuristicCode, c.severity !== null ? `severity ${c.severity}` : null]
          .filter(Boolean)
          .join(", ");
        console.log(`        - ${c.title}${codes ? `  (${codes})` : ""}`);
        console.log(`          ${c.findingIds.join(", ")}`);
      }
    }

    if (validated.discarded.length > 0) {
      console.log(
        warn(
          "The validator threw away: " +
            validated.discarded.map((d) => `${d.count} ${d.reason}`).join(", ") +
            ".",
        ),
      );
    }

    // f1 and f2 are the same problem in different words. A model that cannot
    // see that will not save anyone any work.
    const together = validated.clusters.some(
      (c) => c.findingIds.includes("f1") && c.findingIds.includes("f2"),
    );
    console.log(
      together
        ? ok("It grouped the two descriptions of the same problem. This model can do the job.")
        : warn(
            "It did not group f1 and f2, which describe one problem in different words. " +
              "Usable, but try a larger model before putting it in front of a class.",
          ),
    );
  }
}

// ── 5. what it cost, measured ────────────────────────────────────────────────

if (usage) {
  console.log(
    warn(
      `Tokens: ${usage.prompt_tokens ?? "?"} in, ${usage.completion_tokens ?? "?"} out, ` +
        `for five findings. A real inspection sends more.`,
    ),
  );
}

if (isOpenRouter && spendBefore !== null) {
  // Spend is reported after the generation settles, so give it a moment.
  await new Promise((r) => setTimeout(r, 2500));
  const after = await openRouterKey();
  const spendAfter = after ? Number(after.usage ?? 0) : null;
  if (spendAfter === null) {
    console.log(warn("Could not re-read the key to measure the cost."));
  } else {
    const delta = spendAfter - spendBefore;
    console.log(
      delta === 0
        ? ok("Your OpenRouter balance did not move. That request was free.")
        : warn(`That request cost $${delta.toFixed(6)}. You are on a billed model.`),
    );
  }
}

console.log();
if (failures.length > 0) {
  console.log(`\x1b[31m${failures.length} problem(s). This provider is not ready.\x1b[0m\n`);
  process.exit(1);
}
console.log("\x1b[32mThis key, endpoint and model work with the feature as deployed.\x1b[0m");
console.log("Set the same three values as Supabase secrets and deploy.\n");
