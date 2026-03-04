import { useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";

type Variant = "templates" | "participants" | "sessions" | "generic";

interface EmptyStateProps {
  variant?: Variant;
  title: string;
  description: string;
  action?: ReactNode;
}

function Illustration({ variant }: { variant: Variant }) {
  switch (variant) {
    case "templates":
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="text-primary">
          <rect x="20" y="15" width="80" height="90" rx="8" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
          <rect x="32" y="35" width="40" height="4" rx="2" fill="currentColor" fillOpacity="0.3" />
          <rect x="32" y="47" width="56" height="3" rx="1.5" fill="currentColor" fillOpacity="0.15" />
          <rect x="32" y="56" width="48" height="3" rx="1.5" fill="currentColor" fillOpacity="0.15" />
          <rect x="32" y="65" width="52" height="3" rx="1.5" fill="currentColor" fillOpacity="0.15" />
          <rect x="32" y="80" width="24" height="8" rx="4" fill="currentColor" fillOpacity="0.2" />
          <circle cx="88" cy="28" r="12" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
          <path d="M84 28h8M88 24v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "participants":
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="text-accent">
          <circle cx="60" cy="40" r="18" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
          <path d="M30 95c0-16.569 13.431-30 30-30s30 13.431 30 30" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05" strokeLinecap="round" />
          <circle cx="90" cy="35" r="10" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.08" />
          <circle cx="30" cy="35" r="10" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.08" />
        </svg>
      );
    case "sessions":
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="text-violet-500 dark:text-violet-400">
          <rect x="15" y="20" width="90" height="80" rx="8" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
          <circle cx="60" cy="55" r="20" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.08" />
          <path d="M55 47v18l14-9-14-9z" fill="currentColor" fillOpacity="0.3" />
          <rect x="30" y="85" width="60" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
        </svg>
      );
    default:
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="text-primary">
          <circle cx="60" cy="60" r="40" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
          <path d="M45 60h30M60 45v30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}

export function EmptyState({ variant = "generic", title, description, action }: EmptyStateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
    );

    if (svgRef.current) {
      gsap.fromTo(
        svgRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "elastic.out(1, 0.5)", delay: 0.15 },
      );
    }
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center py-16 text-center">
      <div ref={svgRef} className="mb-6">
        <Illustration variant={variant} />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
