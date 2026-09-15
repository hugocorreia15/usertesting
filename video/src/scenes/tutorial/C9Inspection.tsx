import React from "react";
import { Chapter } from "../../components/Chapter";
import {
  InspectionStats,
  MergeDiagram,
  SynthesisCard,
} from "../../components/ui/InspectionBits";
import { TUTORIAL } from "../../timeline";
import { copy } from "../../copy/en";

const c = copy.tutorial.chapters.inspection;

export const C9Inspection: React.FC = () => (
  <Chapter
    n={c.n}
    title={c.title}
    lead={c.lead}
    total={TUTORIAL.inspection}
    beats={[
      {
        heading: c.beats[0].heading,
        body: c.beats[0].body,
        visual: <InspectionStats delay={8} />,
      },
      {
        heading: c.beats[1].heading,
        body: c.beats[1].body,
        visual: <MergeDiagram delay={8} />,
      },
      {
        heading: c.beats[2].heading,
        body: c.beats[2].body,
        visual: <SynthesisCard delay={8} />,
      },
    ]}
  />
);
