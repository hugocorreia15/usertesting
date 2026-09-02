import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Codes the current visitor has proven possession of by opening a join link.
 *
 * Participant-facing RLS is possession-based (migration 048): a policy grants
 * a row only when the request carries the secret for it. These are attached to
 * every outgoing request as headers, which Postgres reads back through
 * `current_setting('request.headers')`.
 *
 * Empty for the evaluator app, which is authorized by its session instead.
 */
let participantCodes: { join?: string; invite?: string } = {};

/**
 * Called by the join route with the code from the URL, which may be either an
 * invitation code or a session join code. Both headers are sent: each policy
 * checks the one belonging to its own table, so an unmatched code simply
 * grants nothing.
 */
export function setParticipantCodes(codes: { join?: string; invite?: string }) {
  participantCodes = codes;
}

export function clearParticipantCodes() {
  participantCodes = {};
}

// Injected per request rather than at construction, so a single client can
// follow the visitor from invitation code to session join code.
const fetchWithParticipantCodes: typeof fetch = (input, init = {}) => {
  const headers = new Headers(init.headers);
  if (participantCodes.invite) headers.set("x-invite-code", participantCodes.invite);
  if (participantCodes.join) headers.set("x-join-code", participantCodes.join);
  return fetch(input, { ...init, headers });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithParticipantCodes },
});
