# Avalux Roadmap — updates that strengthen the paper

Each item lists the effort, what it adds to the platform, and which paper
section it feeds. Ordered by scientific value per unit of work, not by
engineering appeal: the paper's weakest flank is *evaluation of the tool
itself*, so Tier 1 exists to convert "we built it and used it" into
"we built it, used it, and measured it".

## Tier 1 — Evaluation studies (highest paper value)

### 1.1 Evaluator meta-study: Avalux vs. ad-hoc toolchain
- **What:** 6–10 evaluators each run the same scripted, pre-recorded mock
  session twice (counterbalanced): once logging in Avalux, once with a
  stopwatch + spreadsheet + separate questionnaire form. Measure: protocol
  setup time, logging completeness (against a ground-truth event list),
  time from session end to finished report, and SUS + NASA-TLX on each
  toolchain.
- **Platform work:** none required (a scripted video + event list is study
  material, not code).
- **Paper:** new section "Evaluation" — this is the single biggest upgrade;
  it turns the tool paper into a validated-tool paper and directly answers
  the "no comparative eval" limitation already admitted in §Discussion.

### 1.2 Inter-rater reliability of live logging
- **What:** 2–3 evaluators independently log the same recorded session;
  report Cohen's κ for error categorization and ICC for action/hesitation
  counts.
- **Platform work:** none (runs on existing features).
- **Paper:** subsection in Evaluation; addresses the "evaluator-logged
  counts" validity threat head-on.

### 1.3 Optional auto-instrumentation for web targets
- **What:** a small embeddable JS snippet for browser-based systems under
  test that streams clicks/keys/navigation into the active session as
  auto-counted actions, letting studies compare evaluator-logged vs.
  instrumented counts on the same tasks.
- **Platform work:** medium — public ingest endpoint keyed on join code,
  new `auto_events` table + RLS, live-view overlay toggle.
- **Paper:** method-validity data (correlation between manual and automatic
  counts) plus a feature bullet; already named in Future Work, so shipping
  it converts a promise into a result.

## Tier 2 — Features already promised in the paper (keep it honest)

### 2.1 Flexible task model
- Drop the fixed simple/complex dichotomy (todo.txt); groups become fully
  user-defined taxonomies. Mostly done in UI (task groups exist) — remove
  the residual complexity column and migrate seeds.
- **Paper:** delete from Future Work, mention as shipped in §Protocol Model.

### 2.2 Per-session anonymization
- One-click strip of participant identity from a completed session
  (retain demographics, unlink identity), plus retention policy fields.
- **Platform work:** small — RPC + UI on session detail; the anonymization
  groundwork (migrations 008/019–024) exists.
- **Paper:** strengthens the ethics/GDPR paragraph in §Security Model.

### 2.3 Multi-evaluator observation
- Read-only spectator role for a live session (second evaluator or
  stakeholder), reusing the existing realtime channel; optional
  timestamped observer notes.
- **Platform work:** medium — join-code-scoped read policies already
  cover most of it; needs a spectator route + notes table.
- **Paper:** Future Work → shipped; enables the 1.2 reliability study to
  run live rather than from recordings.

## Tier 3 — High-value, low-cost additions

### 3.1 Event timeline in reports  *(cheapest win — data already exists)*
- `error_logs` / `hesitation_logs` already store `timestamp_seconds`;
  plot them on a per-task timeline strip in the session dashboard and PDF.
- **Paper:** one figure showing *when* within a task problems cluster —
  reviewers love temporal detail; ~a day of work.

### 3.2 Raw data export (CSV/JSON)
- Export sessions/task_results/logs/answers as flat files for external
  statistical analysis (R/SPSS/JASP).
- **Paper:** one sentence in §Analysis and Reporting; big for the
  "research resource" framing.

### 3.3 Participant-client accessibility pass
- WCAG 2.1 AA audit of join flow + participant live view (focus order,
  contrast, screen-reader labels on rating buttons).
- **Paper:** inclusive-research sentence; also genuinely widens who can
  participate in studies.

### 3.4 Interface internationalization (PT/EN)
- Participants in both case studies answered in Portuguese; localize the
  participant-facing strings first.
- **Paper:** footnote-level, but reviewers from non-EN contexts notice.

## Sequencing suggestion

1. **3.1 + 3.2** (days): ship, regenerate report examples, update paper
   §Analysis and Reporting.
2. **2.1 + 2.2** (week): ship, move from Future Work into System Design.
3. **1.2** (a weekend with two colleagues): first reliability numbers.
4. **1.1** (the real study — plan ~2 weeks incl. recruiting evaluators):
   new Evaluation section; this is the version worth submitting to a
   full-paper track rather than a demo/tool track.
5. **1.3 + 2.3** as the follow-up paper's material.
