import React from "react";
import { Chapter } from "../../components/Chapter";
import { Screenshot } from "../../components/Screenshot";
import { ExportCards } from "../../components/ui/ExportCards";
import { ChartExportCard } from "../../components/ui/AnalysisBits";
import { TUTORIAL } from "../../timeline";
import { copy } from "../../copy/en";

const c = copy.tutorial.chapters.exports;

export const C6Exports: React.FC = () => (
  <Chapter
    n={c.n}
    title={c.title}
    lead={c.lead}
    total={TUTORIAL.exports}
    beats={[
      {
        heading: c.beats[0].heading,
        body: c.beats[0].body,
        visual: (
          <Screenshot
            file="13-export.png"
            width={990}
            delay={8}
            from={{ x: 0.14, y: 0.06, w: 0.86 }}
            to={{ x: 0.16, y: 0.13, w: 0.79 }}
            duration={220}
            url="avalux.pt/templates/detail"
          />
        ),
      },
      {
        heading: c.beats[1].heading,
        body: c.beats[1].body,
        visual: <ExportCards delay={8} cardWidth={300} />,
      },
      {
        heading: c.beats[2].heading,
        body: c.beats[2].body,
        visual: <ChartExportCard delay={8} />,
      },
    ]}
  />
);
