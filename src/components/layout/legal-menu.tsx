import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, FileText, Scale, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CookieSettingsDialog } from "@/components/legal/cookie-settings";

/**
 * The legal links, beside the lamp in the header.
 *
 * One small control rather than four links, because the header is a single
 * row that also holds the breadcrumbs, and on a phone four links would push
 * them off the screen. The same menu sits in the corner of the pages that have
 * no header, sign-in and the participant's session, since those are exactly
 * where someone agrees to something and must be able to read what.
 */
export function LegalMenu() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Legal"
            tooltip="Terms, privacy and cookies"
            className="shrink-0 cursor-pointer"
          >
            <Scale className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Legal
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link to="/legal/terms">
              <FileText className="mr-2 h-4 w-4" />
              Terms of service
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/legal/privacy">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Privacy policy
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/legal/cookies">
              <Cookie className="mr-2 h-4 w-4" />
              Cookie policy
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Opened by state: a menu item that triggered the dialog directly
              would close the menu, and the dialog with it. */}
          <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
            <Cookie className="mr-2 h-4 w-4" />
            Cookie settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CookieSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
