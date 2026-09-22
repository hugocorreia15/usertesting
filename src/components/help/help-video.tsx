import { useState } from "react";
import { PlayCircle } from "lucide-react";
import { allows, readConsent, writeConsent } from "@/lib/consent-preferences";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TUTORIAL_VIDEO,
  TUTORIAL_VIDEO_CHAPTERS,
  hasTutorialVideo,
  tutorialEmbedUrl,
  tutorialWatchUrl,
} from "@/lib/tutorial-video";

/**
 * The hosted walkthrough, with jump links to each chapter. Renders nothing
 * until a video id is set, so the page is never left with an empty player.
 */
export function HelpVideo() {
  const [startAt, setStartAt] = useState(0);
  const [embedsAllowed, setEmbedsAllowed] = useState(() =>
    allows(readConsent(), "embeds"),
  );

  if (!hasTutorialVideo) return null;

  const providerName = TUTORIAL_VIDEO.provider === "vimeo" ? "Vimeo" : "YouTube";

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-md border bg-black">
        {embedsAllowed ? (
          <iframe
            // Remounting is what makes a chapter jump take effect: the start
            // offset is part of the player URL, not something it re-reads.
            key={startAt}
            src={tutorialEmbedUrl(startAt)}
            title="Avalux walkthrough"
            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            className="aspect-video w-full border-0"
          />
        ) : (
          /* Loading the player contacts the provider before anyone presses
             play, so it waits. Allowing it here records the consent, rather
             than making an exception that the cookie settings do not know
             about. */
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-muted p-6 text-center">
            <PlayCircle className="h-10 w-10 text-muted-foreground" />
            <p className="max-w-md text-sm text-muted-foreground">
              The walkthrough is hosted on {providerName}. Playing it here loads
              their player, which means your browser contacts {providerName}.
            </p>
            <Button
              size="sm"
              className="cursor-pointer"
              onClick={() => {
                const current = readConsent();
                writeConsent({
                  monitoring: current?.monitoring ?? false,
                  embeds: true,
                });
                setEmbedsAllowed(true);
              }}
            >
              Load the video
            </Button>
            <p className="text-xs text-muted-foreground">
              This is remembered, and can be undone under Cookie settings.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-muted-foreground">
          Jump to:
        </span>
        {TUTORIAL_VIDEO_CHAPTERS.map((chapter) => (
          <Button
            key={chapter.label}
            type="button"
            size="sm"
            variant={startAt === chapter.at ? "secondary" : "ghost"}
            className="h-7 px-2 text-xs"
            onClick={() => setStartAt(chapter.at)}
          >
            {chapter.label}
          </Button>
        ))}
        <a
          href={tutorialWatchUrl()}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Watch on {providerName}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
