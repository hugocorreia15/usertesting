-- ============================================================
-- 036 – Retroactive participant anonymization via RPC
-- ============================================================
-- Privacy-sensitive studies sometimes need identity removed after a
-- session was already recorded (e.g. an erasure request arriving
-- weeks later). Prospective omission already exists: invitation links
-- can skip identity fields and create is_anonymous participants (008).
-- This function is the retroactive complement for sessions that were
-- captured with full identity.
--
-- Scope caveat, intentional: identity lives on the participants row,
-- and a participant may have several sessions. Anonymizing "a session"
-- therefore anonymizes THE PARTICIPANT, i.e. all of their sessions.
-- That is the intended semantics: once identity must be removed, it
-- must be removed everywhere, not just from one session.
--
-- Removed: name (replaced with Participant-XXXX), email, notes, and
-- template-scoped custom field values (participant_field_values).
-- Kept: demographics (age, gender, occupation, tech_proficiency) and
-- every metric, so analyses stay intact. Irreversible by design.

CREATE OR REPLACE FUNCTION anonymize_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant_id uuid;
BEGIN
  -- Ownership check: only the evaluator who owns the session may
  -- anonymize its participant.
  SELECT participant_id INTO v_participant_id
    FROM test_sessions
   WHERE id = p_session_id
     AND user_id = auth.uid();

  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Session not found or not owned by caller';
  END IF;

  UPDATE participants
     SET name = 'Participant-' || substr(md5(random()::text), 1, 6),
         email = NULL,
         notes = NULL,
         is_anonymous = true
   WHERE id = v_participant_id;

  DELETE FROM participant_field_values
   WHERE participant_id = v_participant_id;
END;
$$;

REVOKE ALL ON FUNCTION anonymize_session(uuid) FROM public;
REVOKE ALL ON FUNCTION anonymize_session(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION anonymize_session(uuid) TO authenticated;
