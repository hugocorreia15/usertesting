import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/legal/legal-page";
import { LEGAL_ENTITY } from "@/lib/legal";

export const Route = createFileRoute("/legal/privacy")({
  component: PrivacyPolicy,
});

const E = LEGAL_ENTITY;
const who = E.controllerName || "the operator of this instance";

function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy policy"
      description="What this platform does with personal data, and who answers for it"
    >
      <Section heading="Two different roles, and why it matters to you">
        <p>
          This platform is used to run usability studies. That means two very
          different kinds of personal data pass through it, with different
          people answering for each, and the honest thing is to say so first
          rather than write one notice that blurs them.
        </p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            <strong>If you have an account here</strong>, as a researcher,
            evaluator, student or instructor, {who} is the controller of your
            account data.
          </li>
          <li>
            <strong>If you took part in a study</strong> as a participant, the
            controller is the researcher or institution that invited you, not
            this platform. They decided to run the study, chose what to ask and
            what to record. {who} acts as a processor on their instructions,
            and hosts what they collect. If you want your data from a study,
            ask the team that ran it; if you cannot reach them, write to us and
            we will pass it on.
          </li>
        </ul>
      </Section>

      <Section heading="What is collected">
        <p>Account holders:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Email address and, if you provide one, a display name.</li>
          <li>What you write while running a study: protocols, observer notes, inspection findings, reflections, and review decisions.</li>
          <li>Which organizations and projects you belong to.</li>
        </ul>
        <p>Study participants, where the research team chooses to collect them:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>A name or label, and optionally an email address, so a session can be identified and an invitation sent.</li>
          <li>Study-specific attributes the team defined, which may include age, occupation or self-reported experience.</li>
          <li>What happens during the session: task outcomes, timings, counts of actions, errors and hesitations, and answers to task questions, interviews and questionnaires.</li>
          <li>Audio, video or photographs, only where the protocol asks for them and only from your own device.</li>
          <li>The time consent was accepted, and how it was given.</li>
        </ul>
      </Section>

      <Section heading="Legal bases">
        <p>
          For account holders, processing is necessary to provide the service
          you asked for (Article 6(1)(b) GDPR), and for security and error
          diagnosis in our legitimate interests (Article 6(1)(f)).
        </p>
        <p>
          For participants, the research team relies on the consent you gave
          before the session began (Article 6(1)(a)), or another basis they
          identified to you. Recordings of your voice or face, and anything
          revealing a special category of data, are processed only on the basis
          the research team established with you.
        </p>
      </Section>

      <Section heading="Who else sees it">
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            <strong>Hosting.</strong> The database and files are hosted by
            Supabase, in {E.hostingRegion}. Media are held in a private bucket
            and served through short-lived signed links.
          </li>
          <li>
            <strong>Error monitoring.</strong> Only if you agreed to it. It
            reports faults to Sentry and is configured to send no personal data
            and no session recordings: the identifiers attached are opaque and
            cannot be resolved to a person without this platform's database.
          </li>
          <li>
            <strong>The video on the help page.</strong> Only if you chose to
            load it, in which case your browser contacts the video host.
          </li>
          <li>
            <strong>Model assistance, if a deployment enables it.</strong> A
            language model may be asked to group written findings into problems.
            What a research team wrote can be sent once their own work is done.
            What a participant wrote is sent only for studies that turned that on
            and whose consent text said so, and only for sessions whose consent
            was accepted after that point: a study that already ran cannot be
            included retroactively. Names, email addresses, identifiers and
            dates are never sent; sessions are numbered.
          </li>
        </ul>
        <p>
          Nothing here is sold, and nothing is used for advertising or
          profiling.
        </p>
      </Section>

      <Section heading="How long it is kept">
        <p>
          Study data is kept until the research team deletes it or closes the
          study; they decide retention, because it is their research. Account
          data is kept while the account exists. A participant can be
          anonymized, which permanently strips identifying details from every
          session that person took part in while leaving the measurements
          intact; this cannot be undone.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          You may request access to your data, correction, erasure, restriction,
          portability, and you may object to processing based on legitimate
          interests. Where processing rests on consent, you may withdraw it at
          any time, which does not affect what was lawful before.
        </p>
        <p>
          Write to{" "}
          {E.contactEmail ? (
            <a className="underline" href={`mailto:${E.contactEmail}`}>{E.contactEmail}</a>
          ) : (
            "the address on this page"
          )}
          . For study data, the research team that invited you answers first.
          You also have the right to complain to a supervisory authority, in
          Portugal the{" "}
          <a className="underline" href={E.supervisoryAuthorityUrl} target="_blank" rel="noreferrer">
            {E.supervisoryAuthority}
          </a>
          .
        </p>
      </Section>

      <Section heading="Storage on your device">
        <p>
          What is stored in your browser, and what you can refuse, is set out in
          the <Link className="underline" to="/legal/cookies">cookie policy</Link>.
        </p>
      </Section>

      <Section heading="Children">
        <p>
          The platform is not directed at children. A study involving minors is
          the responsibility of the research team running it, who must obtain
          consent from a holder of parental responsibility and satisfy their own
          institution's ethics requirements before collecting anything.
        </p>
      </Section>
    </LegalPage>
  );
}
