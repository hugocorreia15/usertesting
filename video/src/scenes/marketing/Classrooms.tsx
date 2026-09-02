import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Frame } from "../../components/Frame";
import { Eyebrow, Headline, SubCaption } from "../../components/Caption";
import { OrgDiagram } from "../../components/ui/OrgDiagram";
import { EASE_OUT, theme } from "../../theme";
import { copy } from "../../copy/en";

const ease = Easing.bezier(...EASE_OUT);

const ROLE_COLORS = [
  theme.color.primary,
  theme.color.violet,
  theme.color.accent,
];

/** The classroom story: one organization, sub-teams, scoped student access. */
export const Classrooms: React.FC = () => {
  const frame = useCurrentFrame();
  const c = copy.marketing.classrooms;

  return (
    <Frame name="Classrooms" seed="classrooms">
      <div
        style={{
          position: "absolute",
          left: theme.safe.x,
          top: 0,
          bottom: 0,
          width: 590,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <Eyebrow text="Teams and classrooms" delay={4} />
        <Headline text={c.title} delay={8} size={theme.size.h2} maxWidth={570} />
        <SubCaption
          text={c.sub}
          delay={26}
          size={theme.size.small}
          maxWidth={560}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            marginTop: 26,
          }}
        >
          {c.roles.map((r, i) => {
            const start = 62 + i * 16;
            return (
              <div
                key={r.role}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 14,
                  fontSize: theme.size.tiny,
                  opacity: interpolate(frame, [start, start + 18], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: ease,
                  }),
                  translate: `${interpolate(frame, [start, start + 28], [20, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: ease,
                  })}px 0px`,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    backgroundColor: ROLE_COLORS[i],
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontWeight: 800, color: theme.color.ink }}>
                  {r.role}
                </span>
                <span style={{ fontWeight: 500, color: theme.color.inkMuted }}>
                  {r.note}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 90,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <OrgDiagram delay={14} width={900} />
      </div>
    </Frame>
  );
};
