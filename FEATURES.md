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

### P2.1 README rewrite + repository license  *(hours — gates the paper)*
Replace the stale CRA boilerplate README with: what Avalux is, features,
screenshots (reuse public/help/), local setup (Supabase env vars,
migrations), test/CI, deploy notes. Pick a license (MIT or AGPL — AGPL
if you want derivatives to stay open) and add LICENSE.
**Accept:** paper's Availability section can cite the repo URL + license
with no placeholder. **Paper:** fills the [repository URL and license]
TODO.

### P2.2 Retroactive session anonymization  *(small — ROADMAP 2.2)*
One-click "Anonymize session" on completed sessions: unlink/replace
participant identity (name → Participant-XXXX, email/notes nulled,
custom field values wiped) while keeping demographics + metrics; RPC +
confirm dialog; irreversible warning.
**Accept:** after anonymizing, no query as evaluator returns the
participant's name/email for that session; metrics unchanged.
**Paper:** Future Work item → shipped; strengthens §Security Model.

### P2.3 Practice-task flag  *(small)*
`is_practice` on template_tasks + editor toggle; excluded from ALL
metrics (completion %, efficiency, charts, export marked, SEQ averages)
but still run in sessions; badge in live mode + session detail.
**Accept:** a practice task's timings don't move any aggregate; export
rows carry is_practice=true.

### P2.4 Qualitative coding  *(medium — high research value)*
Code book per template (code + color); evaluator tags open/interview
answers (multi-code); code-frequency matrix view (codes × sessions) +
export table.
**Accept:** tagging an answer updates the matrix; export contains an
answer_codes table. **Paper:** a genuinely novel feature vs the
commercial platforms' moderated modes — worth a subsection.

### P2.5 Auto-instrumentation snippet  *(medium-high — ROADMAP 1.3)*
Embeddable `<script>` for browser-based systems under test: posts
click/keydown/navigation events (with timestamps) to an ingest endpoint
keyed by join code; auto_events table + RLS; live-view overlay toggle
comparing auto vs evaluator counts; export table.
**Accept:** a demo page with the snippet streams events into an active
session; correlation view renders. **Paper:** enables the manual-vs-auto
count validity study (Evaluation section material).

### P2.6 Participant client i18n (PT/EN) + WCAG pass  *(medium)*
Localize participant-facing strings (join, live view, SUS, instruments,
interview) with a lightweight dictionary (no i18n framework needed at
this string count); browser-language default + toggle. A11y: focus
order, aria-labels on rating buttons, contrast check at both themes.
**Accept:** ?lang=pt renders the full participant journey in Portuguese;
axe DevTools reports no critical issues on participant pages.

### P2.7 Teams / organizations  *(large — do last, prerequisite for
multi-evaluator observation)*
org + membership tables; template/session ownership by org; RLS rewrite
(user_id → org membership checks) behind a compatibility view; invite
flow; role: owner/member. Then ROADMAP 2.3 (spectator role + observer
notes) becomes a small follow-up.
**Accept:** two accounts in one org see and edit the same templates;
a third account sees nothing.

### P2.8 Polish grab-bag  *(fillers between larger items)*
Template duplication; chart PNG/SVG export for papers; media size
limits + client-side compression on capture; Latin-square note in help
page; bump CI actions to v5.

## Explicitly deferred

- PWA/offline evaluator mode (large surface).
- Screening/quota logic on shared links beyond `max_responses`.
- Realtime evaluator-side subscriptions replacing the 3 s gate polling
  (works; only revisit if scale demands).
- Sentry source-map upload (needs auth token in CI; do with P2.1's repo
  hygiene pass if desired).
