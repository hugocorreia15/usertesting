import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/use-sidebar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LampToggle } from "@/components/layout/lamp-toggle";

export function Header() {
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border/50 backdrop-blur-md bg-transparent px-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapsed}
        className="hidden shrink-0 md:inline-flex"
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </Button>

      <div className="flex-1 min-w-0 px-1">
        <Breadcrumbs />
      </div>

      <LampToggle />
    </header>
  );
}
