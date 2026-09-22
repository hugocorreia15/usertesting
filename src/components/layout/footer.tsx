import { Link } from "@tanstack/react-router";
import { CookieSettingsButton } from "@/components/legal/cookie-settings";

/**
 * The legal footer. Kept to what a visitor has a right to find easily: who
 * they are dealing with, what is done with their data, and the means to change
 * their mind about the optional parts.
 */
export function Footer() {
  return (
    <footer className="border-t px-6 py-6 text-sm">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Avalux. Open source, self-hostable.
        </p>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            to="/legal/terms"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Terms of service
          </Link>
          <Link
            to="/legal/privacy"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Privacy policy
          </Link>
          <Link
            to="/legal/cookies"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Cookie policy
          </Link>
          <CookieSettingsButton variant="ghost" />
        </nav>
      </div>
    </footer>
  );
}
