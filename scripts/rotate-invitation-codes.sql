-- ============================================================
-- Rotate exposed invitation codes
-- ============================================================
-- Until migration 048, "Anyone can read active invitations" (007) had no
-- TO clause and a USING (is_active = true) predicate, so every live
-- invitation code was listable by any anonymous caller. Anyone who read
-- them still holds them; closing the policy does not un-share a code.
--
-- New codes use the same shape the app generates
-- (crypto.randomUUID().slice(0, 8)): 8 hex characters.
--
-- ROTATING INVALIDATES OUTSTANDING LINKS. Anyone already sent a join link
-- that has not been used yet will get "invalid link" and needs the new one.
-- Run this when you are ready to re-send.

-- ── Option A: only the two codes surfaced during the audit ──
UPDATE session_invitations AS si
   SET code = substring(gen_random_uuid()::text, 1, 8)
  FROM templates t
 WHERE t.id = si.template_id
   AND si.code IN ('4a113931', '816ad3c9')
RETURNING si.code AS new_code,
          si.is_active,
          si.response_count,
          si.max_responses,
          t.name AS template;

-- ── Option B: every still-active invitation (recommended) ──
-- All of them were readable, not just the two that happened to be printed.
-- Run this INSTEAD of Option A.
--
-- UPDATE session_invitations AS si
--    SET code = substring(gen_random_uuid()::text, 1, 8)
--   FROM templates t
--  WHERE t.id = si.template_id
--    AND si.is_active = true
-- RETURNING si.code AS new_code,
--           si.response_count,
--           si.max_responses,
--           t.name AS template;

-- ── Not covered here: test_sessions.join_code ──
-- Session join codes were exposed by the same audit and are a separate
-- secret. Rotating one kicks that participant out of a session in
-- progress, so only consider it for sessions that have not started:
--
-- UPDATE test_sessions
--    SET join_code = substring(gen_random_uuid()::text, 1, 8)
--  WHERE status = 'planned'
-- RETURNING id, join_code;
