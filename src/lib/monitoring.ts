// Client error monitoring (Sentry). Entirely inert unless a DSN is
// configured via VITE_SENTRY_DSN, so local/dev and DSN-less deploys
// behave exactly as before. Participant privacy: no PII is sent —
// no replays, no default PII, and context tags carry only opaque
// UUIDs (session/template ids), never names, emails, or answers.

import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initMonitoring() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      // strip anything resembling form data or request bodies
      if (event.request) delete event.request;
      return event;
    },
  });
}

export function captureError(error: unknown, context?: Record<string, string>) {
  if (!dsn) return;
  Sentry.captureException(error, context ? { tags: context } : undefined);
}

// Tag the active session so dashboard events group by study session.
// Only opaque identifiers — never participant data.
export function setSessionContext(tags: {
  sessionId?: string;
  templateId?: string;
  role?: "evaluator" | "participant";
}) {
  if (!dsn) return;
  Sentry.setTags({
    session_id: tags.sessionId ?? null,
    template_id: tags.templateId ?? null,
    role: tags.role ?? null,
  });
}
