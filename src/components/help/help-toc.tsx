import { useEffect, useState } from "react";
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
// band of the scrollport.
function useActiveSection(entries: TocEntry[]) {
  const [active, setActive] = useState<string | null>(entries[0]?.id ?? null);

  useEffect(() => {
    const scroller = document.querySelector("main");
    if (!scroller) return;

    const onScroll = () => {
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

  return active;
}

function TocLinks({
  entries,
  active,
}: {
  entries: TocEntry[];
  active: string | null;
}) {
  return (
    <nav className="space-y-1">
      {entries.map((e) => (
        <a
          key={e.id}
          href={`#${e.id}`}
          aria-current={active === e.id ? "location" : undefined}
          className={cn(
            "block rounded-md px-2 py-1.5 text-sm transition-colors",
            active === e.id
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {e.label}
        </a>
      ))}
    </nav>
  );
}

export function HelpToc({ entries }: { entries: TocEntry[] }) {
  const active = useActiveSection(entries);

  return (
    <>
      {/* Desktop: sticky within the grid area, following the scroll */}
      <aside className="sticky top-2 hidden lg:block">
        <div className="rounded-md border bg-transparent p-3 backdrop-blur-md">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            On this page
          </p>
          <TocLinks entries={entries} active={active} />
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
          <TocLinks entries={entries} active={active} />
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
