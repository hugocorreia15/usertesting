import React from "react";
import { Chapter } from "../../components/Chapter";
import { Screenshot } from "../../components/Screenshot";
import { InviteCard } from "../../components/ui/SessionBits";
import { TaskOrderDiagram } from "../../components/ui/TaskOrderDiagram";
import { TUTORIAL } from "../../timeline";
import { copy } from "../../copy/en";

const c = copy.tutorial.chapters.sessions;

export const C2Sessions: React.FC = () => (
  <Chapter
    n={c.n}
    title={c.title}
    lead={c.lead}
    total={TUTORIAL.sessions}
    beats={[
      {
        heading: c.beats[0].heading,
        body: c.beats[0].body,
        visual: (
          <Screenshot
            file="05-session-new.png"
            width={990}
            delay={8}
            from={{ x: 0.15, y: 0.14, w: 0.85 }}
            to={{ x: 0.17, y: 0.2, w: 0.8 }}
            duration={280}
            url="avalux.pt/sessions/new"
            annotations={[
              {
                x: 0.188,
                y: 0.257,
                w: 0.341,
                h: 0.05,
                label: "Pick the template",
                delay: 40,
                fadeOutAt: 130,
              },
              {
                x: 0.188,
                y: 0.36,
                w: 0.775,
                h: 0.2,
                label: "Choose which tasks run",
                delay: 140,
              },
            ]}
          />
        ),
      },
      {
        heading: c.beats[1].heading,
        body: c.beats[1].body,
        visual: <InviteCard delay={8} />,
      },
      {
        heading: c.beats[2].heading,
        body: c.beats[2].body,
        visual: <TaskOrderDiagram delay={8} width={940} />,
      },
    ]}
  />
);
