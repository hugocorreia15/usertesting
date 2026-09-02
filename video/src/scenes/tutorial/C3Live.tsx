import React from "react";
import { Chapter } from "../../components/Chapter";
import { Screenshot } from "../../components/Screenshot";
import { Cockpit } from "../../components/ui/Cockpit";
import {
  GatingDiagram,
  SeqScale,
  ShortcutLegend,
} from "../../components/ui/SessionBits";
import { TUTORIAL } from "../../timeline";
import { copy } from "../../copy/en";

const c = copy.tutorial.chapters.live;

/** Shared cockpit state, so each beat looks like the same running session. */
const cockpit = (
  highlight: Parameters<typeof Cockpit>[0]["highlight"],
  show: Parameters<typeof Cockpit>[0]["show"],
  width: number,
) => (
  <Cockpit
    width={width}
    show={show}
    delay={6}
    timerStart={10}
    timerRate={3.4}
    actionsAt={[25, 45, 70, 100, 132, 168]}
    errorsAt={[
      { frame: 55, code: "E2" },
      { frame: 140, code: "E1" },
    ]}
    hesitationsAt={[38, 118]}
    highlight={highlight}
  />
);

export const C3Live: React.FC = () => (
  <Chapter
    n={c.n}
    title={c.title}
    lead={c.lead}
    total={TUTORIAL.live}
    beats={[
      {
        heading: c.beats[0].heading,
        body: c.beats[0].body,
        visual: (
          <Screenshot
            file="08-live-evaluator.png"
            width={990}
            delay={8}
            from={{ x: 0.24, y: 0.07, w: 0.72 }}
            to={{ x: 0.26, y: 0.12, w: 0.66 }}
            duration={220}
            url="avalux.pt/sessions/live"
            annotations={[
              {
                x: 0.276,
                y: 0.545,
                w: 0.293,
                h: 0.215,
                label: "Persisted per session and task",
                delay: 50,
              },
            ]}
          />
        ),
      },
      {
        heading: c.beats[1].heading,
        body: c.beats[1].body,
        visual: cockpit("actions", ["task", "meters"], 1000),
      },
      {
        heading: c.beats[2].heading,
        body: c.beats[2].body,
        visual: cockpit("errors", ["meters", "logs"], 1000),
      },
      {
        heading: c.beats[3].heading,
        body: c.beats[3].body,
        visual: <SeqScale delay={8} />,
      },
      {
        heading: c.beats[4].heading,
        body: c.beats[4].body,
        visual: <ShortcutLegend delay={8} />,
      },
      {
        heading: c.beats[5].heading,
        body: c.beats[5].body,
        visual: <GatingDiagram delay={8} />,
      },
    ]}
  />
);
