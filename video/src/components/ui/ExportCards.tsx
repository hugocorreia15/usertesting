import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../../theme";

const ease = Easing.bezier(...EASE_OUT);

const FileGlyph: React.FC<{ label: string; color: string; size: number }> = ({
  label,
  color,
  size,
}) => (
  <svg width={size} height={size * 1.24} viewBox="0 0 100 124" fill="none">
    <path
      d="M12 10a8 8 0 0 1 8-8h44l26 26v86a8 8 0 0 1-8 8H20a8 8 0 0 1-8-8Z"
      fill={theme.color.card}
      stroke={color}
      strokeWidth="5"
    />
    <path d="M64 2l26 26H72a8 8 0 0 1-8-8Z" fill={color} opacity="0.25" />
    <rect x="12" y="64" width="78" height="34" rx="8" fill={color} />
    <text
      x="51"
      y="88"
      textAnchor="middle"
      fill="#ffffff"
      fontSize="22"
      fontWeight="700"
      fontFamily="monospace"
    >
      {label}
    </text>
  </svg>
);

/** PDF, CSV, and JSON fanning out: nothing is locked in. */
export const ExportCards: React.FC<{
  items?: { label: string; title: string; sub: string; color: string }[];
  delay?: number;
  cardWidth?: number;
}> = ({
  items = [
    {
      label: "PDF",
      title: "PDF report",
      sub: "Charts, timelines, task tables",
      color: theme.color.danger,
    },
    {
      label: "CSV",
      title: "CSV bundle",
      sub: "One flat file per table",
      color: theme.color.success,
    },
    {
      label: "JSON",
      title: "JSON",
      sub: "The whole study, one file",
      color: theme.color.primary,
    },
  ],
  delay = 0,
  cardWidth = 340,
}) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ display: "flex", gap: 34 }}>
      {items.map((item, i) => {
        const start = delay + i * 12;
        const tilt = (i - 1) * 4;
        return (
          <div
            key={item.label}
            style={{
              width: cardWidth,
              padding: 34,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.color.card,
              border: `1px solid ${theme.color.border}`,
              boxShadow: theme.shadow.card,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              opacity: interpolate(frame, [start, start + 18], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ease,
              }),
              translate: `0px ${interpolate(frame, [start, start + 32], [46, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ease,
              })}px`,
              rotate: `${interpolate(frame, [start, start + 36], [0, tilt], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ease,
              })}deg`,
            }}
          >
            <FileGlyph label={item.label} color={item.color} size={96} />
            <div style={{ fontSize: 30, fontWeight: 700, textAlign: "center" }}>
              {item.title}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: theme.color.inkMuted,
                textAlign: "center",
                lineHeight: 1.35,
              }}
            >
              {item.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
};
