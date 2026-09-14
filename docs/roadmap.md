# Build order: paper and code, sequenced against a semester

Supersedes the priority section of
[pedagogical-coverage-and-gaps.md](pedagogical-coverage-and-gaps.md), which
was written before the inspection gap was spotted.

**Ordering principle.** Work is ordered by *when a student cohort hits it*, not
by size or by how much each item helps the paper. Anything that must capture
data while the cohort runs comes before anything that reads data already
stored. Paper items that are *decisions* come before the code they constrain;
paper items that are *writing* come last, because prose is the only fully
recoverable artefact here.

---

## The gap that reorders everything

Avalux has no inspection method. Every feature assumes participants already
exist and a protocol is already written. But an HCI methods course teaches
inspection first: it is cheap, needs no participants, needs no ethics
approval, and it is what produces the problem list that the usability test is
then designed to confirm.

That omission is also visible in the paper. Table I's eight rows all teach
*how to run an empirical test well*. Not one teaches how to choose or justify
a method. This is close to the exact wording of the advisor's objection, that
streamlining the task of evaluating something differs from teaching the
methodology of the field.

**Why this is the strongest available answer to that objection.** Heuristic
evaluation is where the evaluator effect was first and most sharply
documented. If four students inspect the same interface independently, they
produce substantially different problem lists, and the platform can plot the
cumulative unique problems against the number of evaluators. Students then
derive Nielsen's three-to-five evaluator guidance *from their own data*
instead of being told it in a lecture.

That is teaching a methodology, not streamlining a task, and it is not
something a spreadsheet can do.

The supporting model is `nielsen1993mathematical`, already cited twice in the
paper to justify small participant samples. It is the same mathematics applied
to evaluators rather than users, so the citation is in place and the argument
extends rather than opens a new front.

---

## Phase 0: decisions, no code

These constrain everything below, so they come first. Roughly a day in total,
none of it implementation.

| # | Item | Why it is first | Size |
|---|---|---|---|
| D1 | Rewrite Table I: ground objectives in Oleson's difficulty codes and add rows for method choice and inspection | Table I's evidence column is what the class view later displays, and the inspection rows do not exist yet | S |
| D2 | Name the evaluation strategy after Ledo: the two case studies are a Demonstration, the classroom study is a Usage study | Decides how the evaluation section is framed and what the classroom study must measure | S |
| D3 | Verify the Hertzum and Jacobsen agreement figures against the original paper | Currently from a search summary only. The inspection module's entire teaching claim rests on these numbers | S |
| D4 | Decide the independence line: what an instructor may see before consolidation | A database constraint on the module below, not a preference. Schwind et al. warn that supervision can destroy the independence of student work | S |
| D5 | Fix Table I row 8, which still says consent is recorded outside the platform | Stale since consent capture shipped in migration 050 | XS |

### Phase 0 outcome

All five done on 2026-09-12, in commit noted below. Two things did not go as
written.

**D1 was narrowed.** The roadmap said to add Table I rows for method choice
and inspection. Table I is a claim about what the platform offers, and the
inspection module does not exist, so writing those rows would have made the
paper false. What was done instead: the existing objectives are now tagged
with the Oleson difficulty each addresses, two rows were added for features
that *have* shipped (the protocol review's rationales, tagged `WHY`, and the
instructor gate, tagged `STAGE` and `RUSH`), and the absence of any inspection
method is stated plainly in the prose and in Future Work. The inspection rows
get added in Phase 4, when there is something to describe.

**D3 changed one fact in the analysis.** The figures are confirmed from the
source, not a summary: average agreement between any two evaluators ranges
from 5% to 65% across eleven studies, holding for novices and experts alike
and for severity ratings as well as problem detection. Two details matter for
Phase 1. Any-two agreement is defined as the problems two evaluators share
divided by the problems they collectively detect, averaged over all pairs,
which is the Jaccard index and is what H5 should compute. And the paper
attributes the effect to vague goal analyses, vague procedures, and vague
problem criteria, which is a sharper argument for the platform than the
agreement number itself: those are the three things a protocol template is
forced to make explicit.

### D4, decided: the independence rule for Phase 1

The evaluator effect only exists if the passes are genuinely independent, and
Hertzum and Jacobsen name anchoring as one of its three causes. So isolation
is a correctness requirement for the metric, not a classroom courtesy.

1. **Peer isolation.** An evaluator cannot read another evaluator's findings
   for the same evaluation until they have submitted their own pass. Enforced
   in row-level security, for the same reason the review guard is: the
   interface is not where a grade-bearing rule belongs.
2. **Unlock is per evaluator.** Once you submit, you may read anyone else who
   has also submitted. Nobody waits for the slowest teammate.
3. **Submission freezes your pass.** Otherwise the rule is trivially defeated:
   submit an empty pass, read everyone else's, then fill yours in. Frozen sets
   are also what makes the agreement statistic mean anything, since it is
   computed over what each evaluator found *alone*. Later insights belong in
   consolidation, which is collaborative by design.
4. **The instructor sees status, not content, until consolidation.** Progress
   and submission times feed the class view; findings stay closed. Schwind et
   al.'s warning applies to the instructor as much as to a teammate: an
   instructor who reads one pass early can steer the rest. The exception is
   when every evaluator has submitted, after which anchoring is impossible and
   the instructor sees everything.

---

## Phase 1: the inspection module

The largest build, and the one with the earliest deadline, because a cohort
reaches it in its first weeks.

### What it is

Two modes, both real course assignments:

- **Inspect your own design**, once a prototype exists.
- **Inspect comparable products**, which is what students can do in week one
  before they have built anything.

### Design sketch

| # | Item | Notes | Size |
|---|---|---|---|
| H1 | Schema: heuristic sets, evaluations, evaluator assignments, findings, consolidation | Seed Nielsen's ten. Let an organization define its own set, so a course can teach a different one. Finding carries heuristic, location, description, severity 0 to 4, evidence image | L |
| H2 | Row-level security enforcing independence: an evaluator cannot read another's findings until their own pass is submitted | The pedagogically load-bearing constraint. Belongs in the database, not the interface, for the same reason the review guard does | M |
| H3 | Independent pass interface | Reuses the existing private-media signed URL path for evidence screenshots | M |
| H4 | Consolidation: merge duplicates across evaluators, agree a final severity | This is the step where students discover how little they overlap | M |
| H5 | Metrics: proportion of problems found by only one evaluator, mean pairwise agreement, severity agreement, and the aggregation curve | Reuses `cohensKappa` and `numericAgreement` from `src/lib/agreement.ts`. The curve is fitted with the model the paper already cites | M |
| H6 | Traceability: turn a finding into a test task, and show the link in both directions | Closes the pipeline. A reader of the report can see why each task exists | S |
| H7 | Gate integration: optionally require a consolidated inspection before a protocol may be submitted for review | Opt-in per organization, matching the existing review mode | S |

### Phase 1 status

Built on 2026-09-12. H1 through H7 are in, with one exclusion.

| # | State |
|---|---|
| H1 schema | done, migration 052, six tables |
| H2 isolation in row-level security | done, verified by `scripts/verify/inspection-isolation.sql` |
| H3 independent pass interface | done, minus evidence images |
| H4 consolidation | done |
| H5 metrics | done, `src/lib/inspection.ts`, 26 tests |
| H6 finding to task | done, `template_tasks.from_problem_id` |
| H7 gate integration | done, opt-in `templates.require_inspection` |

**Evidence image uploads are deliberately excluded.** The storage bucket keys
access on a user-id path prefix, so a policy for inspection evidence would
have to re-implement the peer-isolation predicate over `storage.objects`.
Getting that wrong leaks evidence images past the isolation boundary, which is
the one thing this module exists to prevent. The column is in the schema and
the work is scoped as its own task with its own verification.

**Two design bugs were found and fixed during the build.** Guarding deletes
with triggers made an inspection undeletable, because `ON DELETE CASCADE`
fires those triggers; deletion moved into row-level security, which cascades
correctly bypass. And an evaluator joining after collection closed would have
held an unfrozen pass beside frozen ones, so joining is now refused once
collection is over.

**Verified against the live database on 2026-09-14.** Migration applied and
`scripts/verify/inspection-isolation.sql` run in the SQL editor: 18 of 18 PASS,
with no SKIP, so the non-evaluator instructor case was exercised for real. The
checks that matter most:

| Behaviour | Result |
|---|---|
| An unsubmitted evaluator sees 2 of 4 findings, not 4 | PASS |
| Submitting alone does not unlock an unsubmitted peer | PASS |
| A submitted pass refuses edits, new findings, and deletion | PASS |
| `submitted_at` refuses a direct write | PASS |
| An org owner who is not an evaluator sees 0 findings, 2 evaluators | PASS |
| The last submission ends collection; all 4 then visible | PASS |
| Consolidation may merge frozen findings but not rewrite them | PASS |
| Nobody may join, and nothing may reopen, once collection closes | PASS |

**Not yet exercised in a browser.** The migration is live, but the interface
has never run against it. A smoke test needs a signed-in session, so it is
yours to do: start an inspection, add findings as two accounts, submit both,
merge, and check the statistics appear.

### What it unlocks

- A second site for the evaluator effect, needing no participants at all.
- New Table I rows with evidence the platform itself reports.
- Ledo's fourth evaluation strategy, Heuristics, becomes available for the
  toolkit's own evaluation.

---

## Phase 2: before sessions start

| # | Item | Why here | Size |
|---|---|---|---|
| B | Reflection prompt after each session: what surprised you, what would you change, what may have led the participant | The only strictly unrecoverable item. No prompt during the semester means no reflections, ever | S |

### Phase 2 status

Built on 2026-09-14. **Verified against the live database the same day**:
migration 053 applied and `scripts/verify/reflection-visibility.sql` run, 14 of 14
PASS, with three accounts playing moderator, teammate and instructor. The checks
that carry the design:

| Behaviour | Result |
|---|---|
| No reflection before the session is completed | PASS |
| Nobody can write as someone else, or insert one already submitted | PASS |
| A placeholder answer under twenty characters cannot be submitted | PASS |
| Instructor and teammate both see 0 while it is a draft | PASS |
| A submitted reflection refuses edits and deletion | PASS |
| Instructor sees it once submitted; a teammate who has not reflected still sees 0 | PASS |
| Your own draft unlocks nothing; submitting yours unlocks a teammate's | PASS |

| Part | State |
|---|---|
| Migration 053, one table and a submit function | applied |
| Visibility rule in row-level security | verified, 14 of 14 |
| Evidence summary beside the questions | done, `src/lib/reflection.ts`, 11 tests |
| Reflection card on completed sessions | done |
| Submitted reflections in the CSV and JSON export | done, drafts excluded, tested |

**Design, and where it follows the inspection module.** Three fixed questions,
not configurable, so cohorts can be compared. A reflection is a private draft
until submitted, and submitting freezes it. A teammate's reflection on the same
session becomes readable once you have submitted your own; the instructor reads
submitted reflections but never drafts. Students learn one rule for inspection
and reflection.

**The questions are grounded in evidence, not memory.** Beside them the card
lists the tasks worth looking back at (failed, hesitations, errors, twice the
expected time, an easy rating on a task that went badly) and what teammates
noted while watching. A quiet session is described as such, with the warning
that it is also what a session looks like when the moderator quietly helped.

**Two mistakes caught before they reached the database.** The column for the
third question was first named `leading`, a reserved word in Postgres; it is
now `may_have_led`, and `scripts/verify/sql-lint.mjs` now rejects reserved
column names. And the form first reloaded the stored draft on every refetch,
which would have erased unsaved typing whenever the window regained focus.

**Paper corrected on 2026-09-14.** The paper said SUS was always on and that
every session ended with it. SUS has been optional since migration 049, and
that is the intended design: a study under time pressure may need workload
rather than perceived usability, a comparison of experiential appeal may need
UEQ-S alone, and a formative study may need no questionnaire. The abstract,
Protocol Model, Live Session, Measures, and the architecture figure now say so,
and note that the protocol review flags a template with no instrument at all.

---

## Phase 3: during and after sessions

| # | Item | Why here | Size |
|---|---|---|---|
| A | Cross-team class view, now covering inspection status as well as sessions | The professor's weekly loop. Must exist *during* the cohort for the intervention to be real, though its analysis could be recovered later | L |
| F+ | Extend findings to post-session synthesis, reusing the Phase 1 tables | The schema has no problem object at all today. One model serves inspection and session synthesis | M |
| G | Export review and inspection history | Recoverable by querying the database, so it sits below the items above | S |
| D | Moderation metrics shown back to the student | Skips and timings are stored. Undo and reset leave no trace today, so they must be logged first; see the correction in the analysis | M |

### Phase 3 status

**A, the class view, built on 2026-09-14.** Owners see it at the top of the
organization page: one row per project, with the list of what needs their
attention beside the project name, then the evidence columns.

The columns are the evidence column of the alignment table where the platform
records it: inspection merged and the evaluators' agreement, protocol warnings
outstanding, review status, and of the completed sessions how many have consent
on file, a counterbalanced order, a co-rater and the kappa, an observer, and a
submitted reflection. Pilots are counted but excluded from every expectation.

Two alignment rows are deliberately not shown because the platform cannot see
them: whether a report states its uncertainty, and whether a warning was
resolved with a written justification.

**Reads go through row-level security, not a database function.** A function
would have to bypass the verified policies and restate them, including "no
inspection findings until every pass is in". Reading as the owner means the
view can only show what the owner may already see. No migration was needed.

**The screenshot changed the design.** The first version put "Needs attention"
last, and at 1440 pixels it had scrolled out of view, so the one column saying
what to do was the one an instructor could not see. It now sits beside the
project name.

---

## Phase 4: paper writing

Only once there is something to describe.

| # | Item | Size |
|---|---|---|
| P-new | New subsection on the inspection module and the evaluator effect it makes visible | M |
| P6 | An education thread in Related Work, which currently has none. Add Nielsen and Molich, Nielsen's heuristics, Hertzum and Jacobsen, alongside the Oleson and Ledo citations | M |
| P5 | Threats to the pedagogical claim | S |
| CS | Extend the classroom study design with inspection research questions | M |

---

## Phase 5: after the first cohort

Session review threads, cross-iteration comparison, consent versioning.

---

## What changed, and why

| Was | Now | Reason |
|---|---|---|
| Class view first | Phase 0 decisions, then inspection | Inspection lands in the cohort's first weeks; the class view matters from the middle of the semester |
| Export review history third | Phase 3 | Review decisions are already stored, so the export is recoverable at any time |
| Paper edits after all app work | Five of them moved to Phase 0 | They are decisions that constrain the schema, not prose |
| No inspection anywhere | The largest single item | The pipeline was missing its first stage |
