import { useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/hooks/use-theme";
import gsap from "gsap";

export function LampToggle() {
  const { theme, toggleTheme } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const cordEndRef = useRef<SVGCircleElement>(null);
  const cordLineRef = useRef<SVGLineElement>(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const currentPull = useRef(0);

  const isOn = theme === "light";

  // Animate bulb glow when theme changes
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const bulbGlow = svg.querySelector(".lamp-glow") as SVGElement;
    const filament = svg.querySelector(".lamp-filament") as SVGElement;
    const shine = svg.querySelector(".lamp-shine") as SVGElement;

    if (isOn) {
      gsap.to(bulbGlow, { opacity: 1, duration: 0.3 });
      gsap.to(filament, { opacity: 1, duration: 0.2 });
      if (shine) gsap.to(shine, { opacity: 0.6, duration: 0.3 });
    } else {
      gsap.to(bulbGlow, { opacity: 0, duration: 0.3 });
      gsap.to(filament, { opacity: 0.3, duration: 0.2 });
      if (shine) gsap.to(shine, { opacity: 0, duration: 0.3 });
    }
  }, [isOn]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    startY.current = e.clientY;
    currentPull.current = 0;
    (e.target as Element).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dy = Math.max(0, Math.min(e.clientY - startY.current, 16));
    currentPull.current = dy;

    if (cordLineRef.current) {
      cordLineRef.current.setAttribute("y2", String(32 + dy));
    }
    if (cordEndRef.current) {
      cordEndRef.current.setAttribute("cy", String(32 + dy));
    }
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;

      const pulled = currentPull.current > 8;

      // Snap cord back
      if (cordLineRef.current) {
        gsap.to(cordLineRef.current, {
          attr: { y2: 32 },
          duration: 0.4,
          ease: "elastic.out(1,0.3)",
        });
      }
      if (cordEndRef.current) {
        gsap.to(cordEndRef.current, {
          attr: { cy: 32 },
          duration: 0.4,
          ease: "elastic.out(1,0.3)",
        });
      }

      if (pulled) {
        // Create a synthetic mouse event at the cord position for the wave effect
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          const syntheticEvent = {
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          } as React.MouseEvent;
          toggleTheme(syntheticEvent);
        }
      }
    },
    [toggleTheme],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Simple click toggle (no drag needed)
      toggleTheme(e);
    },
    [toggleTheme],
  );

  return (
    <>
      <style>{`
        .lamp-toggle {
          cursor: pointer;
          user-select: none;
          touch-action: none;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 44px;
          position: relative;
        }
        .lamp-toggle svg {
          overflow: visible;
          filter: drop-shadow(0 0 1px rgba(0,0,0,0.1));
        }
        .lamp-cap {
          fill: #555;
        }
        .lamp-glass {
          fill: #e8e0c8;
          stroke: #bbb;
          stroke-width: 0.5;
          transition: fill 0.3s, stroke 0.3s;
        }
        .dark .lamp-glass {
          fill: #3a3a3a;
          stroke: #555;
        }
        .lamp-glow {
          fill: #ffeaa7;
          transition: opacity 0.3s;
        }
        .lamp-filament {
          stroke: #e67e22;
          stroke-width: 1;
          fill: none;
          transition: opacity 0.3s;
        }
        .lamp-shine {
          fill: white;
          transition: opacity 0.3s;
        }
        .lamp-cord {
          stroke: #777;
          stroke-width: 1.2;
          stroke-linecap: round;
        }
        .lamp-cord-end {
          fill: #888;
          cursor: grab;
          transition: fill 0.2s;
        }
        .lamp-cord-end:hover {
          fill: #aaa;
        }
        .lamp-cord-end:active {
          cursor: grabbing;
        }
        .lamp-rays {
          stroke: #ffeaa7;
          stroke-width: 0.5;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .light .lamp-rays {
          opacity: 0.4;
        }
      `}</style>
      <div className="lamp-toggle" title={isOn ? "Switch to dark mode" : "Switch to light mode"}>
        <svg
          ref={svgRef}
          viewBox="0 -6 32 48"
          width="40"
          height="60"
          onClick={handleClick}
        >
          {/* Wire from top */}
          <line x1="16" y1="0" x2="16" y2="4" stroke="#777" strokeWidth="1" />

          {/* Cap / socket */}
          <rect className="lamp-cap" x="12" y="4" width="8" height="4" rx="1" />

          {/* Bulb glass */}
          <path
            className="lamp-glass"
            d="M12 8 C12 8 9 12 9 16 C9 20 12 22 16 22 C20 22 23 20 23 16 C23 12 20 8 20 8 Z"
          />

          {/* Glow behind filament */}
          <ellipse
            className="lamp-glow"
            cx="16"
            cy="15"
            rx="5"
            ry="5"
            opacity={isOn ? 1 : 0}
          />

          {/* Filament */}
          <path
            className="lamp-filament"
            d="M14 18 L14.5 12 L16 15 L17.5 12 L18 18"
            opacity={isOn ? 1 : 0.3}
          />

          {/* Shine highlight */}
          <ellipse
            className="lamp-shine"
            cx="13"
            cy="13"
            rx="1.5"
            ry="2"
            opacity={isOn ? 0.6 : 0}
          />

          {/* Light rays */}
          <g className="lamp-rays">
            <line x1="6" y1="10" x2="4" y2="8" />
            <line x1="5" y1="16" x2="2" y2="16" />
            <line x1="6" y1="21" x2="4" y2="23" />
            <line x1="26" y1="10" x2="28" y2="8" />
            <line x1="27" y1="16" x2="30" y2="16" />
            <line x1="26" y1="21" x2="28" y2="23" />
          </g>

          {/* Pull cord */}
          <line
            ref={cordLineRef}
            className="lamp-cord"
            x1="16"
            y1="22"
            x2="16"
            y2="32"
          />
          <circle
            ref={cordEndRef}
            className="lamp-cord-end"
            cx="16"
            cy="32"
            r="2"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        </svg>
      </div>
    </>
  );
}
