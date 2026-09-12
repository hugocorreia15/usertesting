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

**Still to verify against the live database.** The migration has not been
applied. Run `scripts/verify/inspection-isolation.sql` in the SQL editor after
applying it; every row should read PASS, or SKIP where the project lacks a
third account.

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

---

## Phase 3: during and after sessions

| # | Item | Why here | Size |
|---|---|---|---|
| A | Cross-team class view, now covering inspection status as well as sessions | The professor's weekly loop. Must exist *during* the cohort for the intervention to be real, though its analysis could be recovered later | L |
| F+ | Extend findings to post-session synthesis, reusing the Phase 1 tables | The schema has no problem object at all today. One model serves inspection and session synthesis | M |
| G | Export review and inspection history | Recoverable by querying the database, so it sits below the items above | S |
| D | Moderation metrics shown back to the student | Cheap, and the undo, reset and idle data is already logged | S |

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
