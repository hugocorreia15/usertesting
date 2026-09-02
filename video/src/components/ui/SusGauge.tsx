import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, theme } from "../../theme";

const ease = Easing.bezier(...EASE_OUT);

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

/** Arc from `startDeg` to `endDeg`, measured on a 180-to-360 degree semicircle. */
const arcPath = (
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
) => {
  const a = polar(cx, cy, r, startDeg);
  const b = polar(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
};

/**
 * SUS score on a semicircular gauge, with the 95% confidence interval drawn as
 * a band across the arc. A small sample reporting its own uncertainty is the
 * point of the scene, so the band gets equal visual weight to the number.
 */
export const SusGauge: React.FC<{
  score?: number;
  ci?: number;
  size?: number;
  delay?: number;
  label?: string;
}> = ({ score = 78.4, ci = 6.2, size = 560, delay = 0, label = "SUS score" }) => {
  const frame = useCurrentFrame();

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;
  const stroke = size * 0.075;

  const sweep = interpolate(frame, [delay, delay + 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  const toDeg = (v: number) => 180 + (Math.min(100, Math.max(0, v)) / 100) * 180;
  const shown = score * sweep;
  const ciIn = interpolate(frame, [delay + 55, delay + 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  return (
    <div style={{ width: size, height: size * 0.66, position: "relative" }}>
      <svg width={size} height={size * 0.66} viewBox={`0 0 ${size} ${size * 0.66}`}>
        <defs>
          <linearGradient id="susGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={theme.color.primary} />
            <stop offset="55%" stopColor={theme.color.violet} />
            <stop offset="100%" stopColor={theme.color.accent} />
          </linearGradient>
        </defs>

        <path
          d={arcPath(cx, cy, r, 180, 360)}
          fill="none"
          stroke={theme.color.border}
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {ciIn > 0 ? (
          <path
            d={arcPath(cx, cy, r, toDeg(score - ci), toDeg(score + ci))}
            fill="none"
            stroke={theme.color.accent}
            strokeWidth={stroke * 1.5}
            strokeLinecap="butt"
            opacity={0.22 * ciIn}
          />
        ) : null}

        <path
          d={arcPath(cx, cy, r, 180, Math.max(180.01, toDeg(shown)))}
          fill="none"
          stroke="url(#susGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {[score - ci, score + ci].map((v, i) => {
          const outer = polar(cx, cy, r + stroke * 0.95, toDeg(v));
          const inner = polar(cx, cy, r - stroke * 0.95, toDeg(v));
          return (
            <line
              key={i}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={theme.color.accent}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={ciIn}
            />
          );
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: size * 0.24,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: theme.font.mono,
            fontSize: size * 0.19,
            fontWeight: 700,
            color: theme.color.ink,
            letterSpacing: -size * 0.006,
          }}
        >
          {shown.toFixed(1)}
        </div>
        <div
          style={{
            fontSize: size * 0.045,
            fontWeight: 600,
            color: theme.color.inkMuted,
            marginTop: size * 0.012,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: size * 0.042,
            fontWeight: 700,
            color: theme.color.accent,
            marginTop: size * 0.022,
            opacity: ciIn,
          }}
        >
          95% CI ±{ci.toFixed(1)}
        </div>
      </div>
    </div>
  );
};
