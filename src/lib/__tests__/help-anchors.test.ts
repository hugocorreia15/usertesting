import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { HELP_SECTIONS } from "../help-anchors";

// Help buttons link to /help#<section>. A link to a section that does not
// exist scrolls nowhere, and the reader who asked for help gets none. This
// reads the help page source rather than rendering it, because the page is
// large and the only thing checked is that each anchor is present.
const helpPage = readFileSync(
  resolve(__dirname, "../../routes/help/index.tsx"),
  "utf8",
);

describe("help sections", () => {
  it.each(Object.keys(HELP_SECTIONS))("section %s exists on the help page", (id) => {
    expect(helpPage).toContain(`id="${id}"`);
  });

  it("numbers the sections in order", () => {
    const numbers = Object.values(HELP_SECTIONS).map((t) => Number(t.split(".")[0]));
    expect(numbers).toEqual(numbers.map((_, i) => i + 1));
  });
});
