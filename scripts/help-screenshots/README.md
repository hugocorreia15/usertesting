# Help screenshots

Regenerates the images in `public/help/` that document features added after
the original screenshots were taken (sections 9 to 13 of the help page).

```
bash scripts/help-screenshots/capture.sh          # every shot
bash scripts/help-screenshots/capture.sh 18 21    # only these
```

Needs `agent-browser` on the PATH. Output is 1440x900, matching the existing
images.

## How it works

The capture runs the **real app**, with its routes, layout, hooks and
components unchanged, from a separate Vite config that swaps a single module:
`src/lib/supabase` becomes `supabase-mock.ts`, an in-memory stub that answers
from `fixtures.ts`.

That design follows from two constraints.

- **No login and no production data.** The pages need a signed-in user, and
  several topics need data that does not exist in any real account: an
  inspection with four evaluators' passes, a template awaiting review, a
  reflection draft. Creating that in production would have meant attaching
  invented findings to real colleagues' accounts.
- **No credentials in the build.** The config reads environment files from this
  folder, which has none, so it carries no Supabase key and no monitoring DSN.
  An error in the demo is never reported as a production error.

## Fixtures

Everything in `fixtures.ts` is fictional: one class, one study, five invented
people. `?as=<name>` in a URL picks who is signed in (`ana` the instructor,
`bruno` who owns the study, `carla` who co-rated it).

Where the real app would hide rows from the viewer, the fixtures leave them
out, so a screenshot never shows something row-level security would refuse.

The fixtures are type-checked against the app's types:

```
npx tsc -p scripts/help-screenshots/tsconfig.json
```

## Adding a shot

Add a block to `capture.sh` that visits a path, waits for text, scrolls if
needed, and calls `shoot NN-name.png`. Then reference it from the help page
with `<HelpScreenshot src="/help/NN-name.png" ... />`. The component hides
itself until the image exists, so the page never shows a broken frame.
