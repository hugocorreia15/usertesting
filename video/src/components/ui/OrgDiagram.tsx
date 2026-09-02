import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../../theme";

const ease = Easing.bezier(...EASE_OUT);

const Node: React.FC<{
  title: string;
  sub?: string;
  delay: number;
  width: number;
  accent?: string;
  chips?: string[];
}> = ({ title, sub, delay, width, accent = theme.color.primary, chips }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width,
        padding: "24px 28px",
        borderRadius: theme.radius.lg,
        backgroundColor: theme.color.card,
        border: `2px solid ${accent}`,
        boxShadow: theme.shadow.card,
        opacity: interpolate(frame, [delay, delay + 18], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
        translate: `0px ${interpolate(frame, [delay, delay + 28], [24, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        })}px`,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color: accent }}>{title}</div>
      {sub ? (
        <div
          style={{
            fontSize: 21,
            fontWeight: 500,
            color: theme.color.inkMuted,
            marginTop: 6,
          }}
        >
          {sub}
        </div>
      ) : null}
      {chips ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          {chips.map((c) => (
            <span
              key={c}
              style={{
                fontSize: 18,
                fontWeight: 600,
                padding: "7px 14px",
                borderRadius: theme.radius.pill,
                backgroundColor: theme.color.sidebar,
                color: theme.color.inkMuted,
              }}
            >
              {c}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

/** Organization, groups, and the projects each group holds. */
export const OrgDiagram: React.FC<{
  delay?: number;
  width?: number;
  showRoles?: boolean;
}> = ({ delay = 0, width = 980, showRoles = false }) => {
  const frame = useCurrentFrame();
  const linkDraw = interpolate(frame, [delay + 20, delay + 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  return (
    <div style={{ width, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Node
        title="HCI 2026 · Organization"
        sub="Owner sees every project"
        delay={delay}
        width={520}
        accent={theme.color.primary}
      />

      <div style={{ height: 54, width: 2, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 2,
            height: `${linkDraw * 100}%`,
            backgroundColor: theme.color.border,
          }}
        />
      </div>

      <div
        style={{
          width: 560,
          height: 2,
          backgroundColor: theme.color.border,
          opacity: linkDraw,
        }}
      />

      <div style={{ display: "flex", gap: 60, marginTop: 0 }}>
        {[
          {
            title: "Group · Panel team",
            sub: "3 members · 2 students",
            chips: ["Bosch panel v1", "Bosch panel v2"],
          },
          {
            title: "Group · Dashboard team",
            sub: "2 members · 2 students",
            chips: ["Tobii dashboard"],
          },
        ].map((g, i) => (
          <div key={g.title} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 2,
                height: 40,
                backgroundColor: theme.color.border,
                opacity: linkDraw,
              }}
            />
            <Node
              title={g.title}
              sub={g.sub}
              chips={g.chips}
              delay={delay + 34 + i * 12}
              width={420}
              accent={theme.color.accent}
            />
          </div>
        ))}
      </div>

      {showRoles ? (
      <div
        style={{
          display: "flex",
          gap: 34,
          marginTop: 44,
          fontSize: 22,
          fontWeight: 600,
          color: theme.color.inkMuted,
          opacity: interpolate(frame, [delay + 70, delay + 92], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          }),
        }}
      >
        {[
          { role: "Owner", note: "runs the organization", color: theme.color.primary },
          { role: "Member", note: "collaborates across projects", color: theme.color.violet },
          { role: "Student", note: "sees only assigned projects", color: theme.color.accent },
        ].map((r) => (
          <span key={r.role} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: r.color,
              }}
            />
            <b style={{ color: theme.color.ink }}>{r.role}</b> {r.note}
          </span>
        ))}
      </div>
      ) : null}
    </div>
  );
};
