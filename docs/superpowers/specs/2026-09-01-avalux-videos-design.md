# Avalux marketing and tutorial videos — design

Date: 2026-09-01
Status: built and rendered

## Purpose

Two rendered videos built with Remotion:

1. **Marketing video** (82 s as built) for use inside a slide deck presentation.
2. **Tutorial video** (5 min 10 s as built) covering every shipped feature, for
   embedding on the in-app `/help` page.

Crossfades overlap the scenes, so each finished video is 15 frames per cut
shorter than the sum of its scene lengths.

Both 1920x1080, 30 fps, H.264 MP4, silent with on-screen text, English.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Audio | Silent, on-screen text only | Autoplays muted on `/help`, no TTS dependency, copy edits are free |
| Visuals | Hybrid | Built components for anything that moves, real screenshots for evidence |
| Language | English | Matches README, paper, and default UI |
| Placement | Self-contained `video/` npm project | Remotion pins its own React and bundler; keeps it out of the app build, CI, and Vercel |
| Animation | `spring()` and `interpolate()` only | GSAP and framer-motion are not deterministic frame-by-frame |
| Styling | Inline style objects from `theme.ts` | No second Tailwind config to keep in sync |

## Visual system

Lifted from `src/index.css` and `public/logo.svg` so the videos look like the product.

```
primary    #6366f1     ink        #1e1b4b
accent     #14b8a6     muted ink  #6b7280
ground     #fafaff     card       #ffffff
border     #e0e0f0     mark blue  #468AC7
gradient   linear-gradient(135deg, #6366f1, #8b5cf6, #14b8a6)
success    #16a34a     warning    #ca8a04     danger  #ef4444
```

Type: Inter via `@remotion/google-fonts` (the app itself uses the system stack;
Inter is the closest stable match and renders identically across machines).
Background motif: the app's pastel hexagons and circles, drifting slowly.

Two registers:

- **Built UI** for anything that moves: cockpit timer, action counter under
  keycap strikes, error chips logging, SUS gauge with confidence whiskers,
  event timeline, chart bars.
- **Real screenshots** from `public/help/` (13 desktop at 1440x900, 3 mobile at
  375x812) in a rounded browser or phone shell, slow Ken Burns, animated callout
  rings, so every claim is backed by the real product.

## Marketing video — 2580 frames (82 s)

| Frames | Scene | On-screen copy | Motion |
|---|---|---|---|
| 0-300 | Cold open | "A stopwatch. A spreadsheet. A questionnaire tool." then "Three tools. One session. Nothing connected." | Three objects appear staggered, drift apart, broken links between them |
| 300-480 | Logo reveal | "One platform for moderated usability testing." | Objects converge and collapse into the Avalux mark; wordmark fades up |
| 480-840 | Protocols | "Reusable test protocols" / "Tasks, optimal-path baselines, and your own error taxonomy." | Template card assembles: task rows with "Optimal 60s, 4 actions", group chips, error chips E1-E4 |
| 840-1320 | Live cockpit (hero) | "A cockpit built for one hand" / "One tap logs an error. One key undoes it. The timer survives a crash." | Timer 00:00.0 to 01:12.4, actions 0 to 7, keycaps A A 2 H Z strike; E2 chip and hesitation pill land, Z removes the last |
| 1320-1620 | Participant client | "On the participant's own device" / "Realtime sync, two-way gating, EN and PT." | Phone frame cross-fades join to questions; sync line pulses to a small desktop cockpit |
| 1620-1980 | Instruments | "Standardized instruments, scored for you" / "System Usability Scale with 95% confidence intervals." | SUS gauge sweeps to 78.4, CI whiskers draw at plus/minus 6.2; SUS, NASA-TLX, UEQ-S chips slide in |
| 1980-2160 | Analysis and export | "From session to findings" | Event timeline draws markers, bars build, PDF / CSV / JSON cards fan out |
| 2160-2400 | Classrooms | "One class, many projects" / "Organizations, sub-teams, and per-project student access." | Organization node branches into two group cards holding their projects; owner / member / student roles list in |
| 2400-2580 | Close | "avalux.pt" / "Open source. Self-hostable." | Mark plus wordmark settle, gradient underline sweeps |

## Tutorial video — 9450 frames (315 s)

Chapter order mirrors the eight sections of `/help` so the video and the page
teach the same sequence. A persistent chapter rail across the bottom shows
position, so a viewer can scrub to a chapter.

| Frames | Duration | Chapter | Covers | Sources |
|---|---|---|---|---|
| 0-450 | 15 s | Intro | Title, the eight chapters animating in | logo |
| 450-1950 | 50 s | 1. Templates | Reusable protocols, tasks, optimal time and action baselines, task groups, typed error taxonomy, per-task questions, media capture, interview scripts, template-scoped participant fields, practice tasks excluded from all metrics | 02, 03, 04 + built |
| 1950-3150 | 40 s | 2. Sessions | Session creation, participant selection, custom field capture, personal invitations vs shared join links, join codes, task order strategies: fixed, shuffled, Latin square | 05 + built |
| 3150-4650 | 50 s | 3. Live session | Crash-proof timer, action counter against optimal, success / partial / failure / skip, typed error logging, hesitation logging, SEQ rating, undo stack, keyboard shortcuts A, 1-9, H, Z, two-way participant gating | 08 + built cockpit |
| 4650-5700 | 35 s | 4. Participant experience | Join by link or code, EN and PT toggle, task instructions, per-task questions, audio / video / photo capture, post-session SUS | 14, 15, 16 |
| 5700-7050 | 45 s | 5. Results and analytics | Task results, per-task event timelines, SUS with 95% CI, completion and time-on-task dashboards, efficiency, co-rating and Cohen's kappa agreement | 06, 07, 09, 10 + built |
| 7050-7800 | 25 s | 6. Exports | Self-contained PDF report, flat CSV bundle and JSON, chart PNG at 3x and SVG for figures | 13 + built |
| 7800-8550 | 25 s | 7. Participants and coding | Participant records and history, retroactive anonymization, qualitative code book, multi-code tagging, codes-by-sessions frequency matrix | 11, 12 + built |
| 8550-9150 | 20 s | 8. Organizations | Organizations, owner / member / student roles, groups holding members and projects, invite codes, observer mode with notes, project repository links | built |
| 9150-9450 | 10 s | Outro | "All of this is documented at /help", avalux.pt | logo |

## Structure

```
video/
  package.json            remotion 4.x
  remotion.config.ts      H.264, CRF, output dir
  src/
    Root.tsx              registers Marketing and Tutorial compositions
    theme.ts              brand tokens lifted from src/index.css
    timeline.ts           every scene duration in frames, declarative
    copy/en.ts            every on-screen string, one file, PT-swappable
    components/
      Frame.tsx           ground, motif, vignette, safe area
      Caption.tsx         headline and sub-caption with staggered word entry
      Screenshot.tsx      browser shell, Ken Burns, callout slots
      Callout.tsx         ring or box annotation with a label and leader line
      PhoneFrame.tsx      device shell for the 375x812 captures
      ChapterRail.tsx     persistent progress rail, tutorial only
      Keycap.tsx          keyboard key with a strike animation
      ui/                 Cockpit, TimerCard, ActionCounter, ErrorGrid,
                          SusGauge, EventTimeline, BarChart, TemplateCard,
                          ExportCards, OrgDiagram
    scenes/marketing/     one file per scene
    scenes/tutorial/      one file per chapter
    Marketing.tsx         Series of marketing scenes
    Tutorial.tsx          Series of chapters
  public/                 copies of ../public/help/*.png and the logos
  out/                    rendered mp4, gitignored
```

`timeline.ts` holds every duration so pacing can be retuned without opening a
scene file. `copy/en.ts` holds every string so a Portuguese cut is a translation,
not a rewrite.

`scripts/sync-assets.mjs` copies the screenshots and logos out of the app's
`public/` before studio and before a render, so the same files are not tracked
in git twice.

Two things the build added over this design:

- `Cockpit` takes a `show` prop (`task`, `meters`, `logs`). A tutorial beat
  renders only the bands it is talking about, which keeps the cockpit legible
  at the size a beat slot allows.
- `Screenshot` takes `annotations` in *image* coordinates and converts them
  against the live crop, so a callout stays glued to its UI element while the
  shot moves.

## Verification

1. Typecheck the video project.
2. Render stills at the first and middle frame of every scene, then look at them
   to catch clipped text, overflow, and layout breakage.
3. Preview both compositions in Remotion Studio.
4. Render both MP4s and confirm duration and file size.

## Deliverables

- `video/out/avalux-marketing.mp4`
- `video/out/avalux-tutorial.mp4`
- The editable `video/` project.

Embedding into `/help` is out of scope unless requested; the user inserts the
files themselves.

## Out of scope

- Voiceover or music (silent by decision).
- Portuguese cut (structure supports it; not built).
- Vertical 9:16 cut.
