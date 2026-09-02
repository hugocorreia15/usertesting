import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../../theme";
import { Card } from "../Card";

const ease = Easing.bezier(...EASE_OUT);

const ROWS = [
  { metric: "Completion status", value: "κ = 0.78", note: "Substantial" },
  { metric: "Action counts", value: "r = 0.94", note: "MAD 0.8" },
  { metric: "Error counts", value: "r = 0.89", note: "MAD 0.5" },
  { metric: "SEQ rating", value: "r = 0.86", note: "MAD 0.4" },
];

/** Two raters, scored independently, compared. */
export const AgreementCard: React.FC<{ delay?: number; width?: number }> = ({
  delay = 0,
  width = 760,
}) => {
  const frame = useCurrentFrame();

  return (
    <Card name="Agreement" delay={delay} style={{ width, padding: 38 }}>
      <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 10 }}>
        Inter-rater agreement
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 500,
          color: theme.color.inkMuted,
          marginBottom: 28,
        }}
      >
        Primary evaluator vs. co-rater, same session
      </div>

      {ROWS.map((row, i) => {
        const start = delay + 16 + i * 12;
        return (
          <div
            key={row.metric}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 0",
              borderTop: i === 0 ? "none" : `1px solid ${theme.color.border}`,
              opacity: interpolate(frame, [start, start + 18], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ease,
              }),
            }}
          >
            <span style={{ fontSize: 25, fontWeight: 600 }}>{row.metric}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <span
                style={{
                  fontFamily: theme.font.mono,
                  fontSize: 26,
                  fontWeight: 700,
                  color: theme.color.primary,
                }}
              >
                {row.value}
              </span>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  padding: "6px 14px",
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.color.accentSoft,
                  color: "#0f766e",
                }}
              >
                {row.note}
              </span>
            </span>
          </div>
        );
      })}
    </Card>
  );
};
