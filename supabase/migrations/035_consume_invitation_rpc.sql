-- ============================================================
-- 035 – Atomic invitation consumption via RPC; drop fragile policies
-- ============================================================
-- Root cause of the recurring join failures: 007 created an UPDATE
-- policy with no TO clause (applies to EVERY role) whose
-- WITH CHECK (is_active = true) forbids the row from ever being
-- deactivated. Personal links set is_active = false on join, so any
-- authenticated non-owner (e.g. a participant logged into a portal
-- account) failed with "new row violates row-level security policy".
-- The client-side read-modify-write was also racy for shared links
-- (two simultaneous joiners read the same response_count).
--
-- Fix: one SECURITY DEFINER function performs the increment +
-- conditional deactivation atomically; every direct UPDATE path for
-- non-owners is removed.

-- ── 1. Drop the three overlapping UPDATE policies ──
DROP POLICY IF EXISTS "Anon can increment invitation response count"
  ON session_invitations;                                   -- 007, public!
DROP POLICY IF EXISTS "Anon can update invitations response count"
  ON session_invitations;                                   -- 020
DROP POLICY IF EXISTS "Anon can update invitation counters"
  ON session_invitations;                                   -- 031

-- Column-level anon UPDATE grant from 031 is no longer needed
REVOKE UPDATE ON session_invitations FROM anon;

-- Scope the owner-management policy to authenticated (007 left it public)
DROP POLICY IF EXISTS "Users can manage own invitations" ON session_invitations;
CREATE POLICY "Users can manage own invitations"
  ON session_invitations FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 2. Atomic consumption function ──
CREATE OR REPLACE FUNCTION consume_invitation(invitation_code text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE session_invitations
     SET response_count = response_count + 1,
         is_active = CASE
           WHEN max_responses IS NOT NULL
                AND response_count + 1 >= max_responses THEN false
           ELSE is_active
         END
   WHERE code = invitation_code
     AND is_active = true
  RETURNING true;
$$;

REVOKE ALL ON FUNCTION consume_invitation(text) FROM public;
GRANT EXECUTE ON FUNCTION consume_invitation(text) TO anon, authenticated;
