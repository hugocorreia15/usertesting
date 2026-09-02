import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../../theme";
import { Card, Chip } from "../Card";

const ease = Easing.bezier(...EASE_OUT);

export type TaskRow = {
  n: number;
  title: string;
  optimal: string;
  actions: number;
  group?: string;
  practice?: boolean;
};

/** A template assembling itself: tasks, baselines, groups, error taxonomy. */
export const TemplateCard: React.FC<{
  title?: string;
  tasks: TaskRow[];
  errors?: { code: string; label: string }[];
  width?: number;
  delay?: number;
}> = ({
  title = "Eye-tracking dashboard · v2",
  tasks,
  errors = [],
  width = 900,
  delay = 0,
}) => {
  const frame = useCurrentFrame();

  return (
    <Card name="Template" delay={delay} style={{ width, padding: 40 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 30,
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.6 }}>
          {title}
        </div>
        <Chip delay={delay + 8} background={theme.color.accentSoft} color="#0f766e">
          Template
        </Chip>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {tasks.map((t, i) => {
          const start = delay + 14 + i * 12;
          return (
            <div
              key={t.n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "20px 24px",
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.color.border}`,
                backgroundColor: t.practice
                  ? theme.color.sidebar
                  : theme.color.card,
                opacity: interpolate(frame, [start, start + 18], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: ease,
                }),
                translate: `${interpolate(frame, [start, start + 26], [26, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: ease,
                })}px 0px`,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.color.primarySoft,
                  color: theme.color.primaryInk,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 24,
                  fontFamily: theme.font.mono,
                  flexShrink: 0,
                }}
              >
                {t.n}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 28, fontWeight: 600 }}>
                  {t.title}
                  {t.practice ? (
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: theme.color.inkSoft,
                        marginLeft: 12,
                      }}
                    >
                      (practice)
                    </span>
                  ) : null}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: theme.color.inkMuted,
                    marginTop: 6,
                  }}
                >
                  Optimal {t.optimal} · {t.actions} actions
                </div>
              </div>

              {t.group ? (
                <Chip delay={start + 8} size={20}>
                  {t.group}
                </Chip>
              ) : null}
            </div>
          );
        })}
      </div>

      {errors.length ? (
        <>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: theme.color.inkMuted,
              marginTop: 34,
              marginBottom: 16,
              opacity: interpolate(
                frame,
                [delay + 70, delay + 88],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: ease,
                },
              ),
            }}
          >
            Error taxonomy
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {errors.map((e, i) => (
              <Chip
                key={e.code}
                delay={delay + 78 + i * 8}
                size={22}
                background="#fef2f2"
                color="#b91c1c"
              >
                <span style={{ fontFamily: theme.font.mono }}>{e.code}</span>
                {e.label}
              </Chip>
            ))}
          </div>
        </>
      ) : null}
    </Card>
  );
};
