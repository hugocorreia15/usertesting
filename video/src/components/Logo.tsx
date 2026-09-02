import React from "react";
import {
  Easing,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { EASE_OUT, theme } from "../theme";
import { copy } from "../copy/en";

const ease = Easing.bezier(...EASE_OUT);

export const LogoMark: React.FC<{ size: number; style?: React.CSSProperties }> = ({
  size,
  style,
}) => (
  <Img
    src={staticFile("logo.svg")}
    style={{ width: size, height: size * (459 / 541), ...style }}
  />
);

/**
 * Mark plus wordmark, matching the app header: the blue mark next to the
 * indigo-to-teal gradient wordmark.
 */
export const LogoLockup: React.FC<{
  size?: number;
  delay?: number;
  name?: string;
}> = ({ size = 120, delay = 0, name = "Logo" }) => {
  const frame = useCurrentFrame();

  return (
    <Interactive.Div
      name={name}
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.3,
        opacity: interpolate(frame, [delay, delay + 20], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
      }}
    >
      <LogoMark
        size={size}
        style={{
          scale: interpolate(frame, [delay, delay + 34], [0.7, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          }),
        }}
      />
      <div
        style={{
          fontSize: size * 0.86,
          fontWeight: 800,
          letterSpacing: -size * 0.028,
          backgroundImage: theme.gradient,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          translate: `${interpolate(frame, [delay + 6, delay + 38], [-18, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          })}px 0px`,
        }}
      >
        {copy.brand.name}
      </div>
    </Interactive.Div>
  );
};
