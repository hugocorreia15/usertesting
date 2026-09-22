import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/legal/legal-page";
import { LEGAL_ENTITY } from "@/lib/legal";

export const Route = createFileRoute("/legal/terms")({
  component: TermsOfService,
});

const E = LEGAL_ENTITY;
const OPERATOR = E.controllerName || "the operator of this instance";

function TermsOfService() {
  return (
    <LegalPage
      title="Terms of service"
      description="The terms on which this instance of Avalux may be used"
    >
      <p>
        Welcome to Avalux. By accessing or using this instance, you agree to
        these Terms of Service. If you do not agree, do not use the platform.
      </p>
      <p>
        This instance is operated by {OPERATOR}. Avalux is open source
        software; these Terms govern this deployment only and do not apply to
        other instances operated by others.
      </p>

      <Section heading="1. Platform services">
        <p>
          Avalux provides tools for planning and conducting moderated usability
          studies, including reusable test protocols, a live evaluator
          interface for structured logging, a participant client, standardized
          post-session questionnaires, heuristic inspection and synthesis,
          analysis and reporting, organization and classroom management, and
          optional model-assisted grouping of written findings.
        </p>
      </Section>

      <Section heading="2. Eligibility and accounts">
        <ul className="ml-5 list-disc space-y-1">
          <li>You must be at least 16 years old to hold an account.</li>
          <li>
            You must provide accurate account information and keep your
            credentials secure.
          </li>
          <li>You are responsible for all activity carried out under your account.</li>
          <li>
            Accounts may be suspended or terminated for abuse, misuse of
            participant data, violation of these Terms, or where required by
            law.
          </li>
        </ul>
        <p>
          Participants in a study do not require an account and join by link.
          Where a study involves participants under 16, the research team is
          responsible for obtaining consent from a holder of parental
          responsibility.
        </p>
      </Section>

      <Section heading="3. Research conducted on the platform">
        <p>
          Users who create studies on Avalux do so as researchers and accept
          the obligations that follow from that role:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            You determine the purposes and means of processing participant
            data and are the data controller for it. {OPERATOR} acts as a
            processor on your behalf.
          </li>
          <li>
            You must obtain informed consent before collecting participant
            data and inform participants of what will be recorded. The platform
            provides a consent step and records the time of acceptance; it does
            not assess the adequacy of your wording.
          </li>
          <li>
            You must hold any ethics approval required by your institution.
          </li>
          <li>
            You must not upload data concerning persons who have not agreed to
            take part, and must not record any person who has not been informed.
          </li>
          <li>
            You are responsible for the accuracy and lawfulness of the data you
            submit.
          </li>
        </ul>
        <p>
          Avalux is a platform provider and does not warrant the validity,
          reliability, or scientific adequacy of any study conducted using it.
        </p>
      </Section>

      <Section heading="4. Model-assisted features">
        <p>
          Avalux offers optional features in which a language model proposes
          groupings of written findings into candidate usability problems.
          These features are disabled by default and may be enabled only by an
          organization owner.
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            Where enabled, text written by members of a research team may be
            transmitted to the configured model provider for processing.
          </li>
          <li>
            Text written by participants is transmitted only where the relevant
            study has separately enabled that option, where the study's consent
            text includes the disclosure required by the platform, and only for
            sessions in which consent was accepted after that option was
            enabled. Names, email addresses, identifiers, and dates are not
            transmitted.
          </li>
          <li>
            Model output is assistive only. No proposal is applied
            automatically; a user must accept it, and accepted items are
            recorded as assisted.
          </li>
          <li>
            The operator of a deployment selects the model provider and is
            responsible for that choice, including the provider's own terms and
            its treatment of transmitted data.
          </li>
          <li>
            Avalux does not warrant the accuracy, completeness, or fitness of
            any model-generated output.
          </li>
        </ul>
      </Section>

      <Section heading="5. Data protection responsibilities of research teams">
        <p>
          Organizations and individuals who use Avalux to collect participant
          data act as independent data controllers for that data. {OPERATOR}
          acts as a data processor on their behalf. Such users accept
          responsibility for:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            Complying with applicable data protection law, including Regulation
            (EU) 2016/679 (GDPR) and Lei n.º 58/2019 in Portugal.
          </li>
          <li>
            Providing participants with an appropriate privacy notice before
            data is collected.
          </li>
          <li>
            Establishing and documenting a lawful basis for processing,
            including for any audio, video, or photographic recording.
          </li>
          <li>
            Responding to participant requests to exercise their rights of
            access, rectification, erasure, restriction, portability, and
            objection within the periods required by law.
          </li>
          <li>
            Notifying the competent supervisory authority, and where required
            the affected participants, of a personal data breach.
          </li>
          <li>
            Determining retention periods and deleting or anonymizing data when
            it is no longer required.
          </li>
        </ul>
      </Section>

      <Section heading="6. User content and conduct">
        <ul className="ml-5 list-disc space-y-1">
          <li>You remain responsible for content you upload or submit.</li>
          <li>
            You must not upload unlawful, infringing, deceptive, or harmful
            content.
          </li>
          <li>
            You must not misuse platform features, attempt unauthorized access,
            attempt to access data belonging to other users, or disrupt the
            service.
          </li>
        </ul>
      </Section>

      <Section heading="7. Fees">
        <p>
          This instance is provided without charge. No payment features are
          offered, and no payment data is collected.
        </p>
      </Section>

      <Section heading="8. Third-party services">
        <p>
          Avalux relies on the following third-party services. Your use of them
          may be subject to their own terms:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Supabase, for database hosting, authentication, and file storage.</li>
          <li>Vercel, for application hosting.</li>
          <li>Sentry, for error monitoring, where enabled and consented to.</li>
          <li>
            YouTube or Vimeo, for the walkthrough video on the help page, where
            loaded by the user.
          </li>
          <li>
            The configured model provider, where model-assisted features are
            enabled by an organization.
          </li>
        </ul>
      </Section>

      <Section heading="9. Data portability and export">
        <p>
          Protocols, results, and recordings created by a user remain that
          user's content. {OPERATOR} is granted only the rights necessary to
          store, process, and display that content in order to provide the
          service. All study data may be exported at any time in CSV, JSON, or
          PDF format.
        </p>
      </Section>

      <Section heading="10. Availability and changes">
        <p>
          The platform may be modified, suspended, or discontinued in whole or
          in part at any time, including features and limits. No guarantee of
          availability is provided.
        </p>
      </Section>

      <Section heading="11. Intellectual property">
        <p>
          Except for user-provided content, the platform software, branding,
          and materials are owned by their respective authors and licensors and
          are made available under the licence accompanying the source code.
        </p>
      </Section>

      <Section heading="12. Disclaimer">
        <p>
          The platform is provided on an "as is" and "as available" basis,
          without warranties of any kind, to the maximum extent permitted by
          law. It is research and teaching software and is not intended for use
          as a clinical, safety-critical, or system of record.
        </p>
      </Section>

      <Section heading="13. Limitation of liability">
        <p>
          To the maximum extent permitted by law, {OPERATOR} is not liable for
          indirect, incidental, special, consequential, or punitive damages, or
          for loss of data, revenue, opportunity, or profit arising from use of
          the platform.
        </p>
        <p>
          Nothing in these Terms excludes or limits liability that cannot
          lawfully be excluded or limited, including liability for death or
          personal injury caused by negligence, for fraud, or under mandatory
          consumer protection law.
        </p>
      </Section>

      <Section heading="14. Indemnification">
        <p>
          You agree to indemnify and hold harmless {OPERATOR} against claims,
          liabilities, and costs arising out of your use of the platform, the
          content you submit, the studies you conduct, or your breach of these
          Terms.
        </p>
      </Section>

      <Section heading="15. Governing law">
        <p>
          These Terms are governed by the laws of Portugal, without regard to
          conflict of law principles, and the courts of Portugal have
          jurisdiction. Mandatory consumer protections and data protection
          rights applicable in your jurisdiction are not waived by this
          agreement. In particular, the rights of residents of the European
          Union and the United Kingdom under the GDPR and UK GDPR are preserved
          in full.
        </p>
      </Section>

      <Section heading="16. Updates to these Terms">
        <p>
          These Terms may be updated from time to time. The date of the current
          version appears at the foot of this page. Continued use of the
          platform after an update constitutes acceptance of the revised Terms.
        </p>
      </Section>

      <Section heading="17. Contact">
        <p>
          Questions regarding these Terms may be sent to{" "}
          {E.contactEmail ? (
            <a className="underline" href={`mailto:${E.contactEmail}`}>
              {E.contactEmail}
            </a>
          ) : (
            "the contact address for this deployment"
          )}
          . The handling of personal data is described in the{" "}
          <Link className="underline" to="/legal/privacy">
            privacy policy
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
