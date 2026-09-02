import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../../theme";
import { Card } from "../Card";
import { BarChart } from "./BarChart";

const ease = Easing.bezier(...EASE_OUT);

const fadeUp = (frame: number, start: number) => ({
  opacity: interpolate(frame, [start, start + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  }),
  translate: `0px ${interpolate(frame, [start, start + 28], [22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  })}px`,
});

/** A template's code book: colored codes with their definitions. */
export const CodeBook: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();

  const codes = [
    {
      label: "Wayfinding confusion",
      color: "#ef4444",
      def: "Participant cannot locate the next step",
    },
    {
      label: "Label misread",
      color: "#f59e0b",
      def: "A control's wording is read as something else",
    },
    {
      label: "Expected undo",
      color: "#6366f1",
      def: "Participant looks for a way to reverse an action",
    },
    {
      label: "Praised speed",
      color: "#14b8a6",
      def: "Positive remark about responsiveness",
    },
  ];

  return (
    <Card delay={delay} name="Code book" style={{ padding: 44, width: 900 }}>
      <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 28 }}>
        Code book
      </div>
      {codes.map((c, i) => (
        <div
          key={c.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            padding: "22px 0",
            borderTop: i === 0 ? "none" : `1px solid ${theme.color.border}`,
            ...fadeUp(frame, delay + 14 + i * 12),
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              backgroundColor: c.color,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 27, fontWeight: 700 }}>{c.label}</div>
            <div
              style={{
                fontSize: 21,
                fontWeight: 500,
                color: theme.color.inkMuted,
                marginTop: 4,
              }}
            >
              {c.def}
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
};

/** Any titled chart exports as a 3x PNG or an SVG, sized for a paper figure. */
export const ChartExportCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();

  return (
    <Card delay={delay} name="Chart export" style={{ padding: 44, width: 900 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 30,
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700 }}>Time on task</div>
        <div style={{ display: "flex", gap: 14 }}>
          {["PNG 3x", "SVG"].map((label, i) => (
            <div
              key={label}
              style={{
                padding: "14px 24px",
                borderRadius: theme.radius.pill,
                border: `2px solid ${theme.color.primary}`,
                color: theme.color.primary,
                fontSize: 21,
                fontWeight: 700,
                ...fadeUp(frame, delay + 40 + i * 10),
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <BarChart
        width={812}
        height={280}
        delay={delay + 10}
        unit="s"
        bars={[
          { label: "Task 1", value: 42 },
          { label: "Task 2", value: 96 },
          { label: "Task 3", value: 58 },
          { label: "Task 4", value: 71 },
          { label: "Task 5", value: 35 },
        ]}
      />
    </Card>
  );
};

/** Owner, member, and student, and what each one can see. */
export const RoleCards: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();

  const roles = [
    {
      role: "Owner",
      color: theme.color.primary,
      can: ["Create groups and projects", "Invite and set roles", "See every project"],
    },
    {
      role: "Member",
      color: theme.color.violet,
      can: ["Edit shared templates", "Read the org's sessions", "Tag and code answers"],
    },
    {
      role: "Student",
      color: theme.color.accent,
      can: ["Full edit on assigned projects", "Read their own sessions", "Nothing else is visible"],
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, width: 900 }}>
      {roles.map((r, i) => (
        <div
          key={r.role}
          style={{
            padding: 32,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.color.card,
            border: `1px solid ${theme.color.border}`,
            borderLeft: `8px solid ${r.color}`,
            boxShadow: theme.shadow.card,
            ...fadeUp(frame, delay + i * 14),
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 700, color: r.color }}>
            {r.role}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 16,
            }}
          >
            {r.can.map((c) => (
              <span
                key={c}
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  padding: "9px 16px",
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.color.sidebar,
                  color: theme.color.inkMuted,
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/** Observer notes, timestamped against the running session. */
export const ObserverCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();

  const notes = [
    { at: "00:41", text: "Scanned the sidebar twice before opening Study Setup" },
    { at: "01:18", text: "Read the Cloud badge aloud, then hesitated" },
    { at: "02:03", text: "Expected drag and drop for the ZIP upload" },
  ];

  return (
    <Card delay={delay} name="Observer notes" style={{ padding: 44, width: 880 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 26,
        }}
      >
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: theme.color.danger,
            opacity: 0.5 + 0.5 * Math.sin(frame / 8),
          }}
        />
        <span style={{ fontSize: 30, fontWeight: 700 }}>Observer notes</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 20,
            fontWeight: 700,
            padding: "8px 16px",
            borderRadius: theme.radius.pill,
            backgroundColor: theme.color.sidebar,
            color: theme.color.inkMuted,
          }}
        >
          read only
        </span>
      </div>

      {notes.map((n, i) => (
        <div
          key={n.at}
          style={{
            display: "flex",
            gap: 22,
            padding: "20px 0",
            borderTop: i === 0 ? "none" : `1px solid ${theme.color.border}`,
            ...fadeUp(frame, delay + 18 + i * 20),
          }}
        >
          <span
            style={{
              fontFamily: theme.font.mono,
              fontSize: 24,
              fontWeight: 700,
              color: theme.color.primary,
            }}
          >
            {n.at}
          </span>
          <span style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.35 }}>
            {n.text}
          </span>
        </div>
      ))}
    </Card>
  );
};
