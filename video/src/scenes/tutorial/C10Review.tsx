import React from "react";
import { Chapter } from "../../components/Chapter";
import { ConsentBuilder, ReviewFlow } from "../../components/ui/TeachingBits";
import { EventTimeline } from "../../components/ui/EventTimeline";
import { TUTORIAL } from "../../timeline";
import { copy } from "../../copy/en";

const c = copy.tutorial.chapters.review;

export const C10Review: React.FC = () => (
  <Chapter
    n={c.n}
    title={c.title}
    lead={c.lead}
    total={TUTORIAL.review}
    beats={[
      {
        heading: c.beats[0].heading,
        body: c.beats[0].body,
        visual: <ReviewFlow delay={8} />,
      },
      {
        heading: c.beats[1].heading,
        body: c.beats[1].body,
        visual: <ConsentBuilder delay={8} />,
      },
      {
        heading: c.beats[2].heading,
        body: c.beats[2].body,
        visual: <EventTimeline delay={8} />,
      },
    ]}
  />
);
