import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../theme";

const ease = Easing.bezier(...EASE_OUT);

/** Words rise into place one after another, so a line reads as it lands. */
const Words: React.FC<{
  text: string;
  delay: number;
  stagger: number;
  rise: number;
  fadeOutAt?: number;
}> = ({ text, delay, stagger, rise, fadeOutAt }) => {
  const frame = useCurrentFrame();

  return (
    <>
      {text.split(" ").map((word, i) => {
        const start = delay + i * stagger;
        return (
          <span
            key={`${word}-${i}`}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity:
                interpolate(frame, [start, start + 18], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: ease,
                }) *
                (fadeOutAt === undefined
                  ? 1
                  : interpolate(frame, [fadeOutAt, fadeOutAt + 14], [1, 0], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: ease,
                    })),
              translate: `0px ${interpolate(frame, [start, start + 26], [rise, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ease,
              })}px`,
            }}
          >
            {word}{" "}
          </span>
        );
      })}
    </>
  );
};

export const Headline: React.FC<{
  text: string;
  delay?: number;
  size?: number;
  gradient?: boolean;
  align?: React.CSSProperties["textAlign"];
  maxWidth?: number;
  name?: string;
  fadeOutAt?: number;
}> = ({
  text,
  delay = 0,
  size = theme.size.h1,
  gradient = false,
  align = "left",
  maxWidth,
  name = "Headline",
  fadeOutAt,
}) => {
  const frame = useCurrentFrame();

  // A gradient headline animates as one line, and the animation has to sit on
  // the same element that carries the background. `translate` creates a
  // stacking context, so a moving child would fall outside the text clip and
  // render invisible.
  const lineOpacity =
    interpolate(frame, [delay, delay + 22], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    }) *
    (fadeOutAt === undefined
      ? 1
      : interpolate(frame, [fadeOutAt, fadeOutAt + 14], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }));

  return (
    <Interactive.Div
      name={name}
      style={{
        fontSize: size,
        fontWeight: 800,
        letterSpacing: -size * 0.026,
        lineHeight: 1.06,
        textAlign: align,
        maxWidth,
        color: gradient ? "transparent" : theme.color.ink,
        backgroundImage: gradient ? theme.gradient : undefined,
        backgroundClip: gradient ? "text" : undefined,
        WebkitBackgroundClip: gradient ? "text" : undefined,
        opacity: gradient ? lineOpacity : 1,
        translate: gradient
          ? `0px ${interpolate(frame, [delay, delay + 32], [size * 0.22, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ease,
            })}px`
          : undefined,
      }}
    >
      {gradient ? (
        text
      ) : (
        <Words
          text={text}
          delay={delay}
          stagger={3}
          rise={size * 0.28}
          fadeOutAt={fadeOutAt}
        />
      )}
    </Interactive.Div>
  );
};

export const SubCaption: React.FC<{
  text: string;
  delay?: number;
  size?: number;
  align?: React.CSSProperties["textAlign"];
  maxWidth?: number;
  color?: string;
  name?: string;
  fadeOutAt?: number;
}> = ({
  text,
  delay = 0,
  size = theme.size.body,
  align = "left",
  maxWidth = 1180,
  color = theme.color.inkMuted,
  name = "Subcaption",
  fadeOutAt,
}) => (
  <Interactive.Div
    name={name}
    style={{
      fontSize: size,
      fontWeight: 500,
      lineHeight: 1.36,
      letterSpacing: -size * 0.012,
      textAlign: align,
      maxWidth,
      color,
    }}
  >
    <Words
      text={text}
      delay={delay}
      stagger={1.6}
      rise={size * 0.4}
      fadeOutAt={fadeOutAt}
    />
  </Interactive.Div>
);

/** Small uppercase label used above a headline. */
export const Eyebrow: React.FC<{
  text: string;
  delay?: number;
  color?: string;
  name?: string;
}> = ({ text, delay = 0, color = theme.color.primary, name = "Eyebrow" }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div
      name={name}
      style={{
        fontSize: theme.size.micro,
        fontWeight: 700,
        letterSpacing: 3.2,
        textTransform: "uppercase",
        color,
        opacity: interpolate(frame, [delay, delay + 16], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
        translate: `0px ${interpolate(frame, [delay, delay + 22], [14, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        })}px`,
      }}
    >
      {text}
    </Interactive.Div>
  );
};
