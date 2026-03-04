import { useRef, useEffect, useMemo } from "react";
import gsap from "gsap";

interface FloatingShape {
  id: number;
  type: "circle" | "hexagon" | "dots" | "blob";
  x: number;
  y: number;
  size: number;
  color: string;
}

const COLORS = [
  "text-indigo-500/[0.10] dark:text-indigo-400/[0.15]",
  "text-violet-400/[0.10] dark:text-violet-400/[0.15]",
  "text-teal-400/[0.10] dark:text-teal-400/[0.15]",
  "text-emerald-400/[0.10] dark:text-emerald-400/[0.15]",
];

const SHAPE_TYPES: FloatingShape["type"][] = ["circle", "hexagon", "dots", "blob"];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function ShapeSVG({ type, size }: { type: FloatingShape["type"]; size: number }) {
  switch (type) {
    case "circle":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="currentColor" />
        </svg>
      );
    case "hexagon":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <polygon points="50,2 93,25 93,75 50,98 7,75 7,25" fill="currentColor" />
        </svg>
      );
    case "dots":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle cx="20" cy="20" r="8" fill="currentColor" />
          <circle cx="50" cy="15" r="6" fill="currentColor" />
          <circle cx="80" cy="25" r="7" fill="currentColor" />
          <circle cx="30" cy="50" r="5" fill="currentColor" />
          <circle cx="65" cy="55" r="9" fill="currentColor" />
          <circle cx="45" cy="80" r="7" fill="currentColor" />
          <circle cx="75" cy="78" r="6" fill="currentColor" />
        </svg>
      );
    case "blob":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <path
            d="M50 10 C70 10, 90 25, 85 50 C80 75, 65 90, 50 90 C35 90, 15 80, 12 55 C10 30, 30 10, 50 10Z"
            fill="currentColor"
          />
        </svg>
      );
  }
}

export function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  const shapes = useMemo<FloatingShape[]>(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      type: SHAPE_TYPES[i % SHAPE_TYPES.length],
      x: randomBetween(0, 100),
      y: randomBetween(0, 100),
      size: randomBetween(60, 180),
      color: COLORS[i % COLORS.length],
    }));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const elements = containerRef.current!.querySelectorAll("[data-shape]");
      elements.forEach((el) => {
        const driftDuration = randomBetween(15, 35);
        const rotateDuration = randomBetween(40, 80);

        gsap.to(el, {
          x: `+=${randomBetween(-80, 80)}`,
          y: `+=${randomBetween(-80, 80)}`,
          duration: driftDuration,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        gsap.to(el, {
          rotation: 360,
          duration: rotateDuration,
          repeat: -1,
          ease: "none",
        });

        gsap.to(el, {
          opacity: randomBetween(0.5, 1),
          duration: randomBetween(3, 6),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {shapes.map((shape) => (
        <div
          key={shape.id}
          data-shape
          className={`absolute ${shape.color}`}
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            opacity: 0.7,
          }}
        >
          <ShapeSVG type={shape.type} size={shape.size} />
        </div>
      ))}
    </div>
  );
}
