# Classroom evaluation of Avalux: study design

The paper now claims that Avalux is a pedagogical tool because it makes
methodological quality observable. That is a design argument. "Improves upon
the traditional approach" is an empirical claim, and this is the study that
would test it. It is written so it can be handed to an advisor as is.

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
| Report | Written report | Written report (Avalux PDF may be attached) |

Both cohorts receive the same lecture material on moderated testing. The
treatment cohort receives the in-app help page and the tutorial video; the
control cohort receives an equivalent written guide, so instructional
content is matched and only the tool differs.

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

Score with a fixed key; report gain scores by cohort.

**What goes wrong (RQ5), treatment cohort only.** Snapshot the protocol
review's findings for every template at two points: first save, and the
version used for the first real session. The difference is which findings
students fixed after feedback and which persisted. This requires no new
instrumentation; `reviewTemplate()` in `src/lib/protocol-review.ts` is pure
and can be run over an export of the templates table.

## Confounds to name in the paper

- **Novelty.** The treatment tool is new; the control is not. Report it,
  and if the course runs twice, use the second run.
- **Instructor effect.** One instructor for both cohorts, or two instructors
  each teaching one section of each condition.
- **Effort.** Time on the assignment may differ. Ask teams to log hours.
- **The author teaches the course.** State it, and have a second grader who
  did not build the tool.

## Ethics

Students are a captive population. Participation in the *study* must be
optional and separate from the assignment: the assignment is the same
either way, and only the use of a team's data in the analysis requires
consent. Grades must not depend on condition. This needs institutional
review even if the usability studies themselves did not.

## What goes in the paper now

Until the study runs, Future Work states the design in one paragraph, which
it now does. The pedagogical-design subsection makes the design argument
and explicitly does not claim the empirical one. When results exist, RQ1 to
RQ4 become a Classroom Evaluation section between the case studies and the
discussion, and RQ5 becomes a table of finding frequencies before and after
feedback.
