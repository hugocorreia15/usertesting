-- ============================================================
-- 031 – Allow anon join flow to update invitation counters
-- ============================================================
-- The join flow's final step increments session_invitations.response_count
-- (and deactivates the invitation when max_responses is reached) as the
-- anon role. No anon UPDATE policy existed, so every personal/shared link
-- join failed with an RLS violation AFTER creating the participant and
-- session rows. Grant a column-restricted UPDATE so anon can only touch
-- the two counter fields, and only on active invitations.

REVOKE UPDATE ON session_invitations FROM anon;
GRANT UPDATE (response_count, is_active) ON session_invitations TO anon;

CREATE POLICY "Anon can update invitation counters"
  ON session_invitations FOR UPDATE
  TO anon
  USING (is_active = true)
  WITH CHECK (true);
