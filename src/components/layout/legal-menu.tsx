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

const linkClass =
  "whitespace-nowrap text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";

/**
 * The legal links, written out beside the lamp.
 *
 * On a wide screen all four are plain text in the header. Below that they
 * cannot fit beside the breadcrumbs in a single row, so the same four collapse
 * into a small menu rather than wrapping the header or pushing the breadcrumbs
 * off a phone. The pages without a header, sign-in and the participant's
 * session, use the same component in their top right corner, since those are
 * exactly where someone agrees to something.
 */
export function LegalMenu() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <nav aria-label="Legal" className="hidden items-center gap-4 md:flex">
        <Link to="/legal/terms" className={linkClass}>
          Terms of service
        </Link>
        <Link to="/legal/privacy" className={linkClass}>
          Privacy policy
        </Link>
        <Link to="/legal/cookies" className={linkClass}>
          Cookie policy
        </Link>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className={`${linkClass} cursor-pointer`}
        >
          Cookie settings
        </button>
      </nav>

      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Legal"
              className="shrink-0 cursor-pointer"
            >
              <Scale className="size-4" />
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
      </div>

      <CookieSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
