-- ============================================================
-- 064 – A participant could not answer a study's own questions
-- ============================================================
-- Reported from production: joining a session failed with
--
--   new row violates row-level security policy for table "participant_field_values"
--
-- and the participant could not take part at all.
--
-- The policy migration 048 wrote for that insert reads like the right rule:
--
--   WITH CHECK (EXISTS (
--     SELECT 1 FROM participants p
--      WHERE p.id = participant_field_values.participant_id
--        AND p.user_id = anon_invite_owner()))
--
-- but a subquery inside a policy is evaluated with the caller's own
-- privileges, and the same migration deliberately removed every anonymous
-- SELECT policy on participants, because the one that existed before exposed
-- every participant's name, email and notes. So the EXISTS can never find a
-- row, and the check can never pass. The insert was unreachable for an
-- anonymous participant from the day 048 shipped.
--
-- It went unnoticed because it only fires for a template that collects custom
-- participant fields: every other study joins without touching this table. The
-- anonymous probe in scripts/verify/anon-rls.mjs did not catch it either,
-- because it checks that reads are refused, and this is a write that was
-- refused when it should have been allowed.
--
-- The rule itself was right and is unchanged: the participant must belong to
-- the owner of the invitation whose code the caller is holding. It is now
-- asked through a SECURITY DEFINER function, which can see the row the policy
-- needs to check without granting the caller any ability to read it.

CREATE OR REPLACE FUNCTION anon_may_write_participant_fields(pid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM participants p
     WHERE p.id = pid
       AND p.user_id IS NOT NULL
       AND p.user_id = anon_invite_owner()
  );
$$;

REVOKE ALL ON FUNCTION anon_may_write_participant_fields(uuid) FROM public;
GRANT EXECUTE ON FUNCTION anon_may_write_participant_fields(uuid) TO anon, authenticated;

COMMENT ON FUNCTION anon_may_write_participant_fields(uuid) IS
  'Whether the holder of the current invitation code may record field values for this participant. Security definer because the policy that calls it must check a participants row the caller is not allowed to read.';

DROP POLICY IF EXISTS "Join flow records the custom field answers"
  ON participant_field_values;

CREATE POLICY "Join flow records the custom field answers"
  ON participant_field_values FOR INSERT
  TO anon, authenticated
  WITH CHECK (anon_may_write_participant_fields(participant_id));
