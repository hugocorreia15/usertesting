import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, List } from "lucide-react";

export interface TocEntry {
  id: string;
  label: string;
}

function TocLinks({ entries }: { entries: TocEntry[] }) {
  return (
    <nav className="space-y-1">
      {entries.map((e) => (
        <a
          key={e.id}
          href={`#${e.id}`}
          className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {e.label}
        </a>
      ))}
    </nav>
  );
}

export function HelpToc({ entries }: { entries: TocEntry[] }) {
  return (
    <>
      {/* Desktop: sticky sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 rounded-md border bg-transparent p-3 backdrop-blur-md">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            On this page
          </p>
          <TocLinks entries={entries} />
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
          <TocLinks entries={entries} />
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
