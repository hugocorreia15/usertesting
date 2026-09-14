# Classroom evaluation of Avalux: study design

The paper now claims that Avalux is a pedagogical tool because it makes
methodological quality observable. That is a design argument. "Improves upon
the traditional approach" is an empirical claim, and this is the study that
would test it. It is written so it can be handed to an advisor as is.

**Revised on 2026-09-14** to cover what was built after the first draft:
heuristic inspection, the comparison of inspection predictions with testing,
reflection after each session, the kept review history, the record of
corrections made while logging, and the instructor's class view. RQ6 to RQ9 are
new, RQ5 now uses the review history instead of manual snapshots, and the
confounds gain the threats these features introduce.

## Research questions

- **RQ1 (protocol quality).** Do teams using Avalux design better protocols
  than teams using a stopwatch-and-spreadsheet toolchain?
- **RQ2 (reliability).** Do Avalux teams log more consistently, measured as
  inter-rater agreement between two team members on the same session?
- **RQ3 (statistical literacy).** Are Avalux teams more likely to report
  uncertainty alongside their estimates?
- **RQ4 (understanding).** Does methodological understanding improve more for
  Avalux teams, measured by a pre/post test?
- **RQ5 (what goes wrong).** Which protocol-design mistakes do students make,
  and do they persist after feedback?
- **RQ6 (the evaluator effect).** After inspecting alone and seeing their own
  agreement, do students understand why one evaluator is not enough, and how
  many to use?
- **RQ7 (inspection against testing).** After comparing their predictions
  with what participants encountered, do students judge what each method is
  good for correctly, and in particular stop reading an unobserved prediction
  as a false alarm?
- **RQ8 (reflection).** Does a reflection written right after a session,
  beside what the session recorded, name the moderator's own interventions more
  often than one written later from memory?
- **RQ9 (the instructor's loop).** Does the class view change how often, and
  how early, the instructor intervenes in a team's work?

## Design

Two cohorts of the same course unit, same assignment, same rubric, same
instructor. Assignment is by team, not by student, and balanced on prior
coursework. If two parallel sections are not available, the alternative is
a within-subjects crossover: every team runs a small pilot with the
spreadsheet toolchain first, then the main study with Avalux, accepting the
order confound in exchange for feasibility.

| | Control | Treatment |
|---|---|---|
| Protocol design | Word document + rubric | Avalux template + protocol review |
| Live sessions | Stopwatch, paper log, spreadsheet | Avalux cockpit and participant client |
| Analysis | Spreadsheet | Avalux analytics + raw export |
| Inspection | Individual heuristic evaluation on a form, merged in a document | Avalux inspection: isolated passes, merge, agreement statistics |
| Synthesis | Report section comparing predictions with test results | Avalux "After testing" with session evidence |
| Reflection | The same three questions, answered once in the report | The same three questions, answered per session beside the recorded evidence |
| Instructor oversight | Opening each team's documents | Class view, review with history |
| Report | Written report | Written report (Avalux PDF may be attached) |

Both cohorts receive the same lecture material on moderated testing. The
treatment cohort receives the in-app help page and the tutorial video; the
control cohort receives an equivalent written guide, so instructional
content is matched and only the tool differs.

Two matching decisions matter for the new questions. Control teams hand in
each individual inspection form *before* merging, through the course's
submission system, so their agreement can be computed by the researchers even
though they never see it. And control teams answer the same three reflection
questions as the treatment cohort, so RQ8 compares when and beside what the
questions are answered, not which questions are asked.

## Measures

**Protocol quality (RQ1).** Two graders, blind to condition, score each
team's protocol on a rubric before any session runs:

| Criterion | 0 | 1 | 2 |
|---|---|---|---|
| Tasks state goals, not procedures | names UI elements | mixed | goal-oriented throughout |
| Success criteria | absent | vague | explicit per task |
| Baselines (optimal time and actions) | none | some tasks | all measured tasks |
| Error taxonomy | none | generic | study-specific, defined |
| Counterbalancing planned | none | mentioned | strategy and rationale |
| Practice task | absent | present | present and excluded from metrics |
| Instrument choice justified | none | named | named with rationale |
| Consent and data handling planned | absent | consent mentioned | consent form, anonymization, and storage stated |

Report inter-grader agreement on the rubric itself (weighted kappa) so the
measure is as defensible as what it measures.

**Report evidence checklist.** The paper's Table I claims its third
column, "evidence of outcome", is this study's rubric. The protocol rubric
above covers the rows that are visible before a study runs; the rest are
visible only in the final report and are scored there, row for row:

| Table I objective | Evidence graders look for in the report |
|---|---|
| Write tasks as goals, not procedures | Review warnings resolved before the first session (treatment); no interface names in task text (both) |
| Fix criteria and baselines before running | Criterion and baseline on every measured task |
| Control order effects | Order strategy stated and justified |
| Treat "error" as a judgement | Cohen's kappa reported; disagreements discussed and reconciled |
| Report uncertainty with small n | An interval or explicit uncertainty beside every score |
| Moderate without leading | Observer notes cite hints or interventions, and the report reflects on them |
| Analyse qualitatively as a procedure | Codes defined before tagging; frequency matrix or equivalent reported |
| Handle participant data ethically | Consent on file for every participant; anonymized data in any appendix |

Each row is scored 0 to 2 by two graders blind to condition. This is the
measurement that closes the chain the paper draws from learning objective,
through what the platform offers, to an observable outcome.

**Reliability (RQ2).** Every team runs one session that a second team
member co-rates. Control teams do this from a recording with two paper logs;
treatment teams use the co-rating page. Cohen's kappa on completion status
and the mean absolute difference on error counts, per team, compared between
cohorts. This is the platform's own agreement statistic, so for the
treatment cohort it is also a check that the feature is used.

**Statistical literacy (RQ3).** From the final reports, code whether each
reported SUS (or other instrument) score carries an interval or any
statement of uncertainty, and whether the sample size is discussed as a
limitation. Two coders, blind to condition.

**Understanding (RQ4).** A short instrument administered before the
assignment and after submission, identical in both cohorts. Draft items:

1. A task reads "Click the Settings tab and change the language". What is
   wrong with it as a usability-test task, and how would you rewrite it?
2. Two observers watched the same session and counted 3 and 7 errors. Give
   two reasons this can happen and one way to reduce it.
3. Five participants gave SUS scores with a mean of 71. What can and cannot
   be concluded, and what would you report?
4. You have six tasks and eight participants. How do you order the tasks
   across participants, and why?
5. Name a metric that is not comparable across studies and one that is,
   and explain the difference.

6. Four students each inspected the same app alone and found 9, 7, 8 and 6
   problems, but only 2 problems appear in all four lists. What does this
   suggest about inspection, and how many evaluators would you use next time?
7. An inspection predicted 10 problems. In a test with five participants, 6
   of them occurred, and the test also showed 4 problems nobody predicted. Did
   the inspection produce 4 false alarms? What can you conclude about each
   method?

Items 6 and 7 are the understanding measures for RQ6 and RQ7. Score with a
fixed key; report gain scores by cohort.

**The evaluator effect (RQ6).** The outcome is item 6, not the agreement itself.
Any-two agreement is a property of the method and should be similar in both
cohorts; what the treatment is meant to change is whether students understand
it. Agreement is still computed for every team, in the treatment cohort from
the `inspection_findings` and `inspection_problems` tables and in the control
cohort by the researchers from the forms handed in before merging. It serves as
a check that passes were independent: a team whose agreement sits far above the
5% to 65% range reported by Hertzum and Jacobsen probably did not work alone.

**Inspection against testing (RQ7).** The outcome is item 7. Treatment teams'
predictions, outcomes and evidence come from the `inspection_problems`,
`test_problems` and `problem_evidence` tables; report per team the share of
tested predictions participants encountered and the share of observed problems
the inspection predicted. Control teams' equivalents are coded by two graders
from the comparison section of the report, where one exists. Code separately
whether a report calls unobserved predictions false, wrong, or false alarms.

**Reflection (RQ8).** Two coders, blind to condition, rate each answer to "what
did you do that may have led the participant" as specific (names a task and a
behaviour), generic, or none. For treatment sessions that someone observed, also
check the answer against the observer's notes: an observer who recorded a hint
and a moderator who answered "nothing" is a missed intervention. Compare the
rate of specific answers between cohorts, and report the miss rate for the
treatment cohort.

**Reliability, extended (RQ2).** For treatment sessions, the export's
`moderation_events` table records each correction made while logging. Report
whether sessions with more undone entries also show lower co-rater agreement,
which is the observer-load explanation the paper can currently only assert.

**The instructor's loop (RQ9).** The instructor keeps a weekly log for each
cohort: time spent on formative oversight, and each intervention with the team,
the week, and what prompted it. Compare intervention counts and the week of
first intervention per team. This is the weakest measure in the design, since
the instructor knows the condition, and should be reported as descriptive.

**What goes wrong (RQ5), treatment cohort only.** Every submission for review
is now kept with the protocol exactly as submitted (migration 054, the
`review_events` table of the export). Run the protocol review over each
submission snapshot in order: a finding present in one submission and absent
from the next was fixed after feedback, and one present in both persisted. The
reviewer's note between them says what was asked. This needs review mode set to
at least *advisory* on every treatment template, or there are no submissions to
snapshot. It also needs a small adapter, since the snapshot stores the protocol
in a flatter shape than the review function reads.

## Confounds to name in the paper

- **Novelty.** The treatment tool is new; the control is not. Report it,
  and if the course runs twice, use the second run.
- **Instructor effect.** One instructor for both cohorts, or two instructors
  each teaching one section of each condition.
- **Effort.** Time on the assignment may differ. Ask teams to log hours.
- **The tool's developers.** If anyone who built the tool teaches or grades
  the course, state it, and add a grader who was not involved in building it.
- **Isolation outside the platform.** The platform keeps inspection passes and
  reflections apart, but students can still share findings in a chat. The
  agreement check in RQ6 detects the gross case, not the subtle one.
- **Evidence becoming the target.** The class view shows which evidence each
  team has produced, so a team can fill a column without the understanding it
  stands for. This is why the outcomes are the understanding items and blind
  grading, never the columns.
- **Candour.** The instructor reads submitted reflections, which may make
  students write for the reader. Grading must not depend on what a reflection
  admits, and students must be told so before they write one.
- **Added work.** Several features add steps by design, so the effort
  confound is larger than for a tool that only saves time. Hour logs matter
  more, not less.

## Ethics

Students are a captive population. Participation in the *study* must be
optional and separate from the assignment: the assignment is the same
either way, and only the use of a team's data in the analysis requires
consent. Grades must not depend on condition. This needs institutional
review even if the usability studies themselves did not.

Reflections are the most personal data the study collects. Consent to analyse
them should be asked for separately, and quotations in any publication must be
anonymized beyond removing names, since a team's project can identify it.

## What goes in the paper now

Until the study runs, Future Work states the design in one paragraph, which
it now does. The pedagogical-design subsection makes the design argument
and explicitly does not claim the empirical one. When results exist, RQ1 to
RQ4 become a Classroom Evaluation section between the case studies and the
discussion, and RQ5 becomes a table of finding frequencies before and after
feedback. RQ6 and RQ7 report the understanding items with the agreement and
synthesis ratios beside them as context, RQ8 reports the coded reflections, and
RQ9 stays descriptive.

Every table these measures read is in the platform's data export, so the
analysis needs no database access.
