import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../theme";

const ease = Easing.bezier(...EASE_OUT);

/**
 * A ring drawn over a screenshot region, with an optional label pill.
 * All coordinates are percentages of the surrounding shell.
 */
export const Callout: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  delay?: number;
  color?: string;
  labelSide?: "top" | "bottom";
  fadeOutAt?: number;
}> = ({
  x,
  y,
  w,
  h,
  label,
  delay = 0,
  color = theme.color.primary,
  labelSide = "bottom",
  fadeOutAt,
}) => {
  const frame = useCurrentFrame();

  const draw = interpolate(frame, [delay, delay + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  // Anchor the label so it cannot run off the edge of the shell.
  const center = x + w / 2;
  const anchor = center > 74 ? "right" : center < 26 ? "left" : "center";

  const out =
    fadeOutAt === undefined
      ? 1
      : interpolate(frame, [fadeOutAt, fadeOutAt + 14], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        });

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        height: `${h}%`,
        opacity: out,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: theme.radius.md,
          border: `4px solid ${color}`,
          boxShadow: `0 0 0 6px ${color}22, 0 10px 34px ${color}30`,
          opacity: draw,
          scale: interpolate(frame, [delay, delay + 26], [1.07, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          }),
        }}
      />
      {label ? (
        <div
          style={{
            position: "absolute",
            left: anchor === "center" ? "50%" : anchor === "left" ? 0 : undefined,
            right: anchor === "right" ? 0 : undefined,
            [labelSide === "bottom" ? "top" : "bottom"]: "100%",
            translate: `${anchor === "center" ? "-50%" : "0"} ${labelSide === "bottom" ? 16 : -16}px`,
            whiteSpace: "nowrap",
            backgroundColor: color,
            color: theme.color.white,
            fontSize: theme.size.micro,
            fontWeight: 700,
            letterSpacing: 0.2,
            padding: "10px 20px",
            borderRadius: theme.radius.pill,
            boxShadow: theme.shadow.card,
            opacity: interpolate(frame, [delay + 12, delay + 30], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ease,
            }),
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
