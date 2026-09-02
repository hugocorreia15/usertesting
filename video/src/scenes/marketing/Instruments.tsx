import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Frame } from "../../components/Frame";
import { Eyebrow, Headline, SubCaption } from "../../components/Caption";
import { SusGauge } from "../../components/ui/SusGauge";
import { Card } from "../../components/Card";
import { EASE_OUT, theme } from "../../theme";
import { copy } from "../../copy/en";

const ease = Easing.bezier(...EASE_OUT);

const INSTRUMENTS = [
  {
    name: "SUS",
    full: "System Usability Scale",
    note: "10 items · 0 to 100 · 95% CI",
  },
  {
    name: "NASA-TLX",
    full: "Task Load Index",
    note: "6 subscales · perceived workload",
  },
  {
    name: "UEQ-S",
    full: "User Experience Questionnaire",
    note: "8 pairs · pragmatic and hedonic",
  },
];

/** Instruments, scored automatically, with their uncertainty shown. */
export const Instruments: React.FC = () => {
  const frame = useCurrentFrame();
  const c = copy.marketing.instruments;

  return (
    <Frame name="Instruments" seed="instruments">
      <div
        style={{
          position: "absolute",
          left: theme.safe.x,
          top: 130,
          width: 1000,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <Eyebrow text="Measurement" delay={4} />
        <Headline text={c.title} delay={8} size={theme.size.h2} maxWidth={980} />
        <SubCaption
          text={c.sub}
          delay={26}
          size={theme.size.small}
          maxWidth={900}
        />
      </div>

      <div style={{ position: "absolute", left: 215, top: 435 }}>
        <SusGauge score={78.4} ci={6.2} size={690} delay={40} />
      </div>

      <div
        style={{
          position: "absolute",
          right: 130,
          top: 460,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          width: 660,
        }}
      >
        {INSTRUMENTS.map((inst, i) => (
          <Card
            key={inst.name}
            delay={70 + i * 14}
            name={inst.name}
            style={{ padding: 30, display: "flex", alignItems: "center", gap: 26 }}
          >
            <div
              style={{
                width: 150,
                fontSize: 30,
                fontWeight: 800,
                color: theme.color.primary,
                fontFamily: theme.font.mono,
                opacity: interpolate(
                  frame,
                  [70 + i * 14, 90 + i * 14],
                  [0, 1],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: ease,
                  },
                ),
              }}
            >
              {inst.name}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 27, fontWeight: 700 }}>{inst.full}</div>
              <div
                style={{
                  fontSize: 21,
                  fontWeight: 500,
                  color: theme.color.inkMuted,
                  marginTop: 6,
                }}
              >
                {inst.note}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Frame>
  );
};
