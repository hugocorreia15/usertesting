import React from "react";
import { random, useCurrentFrame } from "remotion";
import { theme } from "../theme";

type Shape = {
  kind: "hex" | "circle" | "dot";
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  drift: number;
  phase: number;
};

const PALETTE = [theme.color.primary, theme.color.accent, theme.color.violet];

/** Deterministic scatter of the pastel shapes the Avalux UI uses as a backdrop. */
const buildShapes = (count: number, seed: string): Shape[] =>
  new Array(count).fill(true).map((_, i) => {
    const r = (k: string) => random(`${seed}-${k}-${i}`);
    const kindRoll = r("kind");
    return {
      kind: kindRoll > 0.66 ? "hex" : kindRoll > 0.3 ? "circle" : "dot",
      x: r("x") * 1920,
      y: r("y") * 1080,
      size: 40 + r("size") * 260,
      color: PALETTE[Math.floor(r("color") * PALETTE.length)],
      opacity: 0.028 + r("op") * 0.045,
      drift: 14 + r("drift") * 34,
      phase: r("phase") * Math.PI * 2,
    };
  });

const HEX_PATH = "M50 3 L93 27 L93 74 L50 98 L7 74 L7 27 Z";

export const Motif: React.FC<{ seed?: string; count?: number }> = ({
  seed = "avalux",
  count = 26,
}) => {
  const frame = useCurrentFrame();
  const shapes = React.useMemo(() => buildShapes(count, seed), [count, seed]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {shapes.map((s, i) => {
        const t = frame / 100 + s.phase;
        const dx = Math.sin(t) * s.drift;
        const dy = Math.cos(t * 0.8) * s.drift * 0.6;

        if (s.kind === "hex") {
          return (
            <svg
              key={i}
              viewBox="0 0 100 100"
              width={s.size}
              height={s.size}
              style={{
                position: "absolute",
                left: s.x + dx,
                top: s.y + dy,
                opacity: s.opacity,
                rotate: `${Math.sin(t * 0.4) * 8}deg`,
              }}
            >
              <path d={HEX_PATH} fill={s.color} />
            </svg>
          );
        }

        const size = s.kind === "dot" ? s.size * 0.12 : s.size;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x + dx,
              top: s.y + dy,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: s.color,
              opacity: s.kind === "dot" ? s.opacity * 2.2 : s.opacity,
            }}
          />
        );
      })}
    </div>
  );
};
