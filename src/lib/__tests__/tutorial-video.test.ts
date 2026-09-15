import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  TUTORIAL_VIDEO,
  TUTORIAL_VIDEO_CHAPTERS,
  parseVideoSource,
  tutorialEmbedUrl,
  tutorialWatchUrl,
} from "../tutorial-video";

const original = { ...TUTORIAL_VIDEO };

afterEach(() => {
  TUTORIAL_VIDEO.provider = original.provider;
  TUTORIAL_VIDEO.source = original.source;
});

describe("parseVideoSource", () => {
  it("reads a bare id", () => {
    expect(parseVideoSource("youtube", "dQw4w9WgXcQ")).toEqual({
      id: "dQw4w9WgXcQ",
    });
  });

  it("reads every YouTube link shape", () => {
    for (const link of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s",
    ]) {
      expect(parseVideoSource("youtube", link).id).toBe("dQw4w9WgXcQ");
    }
  });

  it("keeps the privacy hash on an unlisted Vimeo link", () => {
    expect(parseVideoSource("vimeo", "https://vimeo.com/123456789/a1b2c3d4e5")).toEqual(
      { id: "123456789", hash: "a1b2c3d4e5" },
    );
    expect(
      parseVideoSource("vimeo", "https://player.vimeo.com/video/123456789?h=a1b2c3d4e5"),
    ).toEqual({ id: "123456789", hash: "a1b2c3d4e5" });
  });

  it("reads a public Vimeo link with no hash", () => {
    expect(parseVideoSource("vimeo", "https://vimeo.com/123456789")).toEqual({
      id: "123456789",
      hash: undefined,
    });
  });

  it("returns an empty id for junk rather than a broken embed", () => {
    expect(parseVideoSource("youtube", "https://example.com/nope").id).toBe("");
    expect(parseVideoSource("vimeo", "https://example.com/nope").id).toBe("");
    expect(parseVideoSource("youtube", "   ").id).toBe("");
  });
});

describe("player urls", () => {
  it("embeds YouTube on the no-cookie host", () => {
    TUTORIAL_VIDEO.source = "https://youtu.be/dQw4w9WgXcQ";
    const url = tutorialEmbedUrl();
    expect(url).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(url).not.toContain("start=");
    expect(tutorialWatchUrl()).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });

  it("carries a chapter offset into the player URL", () => {
    TUTORIAL_VIDEO.source = "https://youtu.be/dQw4w9WgXcQ";
    expect(tutorialEmbedUrl(187)).toContain("start=187");
  });

  it("asks Vimeo not to track, and carries the unlisted hash", () => {
    TUTORIAL_VIDEO.provider = "vimeo";
    TUTORIAL_VIDEO.source = "https://vimeo.com/123456789/a1b2c3d4e5";
    const url = tutorialEmbedUrl(64);
    expect(url).toContain("player.vimeo.com/video/123456789");
    expect(url).toContain("dnt=1");
    expect(url).toContain("h=a1b2c3d4e5");
    expect(url).toContain("t=64s");
    expect(tutorialWatchUrl()).toBe("https://vimeo.com/123456789/a1b2c3d4e5");
  });
});

/**
 * The runtime read from the Remotion project rather than written down here.
 * These offsets were hardcoded against a 9315 frame cut, and a re-cut left them
 * pointing past the end of the video without anything noticing until the next
 * time someone ran this file. Reading the timeline means a re-cut updates the
 * expectation by itself, and adding a chapter without moving the offsets fails.
 */
function tutorialRuntimeSeconds(): number {
  const source = readFileSync(
    resolve(__dirname, "../../../video/src/timeline.ts"),
    "utf8",
  );
  const block = source.match(/export const TUTORIAL = \{([\s\S]*?)\} as const;/);
  const transition = source.match(/export const TRANSITION = (\d+);/);
  const fps = source.match(/export const FPS = (\d+);/);
  if (!block || !transition || !fps) throw new Error("timeline.ts is not the shape this test expects");

  const scenes = [...block[1].matchAll(/\w+:\s*(\d+)/g)].map((m) => Number(m[1]));
  const frames =
    scenes.reduce((a, b) => a + b, 0) - (scenes.length - 1) * Number(transition[1]);
  return frames / Number(fps[1]);
}

describe("chapter offsets", () => {
  it("stay inside the rendered runtime and in order", () => {
    const runtime = tutorialRuntimeSeconds();
    const offsets = TUTORIAL_VIDEO_CHAPTERS.map((c) => c.at);
    expect(Math.min(...offsets)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...offsets)).toBeLessThan(runtime);
    expect([...offsets].sort((a, b) => a - b)).toEqual(offsets);
  });

  it("has one jump link per chapter in the video", () => {
    const rail = readFileSync(
      resolve(__dirname, "../../../video/src/timeline.ts"),
      "utf8",
    ).match(/export const TUTORIAL_CHAPTERS = \[([\s\S]*?)\] as const;/);
    const chapters = [...(rail?.[1] ?? "").matchAll(/key:\s*"/g)].length;
    expect(TUTORIAL_VIDEO_CHAPTERS).toHaveLength(chapters);
  });
});
