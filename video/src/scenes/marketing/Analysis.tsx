import React from "react";
import { Frame } from "../../components/Frame";
import { Eyebrow, Headline } from "../../components/Caption";
import { EventTimeline } from "../../components/ui/EventTimeline";
import { ExportCards } from "../../components/ui/ExportCards";
import { theme } from "../../theme";
import { copy } from "../../copy/en";

/** Logged events become a timeline, and then a file you can take elsewhere. */
export const Analysis: React.FC = () => {
  const c = copy.marketing.analysis;

  return (
    <Frame name="Analysis" seed="analysis">
      <div
        style={{
          position: "absolute",
          left: theme.safe.x,
          top: 120,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <Eyebrow text="Analysis and reporting" delay={2} />
        <Headline text={c.title} delay={6} size={theme.size.h2} />
      </div>

      <div style={{ position: "absolute", left: theme.safe.x, top: 360 }}>
        <EventTimeline width={1620} delay={18} />
      </div>

      <div
        style={{
          position: "absolute",
          left: theme.safe.x,
          right: theme.safe.x,
          top: 690,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ExportCards delay={46} cardWidth={360} />
      </div>
    </Frame>
  );
};
