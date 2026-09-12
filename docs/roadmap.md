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
