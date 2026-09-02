import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../../theme";

const ease = Easing.bezier(...EASE_OUT);

export type Bar = { label: string; value: number; color?: string };

/** Bars that grow from the baseline, used for the analytics beats. */
export const BarChart: React.FC<{
  bars: Bar[];
  width?: number;
  height?: number;
  max?: number;
  unit?: string;
  delay?: number;
  title?: string;
}> = ({ bars, width = 820, height = 380, max, unit = "", delay = 0, title }) => {
  const frame = useCurrentFrame();
  const ceiling = max ?? Math.max(...bars.map((b) => b.value)) * 1.18;
  const gap = 26;
  const barW = (width - gap * (bars.length - 1)) / bars.length;

  return (
    <div style={{ width }}>
      {title ? (
        <div
          style={{
            fontSize: theme.size.tiny,
            fontWeight: 700,
            marginBottom: 22,
            opacity: interpolate(frame, [delay, delay + 16], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ease,
            }),
          }}
        >
          {title}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap,
          height,
          borderBottom: `2px solid ${theme.color.border}`,
        }}
      >
        {bars.map((b, i) => {
          const start = delay + i * 7;
          const grow = interpolate(frame, [start, start + 34], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          });
          const h = (b.value / ceiling) * height * grow;

          return (
            <div
              key={b.label}
              style={{
                width: barW,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: "100%",
              }}
            >
              <div
                style={{
                  fontSize: theme.size.micro,
                  fontWeight: 700,
                  fontFamily: theme.font.mono,
                  color: theme.color.ink,
                  marginBottom: 10,
                  opacity: grow,
                }}
              >
                {(b.value * grow).toFixed(b.value % 1 === 0 ? 0 : 1)}
                {unit}
              </div>
              <div
                style={{
                  width: "100%",
                  height: h,
                  borderRadius: `${theme.radius.sm}px ${theme.radius.sm}px 0 0`,
                  backgroundColor: b.color ?? theme.color.primary,
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap, marginTop: 14 }}>
        {bars.map((b, i) => (
          <div
            key={b.label}
            style={{
              width: barW,
              textAlign: "center",
              fontSize: theme.size.micro,
              fontWeight: 600,
              color: theme.color.inkMuted,
              opacity: interpolate(
                frame,
                [delay + i * 7, delay + i * 7 + 20],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: ease,
                },
              ),
            }}
          >
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
};
