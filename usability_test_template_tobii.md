# Usability Test Template — Tobii Pro Glasses 3 (Post-hoc Analysis)

## 1. Basic Info

| Field | Value |
|---|---|
| Template Name | BEHOLD — Tobii Pro Glasses 3 Post-hoc Analysis Usability Test |
| Description | Evaluate the post-hoc analysis journey for Tobii Pro Glasses 3 studies: from **Study Setup** uploading or selecting a cloud study ZIP, browsing **Recordings** and **Participants**, drawing/keyframing/auto-tracking **AOIs** and seeing them on the scan-path overlay, defining and scoping **TOIs**, **comparing participants**, reviewing **Heatmap / Scan-path / Bee-swarm** visualizations, exploring the **Metrics Explorer**, and producing an **Export**. Goal: confirm an analyst can go from a fresh study to exported, scoped results unaided. |
| Visibility | Private |

---

## 2. Tasks

### Task Group A — Get a study into the dashboard

#### Task A1 — Upload or select a cloud study
- **Optimal time:** 60 s
- **Optimal actions:** 4
- **Description / instructions:** On **Study Setup**, open the **Cloud Studies** tab. Either upload a study ZIP and wait for ingestion to finish, or open an already-ingested cloud study. With the new source filter, set it to **Tobii** and confirm the study appears; confirm the **Current Study** alert shows it with a *Cloud* badge.
- **Questions:**
  - "Was it clear which tab to use for a cloud (ZIP) study vs. a filesystem study?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Did the Tobii / Webcam source filter help you find the right study?" — *Single Choice*
    - *Options:* Yes, a lot / Somewhat / Not really / Got in the way
  - "Describe how you knew ingestion had completed and the study was ready." — *Open Text*

#### Task A2 — Open the study dashboard and the Study Summary
- **Optimal time:** 30 s
- **Optimal actions:** 3
- **Description / instructions:** Use **Go to Dashboard**, then open **Dashboard → Study Summary** and confirm participant / recording / media counts match expectations.
- **Questions:**
  - "Rate how well the Study Summary oriented you to the dataset." — *Rating*
  - "Take a screenshot of the Study Summary." — *Photo*

### Task Group B — Browse the data

#### Task B1 — Browse recordings and participants
- **Optimal time:** 50 s
- **Optimal actions:** 4
- **Description / instructions:** From the **Analysis** sidebar group open **Recordings**, inspect one recording's duration and validity rate, then open **Participants** and locate the same participant.
- **Questions:**
  - "Could you tell whether a recording had good data quality (validity)?" — *Single Choice*
    - *Options:* Yes, confidently / Yes, but unsure / No
  - "What did you expect to see on the Participants page that was or wasn't there?" — *Open Text*

#### Task B2 — Open a single participant's detail
- **Optimal time:** 40 s
- **Optimal actions:** 3
- **Description / instructions:** Open the detail view for **participant A4**: review their session count, duration, validity and consistency, and note which recording(s) belong to them.
- **Questions:**
  - "Was the per-participant breakdown (sessions, validity, consistency) easy to read?" — *Rating*
  - "Anything you expected on the participant detail that was missing?" — *Open Text*

### Task Group C — Areas of Interest (AOI)

#### Task C1 — Create an AOI and auto-track it
- **Optimal time:** 90 s
- **Optimal actions:** 6
- **Description / instructions:** Open **Analysis → AOI Editor** for a recording. Draw an AOI over an object, keyframe it on at least two frames, then run AOI **auto-track** so it follows the object across the clip. Save the AOI and give it a tag/label.
- **Questions:**
  - "How confident were you that the AOI tracked the right object?" — *Rating*
  - "Was drawing and keyframing the AOI intuitive?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Record the auto-track running and your reaction." — *Video*
  - "Describe anything that made AOI placement harder than expected." — *Open Text*

#### Task C2 — See the AOI on the scan-path overlay
- **Optimal time:** 60 s
- **Optimal actions:** 4
- **Description / instructions:** Open the **Scan-path overlay** for the same recording, enable the AOI layer so the AOI box/keyframes are drawn over the stimulus, and scrub the timeline to watch the scan path enter and leave the AOI.
- **Questions:**
  - "Was it obvious how to turn the AOI layer on over the scan path?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Could you tell, visually, when gaze entered the AOI?" — *Single Choice*
    - *Options:* Yes, confidently / Yes, but unsure / No
  - "Take a photo of the scan path with the AOI overlay visible." — *Photo*
  - "What would make the AOI-on-scan-path view clearer?" — *Open Text*

#### Task C3 — Multi-recording AOI overlay
- **Optimal time:** 60 s
- **Optimal actions:** 4
- **Description / instructions:** Open the **Multi-recording overlay**, pick two recordings, and apply a **per-recording AOI filter** so each tile shows only its own AOI(s). Confirm the filter on one tile does not change the other.
- **Questions:**
  - "Did you understand that the AOI filter is independent per recording?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Rate how useful the side-by-side AOI comparison was." — *Rating*
  - "Describe any confusion about which AOIs belong to which recording." — *Open Text*

#### Task C4 — Scope a visualization/metric to an AOI
- **Optimal time:** 45 s
- **Optimal actions:** 3
- **Description / instructions:** Using the global **scope selector**, switch the analysis from *All data* to a **specific AOI** and confirm fixation counts / charts update to that AOI only.
- **Questions:**
  - "Was the AOI scope selector discoverable?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Did the numbers visibly change to reflect the AOI scope?" — *Single Choice*
    - *Options:* Exactly as expected / Mostly / Partially / Not at all

### Task Group D — Times of Interest (TOI)

#### Task D1 — Create / annotate a TOI
- **Optimal time:** 75 s
- **Optimal actions:** 5
- **Description / instructions:** Open the **TOI annotation panel** for a recording, mark a start and an end on the timeline to define a Time of Interest (e.g. "task segment"), label it, and save it.
- **Questions:**
  - "Was defining a TOI start/end on the timeline intuitive?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Rate how confident you were the TOI captured the segment you intended." — *Rating*
  - "Record yourself creating the TOI and narrating what you expect." — *Video*

#### Task D2 — Scope analysis to a TOI
- **Optimal time:** 50 s
- **Optimal actions:** 3
- **Description / instructions:** Using the global **scope selector**, switch from *All data* to the **TOI** you created, and confirm the fixation/saccade panels recompute for that window only.
- **Questions:**
  - "Was choosing a TOI as the analysis scope clear (vs. AOI vs. all)?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Did the metrics clearly reflect only the TOI window?" — *Single Choice*
    - *Options:* Exactly as expected / Mostly / Partially / Not at all
  - "What did you expect a TOI scope to change that it did/didn't?" — *Open Text*

#### Task D3 — Compare whole-recording vs TOI in the Comparison chart
- **Optimal time:** 60 s
- **Optimal actions:** 4
- **Description / instructions:** Open the **Comparison chart**, set its scope to compare **All data** against a **specific TOI** (and, if offered, a specific AOI), and read how the metrics differ.
- **Questions:**
  - "Was the Comparison chart's scope control (all / TOI / AOI) understandable?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Rate how well the chart communicated the all-vs-TOI difference." — *Rating*
  - "Take a photo of the all-vs-TOI comparison." — *Photo*

#### Task D4 — Auto-track an AOI within a TOI window
- **Optimal time:** 60 s
- **Optimal actions:** 4
- **Description / instructions:** In the **AutoTrack** modal, switch the window source from manual start/end to a **TOI** and run auto-track only within that TOI segment.
- **Questions:**
  - "Was it clear you could drive auto-track by a TOI instead of manual start/end?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Did limiting auto-track to the TOI behave as you expected?" — *Open Text*

### Task Group E — Visualizations

#### Task E1 — Compare heatmap, scan-path and bee-swarm
- **Optimal time:** 75 s
- **Optimal actions:** 5
- **Description / instructions:** Open the **Heatmap / Density** mode, switch to **Scan-path**, then **Bee-swarm**, and scope each to the AOI from C1 and/or the TOI from D1.
- **Questions:**
  - "Which visualization best answered 'where did people look first?' " — *Single Choice*
    - *Options:* Heatmap / Density · Scan-path · Bee-swarm · None of them
  - "Were the controls for switching visualization modes easy to find?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Take a photo of the scan-path with the AOI scope applied." — *Photo*

### Task Group F — Compare participants

#### Task F1 — Compare two participants (C10 vs A4)
- **Optimal time:** 75 s
- **Optimal actions:** 5
- **Description / instructions:** Open the **participant comparison** view, select participants **C10** and **A4**, and review the **Comparison Overview** (Best Data Quality / Most Consistent / Most Active) and the **Detailed Metrics Comparison** (Sessions, Duration, Validity, Consistency, Samples, Efficiency).
- **Questions:**
  - "Was selecting exactly two participants (C10 and A4) to compare straightforward?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "From the Comparison Overview, which participant looked stronger and on what?" — *Open Text*
  - "Rate how clearly the Detailed Metrics Comparison let you contrast C10 vs A4." — *Rating*
  - "Which metric (Validity, Consistency, Efficiency, …) did you trust most for judging quality?" — *Single Choice*
    - *Options:* Validity · Consistency · Efficiency · Samples · Duration
  - "Take a photo of the Comparison Overview for C10 vs A4." — *Photo*

#### Task F2 — Add a third participant / change selection
- **Optimal time:** 40 s
- **Optimal actions:** 3
- **Description / instructions:** Change the comparison selection (swap A4 for another participant, or add a third) and confirm the overview "winners" and detailed rows update.
- **Questions:**
  - "Was changing who is being compared obvious and low-friction?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Did the 'Best Data Quality / Most Consistent / Most Active' badges update sensibly?" — *Single Choice*
    - *Options:* Exactly as expected / Mostly / Partially / Not at all

### Task Group G — Metrics Explorer

#### Task G1 — Fixation metric by participant, scoped to an AOI
- **Optimal time:** 75 s
- **Optimal actions:** 5
- **Description / instructions:** Open **Explorer → Metrics Explorer**. Pick **average fixation duration (ms)**, add an **AOI tag group** condition, set aggregation to *participant*, leave X as *None* (strip plot), and read the result.
- **Questions:**
  - "Was it clear how to choose a metric and add a condition?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Rate how understandable the strip plot was." — *Rating*

#### Task G2 — Saccade direction (math convention)
- **Optimal time:** 50 s
- **Optimal actions:** 3
- **Description / instructions:** Choose a **saccade direction** metric and read how direction is expressed; note the angle convention used.
- **Questions:**
  - "Did you understand the saccade-direction convention without external help?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "What would make the direction metric easier to interpret?" — *Open Text*

#### Task G3 — Pupil diameter (mm)
- **Optimal time:** 45 s
- **Optimal actions:** 3
- **Description / instructions:** Select the **pupil** metric and confirm it is reported in millimetres; aggregate by *recording*.
- **Questions:**
  - "Was the pupil metric's unit (mm) obvious?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Rate confidence that you read the pupil result correctly." — *Rating*

#### Task G4 — AOI metrics + participant variable
- **Optimal time:** 75 s
- **Optimal actions:** 5
- **Description / instructions:** Pick an **AOI metric** (e.g. *AOI time-to-first-fixation* or *AOI revisit count*), split by a **participant variable** (uploaded TSV / set in the UI), and switch aggregation between *participant* and *recording*.
- **Questions:**
  - "Was splitting by a participant variable discoverable?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Did changing aggregation (participant ↔ recording) change the result the way you expected?" — *Single Choice*
    - *Options:* Exactly as expected / Mostly / Partially / Not at all
  - "Which AOI metric did you most want that you couldn't find?" — *Open Text*

#### Task G5 — Zone dwell over time (X axis)
- **Optimal time:** 50 s
- **Optimal actions:** 3
- **Description / instructions:** Choose **zone dwell (ms)**, set an X axis (e.g. a binned variable) so it renders as a series rather than a strip, and read the trend.
- **Questions:**
  - "Was the difference between strip (X = None) and a series (X set) clear?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Narrate what the zone-dwell trend tells you." — *Audio*

### Task Group H — Export

#### Task H1 — Produce an export
- **Optimal time:** 45 s
- **Optimal actions:** 3
- **Description / instructions:** From **Export → Raw Data and Reports** (or **Visualizations**), generate and download an export for the current study/recording, scoped (if offered) to the AOI or TOI.
- **Questions:**
  - "Was it clear what would be included in the export (and at what scope)?" — *Single Choice*
    - *Options:* Yes, immediately / Yes, after a brief look / Only after struggling / No, couldn't
  - "Rate how easy producing the export was." — *Rating*
  - "Narrate the export step out loud." — *Audio*

---

## 3. Error Types

| Code | Label |
|---|---|
| E1 | Navigation error (lost in sidebar groups) |
| E2 | Wrong study selected or wrong tab/source filter (filesystem vs. cloud, Tobii vs. webcam) |
| E3 | Upload / ingestion not understood or failed |
| E4 | Could not interpret recording validity / data quality |
| E5 | Participant ↔ recording mapping confusion |
| E6 | AOI mis-placed or wrong object selected |
| E7 | AOI keyframing not understood |
| E8 | AOI auto-track failed or drifted |
| E9 | AOI layer not enabled / not visible on the scan-path overlay |
| E10 | Multi-recording AOI filter applied to the wrong tile / thought it was global |
| E11 | TOI start/end set incorrectly or not saved |
| E12 | TOI vs AOI vs All scope confusion (global scope selector) |
| E13 | AutoTrack TOI-window option not discovered |
| E14 | Wrong visualization mode chosen for the question |
| E15 | Could not select exactly the two participants to compare (C10 / A4) |
| E16 | Misread the Comparison Overview / Detailed Metrics Comparison |
| E17 | Metric / condition / aggregation selection error in Metrics Explorer |
| E18 | Misread the metric result (strip plot vs series, units e.g. mm) |
| E19 | Export failed or produced the wrong scope/contents |

---

## 4. Interview Questions

1. Describe the full path you took from a raw study ZIP to an exported, scoped result.
2. How clear was the cloud-study upload and ingestion flow, and did the Tobii/Webcam source filter help?
3. Did the Recordings and Participants pages give you the data-quality signals you needed?
4. Walk me through creating and auto-tracking the AOI — what was easy, what fought you?
5. Once tracked, was seeing the AOI on the scan-path overlay (and per-recording in the multi-recording view) clear?
6. How did you experience Times of Interest — defining one, then scoping analysis and the Comparison chart to it?
7. Was the single global scope selector (All / AOI / TOI) a clear mental model, or confusing?
8. Comparing **C10 vs A4**: did the Comparison Overview and Detailed Metrics Comparison let you reach a conclusion confidently?
9. In the Metrics Explorer, was choosing a metric, a condition, an aggregation level, and an X axis intuitive across the different metric types (fixation, saccade direction, pupil mm, AOI, zone dwell)?
10. Did the exported output match what you expected to receive, at the scope you set?
11. Where did you slow down, backtrack, or feel unsure you'd done the right thing?
12. If you onboarded a new analyst, what is the one thing about BEHOLD they must know first?
