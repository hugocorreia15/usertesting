import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../theme";

const ease = Easing.bezier(...EASE_OUT);

/** The app's white card: 1px border, soft shadow, generous radius. */
export const Card: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  name?: string;
  rise?: number;
}> = ({ children, delay = 0, style, name = "Card", rise = 34 }) => {
  const frame = useCurrentFrame();

  return (
    <Interactive.Div
      name={name}
      style={{
        backgroundColor: theme.color.card,
        border: `1px solid ${theme.color.border}`,
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadow.card,
        opacity: interpolate(frame, [delay, delay + 18], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
        translate: `0px ${interpolate(frame, [delay, delay + 30], [rise, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        })}px`,
        ...style,
      }}
    >
      {children}
    </Interactive.Div>
  );
};

/** Small rounded label used for groups, codes, and instrument names. */
export const Chip: React.FC<{
  children: React.ReactNode;
  delay?: number;
  color?: string;
  background?: string;
  size?: number;
  bold?: boolean;
}> = ({
  children,
  delay = 0,
  color = theme.color.primaryInk,
  background = theme.color.primarySoft,
  size = theme.size.micro,
  bold = true,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: `${size * 0.42}px ${size * 0.85}px`,
        borderRadius: theme.radius.pill,
        backgroundColor: background,
        color,
        fontSize: size,
        fontWeight: bold ? 700 : 500,
        whiteSpace: "nowrap",
        opacity: interpolate(frame, [delay, delay + 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
        scale: interpolate(frame, [delay, delay + 22], [0.86, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
      }}
    >
      {children}
    </div>
  );
};
