# Anon data exposure — findings and rollout

## What was wrong

Every anon policy in the participant flow tested whether a row was the *kind*
of row a participant may see, never whether the caller held the secret for it:

| Table | Migration | Predicate |
|---|---|---|
| `participants` | 023 | `TO anon USING (user_id IS NOT NULL)` |
| `test_sessions`, `task_results`, answers | 015, 021 | `TO anon USING (join_code IS NOT NULL)` |
| `templates`, `template_tasks` | 007 | no `TO` clause → `PUBLIC`, `EXISTS(active invitation)` |
| `session_invitations` | 007 | no `TO` clause, `USING (is_active = true)` |
| `storage.objects` | 032 | any evaluator folder with a join-code session |

Those predicates are true for every row, so for `anon` they were equivalent to
RLS being off. Two details made it easy to miss:

- `CREATE POLICY` with no `TO` clause defaults to `PUBLIC`, which includes
  `authenticated`. Migration 035 already diagnosed this on the invitation
  `UPDATE`; the `SELECT`s were not revisited.
- Policies are OR-ed, so a single loose policy defeats every strict one beside
  it. The org policies (041–047) were written correctly and were simply
  overridden.

Confirmed against the live project with nothing but the public anon key that
ships in the client bundle: participant names, e-mails and notes, free-text
answers, SUS and interview responses, full session results, private study
designs, and live invitation codes were all readable unauthenticated.

## The fix

Migration `048_anon_possession_scoping.sql` makes access possession-based. The
participant client sends the code it holds as a request header (`x-join-code`
while in a session, `x-invite-code` while joining); Postgres reads it back
through `current_setting('request.headers')`, and every policy compares the row
against it. A request with no code matches nothing.

The migration contains **only** `CREATE FUNCTION`, `DROP POLICY` and
`CREATE POLICY`. It reads, writes and deletes no data.

## Apply order

The client must send the headers before the policies start requiring them.

1. **Deploy the app first.** `src/lib/supabase.ts` attaches the headers per
   request; `src/routes/join/$code.tsx` sets them in `beforeLoad`. Deployed
   ahead of the migration these are inert — the old policies ignore them.
2. **Then run the migration** in the Supabase SQL editor.
3. **Verify:** `node scripts/verify/anon-rls.mjs` — every check must pass.
4. **Smoke-test a real join**: open an invitation link in a private window,
   join, answer a task question, upload one media answer, and confirm the
   evaluator cockpit sees it.

Pick a moment with no session running. A participant holding the old JS when
the migration lands will see an empty live view until they reload.

## Rollback

Policies only; no data to restore. To revert, drop the policies created here
and re-create the originals from migrations 007, 015, 021, 023, 025 and 032 —
which restores the exposure, so treat it as a last resort.

## Still open

- `useTemplates()` (`src/hooks/use-templates.ts`) selects with no owner filter
  and trusts RLS for scoping. Correct once 048 lands, and org sharing depends
  on RLS doing the scoping, so it is left as is. Worth remembering that a query
  saying what it wants would not have surfaced the leak in the UI at all.
- Anon `INSERT` policies are now tied to the invitation owner, which stops
  arbitrary row creation. Rate limiting is a separate concern.
- `error_logs` and `hesitation_logs` were empty at audit time, so their
  exposure could not be determined either way. Worth re-checking with data.

---

## Migration 050: instructor gate and consent

Applied the same way, and independent of 048. It adds columns with defaults,
seven functions, eight triggers and four policies. No row is rewritten and
nothing is deleted; every existing template gets `review_mode = 'off'`, so
behaviour is unchanged until an organization owner turns the gate on.

After applying, check the guard holds. As a student or member on an org
template with `review_mode = 'required'`:

- updating `review_status` directly must fail with `insufficient_privilege`;
- creating an invitation must fail the RLS check until approved;
- creating a session must succeed and arrive with `is_pilot = true`;
- editing a task after approval must return the status to `draft`.

`node scripts/verify/anon-rls.mjs` must still pass: 050 adds no anonymous
read path, and the consent columns live on rows the participant already
reaches through their join code.

## Migration 051: organization defaults

Adds three columns to `organizations` (all defaulted, so existing orgs are
unchanged), replaces `set_template_org` so sharing inherits them, and adds
`apply_org_defaults` for explicit retrofit. Apply after 050, which it
depends on: both functions set the transaction-local flag that 050's guard
trigger checks before allowing a write to `review_mode`.

After applying, as an organization owner:

- renaming the organization must succeed, and must fail as a member;
- sharing a template into an org with `default_review_mode = 'required'`
  must leave that template gated;
- sharing a template that already has its own consent text must keep it;
- `apply_org_defaults` must return the number of projects touched, and must
  fail with `insufficient_privilege` when called by a member.
