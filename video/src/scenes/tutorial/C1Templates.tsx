import React from "react";
import { Chapter } from "../../components/Chapter";
import { Screenshot } from "../../components/Screenshot";
import { TemplateCard } from "../../components/ui/TemplateCard";
import { QuestionTypes } from "../../components/ui/SessionBits";
import { TUTORIAL } from "../../timeline";
import { copy } from "../../copy/en";

const c = copy.tutorial.chapters.templates;

export const C1Templates: React.FC = () => (
  <Chapter
    n={c.n}
    title={c.title}
    lead={c.lead}
    total={TUTORIAL.templates}
    beats={[
      {
        heading: c.beats[0].heading,
        body: c.beats[0].body,
        visual: (
          <Screenshot
            file="03-task-editor.png"
            width={990}
            delay={8}
            from={{ x: 0.15, y: 0.16, w: 0.85 }}
            to={{ x: 0.17, y: 0.19, w: 0.8 }}
            duration={260}
            url="avalux.pt/templates/edit"
            annotations={[
              {
                x: 0.218,
                y: 0.268,
                w: 0.487,
                h: 0.052,
                label: "Task title",
                delay: 40,
                fadeOutAt: 120,
              },
              {
                x: 0.704,
                y: 0.268,
                w: 0.218,
                h: 0.052,
                label: "Optimal time and expected actions",
                delay: 130,
              },
            ]}
          />
        ),
      },
      {
        heading: c.beats[1].heading,
        body: c.beats[1].body,
        visual: (
          <TemplateCard
            width={940}
            delay={8}
            title="Household panel · v2"
            tasks={[
              {
                n: 1,
                title: "Warm-up: change the room temperature",
                optimal: "30s",
                actions: 2,
                practice: true,
              },
              {
                n: 2,
                title: "Schedule the morning heating",
                optimal: "75s",
                actions: 5,
                group: "Scheduling",
              },
              {
                n: 3,
                title: "Set an away mode until Friday",
                optimal: "60s",
                actions: 4,
                group: "Scheduling",
              },
              {
                n: 4,
                title: "Find yesterday's energy usage",
                optimal: "45s",
                actions: 3,
                group: "Reporting",
              },
            ]}
          />
        ),
      },
      {
        heading: c.beats[2].heading,
        body: c.beats[2].body,
        visual: (
          <Screenshot
            file="04-error-types-fields.png"
            width={990}
            delay={8}
            from={{ x: 0.14, y: 0.06, w: 0.86 }}
            to={{ x: 0.16, y: 0.09, w: 0.8 }}
            duration={260}
            url="avalux.pt/templates/edit"
          />
        ),
      },
      {
        heading: c.beats[3].heading,
        body: c.beats[3].body,
        visual: <QuestionTypes delay={8} />,
      },
      {
        heading: c.beats[4].heading,
        body: c.beats[4].body,
        visual: (
          <Screenshot
            file="04-error-types-fields.png"
            width={990}
            delay={8}
            from={{ x: 0.16, y: 0.4, w: 0.8 }}
            to={{ x: 0.16, y: 0.5, w: 0.78 }}
            duration={260}
            url="avalux.pt/templates/edit"
          />
        ),
      },
    ]}
  />
);
