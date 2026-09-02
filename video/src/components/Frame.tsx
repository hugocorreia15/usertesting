import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";
import { Motif } from "./Motif";

/** The ground every scene sits on: brand background, drifting motif, soft vignette. */
export const Frame: React.FC<{
  children: React.ReactNode;
  name?: string;
  seed?: string;
  motif?: boolean;
  background?: string;
}> = ({ children, name = "Frame", seed, motif = true, background }) => {
  return (
    <AbsoluteFill
      name={name}
      style={{
        backgroundColor: background ?? theme.color.ground,
        fontFamily: theme.font.sans,
        color: theme.color.ink,
      }}
    >
      {motif ? <Motif seed={seed} /> : null}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 80% at 50% 40%, rgba(255,255,255,0) 40%, rgba(30,27,75,0.055) 100%)",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
