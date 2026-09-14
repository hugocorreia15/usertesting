import { Link } from "@tanstack/react-router";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HELP_SECTIONS, type HelpAnchor } from "@/lib/help-anchors";

/**
 * A question-mark button in a page header that opens the help section for
 * that page. The tooltip names the section, so the reader knows where it goes
 * before leaving the page.
 */
export function HelpButton({ section }: { section: HelpAnchor }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      asChild
      tooltip={`Help: ${HELP_SECTIONS[section].replace(/^\d+\.\s*/, "")}`}
      tooltipSide="bottom"
      className="text-muted-foreground hover:text-foreground"
    >
      <Link to="/help" hash={section}>
        <CircleHelp className="h-4 w-4" />
      </Link>
    </Button>
  );
}
