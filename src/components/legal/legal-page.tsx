import type { ReactNode } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { LEGAL_ENTITY, LEGAL_LAST_UPDATED, entityIsConfigured } from "@/lib/legal";

/**
 * The frame shared by every legal page: a readable column, the date the
 * current version took effect, and a notice where the deployment has not been
 * configured with a controller. A policy that names nobody cannot function as
 * a notice, so this is stated rather than left for a reader to discover.
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
              This deployment has not been configured.
            </p>
            <p className="mt-1 text-amber-800/90 dark:text-amber-300/90">
              The operator of this instance has not provided a name, postal
              address, or contact address. This page describes the behaviour of
              the software but identifies no controller and does not constitute
              a notice for this instance.
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
