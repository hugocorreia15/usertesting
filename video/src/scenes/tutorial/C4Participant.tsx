import React from "react";
import { Chapter } from "../../components/Chapter";
import { PhoneFrame } from "../../components/PhoneFrame";
import { Card, Chip } from "../../components/Card";
import { theme } from "../../theme";
import { TUTORIAL } from "../../timeline";
import { copy } from "../../copy/en";

const c = copy.tutorial.chapters.participant;

const WithLangToggle: React.FC<{ file: string }> = ({ file }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
    <PhoneFrame file={file} height={700} delay={8} />
    <Card delay={34} name="Language" style={{ padding: 32, width: 250 }}>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: theme.color.inkMuted,
          marginBottom: 20,
        }}
      >
        Language
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Chip delay={46} size={26}>
          English
        </Chip>
        <Chip
          delay={58}
          size={26}
          background={theme.color.accentSoft}
          color="#0f766e"
        >
          Português
        </Chip>
      </div>
    </Card>
  </div>
);

export const C4Participant: React.FC = () => (
  <Chapter
    n={c.n}
    title={c.title}
    lead={c.lead}
    total={TUTORIAL.participant}
    beats={[
      {
        heading: c.beats[0].heading,
        body: c.beats[0].body,
        visual: <WithLangToggle file="14-join-mobile.png" />,
      },
      {
        heading: c.beats[1].heading,
        body: c.beats[1].body,
        visual: <PhoneFrame file="15-participant-questions-mobile.png" height={720} delay={8} />,
      },
      {
        heading: c.beats[2].heading,
        body: c.beats[2].body,
        visual: <PhoneFrame file="16-participant-sus-mobile.png" height={720} delay={8} />,
      },
    ]}
  />
);
