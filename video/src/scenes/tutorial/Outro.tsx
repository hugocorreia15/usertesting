import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Frame } from "../../components/Frame";
import { Headline, SubCaption } from "../../components/Caption";
import { LogoLockup } from "../../components/Logo";
import { EASE_OUT, theme } from "../../theme";
import { copy } from "../../copy/en";

const ease = Easing.bezier(...EASE_OUT);

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const c = copy.tutorial.outro;

  return (
    <Frame name="Tutorial outro" seed="tutorial-outro">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 34,
        }}
      >
        <Headline
          text={c.title}
          delay={6}
          size={theme.size.h2}
          align="center"
          maxWidth={1500}
        />
        <SubCaption
          text={c.sub}
          delay={28}
          size={theme.size.h3}
          align="center"
          maxWidth={1300}
        />

        <div
          style={{
            width: interpolate(frame, [60, 100], [0, 420], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ease,
            }),
            height: 7,
            borderRadius: theme.radius.pill,
            backgroundImage: theme.gradient,
            marginTop: 18,
          }}
        />

        <div style={{ marginTop: 18 }}>
          <LogoLockup size={110} delay={86} />
        </div>

        <div
          style={{
            fontSize: theme.size.h3,
            fontWeight: 700,
            color: theme.color.primary,
            opacity: interpolate(frame, [120, 148], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ease,
            }),
          }}
        >
          {copy.brand.domain}
        </div>
      </div>
    </Frame>
  );
};
