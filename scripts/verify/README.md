# Verification scripts

Checks that are run by hand against a deployed instance, kept here so they
can be repeated after any change to policies, triggers, or the participant
flow.

| Script | What it proves | How to run |
|---|---|---|
| `anon-rls.mjs` | An anonymous client holding only the public anon key cannot read participant or session data. Migration 048. | `node scripts/verify/anon-rls.mjs` |
| `gate-and-consent.sql` | Migrations 050 and 051: the review-column guard, the review workflow, approval invalidation on protocol edits, pilot marking, organization defaults. | SQL editor |
| `inspection-isolation.sql` | Migration 052: evaluators cannot read each other's findings before both submit, submission freezes a pass, instructors see progress but not content. | SQL editor |
| `reflection-visibility.sql` | Migration 053: reflections are private drafts, frozen on submission, readable by a teammate only after submitting their own. | SQL editor |
| `review-history.sql` | Migration 054: every review decision is kept in order with the protocol as submitted, and nobody can write or alter it. | SQL editor |
| `moderation-events.sql` | Migration 055: corrections are recorded only as yourself, cannot be edited or deleted, and go with their session. | SQL editor |
| `ai-suggestions.sql` | Migration 058: suggestions are impossible until an organization opts in and every pass is in, a stored proposal cannot be rewritten, and accepted groupings are marked assisted. | SQL editor |
| `test-synthesis.sql` | Migration 056: evidence must come from the same study as the problem, there is no false-alarm outcome, outsiders see nothing. | SQL editor |
| `session-summary.sql` | Migration 059: participant text is off by default, cannot be turned on without the consent clause, and a session that consented before the wording changed stays excluded forever. A summary needs a problem the team wrote first. | SQL editor |
| `leave-organization.sql` | Migration 060: an owner may take a template out of their own organization, nobody may put someone else's in, and leaving clears the group link, the student assignments and the sessions' organization. | SQL editor |
| `ai-provider.mts` | That a model provider works before anything is deployed: the key is accepted, whether the model is free or billed, that the request the edge function sends comes back usable, and what it cost. | `npx tsx scripts/verify/ai-provider.mts` |

`anon-rls.mjs` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
`.env.local` and only issues GETs. It exits non-zero on any leak, so it can
go in CI against a staging project.

The SQL scripts need no editing. Each creates its own scratch organization,
templates and sessions, prints a PASS/FAIL table, and deletes everything it
made; nothing belonging to a real study is read or written. They borrow the
oldest two or three accounts to play roles inside the scratch organization, and
print SKIP where the project has too few.

Scripts that test row-level security switch to `SET LOCAL ROLE authenticated`
with a forged `request.jwt.claims`, because RLS does not apply to the SQL
editor's superuser at all. Triggers do fire for the superuser, which is why the
guard checks in `gate-and-consent.sql` work without switching.

## sql-lint.mjs

```
node scripts/verify/sql-lint.mjs
```

Catches three mistakes in these files that no local check used to find, each of
which otherwise costs a round trip to the SQL editor:

- a bare apostrophe inside a single-quoted literal, which Postgres reports as a
  syntax error far from the real line;
- a column named with a reserved word, such as `leading`;
- an INSERT naming a column its table does not have, which is worse than a
  syntax error because a verification script fails partway through, after
  changing things.

The column list is built from the migrations themselves, from CREATE TABLE and
every later ADD COLUMN, so it cannot drift from the schema. Tables the
migrations never create, such as the temporary tables these scripts make for
themselves, are skipped rather than guessed at.

Run it before pasting any migration or verification script.

## ai-provider.mts

```
npx tsx scripts/verify/ai-provider.mts
```

Run this before `supabase secrets set`, not after. It reads `AI_API_KEY`,
`AI_API_URL`, `AI_MODEL` and `AI_JSON_MODE` from the environment or
`.env.local`, and answers the four questions in the order they bite:

1. Does the provider accept the key.
2. Is the model free or billed. On OpenRouter this is read from the model's
   own pricing rather than guessed from the `:free` suffix.
3. Does the request come back usable. It sends the exact body the deployed
   function sends, by importing `supabase/functions/inspection-suggest/prompt.ts`,
   and it judges the answer with `validateMergeSuggestion`, the same function
   the browser runs before anything is stored. A check that rebuilt either in
   its own words would prove only that the check works.
4. What it cost. On OpenRouter the key's lifetime spend is read before and
   after, so "that request was free" is measured rather than assumed.

```
AI_API_KEY=... AI_API_URL=https://openrouter.ai/api/v1/chat/completions \
  npx tsx scripts/verify/ai-provider.mts --models
```

lists the free text models on OpenRouter, largest context first, and nothing
else. A key is not tied to a model: the model is chosen per request, and a
request that names none falls back to an account default set in a web page,
which is the last place a class should discover it. Always set `AI_MODEL`.

The listing keeps only models that cost zero per token *and* answer with text
alone. Zero per-token pricing on its own is not proof of anything, because a
music or image model is billed per second or per picture and reads as zero
here.

It sends invented findings about an invented library website. No study,
participant or student text is read, so it is safe to point at a provider you
are still deciding about.

It exits non-zero when the feature would not work, and says which of the four
steps failed. A 402 means no credits, a 404 usually means the model id is wrong
for that endpoint, and a 429 on an unfunded OpenRouter account means you have
used the fifty free requests for the day.

One last thing it reports: whether the model put the two findings that describe
the same problem in different words into one group. A model that cannot do that
saves nobody any work, however cheap it is.
