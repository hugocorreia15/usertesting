import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../theme";
import {
  TUTORIAL,
  TUTORIAL_CHAPTERS,
  TUTORIAL_DURATION,
  tutorialStarts,
} from "../timeline";

const ease = Easing.bezier(...EASE_OUT);

/**
 * Persistent progress rail across the bottom of the tutorial, so a viewer can
 * see where they are and scrub to a chapter. Rendered at composition level, so
 * `useCurrentFrame()` is the absolute frame.
 */
export const ChapterRail: React.FC = () => {
  const frame = useCurrentFrame();
  const starts = tutorialStarts();

  const introEnd = starts.templates;
  const outroStart = starts.outro;

  // Hidden over the intro and outro, where it would only compete with the title.
  const visible =
    interpolate(frame, [introEnd - 20, introEnd + 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    }) *
    interpolate(frame, [outroStart - 30, outroStart], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    });

  const progress = interpolate(frame, [0, TUTORIAL_DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const activeIndex = TUTORIAL_CHAPTERS.reduce(
    (acc, chapter, i) => (frame >= starts[chapter.key] ? i : acc),
    0,
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: theme.safe.x,
          right: theme.safe.x,
          bottom: 52,
          opacity: visible,
        }}
      >
        {/* Twelve chapters do not fit at the old size: labels wrapped onto two
            lines and the last ones ran off the right edge. The row is now told
            not to wrap, and the numbers carry the sequence so the labels can be
            small. */}
        <div
          style={{
            display: "flex",
            gap: 18,
            marginBottom: 18,
            fontSize: 19,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {TUTORIAL_CHAPTERS.map((chapter, i) => {
            const active = i === activeIndex;
            return (
              <div
                key={chapter.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  color: active ? theme.color.primaryInk : theme.color.inkSoft,
                  opacity: active ? 1 : 0.75,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    flexShrink: 0,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: active ? theme.color.white : theme.color.inkSoft,
                    backgroundColor: active
                      ? theme.color.primary
                      : theme.color.border,
                  }}
                >
                  {i + 1}
                </div>
                {chapter.label}
              </div>
            );
          })}
        </div>

        <div
          style={{
            height: 6,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.color.border,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              borderRadius: theme.radius.pill,
              backgroundImage: theme.gradient,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const TUTORIAL_TOTAL = Object.values(TUTORIAL).reduce((a, b) => a + b, 0);
