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

Catches a bare apostrophe inside a single-quoted SQL literal, which is the one
mistake in these files that no local check used to find. Postgres reports it as
a syntax error far from the real line, so it costs a round trip to the SQL
editor every time. Run it before pasting any migration or verification script.
