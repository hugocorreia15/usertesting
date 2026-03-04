import { useRef, useEffect } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface TimerDisplayProps {
  seconds: number;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function TimerDisplay({
  seconds,
  isRunning,
  onStart,
  onPause,
  onReset,
}: TimerDisplayProps) {
  const digitRef = useRef<HTMLSpanElement>(null);
  const prevSeconds = useRef(Math.floor(seconds));

  useEffect(() => {
    const current = Math.floor(seconds);
    if (current !== prevSeconds.current && digitRef.current) {
      gsap.fromTo(
        digitRef.current,
        { scale: 1.1 },
        { scale: 1, duration: 0.2, ease: "power2.out" },
      );
      prevSeconds.current = current;
    }
  }, [seconds]);

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);

  return (
    <div className="flex flex-col items-center gap-3">
      <span
        ref={digitRef}
        className="font-mono text-6xl font-bold tabular-nums tracking-tight text-primary drop-shadow-[0_0_12px_rgba(99,102,241,0.3)]"
      >
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}.
        {ms}
      </span>
      <div className="flex gap-2">
        {isRunning ? (
          <Button variant="outline" size="icon" onClick={onPause}>
            <Pause className="h-5 w-5" />
          </Button>
        ) : (
          <Button size="icon" onClick={onStart}>
            <Play className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
