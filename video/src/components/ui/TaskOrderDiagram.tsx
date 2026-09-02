import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../../theme";

const ease = Easing.bezier(...EASE_OUT);

const STRATEGIES: { name: string; order: number[]; note: string }[] = [
  { name: "Fixed", order: [1, 2, 3, 4, 5], note: "Same order for everyone" },
  { name: "Shuffled", order: [4, 1, 5, 2, 3], note: "Random per session" },
  {
    name: "Latin square",
    order: [3, 4, 5, 1, 2],
    note: "Rotated position per participant",
  },
];

/** Fixed, shuffled, and Latin-square task orders, side by side. */
export const TaskOrderDiagram: React.FC<{
  delay?: number;
  width?: number;
}> = ({ delay = 0, width = 900 }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ width, display: "flex", flexDirection: "column", gap: 30 }}>
      {STRATEGIES.map((s, si) => {
        const start = delay + si * 22;
        return (
          <div
            key={s.name}
            style={{
              opacity: interpolate(frame, [start, start + 18], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ease,
              }),
              translate: `${interpolate(frame, [start, start + 28], [30, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ease,
              })}px 0px`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 16,
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 30, fontWeight: 700 }}>{s.name}</span>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  color: theme.color.inkMuted,
                }}
              >
                {s.note}
              </span>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              {s.order.map((n, i) => {
                const chipStart = start + 10 + i * 6;
                return (
                  <div
                    key={i}
                    style={{
                      width: 84,
                      height: 66,
                      borderRadius: theme.radius.md,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: theme.font.mono,
                      fontSize: 28,
                      fontWeight: 700,
                      color:
                        si === 0 ? theme.color.primaryInk : theme.color.white,
                      backgroundColor:
                        si === 0 ? theme.color.primarySoft : theme.color.primary,
                      border: `1px solid ${si === 0 ? theme.color.border : theme.color.primary}`,
                      opacity: interpolate(
                        frame,
                        [chipStart, chipStart + 14],
                        [0, 1],
                        {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                          easing: ease,
                        },
                      ),
                      scale: interpolate(
                        frame,
                        [chipStart, chipStart + 20],
                        [0.7, 1],
                        {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                          easing: ease,
                        },
                      ),
                    }}
                  >
                    T{n}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
