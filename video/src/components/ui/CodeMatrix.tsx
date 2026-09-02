import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../../theme";
import { Card } from "../Card";

const ease = Easing.bezier(...EASE_OUT);

const CODES = [
  { label: "Wayfinding confusion", color: "#ef4444" },
  { label: "Label misread", color: "#f59e0b" },
  { label: "Expected undo", color: "#6366f1" },
  { label: "Praised speed", color: "#14b8a6" },
];

const COUNTS = [
  [3, 0, 2, 1, 4, 0],
  [1, 2, 0, 0, 1, 2],
  [0, 1, 1, 3, 0, 1],
  [2, 2, 1, 0, 2, 3],
];

/** Codes against sessions: the pattern across participants, made visible. */
export const CodeMatrix: React.FC<{ delay?: number; cell?: number }> = ({
  delay = 0,
  cell = 78,
}) => {
  const frame = useCurrentFrame();
  const labelW = 400;

  return (
    <Card delay={delay} name="Frequency matrix" style={{ padding: 44 }}>
      <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 26 }}>
        Codes by session
      </div>
      <div style={{ display: "flex", marginLeft: labelW, marginBottom: 14 }}>
        {COUNTS[0].map((_, c) => (
          <div
            key={c}
            style={{
              width: cell,
              textAlign: "center",
              fontSize: 22,
              fontWeight: 700,
              fontFamily: theme.font.mono,
              color: theme.color.inkSoft,
              opacity: interpolate(frame, [delay, delay + 16], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ease,
              }),
            }}
          >
            S{c + 1}
          </div>
        ))}
      </div>

      {CODES.map((code, r) => (
        <div key={code.label} style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: labelW,
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 24,
              fontWeight: 600,
              paddingRight: 24,
              opacity: interpolate(
                frame,
                [delay + r * 10, delay + r * 10 + 18],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: ease,
                },
              ),
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 5,
                backgroundColor: code.color,
                flexShrink: 0,
              }}
            />
            {code.label}
          </div>

          {COUNTS[r].map((v, c) => {
            const start = delay + 12 + r * 10 + c * 5;
            const pop = interpolate(frame, [start, start + 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ease,
            });
            return (
              <div
                key={c}
                style={{
                  width: cell,
                  height: cell,
                  padding: 5,
                  boxSizing: "border-box",
                  opacity: pop,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: theme.radius.sm,
                    backgroundColor: v === 0 ? theme.color.sidebar : code.color,
                    opacity: v === 0 ? 1 : 0.22 + v * 0.19,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: theme.font.mono,
                    fontSize: 24,
                    fontWeight: 700,
                    color: v === 0 ? theme.color.inkSoft : "#ffffff",
                  }}
                >
                  {v === 0 ? "" : v}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </Card>
  );
};
