import React from "react";
import { Chapter } from "../../components/Chapter";
import { Screenshot } from "../../components/Screenshot";
import { EventTimeline } from "../../components/ui/EventTimeline";
import { SusGauge } from "../../components/ui/SusGauge";
import { AgreementCard } from "../../components/ui/AgreementCard";
import { TUTORIAL } from "../../timeline";
import { copy } from "../../copy/en";

const c = copy.tutorial.chapters.results;

export const C5Results: React.FC = () => (
  <Chapter
    n={c.n}
    title={c.title}
    lead={c.lead}
    total={TUTORIAL.results}
    beats={[
      {
        heading: c.beats[0].heading,
        body: c.beats[0].body,
        visual: (
          <Screenshot
            file="06-session-detail.png"
            width={990}
            delay={8}
            from={{ x: 0.14, y: 0.05, w: 0.86 }}
            to={{ x: 0.17, y: 0.14, w: 0.78 }}
            duration={250}
            url="avalux.pt/sessions/detail"
          />
        ),
      },
      {
        heading: c.beats[1].heading,
        body: c.beats[1].body,
        visual: <EventTimeline width={960} delay={8} />,
      },
      {
        heading: c.beats[2].heading,
        body: c.beats[2].body,
        visual: <SusGauge score={78.4} ci={6.2} size={720} delay={10} />,
      },
      {
        heading: c.beats[3].heading,
        body: c.beats[3].body,
        visual: (
          <Screenshot
            file="10-analytics-time.png"
            width={990}
            delay={8}
            from={{ x: 0.14, y: 0.08, w: 0.86 }}
            to={{ x: 0.16, y: 0.16, w: 0.78 }}
            duration={250}
            url="avalux.pt/analytics"
          />
        ),
      },
      {
        heading: c.beats[4].heading,
        body: c.beats[4].body,
        visual: <AgreementCard delay={8} width={880} />,
      },
    ]}
  />
);
