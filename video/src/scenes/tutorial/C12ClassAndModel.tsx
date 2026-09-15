import React from "react";
import { Chapter } from "../../components/Chapter";
import { ClassTable, SuggestionCard } from "../../components/ui/TeachingBits";
import { MergeDiagram } from "../../components/ui/InspectionBits";
import { TUTORIAL } from "../../timeline";
import { copy } from "../../copy/en";

const c = copy.tutorial.chapters.classAndModel;

export const C12ClassAndModel: React.FC = () => (
  <Chapter
    n={c.n}
    title={c.title}
    lead={c.lead}
    total={TUTORIAL.classAndModel}
    beats={[
      {
        heading: c.beats[0].heading,
        body: c.beats[0].body,
        visual: <ClassTable delay={8} />,
      },
      {
        heading: c.beats[1].heading,
        body: c.beats[1].body,
        visual: <MergeDiagram delay={8} width={900} />,
      },
      {
        heading: c.beats[2].heading,
        body: c.beats[2].body,
        visual: <SuggestionCard delay={8} />,
      },
    ]}
  />
);
