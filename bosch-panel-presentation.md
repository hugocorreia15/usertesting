# Bosch Seamless Touch Panel — Usability Study Presentation

Create a 6-slide professional presentation for a usability study. Use Bosch brand colors (blue #005691, white, red #E20015 for highlights). Clean, minimal, sans-serif design. Academic/UX research style.

---

## Slide 1: Title

**Title:** Usability Study — Bosch Seamless Touch Panel

**Subtitle:** Evaluating the user experience of the Bosch Seamless Touch Panel water heater controller

**Details:**
- Evaluator: Hugo Correia
- Date: 24 March 2026
- Tool: Avalux (avalux.pt)

---

## Slide 2: Methodology

**Title:** Study Methodology

**Approach:** Moderated in-person usability testing with task-based observation

**Metrics collected per task:**
- Time on task (seconds)
- Number of actions performed
- Task completion status (Success / Partial / Failure)
- Single Ease Question (SEQ) rating (1–7 scale)
- Error logging by type: Wrong Button (WB), Wrong Direction (WD), Accidental Menu Entry (AE), Overshoot (OV)
- Hesitation moments

**Post-test instruments:**
- Per-task follow-up questions (open-ended, rating, single-choice)
- Semi-structured interview (4 open-ended questions)
- System Usability Scale (SUS) — 10 standardized items, 5-point Likert scale

**Tool:** All data collected and analyzed via Avalux, a custom usability testing platform with real-time observation, participant join links, and automated report generation.

---

## Slide 3: Participants

**Title:** Participant Profile

| Participant | Age | Gender | Tech Proficiency |
|-------------|-----|--------|-----------------|
| P1          | 21  | Female | Low             |
| P2          | 22  | Female | Low             |
| P3          | 20  | Male   | High            |
| P4          | 23  | Male   | Low             |

**Summary:**
- 4 participants, ages 20–23
- 2 female, 2 male
- 3 out of 4 with low tech proficiency (representative of general consumer audience)
- 1 with high tech proficiency (control comparison)
- All sessions completed on 24/03/2026, average duration ~15 minutes each

---

## Slide 4: Task Structure

**Title:** 14 Tasks — Simple (S) & Complex (C)

**Simple Tasks (S1–S7) — Basic identification and control:**

| Task | Description |
|------|-------------|
| S1 | Wake up the panel from standby |
| S2 | Identify the current time |
| S3 | Identify all buttons/touch areas |
| S4 | Describe each button's function |
| S5 | Increase temperature by +1 C |
| S6 | Return to the previous screen |
| S7 | Turn off the panel |

**Complex Tasks (C1–C7) — Multi-step operations:**

| Task | Description |
|------|-------------|
| C1 | Set temperature to exactly 40 C |
| C2 | Change the clock to 08:30 |
| C3 | Change the display language |
| C4 | Explore the full menu structure |
| C5 | Set 35 C and return to home |
| C6 | Find device information screen |
| C7 | Recover from an error state |

---

## Slide 5: Results

**Title:** Key Results

**Overall Task Completion:**
- Success: 70%
- Partial: 20%
- Failure: 11%

**SUS Scores (System Usability Scale, 0–100):**

| Participant | SUS Score | Rating |
|-------------|-----------|--------|
| P1 (F, 21, low tech)  | 25.0 | Poor   |
| P2 (F, 22, low tech)  | 40.0 | Poor   |
| P3 (M, 20, high tech) | 17.5 | Awful  |
| P4 (M, 23, low tech)  | 30.0 | Poor   |
| **Average**            | **28.1** | **Poor** |

Note: Industry average SUS score is 68. A score of 28.1 is significantly below acceptable usability thresholds. Even the high-tech-proficiency participant scored the lowest (17.5), suggesting the interface is unintuitive regardless of technical background.

**Most Problematic Tasks (by avg SEQ rating, 1–7):**
- S1: Wake Up Panel — avg SEQ 1.8 (all participants failed or struggled)
- C7: Error Recovery — avg SEQ 2.5 (no error message shown, users resorted to power cycling)
- C2: Change Clock — avg time 43.6s, avg 10 actions (optimal: 8), most errors logged
- C3: Change Language — avg 3 errors per session

**Best Performing Tasks:**
- S2: Identify Current Time — avg SEQ 7.0, avg time 2.7s, 100% success
- S7: Turn Off Panel — avg SEQ 6.3

---

## Slide 6: Insights & Recommendations

**Title:** Participant Feedback & Recommendations

**What frustrated participants most:**
- "A quantidade de erros e problemas nas funcionalidades" (The amount of errors and problems in the features)
- "O botao de retroceder nao funcionar quando esta no menu" (The back button not working in the menu)
- "Very frustrating at first because the discovery is not intuitive"

**What surprised them:**
- Up/down buttons changing function without warning
- Lack of sensitivity on the power button
- Going back to menu after cooling

**Top Recommendations:**
1. **Add a visible settings button** on the main screen — users couldn't find settings without trial and error
2. **Consistent button behavior** — buttons should maintain the same function across all screens
3. **Error messages** — the panel showed no error feedback; users could only recover by power cycling (rated 1/5)
4. **Improve wake-up interaction** — all 4 participants failed S1; the wake-up gesture is not discoverable
5. **Better visual contrast** — panel display described as "blurry" and hard to read, potentially inaccessible
6. **Add temperature regulation option** — instead of immediately changing temperature without confirmation
