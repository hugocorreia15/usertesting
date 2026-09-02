import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Frame } from "../../components/Frame";
import { Headline, SubCaption } from "../../components/Caption";
import { LogoLockup } from "../../components/Logo";
import { EASE_OUT, theme } from "../../theme";
import { TUTORIAL_CHAPTERS } from "../../timeline";
import { copy } from "../../copy/en";

const ease = Easing.bezier(...EASE_OUT);

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const c = copy.tutorial.intro;

  return (
    <Frame name="Tutorial intro" seed="tutorial-intro">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
        }}
      >
        <LogoLockup size={104} delay={0} />

        <Headline
          text={c.title}
          delay={22}
          size={theme.size.h1}
          align="center"
          gradient
        />

        <SubCaption
          text={c.sub}
          delay={44}
          size={theme.size.h3}
          align="center"
          maxWidth={1200}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 120,
            rowGap: 22,
            marginTop: 46,
          }}
        >
          {TUTORIAL_CHAPTERS.map((chapter, i) => {
            const start = 84 + i * 13;
            return (
              <div
                key={chapter.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  fontSize: 34,
                  fontWeight: 600,
                  width: 480,
                  opacity: interpolate(frame, [start, start + 20], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: ease,
                  }),
                  translate: `${interpolate(frame, [start, start + 30], [24, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: ease,
                  })}px 0px`,
                }}
              >
                <span
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    backgroundColor: theme.color.primarySoft,
                    color: theme.color.primaryInk,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 700,
                    fontFamily: theme.font.mono,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                {chapter.label}
              </div>
            );
          })}
        </div>
      </div>
    </Frame>
  );
};
