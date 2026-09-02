import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../../theme";

const ease = Easing.bezier(...EASE_OUT);

export type TimelineEvent = {
  /** Offset into the task, in seconds. */
  at: number;
  kind: "error" | "hesitation";
  label?: string;
};

/**
 * The per-task strip from session results: errors and hesitations plotted at
 * their real offsets within the task.
 */
export const EventTimeline: React.FC<{
  taskLabel?: string;
  durationSeconds?: number;
  events?: TimelineEvent[];
  width?: number;
  delay?: number;
}> = ({
  taskLabel = "Task 2 · Upload and ingest a cloud study",
  durationSeconds = 96,
  events = [
    { at: 12, kind: "hesitation" },
    { at: 31, kind: "error" },
    { at: 48, kind: "hesitation" },
    { at: 63, kind: "error" },
    { at: 79, kind: "hesitation" },
  ],
  width = 980,
  delay = 0,
}) => {
  const frame = useCurrentFrame();

  const draw = interpolate(frame, [delay, delay + 46], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const railH = 16;

  return (
    <div style={{ width }}>
      <div
        style={{
          fontSize: theme.size.tiny,
          fontWeight: 700,
          color: theme.color.ink,
          marginBottom: 20,
          opacity: interpolate(frame, [delay, delay + 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          }),
        }}
      >
        {taskLabel}
      </div>

      <div style={{ position: "relative", height: 96 }}>
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 0,
            width,
            height: railH,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.color.primarySoft,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 0,
            width: width * draw,
            height: railH,
            borderRadius: theme.radius.pill,
            backgroundImage: theme.gradient,
          }}
        />

        {events.map((e, i) => {
          const x = (e.at / durationSeconds) * width;
          const appear = delay + 10 + (e.at / durationSeconds) * 46;
          const isError = e.kind === "error";
          const color = isError ? theme.color.danger : theme.color.accent;
          const pop = interpolate(frame, [appear, appear + 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          });

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: isError ? 4 : 68,
                translate: "-50% 0px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: pop,
                scale: interpolate(frame, [appear, appear + 18], [0.4, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: ease,
                }),
              }}
            >
              {isError ? (
                <>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      backgroundColor: color,
                      rotate: "45deg",
                    }}
                  />
                  <div
                    style={{
                      width: 3,
                      height: 18,
                      backgroundColor: color,
                      opacity: 0.5,
                    }}
                  />
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: 3,
                      height: 18,
                      backgroundColor: color,
                      opacity: 0.5,
                    }}
                  />
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      backgroundColor: color,
                    }}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: theme.size.micro,
          fontFamily: theme.font.mono,
          color: theme.color.inkSoft,
          marginTop: 8,
          opacity: draw,
        }}
      >
        <span>0:00</span>
        <span>
          {Math.floor(durationSeconds / 60)}:
          {String(durationSeconds % 60).padStart(2, "0")}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 30,
          marginTop: 26,
          fontSize: theme.size.micro,
          fontWeight: 600,
          color: theme.color.inkMuted,
          opacity: interpolate(frame, [delay + 40, delay + 60], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          }),
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              backgroundColor: theme.color.danger,
              rotate: "45deg",
            }}
          />
          Error
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: theme.color.accent,
            }}
          />
          Hesitation
        </span>
      </div>
    </div>
  );
};
