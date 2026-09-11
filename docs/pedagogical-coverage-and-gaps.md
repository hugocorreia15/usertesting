# Avalux in an HCI professor's week: what is covered, what is missing

Written to answer one question an advisor will keep asking: **why would an HCI
professor use this every week, rather than a spreadsheet and a plan template?**

It has three parts: what the literature says a tool like this must do, what
Avalux already does about each, and what is still missing from the app and the
paper. The last section turns it into a semester narrative, which is the form
the argument has to take to be convincing.

## A note on sourcing

Claims below are marked by how I checked them.

- **[read]** I read the source text and the claim is verbatim or close.
- **[search]** From a search summary only. **Verify against the original before
  citing it in the paper.**
- **[own]** From this repository and this paper, checked directly.

---

## 1. What the field says a tool like this must do

| # | Finding | Source | Confidence |
|---|---|---|---|
| L1 | HCI teaching is dominated by active, project-based approaches; a mapping of 17 papers found only **two** tools built for HCI teaching, and 76% of the studies were experience reports with no rigorous evaluation | Lima and Benitti, HCII 2019 | [read] |
| L2 | Computing students hit **18 distinct kinds of difficulty** learning HCI. Several are method difficulties a tool can act on: `WHY` "why do we do this activity this way", `HOW` "how do I perform this method", `SYNTH` "how do I interpret this feedback", `BIAS` "how do I avoid biasing my design", `STAGE` "when should I move to the next stage", `SCOPE`, `TEAM`, `EVAL` | Oleson, Solomon and Ko, CHI 2020 | [read] |
| L3 | The **evaluator effect**: evaluators applying the same method to the same interface find substantially different problem sets. Reported agreement between any two evaluators spans roughly 5% to 65%, and it affects novices and experts alike | Hertzum and Jacobsen, IJHCI 15(1), 2003 | [search] |
| L4 | Planning support for student studies exists (method choice, power, Latin squares, consent generation) and **stops where the session starts**. Its authors warn that heavy supervision "calls into question the independence of the student's research work" | Schwind, Resch and Sehrt, CHI EA 2023 | [read] |
| L5 | The field's own plan template makes assessment turn on an **instructor gate**: students may not recruit or test until the instructor has given feedback | Rose, EngageCSEdu | [read] |
| L6 | Students value GenAI as a **procedural scaffold** but distrust it when it pre-empts their judgement, and dislike its sycophancy. Scaffolding is most useful *after* they have formed their own view | Aziz, Kharrufa and Johnson, EduCHI 2026 | [read] |
| L7 | Toolkit papers are evaluated by four strategies: **Demonstration, Usage, Technical Performance, Heuristics**. Demonstration is the most common and the weakest on its own; it is an existence proof, not evidence of value | Ledo et al., CHI 2018 | [read] |
| L8 | Teaching is aligned when objectives, activities and assessment point at the same thing | Biggs, 1996 | [read] |
| L9 | Students are a **captive population**. Consent must be free of the course's power relation, and participation in a study must be separable from the assignment | Ethics literature on student participants | [search] |

The two that change the argument most are **L2** and **L7**. L2 replaces my
a-priori guess about what students find hard with evidence. L7 names what kind
of paper this is and what its evaluation currently is not.

---

## 2. Boxes completed

What Avalux does today, against the finding it answers.

| Requirement | From | Avalux today | In the paper |
|---|---|---|---|
| Method is a procedure, not improvisation | L2 `HOW` | Template encodes tasks, baselines, typed errors, instruments; the protocol cannot be skipped | III-B, III-I |
| Say *why* a method step matters | L2 `WHY`, L6 | Protocol review: 10 checks, each with a one-line rationale linked to the in-app tutorial | III-I |
| Avoid leading the participant | L2 `BIAS` | Leading-task check: procedural verbs and quoted labels warn, interface nouns note | III-I |
| Make the evaluator effect visible | L3 | Independent co-rating; Cohen's kappa on completion plus agreement on counts, per session | III-D |
| Small samples report uncertainty | — | SUS with 95% CI; the interval is shown with the score | III-D |
| Counterbalancing is a decision | — | Per-session fixed / shuffled / Latin square, with an explainer | III-B |
| Moderation is observable | L2 `SYNTH` | Read-only observation view with timestamped observer notes | III-E |
| Qualitative analysis is a procedure | — | Code book per template, tagging, codes-by-session matrix | III-G |
| Gate before recruiting | L5, L2 `STAGE` | Opt-in instructor review per template; join links wait for approval | III-I |
| Do not destroy independence | L4 | The gate blocks recruiting, **not rehearsal**: unapproved sessions run as pilots, excluded from analytics | III-I |
| Scaffolding after their own judgement | L6 | The review runs on a saved design, not while typing; deterministic, so no sycophancy | III-I |
| Consent is procedural | L9 | Per-template consent text, required checkbox on join, timestamped; evaluator can record consent taken in person | III-E |
| Data handling is procedural | L9 | Retroactive anonymisation; private media via signed URLs | III-E |
| Class-wide comparability | L8 | Organization defaults for instruments, consent text, review mode | III-I |
| Objectives to outcomes | L8 | Table I is a constructive-alignment table; its evidence column is the study rubric | III-I |
| The analysis is the student's | — | Raw CSV/JSON export of every table | III-F |

That is a genuinely strong list. **The gaps below are what a reviewer, or your
advisor, will press on anyway.**

---

## 3. Missing from the app

Ranked by how much each strengthens the professor's weekly case, against effort.

### A. Cross-team comparison for the instructor — *highest value*
**Gap.** The org page lists projects with session counts. There is no way to
see the class: which teams have run sessions, which protocols still carry
review warnings, kappa per team, whether reports state uncertainty.
**Why.** This is the instructor's weekly loop. Without it the professor still
opens twelve projects one at a time, and "daily use" has no anchor. Teacher-
facing dashboards exist precisely to support this orchestration [search].
**Unlocks in the paper.** RQ1/RQ2/RQ3 of the classroom study become a screen
rather than a manual coding exercise, and the alignment table's evidence column
becomes something the tool reports.

### B. Reflection prompt after each session — *highest pedagogical value*
**Gap.** Nothing asks the student what happened. Every feature observes; only
the protocol review gives feedback, and none of it asks for reflection.
**Why.** L2 `SYNTH` is students not knowing how to interpret feedback. Cognitive
apprenticeship's final move is reflection, and the paper already cites it while
the platform does not implement it.
**Shape.** After a session closes, 3 fixed questions (what surprised you, what
would you change in the protocol, what did you do that may have led the
participant), saved on the session, visible to the instructor, exported.

### C. Instructor review of a *session*, not just a protocol
**Gap.** The gate reviews the protocol before the study. Nothing lets an
instructor comment on a completed session.
**Why.** L5's formative assessment is iterative, not a single gate.
**Shape.** Reuse `observer_notes`; add an instructor-visible review thread on
the session with a decision.

### D. Moderation-quality metrics the student can see
**Gap.** The cockpit records undos, resets, skips and idle gaps, but never
shows them back as a reflection on moderation.
**Why.** L2 `BIAS`. A student cannot improve moderation they cannot see.
**Shape.** A "how this session ran" card: undo count, resets, time between
tasks, tasks with no logged events at all.

### E. Cross-iteration comparison (already in the backlog)
**Gap.** No way to compare design v1 against v2 on the same protocol.
**Why.** The iterative loop is the point of the course project.

### F. Consent text templating and versioning
**Gap.** Consent text is a free string; changing it after sessions exist leaves
no record of what a given participant actually agreed to.
**Why.** L9. If the paper claims consent is procedural, the record must be
faithful to the moment.
**Shape.** Store the consent text with the session, not just the timestamp.

### G. Export of the review history
**Gap.** Review decisions and notes are not in the export.
**Why.** RQ5 of the classroom study ("which mistakes persist") needs the
before/after snapshots. Currently it needs a database dump.

---

## 4. Missing from the paper

### P1. Name the evaluation strategy, and admit what it is — *do this first*
The paper's evaluation is **two case studies**, which in Ledo's taxonomy is
*Demonstration*: an existence proof [read]. The Discussion already concedes no
controlled comparison, but does not frame it in the terms a reviewer of a
toolkit paper uses. Add a sentence naming Demonstration as the current
strategy, the planned classroom study as a *Usage* study, and the load tests as
*Technical Performance*. It converts a weakness into a stated plan, and it is a
one-paragraph change.

### P2. Ground the learning objectives in evidence, not assertion
Table I's objectives are currently mine. Oleson et al. give **empirically
derived** difficulty types, several of which map onto the table almost one to
one: `WHY`, `HOW`, `BIAS`, `SYNTH`, `STAGE` [read]. Citing them turns "these
seem like the objectives" into "these are the difficulties the field has
measured, and here is what the platform does about each."

### P3. Cite the evaluator effect where co-rating is described
The co-rating feature is currently described mechanically in III-D. The
evaluator effect is *why* it exists, and it is a well-known result that gives a
reviewer an immediate reason to care [search — verify the 5–65% figure against
Hertzum and Jacobsen before citing].

### P4. State the independence argument explicitly
The paper explains the gate design but does not say plainly that it departs
from Rose's model, and why. Schwind's independence warning is the citation that
justifies the choice. One or two sentences; it is the strongest original
argument in the pedagogy section.

### P5. A threats-to-validity paragraph for the classroom claim
The Discussion covers construct, internal, external validity for the *case
studies*. The pedagogical claim has its own threats: novelty effect, the author
teaching the course, and students being a captive population [search]. The
study design doc names these; the paper does not.

### P6. Related Work has no education thread
Related Work covers commercial platforms, remote evaluation and measurement. It
does not discuss HCI education tooling at all, while the pedagogy section cites
four education sources. Either add a short paragraph there or accept that the
positioning lives only in III-I. A reviewer looking for the education baseline
will look in Related Work first.

---

## 5. The argument for daily use

The gap-by-gap list does not answer the question on its own. This is the
narrative form, which is what an advisor is actually asking for.

| Week | Professor without Avalux | Professor with Avalux | Needs |
|---|---|---|---|
| Protocol design | Reads 12 Word documents, comments by hand | Opens each project; the review has already flagged leading tasks, missing criteria, missing baselines. Comments on what is left | **shipped** |
| Approval | Emails "go ahead" | Approves in the app; recruiting unlocks. Students rehearsed meanwhile and the pilot data is attached | **shipped** |
| Sessions running | Invisible until the report | Cross-team view: who has run what, which teams have no sessions yet | **gap A** |
| After sessions | Invisible | Reads reflections; sees which teams moderated with lots of undos and hints | **gaps B, D** |
| Analysis | Twelve spreadsheets of varying quality | Same metrics, same instruments across teams, because the org set them | **shipped** |
| Marking | Reads 12 reports, guesses at rigour | Kappa per team, uncertainty reported or not, review warnings resolved or not, all visible | **gap A** |
| Next iteration | Starts over | v1 versus v2 on the same protocol | **gap E** |

**The honest reading:** the *student's* loop is well covered and shipped. The
*professor's* weekly loop is the thin part, and gap A is most of it. If you
build one thing, build the class view.

---

## 6. Priority

**If the classroom study runs this semester**, the ordering is forced, because
some of these produce the study's data:

1. **A — class view.** Unlocks RQ1–RQ3 and the professor's weekly case.
2. **B — reflection prompt.** Closes the cognitive-apprenticeship loop the
   paper already claims, and produces qualitative data.
3. **G — export review history.** Needed for RQ5; small.
4. **P1, P2, P3, P4** — paper edits, roughly a page in total, no code.
5. **D — moderation metrics.** Cheap; the data is already logged.
6. **C, E, F** — after the first cohort.

**If the paper is submitted before the study runs**, do P1–P6 only. They cost
about a page and turn the pedagogy section from a design argument into a
positioned one, which is what it needs to survive review.

---

## 7. Every gap claim above, re-checked against the code

Each "missing" claim was verified against this repository rather than
remembered, on the date this file was written:

| Claim | Verified |
|---|---|
| Org page shows only a per-project session count | yes |
| No cross-team kappa or uncertainty view exists | yes |
| No reflection prompt anywhere in the app | yes |
| Review decisions and notes are not in the export | yes |
| Consent text is not stored on the session, only the timestamp | yes |
| Undo and reset are logged but never shown back to the student | yes |
| Related Work contains no education citation at all | yes, zero matches |

## 8. Things I could not check

- The 5–65% evaluator-effect range and the ~40% novice figure came from search
  summaries, not the paper itself. Get the PDF before citing.
- Whether an EduCHI paper already proposes something close to Avalux. I found
  the venue and adjacent work but did not search its full proceedings; worth 30
  minutes before claiming novelty in an education venue.
- Whether your institution treats a classroom study of your own students as
  requiring ethics review. The study design doc assumes it does.
