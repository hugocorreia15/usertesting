import React from "react";
import { AbsoluteFill } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { TRANSITION, TUTORIAL } from "./timeline";
import { ChapterRail } from "./components/ChapterRail";
import { Intro } from "./scenes/tutorial/Intro";
import { C1Templates } from "./scenes/tutorial/C1Templates";
import { C2Sessions } from "./scenes/tutorial/C2Sessions";
import { C3Live } from "./scenes/tutorial/C3Live";
import { C4Participant } from "./scenes/tutorial/C4Participant";
import { C5Results } from "./scenes/tutorial/C5Results";
import { C6Exports } from "./scenes/tutorial/C6Exports";
import { C7Coding } from "./scenes/tutorial/C7Coding";
import { C8Orgs } from "./scenes/tutorial/C8Orgs";
import { Outro } from "./scenes/tutorial/Outro";

const cut = (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION })}
  />
);

export const Tutorial: React.FC = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={TUTORIAL.intro} name="Intro">
          <Intro />
        </TransitionSeries.Sequence>
        {cut}
        <TransitionSeries.Sequence durationInFrames={TUTORIAL.templates} name="1 Templates">
          <C1Templates />
        </TransitionSeries.Sequence>
        {cut}
        <TransitionSeries.Sequence durationInFrames={TUTORIAL.sessions} name="2 Sessions">
          <C2Sessions />
        </TransitionSeries.Sequence>
        {cut}
        <TransitionSeries.Sequence durationInFrames={TUTORIAL.live} name="3 Live session">
          <C3Live />
        </TransitionSeries.Sequence>
        {cut}
        <TransitionSeries.Sequence durationInFrames={TUTORIAL.participant} name="4 Participant">
          <C4Participant />
        </TransitionSeries.Sequence>
        {cut}
        <TransitionSeries.Sequence durationInFrames={TUTORIAL.results} name="5 Results">
          <C5Results />
        </TransitionSeries.Sequence>
        {cut}
        <TransitionSeries.Sequence durationInFrames={TUTORIAL.exports} name="6 Exports">
          <C6Exports />
        </TransitionSeries.Sequence>
        {cut}
        <TransitionSeries.Sequence durationInFrames={TUTORIAL.coding} name="7 Coding">
          <C7Coding />
        </TransitionSeries.Sequence>
        {cut}
        <TransitionSeries.Sequence durationInFrames={TUTORIAL.orgs} name="8 Organizations">
          <C8Orgs />
        </TransitionSeries.Sequence>
        {cut}
        <TransitionSeries.Sequence durationInFrames={TUTORIAL.outro} name="Outro">
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <ChapterRail />
    </AbsoluteFill>
  );
};
