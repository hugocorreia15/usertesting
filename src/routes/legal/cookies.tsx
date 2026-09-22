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
      <p>
        This policy describes the information stored on your device when you
        use this instance of Avalux, and the choices available to you.
      </p>

      <Section heading="1. Scope">
        <p>
          Avalux stores most of this information in your browser's local
          storage rather than in cookies. Article 5(3) of Directive 2002/58/EC,
          as transposed in Portugal by Article 5 of Lei n.º 41/2004, applies to
          the storing of information on, and the gaining of access to
          information stored on, a user's terminal equipment regardless of the
          technology used. Consent is therefore required except where the
          storage is strictly necessary to provide the service you have
          requested.
        </p>
      </Section>

      <Section heading="2. Information stored">
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

      <Section heading="3. Strictly necessary items">
        <p>
          The items identified as strictly necessary are not subject to
          consent, as the service cannot be provided without them: an
          authenticated session is required to remain signed in, and the task
          timer is required for a live session to survive a page reload without
          loss of measurement. None of these items is used for tracking, and
          none is disclosed to a third party.
        </p>
      </Section>

      <Section heading="4. Optional items and consent">
        <p>
          Error monitoring and the embedded walkthrough video are not strictly
          necessary and are disabled until consent is given. Consent may be
          withdrawn at any time through the settings below. Withdrawal takes
          effect immediately for the embedded video; error monitoring ceases on
          the next page load, as it cannot reliably be terminated once
          initialised.
        </p>
        <p>
          Your choice is recorded in your browser and is versioned. Where the
          purposes described in this policy change, a previous choice is
          treated as no longer given and consent is requested again.
        </p>
        <CookieSettingsButton />
      </Section>

      <Section heading="5. Withdrawing consent and clearing stored data">
        <p>
          Clearing site data in your browser removes all information described
          in this policy, including your recorded choice, in which case consent
          will be requested again on your next visit. Signing out terminates
          the authenticated session.
        </p>
        <p>
          The processing of personal data more generally is described in the{" "}
          <Link className="underline" to="/legal/privacy">
            privacy policy
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
