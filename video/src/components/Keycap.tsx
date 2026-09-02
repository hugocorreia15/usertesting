import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../theme";

const ease = Easing.bezier(...EASE_OUT);

/**
 * A keyboard key that presses down and flashes at `pressAt`, used to show the
 * cockpit shortcuts driving the counters.
 */
export const Keycap: React.FC<{
  label: string;
  pressAt: number;
  size?: number;
  caption?: string;
  appearAt?: number;
}> = ({ label, pressAt, size = 92, caption, appearAt }) => {
  const frame = useCurrentFrame();
  const enter = appearAt ?? pressAt - 20;
  const since = frame - pressAt;
  const pressed = since >= 0 && since < 9;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        opacity: interpolate(frame, [enter, enter + 16], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: theme.radius.md,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme.font.mono,
          fontSize: size * 0.42,
          fontWeight: 700,
          color: pressed ? theme.color.white : theme.color.ink,
          backgroundColor: pressed ? theme.color.primary : theme.color.card,
          border: `2px solid ${pressed ? theme.color.primary : theme.color.border}`,
          boxShadow: pressed
            ? theme.shadow.glow
            : `0 5px 0 ${theme.color.border}, 0 10px 22px rgba(30,27,75,0.10)`,
          translate: `0px ${interpolate(
            since,
            [-1, 0, 6, 14],
            [0, 5, 5, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ease,
            },
          )}px`,
        }}
      >
        {label}
      </div>
      {caption ? (
        <div
          style={{
            fontSize: theme.size.micro,
            fontWeight: 600,
            color: theme.color.inkMuted,
          }}
        >
          {caption}
        </div>
      ) : null}
    </div>
  );
};
