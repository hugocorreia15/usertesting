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

const ease = Easing.bezier(...EASE_OUT);
const SRC_W = 375;
const SRC_H = 812;

/** A 375x812 capture inside a device shell. */
export const PhoneFrame: React.FC<{
  file: string;
  height: number;
  delay?: number;
  name?: string;
  children?: React.ReactNode;
}> = ({ file, height, delay = 0, name = "Phone", children }) => {
  const frame = useCurrentFrame();
  const scale = height / SRC_H;
  const width = SRC_W * scale;
  const bezel = height * 0.014;

  return (
    <Interactive.Div
      name={name}
      style={{
        width: width + bezel * 2,
        height: height + bezel * 2,
        borderRadius: height * 0.062,
        padding: bezel,
        backgroundColor: "#161329",
        boxShadow: theme.shadow.lift,
        position: "relative",
        opacity: interpolate(frame, [delay, delay + 20], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        }),
        translate: `0px ${interpolate(frame, [delay, delay + 32], [40, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        })}px`,
      }}
    >
      <div
        style={{
          width,
          height,
          borderRadius: height * 0.05,
          overflow: "hidden",
          backgroundColor: theme.color.card,
          position: "relative",
        }}
      >
        <CanvasImage
          src={staticFile(`help/${file}`)}
          style={{ width, height }}
        />
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          top: bezel + height * 0.014,
          left: "50%",
          translate: "-50% 0px",
          width: width * 0.3,
          height: height * 0.018,
          borderRadius: theme.radius.pill,
          backgroundColor: "#161329",
        }}
      />
    </Interactive.Div>
  );
};
