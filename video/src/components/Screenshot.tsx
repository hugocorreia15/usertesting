import React from "react";
import {
  CanvasImage,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { EASE_OUT, theme } from "../theme";
import { Callout } from "./Callout";

const ease = Easing.bezier(...EASE_OUT);

/** Source captures are 1440x900. */
const IMG_W = 1440;
const IMG_H = 900;
const ASPECT = IMG_W / IMG_H;

export type Region = {
  /** Left edge of the visible region, 0 to 1 of the source width. */
  x: number;
  /** Top edge, 0 to 1 of the source height. */
  y: number;
  /** Visible width, 0 to 1. Height follows, since the shell shares the source aspect. */
  w: number;
};

const FULL: Region = { x: 0, y: 0, w: 1 };

/**
 * A ring to draw over the capture, given in *image* coordinates (0 to 1 of the
 * source). The component converts to shell coordinates against the live crop,
 * so an annotation stays glued to its UI element while the shot moves.
 */
export type Annotation = {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  delay?: number;
  color?: string;
  labelSide?: "top" | "bottom";
  fadeOutAt?: number;
};

/**
 * A real product screenshot in a browser shell, with a slow move between two
 * regions. Cropping to a region is how a callout gets to fill the frame.
 */
export const Screenshot: React.FC<{
  /** File name inside `public/help`. */
  file: string;
  width: number;
  from?: Region;
  to?: Region;
  /** Frames over which `from` becomes `to`. */
  duration?: number;
  delay?: number;
  url?: string;
  annotations?: Annotation[];
  children?: React.ReactNode;
  name?: string;
}> = ({
  file,
  width,
  from = FULL,
  to,
  duration = 240,
  delay = 0,
  url = "avalux.pt",
  annotations = [],
  children,
  name = "Screenshot",
}) => {
  const frame = useCurrentFrame();
  const target = to ?? from;

  const t = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const region = {
    x: from.x + (target.x - from.x) * t,
    y: from.y + (target.y - from.y) * t,
    w: from.w + (target.w - from.w) * t,
  };

  const shellH = width / ASPECT;
  const chrome = Math.max(34, width * 0.036);
  const scale = width / (region.w * IMG_W);

  return (
    <Interactive.Div
      name={name}
      style={{
        width,
        borderRadius: theme.radius.lg,
        overflow: "hidden",
        backgroundColor: theme.color.card,
        border: `1px solid ${theme.color.border}`,
        boxShadow: theme.shadow.lift,
        opacity: interpolate(frame, [delay, delay + 20], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
        scale: interpolate(frame, [delay, delay + 30], [0.965, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
      }}
    >
      <div
        style={{
          height: chrome,
          backgroundColor: theme.color.sidebar,
          borderBottom: `1px solid ${theme.color.border}`,
          display: "flex",
          alignItems: "center",
          gap: chrome * 0.22,
          paddingLeft: chrome * 0.44,
        }}
      >
        {["#f87171", "#fbbf24", "#34d399"].map((c) => (
          <div
            key={c}
            style={{
              width: chrome * 0.22,
              height: chrome * 0.22,
              borderRadius: "50%",
              backgroundColor: c,
            }}
          />
        ))}
        <div
          style={{
            marginLeft: chrome * 0.5,
            height: chrome * 0.56,
            padding: `0 ${chrome * 0.6}px`,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.color.card,
            border: `1px solid ${theme.color.border}`,
            display: "flex",
            alignItems: "center",
            fontSize: chrome * 0.36,
            color: theme.color.inkSoft,
            fontWeight: 500,
          }}
        >
          {url}
        </div>
      </div>

      <div style={{ position: "relative", width, height: shellH, overflow: "hidden" }}>
        <CanvasImage
          src={staticFile(`help/${file}`)}
          style={{
            position: "absolute",
            width: IMG_W * scale,
            height: IMG_H * scale,
            left: -region.x * IMG_W * scale,
            top: -region.y * IMG_H * scale,
          }}
        />
        {annotations.map((a, i) => (
          <Callout
            key={a.label ?? i}
            x={((a.x - region.x) / region.w) * 100}
            y={((a.y - region.y) / region.w) * 100}
            w={(a.w / region.w) * 100}
            h={(a.h / region.w) * 100}
            label={a.label}
            delay={a.delay ?? 0}
            color={a.color}
            labelSide={a.labelSide}
            fadeOutAt={a.fadeOutAt}
          />
        ))}
        {children}
      </div>
    </Interactive.Div>
  );
};
