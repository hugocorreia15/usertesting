import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
} from "remotion";
import { EASE_OUT, theme } from "../theme";
import { Frame } from "./Frame";
import { Eyebrow, Headline, SubCaption } from "./Caption";

const ease = Easing.bezier(...EASE_OUT);

export type BeatSpec = {
  heading: string;
  body: string;
  visual: React.ReactNode;
};

/** The card that opens each chapter. */
const ChapterIntro: React.FC<{
  n: number;
  title: string;
  lead: string;
  duration: number;
}> = ({ n, title, lead, duration }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: interpolate(
          frame,
          [0, 12, duration - 16, duration],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
        ),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 40,
          marginBottom: 34,
        }}
      >
        <div
          style={{
            width: 118,
            height: 118,
            borderRadius: theme.radius.xl,
            backgroundImage: theme.gradient,
            color: theme.color.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 62,
            fontWeight: 800,
            fontFamily: theme.font.mono,
            scale: interpolate(frame, [0, 26], [0.7, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ease,
            }),
          }}
        >
          {n}
        </div>
        <Headline text={title} delay={6} size={theme.size.h1} />
      </div>
      <SubCaption
        text={lead}
        delay={22}
        size={theme.size.h3}
        align="center"
        maxWidth={1300}
      />
    </AbsoluteFill>
  );
};

/** One beat: the point on the left, the evidence on the right. */
const Beat: React.FC<{
  spec: BeatSpec;
  chapterLabel: string;
  index: number;
  count: number;
  duration: number;
}> = ({ spec, chapterLabel, index, count, duration }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, 14, duration - 14, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
  );

  return (
    <AbsoluteFill style={{ opacity }}>
      <div
        style={{
          position: "absolute",
          left: theme.safe.x,
          top: 0,
          bottom: 170,
          width: 590,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 26,
        }}
      >
        <Eyebrow text={chapterLabel} delay={2} />
        <Headline
          text={spec.heading}
          delay={6}
          size={theme.size.h3}
          maxWidth={570}
        />
        <SubCaption
          text={spec.body}
          delay={20}
          size={theme.size.small}
          maxWidth={560}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          {new Array(count).fill(true).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === index ? 34 : 12,
                height: 12,
                borderRadius: theme.radius.pill,
                backgroundColor:
                  i === index ? theme.color.primary : theme.color.border,
              }}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 800,
          right: 90,
          top: 0,
          bottom: 170,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {spec.visual}
      </div>
    </AbsoluteFill>
  );
};

/**
 * A tutorial chapter: a title card, then evenly divided beats.
 * The visual for each beat gets its own local clock, so animations inside a
 * beat start when the beat does.
 */
export const Chapter: React.FC<{
  n: number;
  title: string;
  lead: string;
  beats: BeatSpec[];
  total: number;
  introFrames?: number;
}> = ({ n, title, lead, beats, total, introFrames = 96 }) => {
  const per = Math.floor((total - introFrames) / beats.length);

  return (
    <Frame name={`Chapter ${n}`} seed={`chapter-${n}`}>
      <Sequence durationInFrames={introFrames} name="Chapter card" layout="none">
        <ChapterIntro n={n} title={title} lead={lead} duration={introFrames} />
      </Sequence>

      {beats.map((beat, i) => (
        <Sequence
          key={beat.heading}
          from={introFrames + i * per}
          durationInFrames={per}
          name={beat.heading}
          layout="none"
        >
          <Beat
            spec={beat}
            chapterLabel={`${n} · ${title}`}
            index={i}
            count={beats.length}
            duration={per}
          />
        </Sequence>
      ))}
    </Frame>
  );
};
