import React from "react";
import { Frame } from "../../components/Frame";
import { Eyebrow, Headline, SubCaption } from "../../components/Caption";
import { PhoneFrame } from "../../components/PhoneFrame";
import { Screenshot } from "../../components/Screenshot";
import { SyncLink } from "../../components/ui/SyncLink";
import { theme } from "../../theme";
import { copy } from "../../copy/en";

/** The participant's device, in step with the evaluator's. */
export const Participant: React.FC = () => {
  const c = copy.marketing.participant;

  return (
    <Frame name="Participant" seed="participant">
      <div
        style={{
          position: "absolute",
          left: theme.safe.x,
          top: 130,
          width: 900,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <Eyebrow text="Participant client" delay={4} />
        <Headline text={c.title} delay={8} size={theme.size.h2} maxWidth={860} />
        <SubCaption
          text={c.sub}
          delay={26}
          size={theme.size.small}
          maxWidth={800}
        />
      </div>

      <div style={{ position: "absolute", left: theme.safe.x, top: 470 }}>
        <Screenshot
          file="08-live-evaluator.png"
          width={700}
          delay={22}
          from={{ x: 0.235, y: 0.07, w: 0.65 }}
          to={{ x: 0.25, y: 0.11, w: 0.6 }}
          duration={280}
          url="avalux.pt/sessions/live"
          name="Evaluator"
        />
        <div
          style={{
            marginTop: 22,
            fontSize: theme.size.micro,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: theme.color.inkMuted,
          }}
        >
          Evaluator
        </div>
      </div>

      <div style={{ position: "absolute", left: 900, top: 560 }}>
        <SyncLink width={340} height={220} delay={48} label="realtime" />
      </div>

      <div style={{ position: "absolute", right: 210, top: 330 }}>
        <PhoneFrame file="15-participant-questions-mobile.png" height={580} delay={38} />
        <div
          style={{
            marginTop: 22,
            textAlign: "center",
            fontSize: theme.size.micro,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: theme.color.inkMuted,
          }}
        >
          Participant
        </div>
      </div>
    </Frame>
  );
};
