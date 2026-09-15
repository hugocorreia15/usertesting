import React from "react";
import { Chapter } from "../../components/Chapter";
import { ObserverCard } from "../../components/ui/AnalysisBits";
import { AgreementCard } from "../../components/ui/AgreementCard";
import { ReflectionCard } from "../../components/ui/TeachingBits";
import { TUTORIAL } from "../../timeline";
import { copy } from "../../copy/en";

const c = copy.tutorial.chapters.observing;

export const C11Observing: React.FC = () => (
  <Chapter
    n={c.n}
    title={c.title}
    lead={c.lead}
    total={TUTORIAL.observing}
    beats={[
      {
        heading: c.beats[0].heading,
        body: c.beats[0].body,
        visual: <ObserverCard delay={8} />,
      },
      {
        heading: c.beats[1].heading,
        body: c.beats[1].body,
        visual: <AgreementCard delay={8} />,
      },
      {
        heading: c.beats[2].heading,
        body: c.beats[2].body,
        visual: <ReflectionCard delay={8} />,
      },
    ]}
  />
);
