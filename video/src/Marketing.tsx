import React from "react";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { MARKETING, TRANSITION } from "./timeline";
import { ColdOpen } from "./scenes/marketing/ColdOpen";
import { LogoReveal } from "./scenes/marketing/LogoReveal";
import { Protocols } from "./scenes/marketing/Protocols";
import { CockpitScene } from "./scenes/marketing/CockpitScene";
import { Participant } from "./scenes/marketing/Participant";
import { Instruments } from "./scenes/marketing/Instruments";
import { Analysis } from "./scenes/marketing/Analysis";
import { Classrooms } from "./scenes/marketing/Classrooms";
import { Close } from "./scenes/marketing/Close";

const cut = (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION })}
  />
);

export const Marketing: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={MARKETING.coldOpen} name="Cold open">
        <ColdOpen />
      </TransitionSeries.Sequence>
      {cut}
      <TransitionSeries.Sequence durationInFrames={MARKETING.logoReveal} name="Logo reveal">
        <LogoReveal />
      </TransitionSeries.Sequence>
      {cut}
      <TransitionSeries.Sequence durationInFrames={MARKETING.protocols} name="Protocols">
        <Protocols />
      </TransitionSeries.Sequence>
      {cut}
      <TransitionSeries.Sequence durationInFrames={MARKETING.cockpit} name="Cockpit">
        <CockpitScene />
      </TransitionSeries.Sequence>
      {cut}
      <TransitionSeries.Sequence durationInFrames={MARKETING.participant} name="Participant">
        <Participant />
      </TransitionSeries.Sequence>
      {cut}
      <TransitionSeries.Sequence durationInFrames={MARKETING.instruments} name="Instruments">
        <Instruments />
      </TransitionSeries.Sequence>
      {cut}
      <TransitionSeries.Sequence durationInFrames={MARKETING.analysis} name="Analysis">
        <Analysis />
      </TransitionSeries.Sequence>
      {cut}
      <TransitionSeries.Sequence durationInFrames={MARKETING.classrooms} name="Classrooms">
        <Classrooms />
      </TransitionSeries.Sequence>
      {cut}
      <TransitionSeries.Sequence durationInFrames={MARKETING.close} name="Close">
        <Close />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
