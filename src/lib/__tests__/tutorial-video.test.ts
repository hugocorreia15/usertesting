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

describe("chapter offsets", () => {
  it("stay inside the rendered runtime and in order", () => {
    // The tutorial composition is 9315 frames at 30 fps.
    const runtime = 9315 / 30;
    const offsets = TUTORIAL_VIDEO_CHAPTERS.map((c) => c.at);
    expect(Math.min(...offsets)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...offsets)).toBeLessThan(runtime);
    expect([...offsets].sort((a, b) => a - b)).toEqual(offsets);
  });
});
