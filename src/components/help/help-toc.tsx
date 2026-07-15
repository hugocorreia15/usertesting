import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, List } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TocEntry {
  id: string;
  label: string;
}

// Scrollspy: the app scrolls inside <main> (not the window), so both
// the listener and the activation threshold are relative to it. A
// section is active while its anchor is the last one above the top
// band of the scrollport. Clicking a link pins the highlight to the
// target while the smooth scroll settles, so the indicator glides
// once instead of sweeping through every section in between.
function useActiveSection(entries: TocEntry[]) {
  const [active, setActive] = useState<string | null>(entries[0]?.id ?? null);
  const pinUntil = useRef(0);

  useEffect(() => {
    const scroller = document.querySelector("main");
    if (!scroller) return;

    const onScroll = () => {
      if (Date.now() < pinUntil.current) return;
      const threshold = scroller.getBoundingClientRect().top + 120;
      let current = entries[0]?.id ?? null;
      for (const e of entries) {
        const el = document.getElementById(e.id);
        if (el && el.getBoundingClientRect().top <= threshold) current = e.id;
      }
      setActive(current);
    };

    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [entries]);

  const navigateTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    const scroller = document.querySelector("main");
    if (!el || !scroller) return;
    setActive(id);
    pinUntil.current = Date.now() + 900;
    // Explicitly smooth-scroll the app's scroll container (<main>), which
    // is more reliable than scrollIntoView inside a nested scrollport.
    // A small offset keeps the heading clear of the top edge.
    const top =
      scroller.scrollTop +
      el.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top -
      16;
    scroller.scrollTo({ top, behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
  }, []);

  return { active, navigateTo };
}

function TocLinks({
  entries,
  active,
  indicatorId,
  onNavigate,
}: {
  entries: TocEntry[];
  active: string | null;
  /** distinct per rendered list so the pill never jumps between them */
  indicatorId: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav className="space-y-1">
      {entries.map((e) => {
        const isActive = active === e.id;
        return (
          <a
            key={e.id}
            href={`#${e.id}`}
            aria-current={isActive ? "location" : undefined}
            onClick={(ev) => {
              ev.preventDefault();
              onNavigate(e.id);
            }}
            className={cn(
              "relative block rounded-md px-2 py-1.5 text-sm transition-colors duration-200",
              isActive
                ? "text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.div
                layoutId={indicatorId}
                className="absolute inset-0 rounded-md border-l-2 border-primary bg-sidebar-accent shadow-[inset_0_0_12px_rgba(99,102,241,0.08)]"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10">{e.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

export function HelpToc({ entries }: { entries: TocEntry[] }) {
  const { active, navigateTo } = useActiveSection(entries);

  return (
    <>
      {/* Desktop: sticky within the grid area, following the scroll */}
      <aside className="sticky top-2 hidden lg:block">
        <div className="rounded-md border bg-transparent p-3 backdrop-blur-md">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            On this page
          </p>
          <TocLinks
            entries={entries}
            active={active}
            indicatorId="help-toc-desktop"
            onNavigate={navigateTo}
          />
        </div>
      </aside>

      {/* Mobile: collapsible block at top of content */}
      <Collapsible className="rounded-md border bg-transparent backdrop-blur-md lg:hidden">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium">
          <span className="flex items-center gap-2">
            <List className="h-4 w-4" />
            On this page
          </span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t px-2 py-2">
          <TocLinks
            entries={entries}
            active={active}
            indicatorId="help-toc-mobile"
            onNavigate={navigateTo}
          />
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
