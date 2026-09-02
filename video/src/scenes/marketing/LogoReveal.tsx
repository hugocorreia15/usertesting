import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Frame } from "../../components/Frame";
import { SubCaption } from "../../components/Caption";
import { LogoLockup } from "../../components/Logo";
import {
  Questionnaire,
  Spreadsheet,
  Stopwatch,
} from "../../components/ui/LegacyTools";
import { EASE_OUT, theme } from "../../theme";
import { copy } from "../../copy/en";

const ease = Easing.bezier(...EASE_OUT);

const TOOLS = [
  { Comp: Stopwatch, x: 280 },
  { Comp: Spreadsheet, x: 960 },
  { Comp: Questionnaire, x: 1640 },
];

/** The three tools collapse into one mark. */
export const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();

  const converge = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.5, 0, 0.2, 1),
  });

  return (
    <Frame name="Logo reveal" seed="logo">
      {TOOLS.map((tool, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: tool.x + (960 - tool.x) * converge,
            top: 430 + (500 - 430) * converge,
            translate: "-50% -50%",
            opacity: interpolate(converge, [0.55, 1], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(converge, [0, 1], [1, 0.18], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <tool.Comp size={220} />
        </div>
      ))}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
        }}
      >
        <div
          style={{
            scale: interpolate(frame, [34, 72], [0.82, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ease,
            }),
          }}
        >
          <LogoLockup size={168} delay={34} />
        </div>

        <SubCaption
          text={copy.brand.tagline}
          delay={74}
          size={theme.size.h3}
          align="center"
          maxWidth={1400}
          color={theme.color.inkMuted}
        />
      </div>
    </Frame>
  );
};
