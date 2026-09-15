import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../../theme";
import { Card, Chip } from "../Card";

const ease = Easing.bezier(...EASE_OUT);

const fadeIn = (frame: number, start: number, span = 18) =>
  interpolate(frame, [start, start + span], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

/**
 * Four evaluators' findings collapsing into one problem. The point of the shot
 * is that the same problem arrives in four different sentences, which is why
 * merging is the slow step.
 */
export const MergeDiagram: React.FC<{ delay?: number; width?: number }> = ({
  delay = 0,
  width = 980,
}) => {
  const frame = useCurrentFrame();
  const findings = [
    { who: "Ana", text: "No confirmation after saving" },
    { who: "Bruno", text: "I could not tell if the schedule saved" },
    { who: "Carla", text: "Save gives no feedback" },
    { who: "Diogo", text: "Pressed save three times" },
  ];
  const merged = fadeIn(frame, delay + 70, 22);

  return (
    <Card name="Merge" delay={delay} style={{ width, padding: 38 }}>
      <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 6 }}>
        Four passes, one problem
      </div>
      <div style={{ fontSize: 21, color: theme.color.inkMuted, marginBottom: 26 }}>
        Each evaluator worked alone, so the same problem arrives four times
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {findings.map((f, i) => (
          <div
            key={f.who}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 18px",
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.color.border}`,
              backgroundColor: theme.color.ground,
              opacity: fadeIn(frame, delay + 14 + i * 10),
              translate: `${interpolate(
                frame,
                [delay + 70, delay + 100],
                [0, 26],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
              )}px 0px`,
            }}
          >
            <Chip delay={delay + 14 + i * 10} size={17}>
              {f.who}
            </Chip>
            <span style={{ fontSize: 22, color: theme.color.ink }}>{f.text}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 24,
          padding: "20px 22px",
          borderRadius: theme.radius.md,
          border: `2px solid ${theme.color.primary}`,
          backgroundColor: theme.color.primarySoft,
          opacity: merged,
          scale: interpolate(frame, [delay + 70, delay + 100], [0.96, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          }),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 25, fontWeight: 700, color: theme.color.primaryInk }}>
            Saving a schedule gives no feedback
          </span>
          <Chip delay={delay + 80} size={16} background={theme.color.white}>
            H1
          </Chip>
          <Chip delay={delay + 84} size={16} background={theme.color.white}>
            Severity 3
          </Chip>
        </div>
      </div>
    </Card>
  );
};

/**
 * What the passes showed once merged. The agreement figure is the one worth
 * putting on screen, because a number far above the published range is how a
 * team finds out its passes were not independent.
 */
export const InspectionStats: React.FC<{ delay?: number; width?: number }> = ({
  delay = 0,
  width = 900,
}) => {
  const frame = useCurrentFrame();
  const stats = [
    { value: "23", label: "problems", note: "from 41 findings" },
    { value: "31%", label: "any-two agreement", note: "within the 5 to 65% range" },
    { value: "4", label: "evaluators", note: "each working alone" },
  ];

  return (
    <Card name="Inspection stats" delay={delay} style={{ width, padding: 40 }}>
      <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 28 }}>
        What the passes showed
      </div>
      <div style={{ display: "flex", gap: 20 }}>
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              padding: "26px 22px",
              borderRadius: theme.radius.md,
              backgroundColor: theme.color.ground,
              border: `1px solid ${theme.color.border}`,
              opacity: fadeIn(frame, delay + 18 + i * 14),
            }}
          >
            <div style={{ fontSize: 52, fontWeight: 800, color: theme.color.primary }}>
              {s.value}
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 18, color: theme.color.inkMuted, marginTop: 6 }}>
              {s.note}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 20,
          color: theme.color.inkMuted,
          opacity: fadeIn(frame, delay + 70),
        }}
      >
        Two evaluators typically agree on a third of what they find, so the
        fifth evaluator is still finding new problems.
      </div>
    </Card>
  );
};

/** Predictions against what testing actually showed. */
export const SynthesisCard: React.FC<{ delay?: number; width?: number }> = ({
  delay = 0,
  width = 880,
}) => {
  const frame = useCurrentFrame();
  const rows = [
    { title: "Saving gives no feedback", outcome: "Hit in testing", tone: theme.color.success },
    { title: "Away mode is two menus deep", outcome: "Hit in testing", tone: theme.color.success },
    { title: "Onboarding cannot be skipped", outcome: "Not observed", tone: theme.color.inkMuted },
    { title: "Schedule will not repeat weekly", outcome: "Only testing found it", tone: theme.color.violet },
  ];

  return (
    <Card name="Synthesis" delay={delay} style={{ width, padding: 38 }}>
      <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 6 }}>After testing</div>
      <div style={{ fontSize: 21, color: theme.color.inkMuted, marginBottom: 24 }}>
        Which predictions participants met, and what only testing found
      </div>
      {rows.map((r, i) => (
        <div
          key={r.title}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 0",
            borderTop: i === 0 ? "none" : `1px solid ${theme.color.border}`,
            opacity: fadeIn(frame, delay + 18 + i * 13),
          }}
        >
          <span style={{ fontSize: 23 }}>{r.title}</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: r.tone }}>{r.outcome}</span>
        </div>
      ))}
      <div
        style={{
          marginTop: 22,
          fontSize: 20,
          color: theme.color.inkMuted,
          opacity: fadeIn(frame, delay + 78),
        }}
      >
        Not observed never means wrong. A few sessions can miss a real problem.
      </div>
    </Card>
  );
};
