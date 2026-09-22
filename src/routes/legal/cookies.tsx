import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/legal/legal-page";
import { CookieSettingsButton } from "@/components/legal/cookie-settings";
import { CONSENT_STORAGE_KEY } from "@/lib/consent-preferences";

export const Route = createFileRoute("/legal/cookies")({
  component: CookiePolicy,
});

/** Everything this app puts in a browser, named, with why and for how long. */
const STORED = [
  {
    name: "sb-* (Supabase auth)",
    purpose: "Keeps you signed in. Without it every page would ask you to log in again.",
    kind: "Strictly necessary",
    life: "Until you sign out, or the session expires",
  },
  {
    name: CONSENT_STORAGE_KEY,
    purpose: "Remembers this page's answer, so you are not asked again and can withdraw.",
    kind: "Strictly necessary",
    life: "Until you change or clear it",
  },
  {
    name: "avalux-lang, theme",
    purpose: "Your chosen language and light or dark appearance.",
    kind: "Strictly necessary",
    life: "Until you change or clear it",
  },
  {
    name: "avalux-timer-*",
    purpose:
      "The running task timer for a live session, so a reload or a browser crash mid-task does not lose the measurement.",
    kind: "Strictly necessary",
    life: "Until the task ends",
  },
  {
    name: "view mode",
    purpose: "Whether a list is shown as cards or as a table.",
    kind: "Strictly necessary",
    life: "Until you change or clear it",
  },
  {
    name: "Sentry",
    purpose:
      "Reports errors so they can be fixed. Configured to send no personal data and no session recordings.",
    kind: "Optional, off unless you agree",
    life: "For the visit",
  },
  {
    name: "YouTube or Vimeo",
    purpose:
      "The walkthrough video on the help page. Their player sets its own storage once loaded.",
    kind: "Optional, off unless you load it",
    life: "Set by the video host",
  },
];

function CookiePolicy() {
  return (
    <LegalPage
      title="Cookie policy"
      description="What is stored in your browser, and what you can refuse"
    >
      <Section heading="Mostly not cookies">
        <p>
          Almost nothing here is a cookie in the technical sense. The platform
          keeps what it needs in your browser's local storage instead. The law
          does not care about the mechanism: storing or reading anything on your
          device needs your consent unless it is strictly necessary to provide
          the service you asked for, so that is the line this page draws.
        </p>
      </Section>

      <Section heading="What is stored">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4 font-semibold">Name</th>
                <th className="py-2 pr-4 font-semibold">What for</th>
                <th className="py-2 pr-4 font-semibold">Needs consent</th>
                <th className="py-2 font-semibold">How long</th>
              </tr>
            </thead>
            <tbody>
              {STORED.map((row) => (
                <tr key={row.name} className="border-b align-top">
                  <td className="py-2.5 pr-4 font-mono text-xs">{row.name}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{row.purpose}</td>
                  <td className="py-2.5 pr-4">{row.kind}</td>
                  <td className="py-2.5 text-muted-foreground">{row.life}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section heading="Why some of it is not offered as a choice">
        <p>
          The items marked strictly necessary are not presented as options,
          because refusing them would mean refusing the service: you cannot stay
          signed in without a session, and a live session cannot survive a
          reload without its timer. Offering a switch that cannot honestly be
          turned off would be worse than offering none. None of them tracks you,
          and none is shared with anyone.
        </p>
      </Section>

      <Section heading="What you can refuse, and change your mind about">
        <p>
          Error monitoring and the embedded video are optional. Both are off
          until you say otherwise, and you can withdraw as easily as you agreed.
          Withdrawal stops the video immediately; error monitoring stops on the
          next page load, because it cannot be reliably torn down once started.
        </p>
        <CookieSettingsButton />
      </Section>

      <Section heading="Clearing everything">
        <p>
          Clearing site data in your browser removes all of it, including your
          answer to this question, which means you will be asked again. Signing
          out removes the session.
        </p>
        <p>
          What happens to personal data more broadly is in the{" "}
          <Link className="underline" to="/legal/privacy">privacy policy</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}
