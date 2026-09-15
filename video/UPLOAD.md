# Publishing the tutorial video

The Help page section is already built. It stays hidden until a video id is
set, so nothing changes on the site until you decide to publish.

## 1. Upload

Upload `out/avalux-tutorial.mp4` (1920x1080, 7:53). Both YouTube and Vimeo
accept it as is; no re-encode needed.

**Visibility:** *Unlisted* is usually the right choice. An unlisted video still
embeds and plays for anyone who opens the Help page, but it does not show up in
search or on the channel. Switch to public later if you want it discoverable.

## 2. Suggested metadata

**Title**

```
Avalux: the complete walkthrough
```

**Description** — paste as is. The timestamps make YouTube generate chapter
markers on the scrub bar automatically (it needs the first one to be `0:00`).

```
Avalux is an open, self-hostable platform for moderated usability testing:
reusable test protocols, a live evaluator cockpit, a participant client that
runs on the participant's own device, standardized instruments, and automatic
analysis and reporting.

This walkthrough covers every feature, in the order you will use them.

0:00 Introduction
0:14 Templates
1:04 Sessions
1:43 Running a live session
2:33 The participant experience
3:07 Results and analytics
3:52 Exports and reporting
4:16 Participants and qualitative coding
4:41 Organizations and classrooms
5:00 Heuristic inspection
5:45 Instructor review and consent
6:24 Observing, co-rating and reflection
7:04 Class overview and model assistance
7:44 Wrap-up

Try it: https://avalux.pt
Source: https://github.com/MrLoydHD/usertesting
```

## 3. Switch the Help section on

Three edits, and they must go together. Until the new video is live the app
points at the old five-minute cut, whose chapter offsets are the first eight
below; adding the last four early would give the Help page jump links that seek
past the end of it.

**a.** `src/lib/tutorial-video.ts`, the video itself:

```ts
export const TUTORIAL_VIDEO: TutorialVideo = {
  provider: "youtube",   // or "vimeo"
  source: "PASTE_THE_SHARE_LINK_HERE",
};
```

**b.** `src/lib/tutorial-video.ts`, the jump links. Replace
`TUTORIAL_VIDEO_CHAPTERS` wholesale with this, which is derived from
`video/src/timeline.ts` and already checked against the render:

```ts
export const TUTORIAL_VIDEO_CHAPTERS: { label: string; at: number }[] = [
  { label: "Templates", at: 14 },
  { label: "Sessions", at: 64 },
  { label: "Live session", at: 103 },
  { label: "Participant", at: 153 },
  { label: "Results", at: 187 },
  { label: "Exports", at: 232 },
  { label: "Coding", at: 256 },
  { label: "Organizations", at: 281 },
  { label: "Heuristic inspection", at: 300 },
  { label: "Review and consent", at: 345 },
  { label: "Observing and reflection", at: 384 },
  { label: "Class overview and model help", at: 424 },
];
```

**c.** `src/routes/help/index.tsx`, the paragraph in the Video walkthrough
section. It currently says the video covers the core workflow and that the
teaching features are written up rather than filmed, which stops being true the
moment this upload is live. Replace it with:

```tsx
<p>
  An eight-minute tour of every feature, in the same order as the
  sections below. Use the jump links to go straight to a chapter.
</p>
```

`source` takes the share link as you copied it, or a bare id. An unlisted Vimeo
link carries a privacy hash after the number and the player will not embed
without it, so paste the whole thing.

Those three are the only changes. The Help page then shows a "Video
walkthrough" section at the top with a chapter jump bar, and adds it to the
page's table of contents.

The player is embedded through `youtube-nocookie.com` (or Vimeo with `dnt=1`),
so it does not set tracking cookies before someone presses play.

## 4. If you re-cut the video

Chapter offsets live in two places and must agree: `video/src/timeline.ts` (the
source of truth) and `TUTORIAL_VIDEO_CHAPTERS` in `src/lib/tutorial-video.ts`.
Re-derive the seconds with `tutorialStarts()` divided by 30, then update the
description timestamps above.

## The marketing video

`out/avalux-marketing.mp4` (82 s) is meant to be dropped straight into
a slide, so it needs no hosting. If you do want it online too, upload it the
same way; nothing in the app links to it.
