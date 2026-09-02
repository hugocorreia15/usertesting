import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Frame } from "../../components/Frame";
import { Eyebrow, Headline, SubCaption } from "../../components/Caption";
import { Keycap } from "../../components/Keycap";
import { Cockpit } from "../../components/ui/Cockpit";
import { EASE_OUT, theme } from "../../theme";
import { copy } from "../../copy/en";

const ease = Easing.bezier(...EASE_OUT);

const PRESSES = [
  { label: "A", pressAt: 96, caption: "action" },
  { label: "A", pressAt: 132, caption: "action" },
  { label: "2", pressAt: 200, caption: "error E2" },
  { label: "H", pressAt: 280, caption: "hesitation" },
  { label: "Z", pressAt: 372, caption: "undo" },
];

/** The hero: the cockpit actually running under keyboard shortcuts. */
export const CockpitScene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = copy.marketing.cockpit;

  return (
    <Frame name="Cockpit scene" seed="cockpit">
      <div
        style={{
          position: "absolute",
          left: theme.safe.x,
          top: 150,
          width: 620,
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        <Eyebrow text="Live session" delay={4} />
        <Headline text={c.title} delay={8} size={theme.size.h2} maxWidth={620} />
        <SubCaption text={c.sub} delay={26} size={theme.size.small} maxWidth={600} />

        <div style={{ display: "flex", gap: 20, marginTop: 34 }}>
          {PRESSES.map((p, i) => (
            <Keycap
              key={`${p.label}-${i}`}
              label={p.label}
              pressAt={p.pressAt}
              caption={p.caption}
              appearAt={60 + i * 8}
              size={84}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 110,
          top: "50%",
          translate: `0px ${
            -50
          }%`,
          scale: interpolate(frame, [0, 46], [0.94, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          }),
        }}
      >
        <Cockpit
          width={900}
          delay={0}
          timerStart={70}
          timerRate={4.6}
          actionsAt={[96, 132, 168, 210, 244, 300, 340]}
          errorsAt={[{ frame: 200, code: "E2" }]}
          hesitationsAt={[280]}
          undoAt={undefined}
          highlight={
            frame > 360
              ? "outcome"
              : frame > 270
                ? "hesitation"
                : frame > 190
                  ? "errors"
                  : frame > 90
                    ? "actions"
                    : "timer"
          }
        />
      </div>
    </Frame>
  );
};
