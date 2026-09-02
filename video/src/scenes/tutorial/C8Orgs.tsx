import React from "react";
import { Chapter } from "../../components/Chapter";
import { OrgDiagram } from "../../components/ui/OrgDiagram";
import { ObserverCard, RoleCards } from "../../components/ui/AnalysisBits";
import { TUTORIAL } from "../../timeline";
import { copy } from "../../copy/en";

const c = copy.tutorial.chapters.orgs;

export const C8Orgs: React.FC = () => (
  <Chapter
    n={c.n}
    title={c.title}
    lead={c.lead}
    total={TUTORIAL.orgs}
    beats={[
      {
        heading: c.beats[0].heading,
        body: c.beats[0].body,
        visual: <RoleCards delay={8} />,
      },
      {
        heading: c.beats[1].heading,
        body: c.beats[1].body,
        visual: <OrgDiagram delay={8} width={980} />,
      },
      {
        heading: c.beats[2].heading,
        body: c.beats[2].body,
        visual: <ObserverCard delay={8} />,
      },
    ]}
  />
);
