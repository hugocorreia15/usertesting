import React from "react";
import { Frame } from "../../components/Frame";
import { Eyebrow, Headline, SubCaption } from "../../components/Caption";
import { TemplateCard } from "../../components/ui/TemplateCard";
import { theme } from "../../theme";
import { copy } from "../../copy/en";

/** A template assembling itself. */
export const Protocols: React.FC = () => {
  const c = copy.marketing.protocols;

  return (
    <Frame name="Protocols" seed="protocols">
      <div
        style={{
          position: "absolute",
          left: theme.safe.x,
          top: 250,
          width: 600,
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        <Eyebrow text="Test templates" delay={4} />
        <Headline text={c.title} delay={8} size={theme.size.h2} maxWidth={600} />
        <SubCaption
          text={c.sub}
          delay={26}
          size={theme.size.small}
          maxWidth={580}
        />
      </div>

      <div style={{ position: "absolute", right: 110, top: 150 }}>
        <TemplateCard
          width={900}
          delay={10}
          tasks={c.tasks.map((t) => ({ ...t }))}
          errors={c.errors.map((e) => ({ ...e }))}
        />
      </div>
    </Frame>
  );
};
