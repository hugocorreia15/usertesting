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
