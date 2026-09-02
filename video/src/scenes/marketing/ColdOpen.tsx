import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Frame } from "../../components/Frame";
import { SubCaption } from "../../components/Caption";
import {
  Questionnaire,
  Spreadsheet,
  Stopwatch,
} from "../../components/ui/LegacyTools";
import { EASE_OUT, theme } from "../../theme";
import { copy } from "../../copy/en";

const ease = Easing.bezier(...EASE_OUT);

const TOOLS = [
  { Comp: Stopwatch, x: 470, label: "Timing" },
  { Comp: Spreadsheet, x: 960, label: "Logging" },
  { Comp: Questionnaire, x: 1450, label: "Questionnaires" },
];

const DRIFT = [-190, 0, 190];

/** The problem: three tools that never talk to each other. */
export const ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const c = copy.marketing.coldOpen;

  const separation = interpolate(frame, [150, 290], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  return (
    <Frame name="Cold open" seed="cold">
      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", inset: 0 }}
      >
        {[0, 1].map((i) => {
          const x1 = TOOLS[i].x + DRIFT[i] * separation + 110;
          const x2 = TOOLS[i + 1].x + DRIFT[i + 1] * separation - 110;
          return (
            <line
              key={i}
              x1={x1}
              y1={455}
              x2={x2}
              y2={455}
              stroke={theme.color.inkSoft}
              strokeWidth={3}
              strokeDasharray="12 14"
              opacity={
                interpolate(frame, [70, 100], [0, 0.5], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }) *
                (1 - separation * 0.95)
              }
            />
          );
        })}
      </svg>

      {TOOLS.map((tool, i) => {
        const enter = 10 + i * 16;
        const float = Math.sin((frame + i * 40) / 34) * 10;
        return (
          <div
            key={tool.label}
            style={{
              position: "absolute",
              left: tool.x + DRIFT[i] * separation,
              top: 316 + float,
              translate: "-50% 0px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
              opacity: interpolate(frame, [enter, enter + 22], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ease,
              }),
              scale: interpolate(frame, [enter, enter + 34], [0.55, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ease,
              }),
              rotate: `${DRIFT[i] * separation * 0.02}deg`,
            }}
          >
            <tool.Comp size={262} />
            <div
              style={{
                fontSize: theme.size.small,
                fontWeight: 700,
                color: theme.color.inkMuted,
              }}
            >
              {tool.label}
            </div>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 726,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <SubCaption
          text={c.first}
          delay={34}
          fadeOutAt={132}
          size={theme.size.h3}
          align="center"
          maxWidth={1400}
          color={theme.color.ink}
          name="Cold open line 1"
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 726,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <SubCaption
          text={c.second}
          delay={168}
          size={theme.size.h3}
          align="center"
          maxWidth={1400}
          color={theme.color.ink}
          name="Cold open line 2"
        />
      </div>
    </Frame>
  );
};
