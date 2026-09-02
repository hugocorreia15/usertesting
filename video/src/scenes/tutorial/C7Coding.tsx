import React from "react";
import { Chapter } from "../../components/Chapter";
import { Screenshot } from "../../components/Screenshot";
import { CodeBook } from "../../components/ui/AnalysisBits";
import { CodeMatrix } from "../../components/ui/CodeMatrix";
import { TUTORIAL } from "../../timeline";
import { copy } from "../../copy/en";

const c = copy.tutorial.chapters.coding;

export const C7Coding: React.FC = () => (
  <Chapter
    n={c.n}
    title={c.title}
    lead={c.lead}
    total={TUTORIAL.coding}
    beats={[
      {
        heading: c.beats[0].heading,
        body: c.beats[0].body,
        visual: (
          <Screenshot
            file="12-participant-detail.png"
            width={990}
            delay={8}
            from={{ x: 0.14, y: 0.05, w: 0.86 }}
            to={{ x: 0.16, y: 0.12, w: 0.79 }}
            duration={220}
            url="avalux.pt/participants"
          />
        ),
      },
      {
        heading: c.beats[1].heading,
        body: c.beats[1].body,
        visual: <CodeBook delay={8} />,
      },
      {
        heading: c.beats[2].heading,
        body: c.beats[2].body,
        visual: <CodeMatrix delay={8} cell={84} />,
      },
    ]}
  />
);
