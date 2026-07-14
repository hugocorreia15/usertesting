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

## Later

- **L1. Teams/organizations** — shared ownership of templates/sessions
  (RLS: membership table + `org_id` scoping). Prerequisite for
  multi-evaluator observation (ROADMAP 2.3).
- **L2. Qualitative coding** — evaluator tags open/interview answers
  with reusable codes; code-frequency matrix per template.
- **L3. SUS confidence intervals** — small-sample CI (Sauro & Lewis) on
  report SUS summaries.
- **L4. Auto-instrumentation snippet** *(ROADMAP 1.3)* — embeddable JS
  for browser-based systems under test streaming click/key events into
  the session; correlate vs evaluator counts.
- **L5. Retroactive session anonymization** *(ROADMAP 2.2)* — one-click
  identity strip on a completed session.
- **L6. Participant client i18n** (PT/EN first) and WCAG 2.1 AA pass
  (focus order, labels on rating buttons, contrast).
- **L7. Practice-task flag** — warm-up tasks excluded from all metrics.
- **L8. Session/report polish** — template duplication, figure
  export (PNG/SVG) from dashboards, media size limits + compression
  on capture.
- **L9. README rewrite + repository license** — required before the
  paper's "open" claim is submitted (see paper Availability TODO).

## Explicitly deferred

- PWA/offline evaluator mode (large surface; revisit after N1 exists).
- Screening/quota logic on shared links beyond `max_responses`.
- Realtime evaluator-side subscriptions replacing the 3 s gate polling
  (works; only revisit if scale demands).
