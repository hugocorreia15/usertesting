import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Frame } from "../../components/Frame";
import { SubCaption } from "../../components/Caption";
import { LogoLockup } from "../../components/Logo";
import { EASE_OUT, theme } from "../../theme";
import { copy } from "../../copy/en";

const ease = Easing.bezier(...EASE_OUT);

export const Close: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Frame name="Close" seed="close">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}
      >
        <LogoLockup size={160} delay={0} />

        <div
          style={{
            width: interpolate(frame, [22, 62], [0, 460], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ease,
            }),
            height: 7,
            borderRadius: theme.radius.pill,
            backgroundImage: theme.gradient,
          }}
        />

        <div
          style={{
            fontSize: theme.size.h3,
            fontWeight: 700,
            color: theme.color.ink,
            opacity: interpolate(frame, [40, 66], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ease,
            }),
          }}
        >
          {copy.brand.domain}
        </div>

        <SubCaption
          text={copy.brand.closing}
          delay={62}
          size={theme.size.small}
          align="center"
          maxWidth={900}
        />
      </div>
    </Frame>
  );
};
