# Avalux Feature Plan

Application-improvement plan, ordered by value. Paper-oriented items live
in [ROADMAP.md](ROADMAP.md); items appearing in both are cross-referenced.
Each item carries acceptance criteria so it can be picked up cold.

## Shipped in this iteration (2026-07)

- **Private session media** — `session-media` bucket flipped private
  (migration 032); clients store bucket paths and render via 1-hour
  signed URLs (`src/components/media/signed-media.tsx`); anon upload
  policy re-based on join-code sessions (the invitation `is_active`
  dependency silently broke uploads after personal links deactivated);
  edit-page upload path fixed to satisfy the owner-folder policy;
  session deletion now removes the session's storage files.
- **Live undo** — every action/error/hesitation tap is undoable (stack
  per task; deletes the created log row); `Z`/`U` shortcut + button.
- **Crash-proof timer** — running timer state persists per
  session+task (epoch-based, zero loss on tab crash/reload) and
  rehydrates on load, auto-resuming if it was running.
- **Cockpit keyboard shortcuts** — `A` action, `1–9` typed errors,
  `H` hesitation, `Z` undo; suppressed while typing or in dialogs.

## Next (highest value per effort)

### N1. Test foundation + CI  *(the multiplier — do first)*
Vitest + React Testing Library. Start with pure logic: SUS scoring
(`lib/sus.ts`), efficiency aggregation incl. skipped-task exclusion
(`template-sessions-tab`), the participant gating predicate
(`participantStillAnswering`), `truncateLabel`, timer persistence
rehydration. GitHub Actions: `tsc && vite build && vitest run` on push.
**Accept:** CI red on a reintroduced Infinity%-style bug.

### N2. Event timeline in session results  *(ROADMAP 3.1 — data exists)*
Per-task horizontal timeline strip plotting `error_logs` /
`hesitation_logs` timestamps (color by type), in the session detail
Task Results tab and the PDF report.
**Accept:** a task with 3 errors shows 3 markers at the right offsets;
PDF shows the same strip.

### N3. Raw data export (CSV/JSON)  *(ROADMAP 3.2)*
Per-template export: sessions, task_results, error/hesitation logs,
question answers, SUS items as flat CSVs (zip) or one JSON.
**Accept:** re-computing SUS from the export matches the app.

### N4. Task randomization / counterbalancing
Per-session task-order strategy on session creation: fixed / shuffled /
Latin-square position. Order already lives in `task_results.sort_order`.
**Accept:** two sessions created with "shuffled" get different orders;
report notes the strategy.

### N5. Additional standardized questionnaires
Generalize the SUS machinery into instrument definitions (items, scale,
scoring fn): add NASA-TLX and UEQ-S as selectable post-session
instruments per template.
**Accept:** a template with TLX shows TLX to the participant after tasks
and scores it in the report.

### N6. Error monitoring — SHIPPED (needs DSN)
Sentry wired behind `VITE_SENTRY_DSN` (inert without it): global handlers
via Sentry.init, error-boundary capture, session-context tags (opaque
UUIDs + role only; no PII, no replays, request data stripped).
**To activate:** create a Sentry project (React), set `VITE_SENTRY_DSN`
in Vercel project env (Production) and redeploy.
**Deferred:** source-map upload (needs a Sentry auth token in CI).

## Later — Phase 2 plan (ordered)

Everything in the former Next tier shipped (N1–N6), as did L3 (SUS
confidence intervals, incl. in the paper). Remaining items, re-planned
with scope and acceptance criteria, in recommended order:

### P2.1 README rewrite + repository license — SHIPPED
README rewritten (features, stack, setup, testing, deployment, research
context); MIT LICENSE added; paper Availability cites the public repo
URL + license with no placeholder remaining.

### P2.2 Retroactive session anonymization — SHIPPED
anonymize_session RPC (migration 036, owner-only SECURITY DEFINER):
name becomes Participant-XXXX, email/notes/custom field values removed
across all the participant's sessions, demographics + metrics kept;
Anonymize button with confirm dialog on completed sessions. Documented
in the paper's Security Model.

### P2.3 Practice-task flag — SHIPPED
`is_practice` on template_tasks (migration 037) + editor toggle;
practice tasks always run first (pinned before shuffle/latin-square
rotation of measured tasks); excluded from ALL metrics: session
averages, analytics charts + summary, completion donut, PDF session
charts + overall aggregates; marked "(practice)" in PDF task table and
badged in live mode + session detail; export carries an is_practice
column.

### P2.4 Qualitative coding — SHIPPED
Code book per template (template_codes + answer_codes, migration 039,
owner-only RLS); Coding tab on template detail (code book editor with
color/definition + codes × sessions frequency matrix); multi-code tag
picker on open task answers and interview answers in session detail;
answer_codes export table resolving source/question/answer text;
"Qualitative Coding" subsection in the paper.

### P2.5 Auto-instrumentation snippet — SHIPPED
public/avalux-instrument.js (dependency-free, batched every 2 s,
privacy-safe: element descriptors + key classes only, never typed text)
posts click/keydown/navigation events into auto_events (migration 040,
anon insert only while session in_progress); live cockpit panel toggles
auto vs manual counts (with prefilled demo-page link); session detail
shows counts + per-minute stacked timeline; auto_events export table;
public/instrument-demo.html playground; paper paragraph in Measures.

### P2.6 Participant client i18n (PT/EN) + WCAG pass — SHIPPED
src/lib/i18n.tsx: typed EN/PT dictionaries (compile-time parity),
?lang= param → localStorage → browser-language detection, EN|PT toggle
on join + live views; SUS in validated European Portuguese (Martins et
al. 2015), UEQ-S official PT pairs, TLX PT; document.lang follows the
UI (WCAG 3.1.1). A11y: aria-label/aria-pressed on all rating buttons,
label associations on every join-form field (incl. custom fields and
selects), range inputs labeled. Verified in-browser: ?lang=pt renders
the join flow in Portuguese, default stays EN.

### P2.7 Teams / organizations — SHIPPED
organizations + members (owner/member) + code-based invites (migration
041, accept_org_invite RPC, is_org_member/is_org_owner SECURITY DEFINER
helpers — no RLS recursion). Sharing is ADDITIVE: all user_id policies
untouched, org policies OR on top, so single-user flows cannot regress.
Org templates: member-editable incl. code book + collaborative tagging;
org sessions: member-readable (editing stays with creator until the
spectator role); sessions inherit the template org via BEFORE INSERT
trigger (anon join flow included); set_template_org RPC moves existing
sessions on share/unshare. /organizations page (create, invite codes,
join, members, leave); share dropdown on template detail; Shared badge
on lists. Known v1 limitation: session media stays creator-only
(storage policies untouched).
**Verify (needs two accounts):** share a template from account A's
detail page, join the org from account B via invite code → B sees and
edits the template and reads its sessions; a third account sees
nothing.

### P2.8 Polish grab-bag — SHIPPED
Template duplication (deep copy incl. groups/tasks/questions/error
types/fields/code book, never session data); chart PNG (3x)/SVG export
button on all 17 titled charts (session detail, analytics, template
overview) for paper figures; media capture hardening (photos downscaled
to 1600 px JPEG q0.8, size caps 5/20/50 MB, recording auto-stop 3 min
audio / 2 min video, localized notes); Latin-square explainer in the
help page; CI actions bumped to v5.

## Phase 3 (post-roadmap requests)

### P3.1 Student role + per-project scoping — SHIPPED
'student' role on org members/invites (migration 042); template_members
assignment table managed by org owners (Project members dropdown on
template detail); students see ONLY assigned org templates with FULL
edit (tasks/questions/code book/tagging) and read their project's
sessions; everything else invisible. 041 org policies replaced by
can_access_org_template / can_read_org_session SECURITY DEFINER
helpers; per-user policies still untouched. Invite generator gained a
Member/Student role selector. Classroom flow: one org, professor owner
sees all, each pair/trio assigned to its own project template.

### P3.2 Project repository link — SHIPPED
templates.repo_url (migration 042) + optional URL field in the template
form; Repository button (GitHub icon) on template detail opens it.

### P3.3 Spectator observation + observer notes — SHIPPED (was ROADMAP 2.3)
observer_notes table (migration 045, can_note_session definer helper —
recursion-safe per the 043 lesson); read-only /sessions/:id/observe
page (live task progress on a 3 s refresh, current-task banner, notes
composer) for anyone with session read access (creator, org members,
assigned students); Observe button on in_progress session detail;
Observer Notes card on session overview; observer_notes export table;
paper: observation moved from Future Work to Section III.

### P3.4 Organizations help section — SHIPPED
Help page section 8 "Organizations & Classrooms": roles incl. student,
invite codes, project sharing/assignment, repo link, classroom recipe,
media caveat.

### P3.5 Participant live-query split — SHIPPED
Load-test fix: the participant client's 4-level nested select (session +
task definitions + questions + answers), re-fetched on every realtime
tick, caused 57014 statement timeouts near 15 concurrent participants.
Now split: static half (template instruments/questions + task
definitions) fetched once per session (staleTime Infinity), light live
half (status, progress, answers) on ticks; merged in
src/lib/participant-live.ts (pure, tested; null-merge triggers a static
refetch if a session is rebuilt). Hook API unchanged. k6 journey
scenario mirrors the split.

### P3.7 First-class organization groups + role management — SHIPPED
org_groups + org_group_members (migration 047): named sub-teams inside
an org, each holding members and one or more project templates
(templates.org_group_id). Group members get full edit of the group's
templates and read their sessions (can_access_org_template /
can_read_org_session extended; all cross-table checks in SECURITY
DEFINER helpers per the 043 lesson). Org detail page: Groups section
(owner create/delete, cards link to group page) + per-member role
dropdown (set_member_role RPC, last-owner guard). New group detail page
(/organizations/$orgId/groups/$groupId): attach/detach templates
(set_template_group RPC, also shares to org + moves sessions), add/
remove members, session counts, repo links. Students see only their
own groups.

### P3.8 Security: anon access made possession-based — SHIPPED
Audit found the entire participant dataset readable by any anonymous client
holding the public anon key: participant names/e-mails/notes, free-text and
instrument answers, session results, private study designs, and live join
codes. Cause was systemic, not a single policy: every anon policy in the join
flow used an existence predicate (`user_id IS NOT NULL`, `join_code IS NOT
NULL`, `EXISTS(active invitation)`) instead of checking the caller holds the
secret, and several 007-era policies had no `TO` clause so they applied to
`PUBLIC` (authenticated included) and OR-ed past every correct org policy.
Migration 048 introduces `current_join_code()` / `current_invite_code()` read
from PostgREST request headers plus SECURITY DEFINER possession helpers, and
rewrites ~20 policies across 12 tables and storage. The client attaches the
code it holds per request (`src/lib/supabase.ts`), set in the join route's
`beforeLoad` and cleared elsewhere. The participant id is now generated
client-side so the join no longer needs an anon SELECT on participants.
`scripts/verify/anon-rls.mjs` proves the holes are closed; it reported 14
failures before the fix. Rollout order and rollback in
`docs/security/048-rollout.md`.
**Verified in production:** migration 048 applied and `scripts/verify/anon-rls.mjs`
reports all 16 checks passing, including that the private templates which
triggered the audit are no longer readable. A live probe also confirmed the
possession mechanism end to end: the invitation lookup returns nothing with no
header and nothing with a wrong code, and returns a private template plus its
tasks with the right one.

### P3.9 Optional SUS + richer participant fields — SHIPPED
SUS was hard-wired on (034: "implicit and always on"); it is now an entry in
`templates.instruments` like NASA-TLX and UEQ-S, with migration 049
backfilling `sus` into every existing template so no running study changes
behaviour. `administersSus()` gates the participant flow, and the session
detail SUS tab stays visible whenever answers exist, so opting out never hides
collected data. Template-scoped participant fields gained Multiple Choice and
Rating (with configurable bounds) alongside the existing types, which are
relabelled in the UI as "Open Text" and "Single Choice" rather than renamed in
the database, so no live row was rewritten. Multi-select answers encode as a
JSON array via `src/lib/participant-fields.ts`, which tolerates legacy plain
strings. One shared `ParticipantFieldInput` renders the join form and the
participant record so the two cannot drift.
**Verified in production:** migration 049 applied; rating bounds are live on
template_participant_fields.
**Deferred:** Audio/Video/Photo participant fields — capture happens on the
join form before a session row exists, so the storage path and its RLS need
their own design.

### P3.10 Template editor split into sections — SHIPPED
The edit form was six stacked cards in one scroll, and Tasks dominated it
(`task-list-editor` renders nested per-task question editors, ~305 lines,
against ~56 for Error Types), so Participant Fields and Questionnaires sat
below an unbounded task list and Save was at the very bottom. `TemplateForm`
now renders one section at a time behind a pill tab row carrying item counts,
with a sticky footer holding Save and an unsaved-changes indicator (a snapshot
comparison against the form as it loaded, re-baselined after each save).
Section state lives above the panels, so switching never loses edits, and
saving with an empty name jumps back to Basics where the field is. Applies to
both the Edit tab and /templates/new, which share the component.

### P3.11 Protocol review — SHIPPED
The pedagogical framing added to the paper (Section III, "Pedagogical
Design") distinguishes features that make method quality observable from
features that give feedback, and notes the platform had none of the second
kind. This is the first. `src/lib/protocol-review.ts` (pure, 19 tests)
checks a template against common novice mistakes: tasks whose wording
walks the participant through the interface (procedural verbs and quoted
labels warn; interface nouns alone only note, since in a hardware study
"panel" and "button" are the device under test, which the Study 1
template demonstrated on the first live run),
tasks without a description (no success criterion) or without an optimal
path, missing error taxonomy, no post-session instrument, no practice
task once there are four or more measured tasks, over-long task text, and
a long flat task list with no groups; plus a session-time advisory to
counterbalance order from four measured tasks, since order strategy is
chosen per session and cannot be checked on the template. Every finding
carries a one-line rationale and links to the relevant /help anchor.
Rendered as a card at the top of the template Overview tab, ahead of the
analytics empty state, because it matters most before any session exists.
Advisory only; nothing blocks. `docs/classroom-study-design.md` is the
evaluation that would test the paper's empirical claim.

### P3.12 Pedagogical positioning against the field — PAPER ONLY
Three papers and a teaching resource from the advisor (kept locally in
docs/papers/, gitignored) reframed the pedagogy section. Lima and
Benitti's mapping of HCI teaching (HCII 2019) found only two tools built
for HCI teaching and almost no rigorous evaluation of any, which is now the
opening of the section and the justification for the classroom study.
Schwind et al.'s HCI User Studies Toolkit (CHI EA 2023) supports study
*planning* (method choice, power, Latin squares, consent generation) and
stops where Avalux starts, at the session; their caveat that planning
tools can be satisfied mechanically now appears in Discussion as a
limitation of the protocol review. Aziz et al. (EduCHI 2026) found students
value GenAI as a procedural scaffold but distrust it when it pre-empts
their own judgment and dislike its sycophancy; the review is cited as a
deterministic scaffold that appears only after a design is saved. Rose's
EngageCSEdu usability-testing plan template gives the field's own module
structure (plan, materials, recruit, run, analyse) and makes an
*instructor gate*, feedback before any session may run, the centre of
assessment. The table is now a constructive-alignment table (Biggs 1996):
objective, what Avalux offers, evidence of outcome, with an ethics row
that honestly says consent is recorded outside the platform.
**Gaps the papers exposed, as candidate features:**
1. **Instructor gate** on a template: a review-requested / approved state
   set by an org owner, with session creation blocked (or warned) until
   approval and the protocol review findings visible to the instructor at
   that moment. Rose makes this the assessment mechanism; it is the
   "structured instructor review" the paper lists as missing.
2. **Consent capture** in the join flow: a per-template consent text
   shown before the form, with acceptance timestamped on the session.
   Schwind's consent generator is the reference; today consent lives
   outside the platform and the paper's ethics row says so.

### P3.13 Instructor gate (opt-in per template) — SHIPPED
Closes the first gap the pedagogy literature exposed. An org owner sets a
template's review mode: **off** (default, and what every existing template
gets), **advisory** (workflow and status visible, nothing blocked), or
**required**.

Deliberately *not* EngageCSEdu's model. Rose blocks all testing until the
instructor approves; that protects participants but makes the instructor the
critical path for a whole cohort, and Schwind et al. warn that heavy
supervision "calls into question the independence of the student's research
work". So the gate closes on **recruiting, not rehearsal**: while a required
review is unapproved, join links are refused, but a session run directly is
auto-marked `is_pilot` and excluded from the template's analytics and PDF
report (the same exclusion shape as practice tasks). The instructor then
reviews with the protocol review's findings *and* the pilot data in hand,
which is better review material than a document, and the student has
something useful to do while waiting.

Any protocol edit (tasks, task questions, groups, error types, interview
questions, participant fields, instruments) after approval or submission
drops the status to draft via triggers, so what was approved is what runs.

Security note: students hold UPDATE on org templates, so the review columns
cannot be plain columns; a BEFORE UPDATE trigger refuses any write to them
unless a transaction-local flag set by the three SECURITY DEFINER functions
(`set_template_review_mode`, `request_template_review`, `review_template`) is
on. Column-level REVOKE would not work, since a table-level UPDATE grant
cannot be narrowed per column. Invitation INSERT is gated in RLS by
`template_recruiting_allowed()`, so the block holds even if the UI is
bypassed; 035's single FOR ALL invitation policy is split per verb, because
its WITH CHECK would otherwise also block deactivating a link.

### P3.14 Consent capture — SHIPPED
The second gap. A template may carry `consent_text`; when set, the join form
shows it before any field and requires a checkbox, and acceptance is
timestamped on the session (`consent_accepted_at`, `consent_method =
join_form`). For sessions the evaluator runs in person, as in both case
studies, a "Record consent obtained" control on the session marks it
`recorded_by_evaluator`, so the paper's ethics row ("consent on file for
every participant") is checkable rather than aspirational. Both columns
export with the sessions table. Consent text is EN/PT-agnostic: it is the
author's own text, shown verbatim, with only the surrounding labels
localized.

### P3.15 Organization settings dialog — SHIPPED
The organization had no settings at all: no rename (despite orgs_update
allowing it since 041), and delete lived only on the list page. Owner-only
dialog on the org detail header now holds rename, delete (moved from the
list, which links here instead), and three defaults a project inherits when
it is shared into the org (migration 051):

- **review mode** — taken outright, since it is the org's policy not the
  team's choice;
- **consent text** and **instruments** — copied only when the template has
  none, so a team's own work is never clobbered.

Instruments as an org default is the addition worth naming: a class whose
teams each pick different questionnaires cannot compare results, which is the
comparability the paper's classroom study depends on.

Changing a default does NOT rewrite existing projects; forcing approval onto
a running study would be worse than the setting appearing not to apply. Each
default carries an opt-in "Apply to the N existing projects" checkbox, and
apply_org_defaults() returns how many it touched. Both functions set the 050
transaction-local flag, since review_mode is otherwise unwritable.

### P3.17 Migrations 050 and 051 verified against production — VERIFIED
`scripts/verify/gate-and-consent.sql` run in the SQL editor: 14 of 14 checks
PASS. The one that mattered is the first, since students hold UPDATE on org
templates and the whole design rests on it:

> guard refuses direct review_status write — PASS
> "review columns change only through the review functions"

A student cannot approve their own protocol, and the trigger holds even
against the SQL editor's superuser, which is the strictest case available.
Also proven rather than argued: the three-step workflow, approval returning
to draft on a protocol edit, pilot marking that catches a non-owner's session
but not an owner's, organization defaults inheriting on share without
clobbering a team's own consent text or instruments, the retrofit reporting
its count, and a non-owner being refused both approval and retrofit.

Writing the script caught a bug that would have aborted the run:
test_sessions.user_id has a foreign key to auth.users, so the non-owner
evaluator had to be a second real account rather than an invented uuid.

### P3.18 Regression: "Session Complete" shown between tasks — FIXED
Reported from a live session. Introduced by P3.9: when SUS became opt-in,
the live view gained `susSatisfied = !susEnabled || hasSusAnswers`, which is
true from the first render on a template that does not administer SUS. The
thank-you branch was tested before the in-progress branch, so the moment
there was no pending task, which is the normal state between tasks while the
evaluator closes the next one, the participant was told the session was over.

The same line had a second effect nobody had hit yet: with SUS off and no
instruments, the thank-you branch also pre-empted the interview, so the
closing interview was skipped outright.

The branch order is now a pure function, `participantStep` in
lib/participant-live.ts, so the rule is stated once and tested: nothing that
closes a session may be shown while it is still running, and the closing
steps run interview, then SUS, then remaining instruments, then thanks. Seven
tests, including an exhaustive sweep asserting that no combination of
instruments, interview and SUS settings can end a session the evaluator has
not ended.

### P3.16 Participant answer submission: silent failures and N round trips — SHIPPED
Reported symptom: submitting a task's answers sometimes did nothing, the form
stayed put, and the participant had to press the button repeatedly before the
session advanced. Three compounding causes, all in the same path:

1. **The rejection was unhandled.** `handleSubmit` awaited `mutateAsync` with
   no try/catch, and the caller did not await the returned promise. Any failed
   write produced an unhandled rejection: no toast, no advance, a button that
   appeared dead. This is the reported bug.
2. **One round trip per question.** `useSubmitParticipantAnswers` looped over
   the answers upserting each in turn, so a five-question task was five
   sequential requests on the participant's phone, and each write also woke
   the realtime subscription and refetched the whole session. Now a single
   upsert of the array.
3. **Mutations do not retry by default.** One dropped request on mobile data
   was a hard failure. `retry: 1`.

Also fixed while in there: when `mergeParticipantSession` returned null (a
task result with no static definition, e.g. the evaluator changed tasks
mid-session) the hook returned undefined, which unmounted the participant's
whole view and discarded answers already typed into the open form. The hook
now holds the last cleanly merged session and keeps showing it while the
static half refetches.

Four tests in `src/hooks/__tests__/` cover the batching, the column mapping,
the rejection reaching the caller, and the retry.

## Backlog (candidate features, ranked 2026-07-15)

1. **Inter-rater reliability mode — SHIPPED** — a co-rater scores a
   session's tasks independently (rater_scores, migration 046, RLS via
   can_note_session) on /sessions/:id/corate; session detail shows an
   Inter-rater Agreement card: Cohen's kappa (Landis & Koch band) on
   completion status + exact-match/MAD/Pearson on action/error/
   hesitation/SEQ counts vs the primary evaluator; rater_scores export
   table. Stats in src/lib/agreement.ts (pure, tested against the
   textbook kappa=0.4 example).
2. **Findings → GitHub issues** — projects carry repo links; one-click
   "create issue" from a coded quote or error cluster closes the
   finding → issue → fix → retest loop for student teams.
3. **Cross-iteration comparison** — compare two templates (design v1 vs
   v2): SUS delta with CIs, per-task time/error deltas. Made for
   iterative coursework re-tests.
4. **Screening & quotas on shared links** — screener questions with
   accept/reject + per-demographic caps (from the deferred pile).
5. **Custom instrument builder** — user-defined questionnaires beyond
   SUS/TLX/UEQ-S, generalizing the instruments machinery.
6. **AI-assisted coding suggestions** — suggest code-book tags for open
   answers; needs API key + cost/privacy decisions, so ranked last for
   an academic tool.

## Explicitly deferred

- PWA/offline evaluator mode (large surface).
- Screening/quota logic on shared links beyond `max_responses`.
- Realtime evaluator-side subscriptions replacing the 3 s gate polling
  (works; only revisit if scale demands).
- Sentry source-map upload (needs auth token in CI; do with P2.1's repo
  hygiene pass if desired).
