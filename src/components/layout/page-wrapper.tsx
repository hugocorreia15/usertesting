import { useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { HelpButton } from "@/components/help/help-button";
import type { HelpAnchor } from "@/lib/help-anchors";

export function PageWrapper({
  title,
  description,
  actions,
  help,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Help section for this page, shown as a question mark beside the title. */
  help?: HelpAnchor;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
      );

      // Stagger animate cards within the page
      const cards = ref.current.querySelectorAll("[data-animate-card]");
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 20, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.4,
            stagger: 0.07,
            ease: "power2.out",
            delay: 0.15,
          },
        );
      }
    }
  }, []);

  return (
    <div ref={ref} className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="break-words text-2xl font-bold tracking-tight gradient-text">{title}</h1>
            {help && <HelpButton section={help} />}
          </div>
          {description && (
            <p className="mt-1 text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
