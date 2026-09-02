import React from "react";
import { theme } from "../../theme";

/** The three disconnected tools a moderated session is usually assembled from. */

export const Stopwatch: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <rect x="42" y="4" width="16" height="9" rx="3" fill={theme.color.ink} />
    <line
      x1="50"
      y1="13"
      x2="50"
      y2="20"
      stroke={theme.color.ink}
      strokeWidth="5"
    />
    <circle
      cx="50"
      cy="58"
      r="34"
      fill={theme.color.card}
      stroke={theme.color.ink}
      strokeWidth="5"
    />
    <circle cx="50" cy="58" r="27" fill={theme.color.sidebar} />
    <line
      x1="50"
      y1="58"
      x2="50"
      y2="38"
      stroke={theme.color.danger}
      strokeWidth="4"
      strokeLinecap="round"
    />
    <line
      x1="50"
      y1="58"
      x2="64"
      y2="66"
      stroke={theme.color.ink}
      strokeWidth="4"
      strokeLinecap="round"
    />
    <circle cx="50" cy="58" r="4" fill={theme.color.ink} />
  </svg>
);

export const Spreadsheet: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <rect
      x="8"
      y="16"
      width="84"
      height="68"
      rx="8"
      fill={theme.color.card}
      stroke={theme.color.ink}
      strokeWidth="5"
    />
    <rect x="8" y="16" width="84" height="16" rx="8" fill={theme.color.success} />
    <rect x="8" y="26" width="84" height="6" fill={theme.color.success} />
    {[42, 54, 66, 78].map((y) => (
      <line
        key={y}
        x1="8"
        y1={y}
        x2="92"
        y2={y}
        stroke={theme.color.border}
        strokeWidth="3"
      />
    ))}
    {[36, 64].map((x) => (
      <line
        key={x}
        x1={x}
        y1="32"
        x2={x}
        y2="84"
        stroke={theme.color.border}
        strokeWidth="3"
      />
    ))}
  </svg>
);

export const Questionnaire: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <rect
      x="16"
      y="8"
      width="68"
      height="84"
      rx="8"
      fill={theme.color.card}
      stroke={theme.color.ink}
      strokeWidth="5"
    />
    {[26, 46, 66].map((y, i) => (
      <g key={y}>
        <circle
          cx="30"
          cy={y}
          r="6"
          fill={i === 1 ? theme.color.primary : theme.color.card}
          stroke={theme.color.ink}
          strokeWidth="3.5"
        />
        <line
          x1="44"
          y1={y}
          x2="72"
          y2={y}
          stroke={theme.color.inkSoft}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    ))}
  </svg>
);
