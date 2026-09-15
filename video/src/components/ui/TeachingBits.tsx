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

/** A protocol moving through review, and what each state permits. */
export const ReviewFlow: React.FC<{ delay?: number; width?: number }> = ({
  delay = 0,
  width = 1000,
}) => {
  const frame = useCurrentFrame();
  const states = [
    { label: "Draft", note: "the team is writing it", tone: theme.color.inkMuted },
    { label: "Submitted", note: "waiting for the instructor", tone: theme.color.primary },
    { label: "Approved", note: "join links can be created", tone: theme.color.success },
  ];

  return (
    <Card name="Review" delay={delay} style={{ width, padding: 40 }}>
      <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 26 }}>
        A protocol is reviewed before it runs
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {states.map((s, i) => (
          <React.Fragment key={s.label}>
            <div
              style={{
                flex: 1,
                padding: "24px 20px",
                borderRadius: theme.radius.md,
                border: `2px solid ${s.tone}`,
                backgroundColor: theme.color.ground,
                opacity: fadeIn(frame, delay + 16 + i * 18),
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: s.tone }}>{s.label}</div>
              <div style={{ fontSize: 19, color: theme.color.inkMuted, marginTop: 6 }}>
                {s.note}
              </div>
            </div>
            {i < states.length - 1 && (
              <div
                style={{
                  fontSize: 30,
                  color: theme.color.inkSoft,
                  opacity: fadeIn(frame, delay + 26 + i * 18),
                }}
              >
                →
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div
        style={{
          marginTop: 26,
          padding: "20px 22px",
          borderRadius: theme.radius.md,
          backgroundColor: theme.color.primarySoft,
          fontSize: 21,
          color: theme.color.primaryInk,
          opacity: fadeIn(frame, delay + 74),
        }}
      >
        Editing an approved protocol sends it back to draft, so what was
        approved is what runs. Sessions run before approval are marked
        <strong> Pilot</strong> and left out of the results.
      </div>
    </Card>
  );
};

/** The consent text as the participant sees it, built from ticked clauses. */
export const ConsentBuilder: React.FC<{ delay?: number; width?: number }> = ({
  delay = 0,
  width = 1000,
}) => {
  const frame = useCurrentFrame();
  const clauses = [
    "Taking part is voluntary",
    "They may stop at any time",
    "We are testing the system, not them",
    "Results are reported without names",
  ];

  return (
    <Card name="Consent" delay={delay} style={{ width, padding: 40 }}>
      <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 6 }}>
        Consent, from a checklist
      </div>
      <div style={{ fontSize: 21, color: theme.color.inkMuted, marginBottom: 24 }}>
        Most of it is the same in every study. Only the purpose changes.
      </div>

      <div style={{ display: "flex", gap: 26 }}>
        <div style={{ flex: 1 }}>
          {clauses.map((c, i) => (
            <div
              key={c}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "13px 0",
                fontSize: 21,
                opacity: fadeIn(frame, delay + 16 + i * 12),
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  backgroundColor: theme.color.primary,
                  color: theme.color.white,
                  fontSize: 18,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✓
              </div>
              {c}
            </div>
          ))}
        </div>

        <div
          style={{
            flex: 1.15,
            padding: "22px 24px",
            borderRadius: theme.radius.md,
            backgroundColor: theme.color.ground,
            border: `1px solid ${theme.color.border}`,
            opacity: fadeIn(frame, delay + 62),
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: theme.color.inkSoft,
              marginBottom: 12,
            }}
          >
            What a participant reads
          </div>
          <div style={{ fontSize: 20, lineHeight: 1.5, color: theme.color.ink }}>
            We are testing a booking site for a public library. Taking part is
            voluntary. You may stop at any time, without giving a reason. We are
            testing the system, not you. Results are reported without your name.
          </div>
        </div>
      </div>
    </Card>
  );
};

/** Three questions, answered before the team sees anyone else's answers. */
export const ReflectionCard: React.FC<{ delay?: number; width?: number }> = ({
  delay = 0,
  width = 900,
}) => {
  const frame = useCurrentFrame();
  const prompts = [
    "What surprised you?",
    "What would you change in the protocol?",
    "Where might you have led the participant?",
  ];

  return (
    <Card name="Reflection" delay={delay} style={{ width, padding: 40 }}>
      <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 6 }}>
        After the session, before the answers
      </div>
      <div style={{ fontSize: 21, color: theme.color.inkMuted, marginBottom: 26 }}>
        Written alone, and visible to teammates only once they have written
        their own
      </div>
      {prompts.map((p, i) => (
        <div
          key={p}
          style={{
            padding: "18px 22px",
            marginBottom: 12,
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.color.border}`,
            backgroundColor: theme.color.ground,
            fontSize: 23,
            opacity: fadeIn(frame, delay + 18 + i * 16),
          }}
        >
          {p}
        </div>
      ))}
      <div
        style={{
          marginTop: 14,
          fontSize: 20,
          color: theme.color.inkMuted,
          opacity: fadeIn(frame, delay + 74),
        }}
      >
        The third question is the one that makes a leading task visible to the
        person who wrote it.
      </div>
    </Card>
  );
};

/** One row per project: what each team has actually produced. */
export const ClassTable: React.FC<{ delay?: number; width?: number }> = ({
  delay = 0,
  width = 1120,
}) => {
  const frame = useCurrentFrame();
  const cols = ["Inspection", "Protocol", "Review", "Sessions", "Consent", "Reflected"];
  const rows = [
    { team: "Group A", cells: ["Merged, 31%", "Clear", "Approved", "6", "6/6", "6/6"], flag: null },
    { team: "Group B", cells: ["3 of 4 in", "1 warning", "Waiting", "2", "2/2", "1/2"], flag: "Waiting for your review" },
    { team: "Group C", cells: ["None", "2 warnings", "Off", "4", "1/4", "0/4"], flag: "1 session without consent" },
  ];

  return (
    <Card name="Class" delay={delay} style={{ width, padding: 36 }}>
      <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 22 }}>Class overview</div>

      <div style={{ display: "flex", gap: 10, paddingBottom: 12, opacity: fadeIn(frame, delay + 12) }}>
        <div style={{ width: 190, fontSize: 17, fontWeight: 700, color: theme.color.inkSoft }}>
          PROJECT
        </div>
        {cols.map((c) => (
          <div
            key={c}
            style={{
              flex: 1,
              fontSize: 17,
              fontWeight: 700,
              color: theme.color.inkSoft,
              textTransform: "uppercase",
            }}
          >
            {c}
          </div>
        ))}
      </div>

      {rows.map((r, i) => (
        <div
          key={r.team}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            padding: "16px 0",
            borderTop: `1px solid ${theme.color.border}`,
            opacity: fadeIn(frame, delay + 22 + i * 16),
          }}
        >
          <div style={{ width: 190 }}>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{r.team}</div>
            {r.flag && (
              <div style={{ fontSize: 16, color: theme.color.warning, marginTop: 4 }}>
                {r.flag}
              </div>
            )}
          </div>
          {r.cells.map((cell, j) => (
            <div
              key={j}
              style={{
                flex: 1,
                fontSize: 20,
                color:
                  cell.includes("warning") || cell === "None" || cell.startsWith("1/4") || cell.startsWith("0/")
                    ? theme.color.warning
                    : theme.color.ink,
              }}
            >
              {cell}
            </div>
          ))}
        </div>
      ))}

      <div
        style={{
          marginTop: 20,
          fontSize: 19,
          color: theme.color.inkMuted,
          opacity: fadeIn(frame, delay + 80),
        }}
      >
        Each column is the evidence a learning objective asks for, where the
        platform records it.
      </div>
    </Card>
  );
};

/** A proposal, and the two things that make it safe to offer. */
export const SuggestionCard: React.FC<{ delay?: number; width?: number }> = ({
  delay = 0,
  width = 1000,
}) => {
  const frame = useCurrentFrame();
  const groups = [
    { title: "The away temperature reads as the current temperature", meta: "3 sessions, H2, severity 3" },
    { title: "Nobody expects the schedule to need saving on each day", meta: "2 sessions, H6, severity 2" },
  ];

  return (
    <Card name="Suggestions" delay={delay} style={{ width, padding: 38 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
        <div style={{ fontSize: 30, fontWeight: 700 }}>What these sessions point to</div>
        <Chip delay={delay + 10} size={16}>
          proposed
        </Chip>
      </div>
      <div style={{ fontSize: 21, color: theme.color.inkMuted, marginBottom: 24 }}>
        Off by default, and refused until your team has written a problem of its
        own
      </div>

      {groups.map((g, i) => (
        <div
          key={g.title}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            padding: "18px 22px",
            marginBottom: 12,
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.color.border}`,
            backgroundColor: theme.color.ground,
            opacity: fadeIn(frame, delay + 20 + i * 16),
          }}
        >
          <div>
            <div style={{ fontSize: 23, fontWeight: 600 }}>{g.title}</div>
            <div style={{ fontSize: 18, color: theme.color.inkMuted, marginTop: 4 }}>
              {g.meta}
            </div>
          </div>
          <div
            style={{
              padding: "10px 20px",
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.color.border}`,
              fontSize: 19,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Accept
          </div>
        </div>
      ))}

      <div
        style={{
          marginTop: 16,
          padding: "18px 22px",
          borderRadius: theme.radius.md,
          backgroundColor: theme.color.primarySoft,
          fontSize: 20,
          color: theme.color.primaryInk,
          opacity: fadeIn(frame, delay + 72),
        }}
      >
        Nothing is applied on its own. Accepting writes the problem you would
        have written by hand, marked <strong>assisted</strong>, so a report can
        say which work was your own.
      </div>
    </Card>
  );
};
