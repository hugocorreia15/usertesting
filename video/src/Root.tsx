import "./index.css";
import { Composition, Folder } from "remotion";
import {
  FPS,
  MARKETING,
  MARKETING_DURATION,
  TUTORIAL,
  TUTORIAL_DURATION,
} from "./timeline";
import { Marketing } from "./Marketing";
import { Tutorial } from "./Tutorial";

import { ColdOpen } from "./scenes/marketing/ColdOpen";
import { LogoReveal } from "./scenes/marketing/LogoReveal";
import { Protocols } from "./scenes/marketing/Protocols";
import { CockpitScene } from "./scenes/marketing/CockpitScene";
import { Participant } from "./scenes/marketing/Participant";
import { Instruments } from "./scenes/marketing/Instruments";
import { Analysis } from "./scenes/marketing/Analysis";
import { Classrooms } from "./scenes/marketing/Classrooms";
import { Close } from "./scenes/marketing/Close";

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

const HD = { fps: FPS, width: 1920, height: 1080 } as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Marketing"
        component={Marketing}
        durationInFrames={MARKETING_DURATION}
        {...HD}
      />
      <Composition
        id="Tutorial"
        component={Tutorial}
        durationInFrames={TUTORIAL_DURATION}
        {...HD}
      />

      <Folder name="Marketing-Scenes">
        <Composition id="M1-ColdOpen" component={ColdOpen} durationInFrames={MARKETING.coldOpen} {...HD} />
        <Composition id="M2-LogoReveal" component={LogoReveal} durationInFrames={MARKETING.logoReveal} {...HD} />
        <Composition id="M3-Protocols" component={Protocols} durationInFrames={MARKETING.protocols} {...HD} />
        <Composition id="M4-Cockpit" component={CockpitScene} durationInFrames={MARKETING.cockpit} {...HD} />
        <Composition id="M5-Participant" component={Participant} durationInFrames={MARKETING.participant} {...HD} />
        <Composition id="M6-Instruments" component={Instruments} durationInFrames={MARKETING.instruments} {...HD} />
        <Composition id="M7-Analysis" component={Analysis} durationInFrames={MARKETING.analysis} {...HD} />
        <Composition id="M8-Classrooms" component={Classrooms} durationInFrames={MARKETING.classrooms} {...HD} />
        <Composition id="M9-Close" component={Close} durationInFrames={MARKETING.close} {...HD} />
      </Folder>

      <Folder name="Tutorial-Chapters">
        <Composition id="T0-Intro" component={Intro} durationInFrames={TUTORIAL.intro} {...HD} />
        <Composition id="T1-Templates" component={C1Templates} durationInFrames={TUTORIAL.templates} {...HD} />
        <Composition id="T2-Sessions" component={C2Sessions} durationInFrames={TUTORIAL.sessions} {...HD} />
        <Composition id="T3-Live" component={C3Live} durationInFrames={TUTORIAL.live} {...HD} />
        <Composition id="T4-Participant" component={C4Participant} durationInFrames={TUTORIAL.participant} {...HD} />
        <Composition id="T5-Results" component={C5Results} durationInFrames={TUTORIAL.results} {...HD} />
        <Composition id="T6-Exports" component={C6Exports} durationInFrames={TUTORIAL.exports} {...HD} />
        <Composition id="T7-Coding" component={C7Coding} durationInFrames={TUTORIAL.coding} {...HD} />
        <Composition id="T8-Orgs" component={C8Orgs} durationInFrames={TUTORIAL.orgs} {...HD} />
        <Composition id="T9-Outro" component={Outro} durationInFrames={TUTORIAL.outro} {...HD} />
      </Folder>
    </>
  );
};
