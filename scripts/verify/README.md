# Verification scripts

Checks that are run by hand against a deployed instance, kept here so they
can be repeated after any change to policies, triggers, or the participant
flow.

| Script | What it proves | How to run |
|---|---|---|
| `anon-rls.mjs` | An anonymous client holding only the public anon key cannot read participant or session data. Covers migration 048. | `node scripts/verify/anon-rls.mjs` |
| `gate-and-consent.sql` | Migrations 050 and 051: the review-column guard, the review workflow, approval invalidation on protocol edits, pilot marking, and organization defaults. | Paste into the Supabase SQL editor after replacing the two placeholders |

`anon-rls.mjs` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
`.env.local` and only issues GETs. It exits non-zero on any leak, so it can
go in CI against a staging project.

`gate-and-consent.sql` is not idempotent: it changes a template's review
state and an organization's defaults. Use a template you can experiment
with, and run the last block to put things back. Triggers fire for a
superuser in the SQL editor, which is why the guard checks work there even
though RLS does not apply.
