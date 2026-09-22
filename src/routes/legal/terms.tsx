import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/legal/legal-page";
import { LEGAL_ENTITY } from "@/lib/legal";

export const Route = createFileRoute("/legal/terms")({
  component: TermsOfService,
});

const E = LEGAL_ENTITY;
const who = E.controllerName || "the operator of this instance";

function TermsOfService() {
  return (
    <LegalPage
      title="Terms of service"
      description="The terms on which this instance may be used"
    >
      <Section heading="Who these terms are between">
        <p>
          They are between you and {who}, who operates this instance. Avalux
          itself is open source software; anyone may run their own copy, and
          these terms cover this deployment only.
        </p>
      </Section>

      <Section heading="Accounts">
        <p>
          You need an account to run studies. Keep your credentials to
          yourself, give accurate contact details, and tell us if you believe
          someone else has used your account. You are responsible for what is
          done through it.
        </p>
      </Section>

      <Section heading="What you are responsible for when you run a study">
        <p>
          This is the important part, and it is not boilerplate. When you run a
          study here, you are the researcher and you carry the obligations that
          go with it:
        </p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            You decide what to collect, and you are the data controller for it.
            The platform holds it on your behalf.
          </li>
          <li>
            You must obtain informed consent before collecting anything, and
            tell participants what will be recorded. The platform gives you a
            consent step and timestamps acceptance; it cannot tell you whether
            your wording is adequate for your institution.
          </li>
          <li>
            You must have whatever ethics approval your institution requires.
          </li>
          <li>
            You must not upload data about people who did not agree to take
            part, and must not record anyone who has not been told.
          </li>
          <li>
            If you enable model assistance, you are responsible for the choice,
            including where you point it and what that provider does with what
            it receives.
          </li>
        </ul>
      </Section>

      <Section heading="Acceptable use">
        <p>
          Do not use the platform to break the law, to harass anyone, to
          circumvent its access controls, to attempt to read data belonging to
          other people, or to place load on it that would degrade it for others.
          Do not upload malware or content you have no right to.
        </p>
      </Section>

      <Section heading="Your content">
        <p>
          Your protocols, your recordings and your results remain yours. You
          give {who} only the permission needed to store and display them so
          the service works. You can export everything at any time as CSV, JSON
          or PDF, which is deliberate: leaving should not cost you your data.
        </p>
      </Section>

      <Section heading="Availability, and what this service is not">
        <p>
          This instance is provided as it is, without a guarantee of
          availability or fitness for a particular purpose. It is research and
          teaching software, not a clinical, safety or records system, and it
          should not be the only copy of anything you cannot lose. Export your
          studies.
        </p>
        <p>
          To the extent the law allows, {who} is not liable for indirect or
          consequential loss, or for lost data or lost profits. Nothing here
          excludes liability that cannot lawfully be excluded, which for a
          consumer in Portugal includes your statutory rights.
        </p>
      </Section>

      <Section heading="Ending it">
        <p>
          You may stop using the service and ask for your account to be deleted
          at any time. We may suspend an account that breaks these terms, or
          that puts participants' data at risk, and will say why where we
          lawfully can.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          If these terms change materially, the date at the foot of this page
          changes and account holders are told. Continuing to use the service
          after that means accepting the new version.
        </p>
      </Section>

      <Section heading="Law and jurisdiction">
        <p>
          These terms are governed by Portuguese law, and the courts of
          Portugal have jurisdiction. If you are a consumer, this does not
          deprive you of the protection of the mandatory rules of the country
          where you live.
        </p>
        <p>
          How personal data is handled is set out in the{" "}
          <Link className="underline" to="/legal/privacy">privacy policy</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}
