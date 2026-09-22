import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/legal/legal-page";
import { LEGAL_ENTITY } from "@/lib/legal";

export const Route = createFileRoute("/legal/privacy")({
  component: PrivacyPolicy,
});

const E = LEGAL_ENTITY;
const OPERATOR = E.controllerName || "the operator of this instance";

function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy policy"
      description="How personal data is processed on this instance of Avalux"
    >
      <p>
        This policy explains how personal data is processed when you use this
        instance of Avalux, and sets out your rights under Regulation (EU)
        2016/679 (GDPR) and Lei n.º 58/2019.
      </p>

      <Section heading="1. Controller">
        <p>
          For data relating to account holders, the controller is{" "}
          {E.controllerName || "the operator of this instance"}
          {E.address ? `, ${E.address}` : ""}
          {E.contactEmail ? (
            <>
              , contactable at{" "}
              <a className="underline" href={`mailto:${E.contactEmail}`}>
                {E.contactEmail}
              </a>
            </>
          ) : null}
          .
        </p>
        <p>
          For data relating to study participants, the controller is the
          researcher, organization, or institution that invited the
          participant. That party determines the purposes and means of
          processing. {OPERATOR} acts as a processor on their behalf and hosts
          the data they collect. A participant wishing to exercise their rights
          should contact the research team that conducted the study; where that
          is not possible, a request may be sent to the address above and will
          be forwarded.
        </p>
      </Section>

      <Section heading="2. Categories of data processed">
        <p>Account holders:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Email address and, where provided, a display name.</li>
          <li>
            Content created while conducting research: protocols, observer
            notes, inspection findings, reflections, and review decisions.
          </li>
          <li>Organization and project membership.</li>
        </ul>
        <p>Study participants, where collected by the research team:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            A name or identifying label, and where applicable an email address
            for the purpose of issuing an invitation.
          </li>
          <li>
            Study-specific attributes defined by the research team, which may
            include age, occupation, or self-reported experience.
          </li>
          <li>
            Session data: task outcomes, timings, counts of actions, errors and
            hesitations, and responses to task questions, interviews, and
            questionnaires.
          </li>
          <li>
            Audio, video, or photographic recordings, where the protocol
            provides for them and where captured on the participant's own
            device.
          </li>
          <li>The time and method of consent.</li>
        </ul>
      </Section>

      <Section heading="3. Purposes and legal bases">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            Provision of the service to account holders: performance of a
            contract, Article 6(1)(b) GDPR.
          </li>
          <li>
            Security, abuse prevention, and error diagnosis: legitimate
            interests, Article 6(1)(f) GDPR.
          </li>
          <li>
            Optional error monitoring and the embedded walkthrough video:
            consent, Article 6(1)(a) GDPR, obtained through the cookie settings
            and withdrawable at any time.
          </li>
          <li>
            Participant data: the basis established by the research team,
            ordinarily consent under Article 6(1)(a) GDPR obtained before the
            session, and where recordings or special categories of data are
            involved, the corresponding basis under Article 9 GDPR.
          </li>
        </ul>
      </Section>

      <Section heading="4. Recipients and third-party processors">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Supabase</strong>, providing database hosting,
            authentication, and file storage in {E.hostingRegion}. Media files
            are held in a private bucket and served through short-lived signed
            URLs.
          </li>
          <li>
            <strong>Vercel</strong>, providing application hosting.
          </li>
          <li>
            <strong>Sentry</strong>, providing error monitoring, only where
            consent has been given. It is configured not to transmit personal
            data or session recordings; attached identifiers are opaque and
            cannot be resolved to an individual without this platform's
            database.
          </li>
          <li>
            <strong>YouTube or Vimeo</strong>, where the user chooses to load
            the walkthrough video on the help page.
          </li>
          <li>
            <strong>The configured model provider</strong>, where an
            organization has enabled model-assisted features. Section 5 applies.
          </li>
        </ul>
        <p>
          Personal data is not sold, and is not used for advertising or
          automated profiling.
        </p>
      </Section>

      <Section heading="5. Model-assisted processing">
        <p>
          Where an organization enables model-assisted features, written
          findings may be transmitted to the configured model provider for the
          purpose of proposing groupings of related observations.
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            Text written by members of a research team may be transmitted once
            the team has completed its own analysis.
          </li>
          <li>
            Text written by participants is transmitted only where the study
            has separately enabled that option, where the study's consent text
            includes the required disclosure, and only for sessions in which
            consent was accepted after that option was enabled. A study
            conducted before that point cannot be included retrospectively.
          </li>
          <li>
            Names, email addresses, identifiers, and dates are not transmitted.
            Sessions are referred to by number.
          </li>
          <li>
            Where the model provider is established outside the European
            Economic Area, the operator of the deployment is responsible for
            ensuring an appropriate transfer mechanism under Chapter V GDPR.
          </li>
        </ul>
      </Section>

      <Section heading="6. Retention">
        <p>
          Study data is retained until deleted by the research team that
          collected it; that team determines the retention period. Account data
          is retained for the lifetime of the account. A participant may be
          anonymized, which irreversibly removes identifying details from every
          session in which that person took part while retaining the
          measurements.
        </p>
      </Section>

      <Section heading="7. International transfers">
        <p>
          Database and file storage are located in {E.hostingRegion}. Where a
          processor named in section 4 processes data outside the European
          Economic Area, that transfer is carried out under the safeguards
          provided for in Chapter V GDPR, ordinarily standard contractual
          clauses.
        </p>
      </Section>

      <Section heading="8. Your rights">
        <p>
          You have the right to request access to your personal data, its
          rectification or erasure, restriction of processing, and data
          portability, and to object to processing carried out on the basis of
          legitimate interests. Where processing is based on consent, you may
          withdraw that consent at any time; withdrawal does not affect the
          lawfulness of processing carried out before it.
        </p>
        <p>
          Requests may be sent to{" "}
          {E.contactEmail ? (
            <a className="underline" href={`mailto:${E.contactEmail}`}>
              {E.contactEmail}
            </a>
          ) : (
            "the contact address for this deployment"
          )}
          . Requests concerning study data are addressed in the first instance
          to the research team identified in section 1.
        </p>
        <p>
          You have the right to lodge a complaint with a supervisory authority.
          In Portugal this is the{" "}
          <a
            className="underline"
            href={E.supervisoryAuthorityUrl}
            target="_blank"
            rel="noreferrer"
          >
            {E.supervisoryAuthority}
          </a>
          .
        </p>
      </Section>

      <Section heading="9. Storage on your device">
        <p>
          Information stored in your browser, and the choices available to you,
          are described in the{" "}
          <Link className="underline" to="/legal/cookies">
            cookie policy
          </Link>
          .
        </p>
      </Section>

      <Section heading="10. Children">
        <p>
          The platform is not directed at children. Where a study involves
          participants under the age of 16, the research team conducting it is
          responsible for obtaining consent from a holder of parental
          responsibility and for satisfying the ethics requirements of its
          institution.
        </p>
      </Section>

      <Section heading="11. Changes to this policy">
        <p>
          This policy may be updated from time to time. The date of the current
          version appears at the foot of this page.
        </p>
      </Section>
    </LegalPage>
  );
}
