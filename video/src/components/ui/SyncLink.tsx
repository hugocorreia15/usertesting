import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../../theme";

/**
 * The realtime channel between the evaluator and the participant: a dashed
 * curve with pulses travelling along it. The pulse position is the cubic
 * bezier evaluated directly, so it tracks the drawn path exactly.
 */
export const SyncLink: React.FC<{
  width: number;
  height: number;
  delay?: number;
  pulses?: number;
  label?: string;
}> = ({ width, height, delay = 0, pulses = 3, label }) => {
  const frame = useCurrentFrame();

  const p0 = { x: 0, y: height * 0.82 };
  const p1 = { x: width * 0.4, y: height * 0.82 };
  const p2 = { x: width * 0.6, y: height * 0.18 };
  const p3 = { x: width, y: height * 0.18 };

  const d = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

  const draw = interpolate(frame, [delay, delay + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const at = (t: number) => {
    const u = 1 - t;
    return {
      x:
        u * u * u * p0.x +
        3 * u * u * t * p1.x +
        3 * u * t * t * p2.x +
        t * t * t * p3.x,
      y:
        u * u * u * p0.y +
        3 * u * u * t * p1.y +
        3 * u * t * t * p2.y +
        t * t * t * p3.y,
    };
  };

  const CYCLE = 52;

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <path
        d={d}
        fill="none"
        stroke={theme.color.border}
        strokeWidth={3}
        strokeDasharray="10 10"
        opacity={draw}
      />

      {new Array(pulses).fill(true).map((_, i) => {
        if (frame < delay) return null;
        const raw = ((frame - delay - i * (CYCLE / pulses)) % CYCLE) / CYCLE;
        const t = raw < 0 ? raw + 1 : raw;
        const point = at(t);
        return (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={9}
            fill={theme.color.accent}
            opacity={draw * (0.3 + 0.7 * Math.sin(Math.PI * t))}
          />
        );
      })}

      {label ? (
        <text
          x={width / 2}
          y={height * 0.5 - 26}
          textAnchor="middle"
          fill={theme.color.accent}
          fontSize={24}
          fontWeight={700}
          fontFamily={theme.font.sans}
          opacity={draw}
        >
          {label}
        </text>
      ) : null}
    </svg>
  );
};
