/**
 * The hosted tutorial walkthrough shown on the Help page.
 *
 * The video is rendered from the Remotion project in `video/` and uploaded to
 * YouTube or Vimeo by hand. Paste the share link below to switch the section
 * on; while `source` is empty the Help page renders as it did before.
 */
export type TutorialVideo = {
  provider: "youtube" | "vimeo";
  /**
   * The share link, or a bare video id. All of these work:
   *   https://www.youtube.com/watch?v=ABC123
   *   https://youtu.be/ABC123
   *   https://vimeo.com/123456789
   *   https://vimeo.com/123456789/a1b2c3d4e5   (unlisted, keeps the hash)
   *   ABC123
   */
  source: string;
};

export const TUTORIAL_VIDEO: TutorialVideo = {
  provider: "youtube",
  source: "https://youtu.be/FIeoc_4YQao",
};

/**
 * Pulls the id out of a share link. An unlisted Vimeo video also carries a
 * privacy hash, and the player refuses to embed it without one, so it is kept.
 */
export function parseVideoSource(
  provider: TutorialVideo["provider"],
  source: string,
): { id: string; hash?: string } {
  const trimmed = source.trim();
  if (!trimmed) return { id: "" };

  // A bare id: no slashes, no query.
  if (!trimmed.includes("/") && !trimmed.includes("?")) return { id: trimmed };

  if (provider === "vimeo") {
    // vimeo.com/<id>[/<hash>] and player.vimeo.com/video/<id>[?h=<hash>]
    const path = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/);
    if (!path) return { id: "" };
    const query = trimmed.match(/[?&]h=(\w+)/);
    return { id: path[1], hash: path[2] ?? query?.[1] };
  }

  // youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/embed/<id>
  const short = trimmed.match(/youtu\.be\/([\w-]{6,})/);
  if (short) return { id: short[1] };
  const watch = trimmed.match(/[?&]v=([\w-]{6,})/);
  if (watch) return { id: watch[1] };
  const embed = trimmed.match(/\/embed\/([\w-]{6,})/);
  if (embed) return { id: embed[1] };
  return { id: "" };
}

const parsed = parseVideoSource(TUTORIAL_VIDEO.provider, TUTORIAL_VIDEO.source);

export const hasTutorialVideo = parsed.id.length > 0;

/**
 * Chapter offsets in seconds, taken from `video/src/timeline.ts`. If the video
 * is re-cut with different scene lengths, re-derive these from
 * `tutorialStarts()` in that file.
 */
export const TUTORIAL_VIDEO_CHAPTERS: { label: string; at: number }[] = [
  { label: "Templates", at: 14 },
  { label: "Sessions", at: 64 },
  { label: "Live session", at: 103 },
  { label: "Participant", at: 153 },
  { label: "Results", at: 187 },
  { label: "Exports", at: 232 },
  { label: "Coding", at: 256 },
  { label: "Organizations", at: 281 },
];

/** Player URL for an optional start offset, on the privacy-preserving host. */
export function tutorialEmbedUrl(startSeconds = 0): string {
  const { id, hash } = parseVideoSource(
    TUTORIAL_VIDEO.provider,
    TUTORIAL_VIDEO.source,
  );

  if (TUTORIAL_VIDEO.provider === "vimeo") {
    const params = new URLSearchParams({ dnt: "1" });
    if (hash) params.set("h", hash);
    if (startSeconds > 0) params.set("t", `${startSeconds}s`);
    return `https://player.vimeo.com/video/${id}?${params.toString()}`;
  }

  const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
  if (startSeconds > 0) params.set("start", String(startSeconds));
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

/** Canonical page for the "watch on ..." link. */
export function tutorialWatchUrl(): string {
  const { id, hash } = parseVideoSource(
    TUTORIAL_VIDEO.provider,
    TUTORIAL_VIDEO.source,
  );
  return TUTORIAL_VIDEO.provider === "vimeo"
    ? `https://vimeo.com/${id}${hash ? `/${hash}` : ""}`
    : `https://www.youtube.com/watch?v=${id}`;
}
