import type { ReactNode } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { LEGAL_ENTITY, LEGAL_LAST_UPDATED, entityIsConfigured } from "@/lib/legal";

/**
 * The frame every legal page shares: a readable column, the date the wording
 * took effect, and an honest warning when the deployment has not yet said who
 * it is. A policy naming nobody is not a policy, so the page says so at the
 * top rather than letting a reader assume it was completed.
 */
export function LegalPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <PageWrapper title={title} description={description}>
      <div className="mx-auto max-w-3xl space-y-6 pb-16">
        {!entityIsConfigured() && (
          <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              This deployment has not been identified yet.
            </p>
            <p className="mt-1 text-amber-800/90 dark:text-amber-300/90">
              Whoever runs this instance must set their name, postal address and
              contact address in <code>src/lib/legal.ts</code>. Until then this
              page describes how the software behaves, but names no controller,
              and cannot be relied on as this instance's notice.
            </p>
          </div>
        )}

        <div className="space-y-5 text-sm leading-relaxed">{children}</div>

        <p className="border-t pt-4 text-xs text-muted-foreground">
          Last updated {new Date(LEGAL_LAST_UPDATED).toLocaleDateString()}.
          {LEGAL_ENTITY.contactEmail ? (
            <>
              {" "}
              Questions:{" "}
              <a className="underline" href={`mailto:${LEGAL_ENTITY.contactEmail}`}>
                {LEGAL_ENTITY.contactEmail}
              </a>
              .
            </>
          ) : null}
        </p>
      </div>
    </PageWrapper>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold">{heading}</h2>
      {children}
    </section>
  );
}
