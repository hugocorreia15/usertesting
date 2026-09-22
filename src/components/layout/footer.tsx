import { Link } from "@tanstack/react-router";
import { CookieSettingsButton } from "@/components/legal/cookie-settings";
import { useConsent } from "@/hooks/use-consent";

/**
 * The legal footer. Kept to what a visitor has a right to find easily: who
 * they are dealing with, what is done with their data, and the means to change
 * their mind about the optional parts.
 */
export function Footer() {
  const { pending } = useConsent();

  return (
    // The top margin is the point: without it the rule sits against whatever
    // card ends the page and reads as part of it rather than as the end.
    <footer
      className={`mt-12 border-t px-6 pt-8 text-sm md:mt-16 ${
        // The cookie banner is fixed to the bottom of the viewport, so while it
        // is showing it would sit on top of these links.
        pending ? "pb-44 sm:pb-36" : "pb-10"
      }`}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
