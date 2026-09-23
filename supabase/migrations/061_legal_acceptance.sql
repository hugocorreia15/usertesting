-- ============================================================
-- 061 – Recording that a user accepted the terms
-- ============================================================
-- Accepting the terms is a contractual act, so it is recorded rather than
-- inferred: who accepted, which document, which version, and when. A record
-- that cannot say which wording was agreed to is not evidence of anything,
-- which is why the version is stored alongside rather than assumed to be
-- whatever the site shows today.
--
-- WHAT IS AND IS NOT GATED ON THIS
--
-- The terms of service and the privacy notice are conditions of holding an
-- account: one is a contract, the other is information a controller must give
-- under Article 13 GDPR before processing begins.
--
-- The optional purposes in the cookie settings are deliberately NOT recorded
-- here and must never gate access. Consent under Article 4(11) GDPR has to be
-- freely given, and consent extracted as the price of using a service is not
-- freely given; Article 7(4) requires that to be taken into account. Bundling
-- error monitoring into a mandatory "accept to continue" would make that
-- consent invalid and would be worse than not asking. It stays in its own
-- banner, refusable, with the service working either way.
--
-- An acceptance is immutable. There is no update or delete policy, so a row
-- can be written by the person it belongs to and then only read.

CREATE TABLE legal_acceptances (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document    text NOT NULL CHECK (document IN ('terms', 'privacy')),
  -- The version string shown on the page at the moment of acceptance.
  version     text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, document, version)
);

CREATE INDEX idx_legal_acceptances_user ON legal_acceptances(user_id, document);

COMMENT ON TABLE legal_acceptances IS
  'One row per user, document and version. Immutable: written by its owner, then read only. Optional cookie consent is not stored here and never gates access.';

ALTER TABLE legal_acceptances ENABLE ROW LEVEL SECURITY;

-- You may see your own acceptances, and nobody else's.
CREATE POLICY legal_acceptances_read ON legal_acceptances
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- You may record your own acceptance, and only your own. There is no policy
-- for update or delete, so an acceptance cannot be rewritten or withdrawn
-- after the fact; ending the agreement is deleting the account.
CREATE POLICY legal_acceptances_insert ON legal_acceptances
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Has the caller accepted every required document at this version? Asked by
-- the interface on every load, so it is one round trip rather than two.
CREATE OR REPLACE FUNCTION has_accepted_legal(v text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT COUNT(DISTINCT document) = 2
    FROM legal_acceptances
   WHERE user_id = auth.uid()
     AND version = v
     AND document IN ('terms', 'privacy');
$$;

REVOKE ALL ON FUNCTION has_accepted_legal(text) FROM public;
GRANT EXECUTE ON FUNCTION has_accepted_legal(text) TO authenticated;
