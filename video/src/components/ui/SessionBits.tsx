import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../../theme";
import { Card } from "../Card";

const ease = Easing.bezier(...EASE_OUT);

const fadeUp = (frame: number, start: number) => ({
  opacity: interpolate(frame, [start, start + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  }),
  translate: `0px ${interpolate(frame, [start, start + 28], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  })}px`,
});

/** The question types a task can carry, including on-device media capture. */
export const QuestionTypes: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();

  const items = [
    { label: "Rating", glyph: "★", note: "1 to 5 or 1 to 7" },
    { label: "Open text", glyph: "¶", note: "Free response" },
    { label: "Choice", glyph: "◉", note: "Single or multiple" },
    { label: "Audio", glyph: "◎", note: "Recorded in browser" },
    { label: "Video", glyph: "▣", note: "Front or rear camera" },
    { label: "Photo", glyph: "◐", note: "Downscaled on device" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 22,
        width: 900,
      }}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          style={{
            padding: 28,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.color.card,
            border: `1px solid ${theme.color.border}`,
            boxShadow: theme.shadow.card,
            ...fadeUp(frame, delay + i * 9),
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: theme.radius.md,
              backgroundColor: theme.color.primarySoft,
              color: theme.color.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              marginBottom: 18,
            }}
          >
            {item.glyph}
          </div>
          <div style={{ fontSize: 27, fontWeight: 700 }}>{item.label}</div>
          <div
            style={{
              fontSize: 21,
              fontWeight: 500,
              color: theme.color.inkMuted,
              marginTop: 6,
            }}
          >
            {item.note}
          </div>
        </div>
      ))}
    </div>
  );
};

/** Personal invitation against a shared join link. */
export const InviteCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, width: 880 }}>
      <Card delay={delay} name="Personal invitation" style={{ padding: 36 }}>
        <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 10 }}>
          Personal invitation
        </div>
        <div
          style={{
            fontSize: 22,
            color: theme.color.inkMuted,
            marginBottom: 22,
            fontWeight: 500,
          }}
        >
          One link, one participant, consumed on first use
        </div>
        <div
          style={{
            padding: "20px 26px",
            borderRadius: theme.radius.md,
            backgroundColor: theme.color.sidebar,
            border: `1px solid ${theme.color.border}`,
            fontFamily: theme.font.mono,
            fontSize: 24,
            color: theme.color.primaryInk,
          }}
        >
          avalux.pt/join/7QF2-N4KD
        </div>
      </Card>

      <Card delay={delay + 16} name="Shared link" style={{ padding: 36 }}>
        <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 10 }}>
          Shared join code
        </div>
        <div
          style={{
            fontSize: 22,
            color: theme.color.inkMuted,
            marginBottom: 22,
            fontWeight: 500,
          }}
        >
          One code, many participants, capped by max responses
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              flex: 1,
              padding: "20px 26px",
              borderRadius: theme.radius.md,
              backgroundColor: theme.color.sidebar,
              border: `1px solid ${theme.color.border}`,
              fontFamily: theme.font.mono,
              fontSize: 24,
              color: theme.color.primaryInk,
            }}
          >
            STUDY-2026
          </div>
          <div
            style={{
              padding: "18px 26px",
              borderRadius: theme.radius.pill,
              backgroundColor: theme.color.accentSoft,
              color: "#0f766e",
              fontSize: 22,
              fontWeight: 700,
              opacity: interpolate(frame, [delay + 30, delay + 48], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ease,
              }),
            }}
          >
            14 / 20 used
          </div>
        </div>
      </Card>
    </div>
  );
};

/** The Single Ease Question, as the participant sees it. */
export const SeqScale: React.FC<{ delay?: number; chosen?: number }> = ({
  delay = 0,
  chosen = 6,
}) => {
  const frame = useCurrentFrame();

  return (
    <Card delay={delay} name="SEQ" style={{ padding: 44, width: 880 }}>
      <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 12 }}>
        Single Ease Question
      </div>
      <div
        style={{
          fontSize: 23,
          fontWeight: 500,
          color: theme.color.inkMuted,
          marginBottom: 34,
        }}
      >
        Overall, how difficult or easy was this task to complete?
      </div>

      <div style={{ display: "flex", gap: 14 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((n) => {
          const selected = n === chosen;
          const pick = interpolate(frame, [delay + 34, delay + 52], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          });
          return (
            <div
              key={n}
              style={{
                flex: 1,
                height: 88,
                borderRadius: theme.radius.md,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: theme.font.mono,
                fontSize: 32,
                fontWeight: 700,
                border: `2px solid ${selected && pick > 0.5 ? theme.color.primary : theme.color.border}`,
                backgroundColor:
                  selected && pick > 0.5
                    ? theme.color.primary
                    : theme.color.card,
                color:
                  selected && pick > 0.5
                    ? theme.color.white
                    : theme.color.inkMuted,
                scale: selected
                  ? interpolate(frame, [delay + 34, delay + 50], [1, 1.06], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: ease,
                    })
                  : 1,
              }}
            >
              {n}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 16,
          fontSize: 21,
          fontWeight: 600,
          color: theme.color.inkSoft,
        }}
      >
        <span>Very difficult</span>
        <span>Very easy</span>
      </div>
    </Card>
  );
};

/** The full shortcut set the cockpit responds to. */
export const ShortcutLegend: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();

  const rows = [
    { keys: ["A"], what: "Log an action" },
    { keys: ["1", "…", "9"], what: "Log a typed error" },
    { keys: ["H"], what: "Log a hesitation" },
    { keys: ["Z"], what: "Undo the last entry" },
  ];

  return (
    <Card delay={delay} name="Shortcuts" style={{ padding: 48, width: 860 }}>
      <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 30 }}>
        Keyboard shortcuts
      </div>
      {rows.map((row, i) => (
        <div
          key={row.what}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            padding: "22px 0",
            borderTop: i === 0 ? "none" : `1px solid ${theme.color.border}`,
            ...fadeUp(frame, delay + 14 + i * 12),
          }}
        >
          <div style={{ display: "flex", gap: 10, width: 250 }}>
            {row.keys.map((k) => (
              <div
                key={k}
                style={{
                  minWidth: 60,
                  height: 60,
                  padding: "0 14px",
                  borderRadius: theme.radius.sm,
                  border: `2px solid ${theme.color.border}`,
                  boxShadow: `0 4px 0 ${theme.color.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: theme.font.mono,
                  fontSize: 26,
                  fontWeight: 700,
                }}
              >
                {k}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 27, fontWeight: 600 }}>{row.what}</div>
        </div>
      ))}
      <div
        style={{
          marginTop: 22,
          fontSize: 21,
          fontWeight: 500,
          color: theme.color.inkMuted,
          ...fadeUp(frame, delay + 70),
        }}
      >
        Suppressed while typing or while a dialog is open.
      </div>
    </Card>
  );
};

/** Two-way gating: neither side advances alone. */
export const GatingDiagram: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin((frame - delay) / 9);

  return (
    <div style={{ width: 900, display: "flex", flexDirection: "column", gap: 34 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <Card delay={delay} name="Evaluator side" style={{ flex: 1, padding: 34 }}>
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 10 }}>
            Evaluator
          </div>
          <div style={{ fontSize: 22, color: theme.color.inkMuted, fontWeight: 500 }}>
            Wants to advance to task 3
          </div>
        </Card>

        <div
          style={{
            width: 108,
            height: 108,
            borderRadius: "50%",
            backgroundColor: theme.color.warning,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 46,
            color: theme.color.white,
            boxShadow: `0 0 ${18 + pulse * 22}px rgba(202,138,4,${0.25 + pulse * 0.3})`,
            opacity: interpolate(frame, [delay + 18, delay + 36], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ease,
            }),
            flexShrink: 0,
          }}
        >
          ⏸
        </div>

        <Card delay={delay + 12} name="Participant side" style={{ flex: 1, padding: 34 }}>
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 10 }}>
            Participant
          </div>
          <div style={{ fontSize: 22, color: theme.color.inkMuted, fontWeight: 500 }}>
            Still answering task 2
          </div>
        </Card>
      </div>

      <div
        style={{
          padding: "26px 34px",
          borderRadius: theme.radius.lg,
          backgroundColor: theme.color.sidebar,
          border: `1px solid ${theme.color.border}`,
          fontSize: 25,
          fontWeight: 600,
          color: theme.color.ink,
          textAlign: "center",
          ...fadeUp(frame, delay + 40),
        }}
      >
        The session holds until both sides are ready.
      </div>
    </div>
  );
};
