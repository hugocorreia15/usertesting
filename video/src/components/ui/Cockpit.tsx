import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_OUT, theme } from "../../theme";
import { Card } from "../Card";

const ease = Easing.bezier(...EASE_OUT);

export type CockpitHighlight =
  | "task"
  | "timer"
  | "actions"
  | "errors"
  | "hesitation"
  | "outcome"
  | null;

export type CockpitProps = {
  taskIndex?: number;
  taskCount?: number;
  taskTitle?: string;
  taskBody?: string;
  optimalSeconds?: number;
  optimalActions?: number;
  errorTypes?: { code: string; label: string }[];
  /** Frame at which the task timer starts running. */
  timerStart?: number;
  /** Clock speed. Above 1 compresses a real session into a short scene. */
  timerRate?: number;
  /** Frames at which the evaluator logs an action. */
  actionsAt?: number[];
  /** Frames at which a typed error is logged. */
  errorsAt?: { frame: number; code: string }[];
  /** Frames at which a hesitation is logged. */
  hesitationsAt?: number[];
  /** Frame at which the most recent entry is undone. */
  undoAt?: number;
  highlight?: CockpitHighlight;
  delay?: number;
  width?: number;
  /** Which bands to render. Trimming keeps a focused beat legible at size. */
  show?: ("task" | "meters" | "logs")[];
};

const DEFAULT_ERRORS = [
  { code: "E1", label: "Navigation error" },
  { code: "E2", label: "Wrong study selected" },
  { code: "E3", label: "Upload / ingestion" },
  { code: "E4", label: "Could not interpret" },
];

const formatTimer = (seconds: number) => {
  const clamped = Math.max(0, seconds);
  const mm = Math.floor(clamped / 60);
  const ss = Math.floor(clamped % 60);
  const tenths = Math.floor((clamped * 10) % 10);
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${tenths}`;
};

const Glow: React.FC<{ on: boolean }> = ({ on }) =>
  on ? (
    <div
      style={{
        position: "absolute",
        inset: -5,
        borderRadius: theme.radius.lg + 5,
        border: `3px solid ${theme.color.primary}`,
        boxShadow: theme.shadow.glow,
        pointerEvents: "none",
      }}
    />
  ) : null;

const Panel: React.FC<{
  title: string;
  children: React.ReactNode;
  delay: number;
  highlighted: boolean;
  style?: React.CSSProperties;
  name: string;
}> = ({ title, children, delay, highlighted, style, name }) => (
  <Card
    name={name}
    delay={delay}
    style={{ padding: 30, position: "relative", ...style }}
  >
    <div
      style={{
        fontSize: theme.size.tiny,
        fontWeight: 700,
        color: theme.color.ink,
        marginBottom: 18,
      }}
    >
      {title}
    </div>
    {children}
    <Glow on={highlighted} />
  </Card>
);

/**
 * The evaluator cockpit, rebuilt so it can actually run: the timer ticks, the
 * action counter moves, errors and hesitations land and can be undone.
 */
export const Cockpit: React.FC<CockpitProps> = ({
  taskIndex = 2,
  taskCount = 6,
  taskTitle = "Upload and ingest a cloud study",
  taskBody = "On Study Setup, open the Cloud Studies tab, upload a study ZIP, and wait for ingestion to finish.",
  optimalSeconds = 60,
  optimalActions = 4,
  errorTypes = DEFAULT_ERRORS,
  timerStart,
  timerRate = 1,
  actionsAt = [],
  errorsAt = [],
  hesitationsAt = [],
  undoAt,
  highlight = null,
  delay = 0,
  width = 1180,
  show = ["task", "meters", "logs"],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const elapsed =
    timerStart === undefined ? 0 : ((frame - timerStart) / fps) * timerRate;
  const running = timerStart !== undefined && frame >= timerStart;

  const actions = actionsAt.filter((f) => frame >= f).length;
  const loggedErrors = errorsAt.filter((e) => frame >= e.frame);
  const undone = undoAt !== undefined && frame >= undoAt ? 1 : 0;
  const errors = loggedErrors.slice(0, Math.max(0, loggedErrors.length - undone));
  const hesitations = hesitationsAt.filter((f) => frame >= f).length;

  const fromOptimal = actions - optimalActions;
  const scale = width / 1180;

  return (
    <div
      style={{
        width,
        display: "flex",
        flexDirection: "column",
        gap: 22 * scale,
        fontSize: 16 * scale,
      }}
    >
      {show.includes("task") ? (
      <Card
        name="Task card"
        delay={delay}
        style={{ padding: 34 * scale, position: "relative" }}
      >
        <div
          style={{
            fontSize: 26 * scale,
            fontWeight: 700,
            color: theme.color.ink,
            marginBottom: 14 * scale,
          }}
        >
          Task {taskIndex} of {taskCount}
        </div>
        <div
          style={{
            fontSize: 40 * scale,
            fontWeight: 700,
            letterSpacing: -0.8 * scale,
            marginBottom: 12 * scale,
          }}
        >
          {taskTitle}
        </div>
        <div
          style={{
            fontSize: 24 * scale,
            lineHeight: 1.45,
            color: theme.color.inkMuted,
            marginBottom: 16 * scale,
          }}
        >
          {taskBody}
        </div>
        <div
          style={{
            fontSize: 23 * scale,
            fontWeight: 600,
            color: theme.color.inkMuted,
            marginBottom: 18 * scale,
          }}
        >
          Optimal: {optimalSeconds}s&nbsp;&nbsp;Actions: {optimalActions}
        </div>
        <div
          style={{
            height: 9 * scale,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.color.primarySoft,
            overflow: "hidden",
            marginBottom: 24 * scale,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(taskIndex / taskCount) * 100}%`,
              backgroundColor: theme.color.primary,
              borderRadius: theme.radius.pill,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 16 * scale, position: "relative" }}>
          {[
            { label: "Success", bg: theme.color.success },
            { label: "Partial", bg: theme.color.warning },
            { label: "Failure", bg: theme.color.danger },
            { label: "Skip", bg: theme.color.card },
          ].map((b) => (
            <div
              key={b.label}
              style={{
                flex: 1,
                height: 62 * scale,
                borderRadius: theme.radius.sm,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 25 * scale,
                fontWeight: 600,
                color: b.label === "Skip" ? theme.color.ink : theme.color.white,
                backgroundColor: b.bg,
                border:
                  b.label === "Skip" ? `1px solid ${theme.color.border}` : "none",
              }}
            >
              {b.label}
            </div>
          ))}
          <Glow on={highlight === "outcome"} />
        </div>
        <Glow on={highlight === "task"} />
      </Card>
      ) : null}

      {show.includes("meters") ? (
      <div style={{ display: "flex", gap: 22 * scale }}>
        <Panel
          name="Timer"
          title="Timer"
          delay={delay + 6}
          highlighted={highlight === "timer"}
          style={{ flex: 1, padding: 30 * scale }}
        >
          <div
            style={{
              fontFamily: theme.font.mono,
              fontSize: 86 * scale,
              fontWeight: 700,
              color: theme.color.primary,
              textAlign: "center",
              letterSpacing: -2 * scale,
            }}
          >
            {formatTimer(elapsed)}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 14 * scale,
            }}
          >
            <div
              style={{
                width: 60 * scale,
                height: 46 * scale,
                borderRadius: theme.radius.sm,
                backgroundColor: running
                  ? theme.color.primary
                  : theme.color.primarySoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: running ? theme.color.white : theme.color.primary,
                fontSize: 22 * scale,
                fontWeight: 700,
              }}
            >
              {running ? "❚❚" : "▶"}
            </div>
          </div>
        </Panel>

        <Panel
          name="Actions"
          title="Actions"
          delay={delay + 10}
          highlighted={highlight === "actions"}
          style={{ flex: 1, padding: 30 * scale }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 30 * scale,
            }}
          >
            <Stepper label="−" scale={scale} />
            <div
              key={actions}
              style={{
                fontFamily: theme.font.mono,
                fontSize: 64 * scale,
                fontWeight: 700,
                color: theme.color.primary,
                minWidth: 70 * scale,
                textAlign: "center",
                scale: interpolate(
                  frame - (actionsAt[actions - 1] ?? -999),
                  [0, 7],
                  [1.35, 1],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: ease,
                  },
                ),
              }}
            >
              {actions}
            </div>
            <Stepper label="+" scale={scale} />
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: 12 * scale,
              fontSize: 23 * scale,
              fontWeight: 600,
              color:
                fromOptimal > 0 ? theme.color.warning : theme.color.inkMuted,
            }}
          >
            {fromOptimal >= 0 ? "+" : ""}
            {fromOptimal} from optimal
          </div>
        </Panel>
      </div>
      ) : null}

      {show.includes("logs") ? (
      <div style={{ display: "flex", gap: 22 * scale }}>
        <Panel
          name="Errors"
          title="Errors"
          delay={delay + 14}
          highlighted={highlight === "errors"}
          style={{ flex: 1, padding: 30 * scale }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 14 * scale,
            }}
          >
            {errorTypes.map((e) => {
              const sameCode = errors.filter((x) => x.code === e.code);
              const hit = sameCode.length;
              const lastHit = sameCode[sameCode.length - 1];
              const flash = lastHit
                ? interpolate(frame - lastHit.frame, [0, 12], [1, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })
                : 0;
              return (
                <div
                  key={e.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12 * scale,
                    padding: `${16 * scale}px ${16 * scale}px`,
                    borderRadius: theme.radius.sm,
                    border: `1px solid ${theme.color.border}`,
                    backgroundColor:
                      flash > 0
                        ? `rgba(239, 68, 68, ${0.16 * flash})`
                        : theme.color.card,
                    fontSize: 22 * scale,
                    fontWeight: 500,
                    color: theme.color.ink,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontFamily: theme.font.mono,
                      color: theme.color.inkMuted,
                    }}
                  >
                    {e.code}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {e.label}
                  </span>
                  {hit > 0 ? (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontWeight: 700,
                        color: theme.color.danger,
                        fontFamily: theme.font.mono,
                      }}
                    >
                      {hit}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          name="Hesitations"
          title="Hesitations"
          delay={delay + 18}
          highlighted={highlight === "hesitation"}
          style={{ flex: 1, padding: 30 * scale }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18 * scale,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 62 * scale,
                borderRadius: theme.radius.sm,
                border: `1px solid ${theme.color.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24 * scale,
                fontWeight: 600,
                color: theme.color.ink,
              }}
            >
              Log Hesitation
            </div>
            <div
              style={{
                width: 62 * scale,
                height: 62 * scale,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.color.primarySoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: theme.font.mono,
                fontSize: 30 * scale,
                fontWeight: 700,
                color: theme.color.primaryInk,
              }}
            >
              {hesitations}
            </div>
          </div>

          <div
            style={{
              marginTop: 18 * scale,
              display: "flex",
              flexDirection: "column",
              gap: 10 * scale,
            }}
          >
            {hesitationsAt
              .filter((f) => frame >= f)
              .map((f) => (
                <div
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12 * scale,
                    fontSize: 21 * scale,
                    color: theme.color.inkMuted,
                    opacity: interpolate(frame - f, [0, 10], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: ease,
                    }),
                  }}
                >
                  <span
                    style={{
                      width: 9 * scale,
                      height: 9 * scale,
                      borderRadius: "50%",
                      backgroundColor: theme.color.accent,
                    }}
                  />
                  <span style={{ fontFamily: theme.font.mono, fontWeight: 600 }}>
                    {formatTimer(
                      timerStart === undefined
                        ? 0
                        : ((f - timerStart) / fps) * timerRate,
                    )}
                  </span>
                  <span>hesitation logged</span>
                </div>
              ))}
          </div>
        </Panel>
      </div>
      ) : null}
    </div>
  );
};

const Stepper: React.FC<{ label: string; scale: number }> = ({
  label,
  scale,
}) => (
  <div
    style={{
      width: 62 * scale,
      height: 62 * scale,
      borderRadius: theme.radius.sm,
      border: `1px solid ${theme.color.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 30 * scale,
      color: theme.color.inkMuted,
    }}
  >
    {label}
  </div>
);
