# Publishing the tutorial video

The Help page section is already built. It stays hidden until a video id is
set, so nothing changes on the site until you decide to publish.

## 1. Upload

Upload `out/avalux-tutorial.mp4` (64 MB, 1920x1080, 5:10). Both YouTube and
Vimeo accept it as is; no re-encode needed.

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
5:00 Wrap-up

Try it: https://avalux.pt
Source: https://github.com/MrLoydHD/usertesting
```

## 3. Switch the Help section on

Edit `src/lib/tutorial-video.ts` in the app (not in this folder):

```ts
export const TUTORIAL_VIDEO: TutorialVideo = {
  provider: "youtube",   // or "vimeo"
  id: "PASTE_ID_HERE",
};
```

- YouTube: the part after `v=`, so `https://youtube.com/watch?v=dQw4w9WgXcQ` gives `dQw4w9WgXcQ`.
- Vimeo: the number, so `https://vimeo.com/123456789` gives `123456789`.

That is the only change. The Help page then shows a "Video walkthrough" section
at the top with a chapter jump bar, and adds it to the page's table of contents.

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
