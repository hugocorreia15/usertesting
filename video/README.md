# Avalux videos

Two videos, built with [Remotion](https://remotion.dev) as React components:

| Composition | Length | For |
|---|---|---|
| `Marketing` | 82 s | Slide decks and the project pitch |
| `Tutorial` | 5 min 10 s | The in-app `/help` page, chaptered walkthrough of every feature |

Both render 1920x1080 at 30 fps, silent, with on-screen text in English.

## Running it

```
npm install
npm run dev                 # Remotion Studio, live preview and visual editing
npm run render              # both videos into out/
npm run render:marketing
npm run render:tutorial
```

`npm run dev` and the render scripts first copy the product screenshots and
logos out of the app's `../public` folder (`scripts/sync-assets.mjs`), so the
same files are not tracked in git twice.

Individual scenes are registered as their own compositions under the
`Marketing-Scenes` and `Tutorial-Chapters` folders in the Studio sidebar, so a
single scene can be previewed or re-rendered on its own.

## Publishing

`UPLOAD.md` covers uploading the tutorial to YouTube or Vimeo and switching on
the Help page section, which is already wired and waits on a video id in
`../src/lib/tutorial-video.ts`.

## Where to change things

| Want to change | Edit |
|---|---|
| Any on-screen wording | `src/copy/en.ts` |
| Pacing, scene or chapter length | `src/timeline.ts` |
| Colors, type scale, shadows | `src/theme.ts` |
| One marketing beat | `src/scenes/marketing/` |
| One tutorial chapter | `src/scenes/tutorial/` |

`src/theme.ts` mirrors the app's tokens from `../src/index.css`. If the app's
palette changes, change it there and every scene follows.

## How it is built

Two visual registers:

- **Built UI** (`src/components/ui/`) for anything that has to move: the cockpit
  timer and counters, the SUS gauge and its confidence band, event timelines,
  charts, the org diagram.
- **Real screenshots** (`src/components/Screenshot.tsx`) from `public/help`, in a
  browser or phone shell with a slow crop move. Callouts are given in *image*
  coordinates and converted against the live crop, so an annotation stays glued
  to its UI element while the shot moves.

Animation is `spring()` and `interpolate()` only. CSS transitions, CSS
keyframes, GSAP and framer-motion do not render deterministically frame by
frame and must not be used here.

## A Portuguese cut

Every string lives in `src/copy/en.ts`. Add `src/copy/pt.ts` with the same
shape, swap the import, and register a second pair of compositions.
