-- ============================================================
-- 053 – Reflection after a session
-- ============================================================
-- Cognitive apprenticeship ends in reflection, and the paper cites it, but the
-- platform observed everything and asked the student nothing. After a session
-- is completed, each person who took part answers three fixed questions: what
-- they did not expect, what they would change in the protocol, and what they
-- did that may have led the participant.
--
-- WHY THIS IS CAPTURED NOW RATHER THAN LATER
-- Of everything on the roadmap this is the one thing that cannot be recovered.
-- A cohort that finishes without it has no reflections, ever. Analysis views
-- can be built afterwards over stored data; this data has to be written while
-- the session is fresh.
--
-- VISIBILITY, AND WHY IT MIRRORS THE INSPECTION RULE
-- A reflection begins as a private draft. Submitting it freezes it.
--   1. You always read your own, draft or submitted.
--   2. You read a teammate's submitted reflection on a session once you have
--      submitted your own on that same session. A moderator and an observer
--      describing the same session is a useful comparison only if neither
--      wrote theirs after reading the other's.
--   3. An organization owner, the instructor, reads submitted reflections.
--      Never drafts: a draft has not yet been written for anyone.
-- Students therefore learn one rule for both inspection and reflection.
--
-- Submission requires every answer to be at least 20 characters, mirroring
-- MIN_ANSWER_LENGTH in src/lib/reflection.ts, so "n/a" cannot be submitted.
--
-- Nothing here reads or writes any existing row.

CREATE TABLE session_reflections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  surprised       text NOT NULL DEFAULT '',
  protocol_change text NOT NULL DEFAULT '',
  may_have_led    text NOT NULL DEFAULT '',
  submitted_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

CREATE INDEX idx_session_reflections_session ON session_reflections(session_id);

COMMENT ON TABLE session_reflections IS
  'One reflection per person per completed session. Private draft until submitted through submit_session_reflection(), then frozen.';
COMMENT ON COLUMN session_reflections.may_have_led IS
  'What the author said or did that may have led the participant.';

-- ── helpers ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION can_read_session(sid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM test_sessions ts
                 WHERE ts.id = sid AND ts.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM test_sessions ts
                 JOIN templates t ON t.id = ts.template_id
                 WHERE ts.id = sid AND t.user_id = auth.uid())
      OR can_read_org_session(sid);
$$;

CREATE OR REPLACE FUNCTION session_is_completed(sid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM test_sessions
                 WHERE id = sid AND status = 'completed');
$$;

CREATE OR REPLACE FUNCTION has_submitted_reflection(sid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM session_reflections
                 WHERE session_id = sid AND user_id = auth.uid()
                   AND submitted_at IS NOT NULL);
$$;

CREATE OR REPLACE FUNCTION instructs_session(sid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM test_sessions ts
                 WHERE ts.id = sid AND ts.org_id IS NOT NULL
                   AND is_org_owner(ts.org_id));
$$;

REVOKE ALL ON FUNCTION can_read_session(uuid)          FROM public;
REVOKE ALL ON FUNCTION session_is_completed(uuid)      FROM public;
REVOKE ALL ON FUNCTION has_submitted_reflection(uuid)  FROM public;
REVOKE ALL ON FUNCTION instructs_session(uuid)         FROM public;
GRANT EXECUTE ON FUNCTION can_read_session(uuid)         TO authenticated;
GRANT EXECUTE ON FUNCTION session_is_completed(uuid)     TO authenticated;
GRANT EXECUTE ON FUNCTION has_submitted_reflection(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION instructs_session(uuid)        TO authenticated;

-- ── the freeze ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION guard_session_reflection() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
DECLARE
  via_rpc boolean := COALESCE(current_setting('avalux.reflection_rpc', true), 'off') = 'on';
BEGIN
  IF NEW.session_id IS DISTINCT FROM OLD.session_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'a reflection cannot be moved to another session or author';
  END IF;

  IF OLD.submitted_at IS NOT NULL THEN
    RAISE EXCEPTION 'this reflection was submitted and is frozen';
  END IF;

  IF NEW.submitted_at IS DISTINCT FROM OLD.submitted_at AND NOT via_rpc THEN
    RAISE EXCEPTION 'submitted_at changes only through submit_session_reflection()';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_guard_session_reflection
  BEFORE UPDATE ON session_reflections
  FOR EACH ROW EXECUTE FUNCTION guard_session_reflection();

-- ── submitting ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION submit_session_reflection(sid uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM session_reflections
   WHERE session_id = sid AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'write your reflection before submitting it';
  END IF;
  IF r.submitted_at IS NOT NULL THEN
    RETURN;
  END IF;
  IF length(btrim(r.surprised)) < 20
     OR length(btrim(r.protocol_change)) < 20
     OR length(btrim(r.may_have_led)) < 20 THEN
    RAISE EXCEPTION 'every answer needs at least 20 characters before it can be submitted';
  END IF;

  PERFORM set_config('avalux.reflection_rpc', 'on', true);
  UPDATE session_reflections SET submitted_at = now() WHERE id = r.id;
  PERFORM set_config('avalux.reflection_rpc', 'off', true);
END $$;

GRANT EXECUTE ON FUNCTION submit_session_reflection(uuid) TO authenticated;

-- ── row-level security ──────────────────────────────────────

ALTER TABLE session_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_reflections_read ON session_reflections
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (submitted_at IS NOT NULL AND instructs_session(session_id))
    OR (submitted_at IS NOT NULL
        AND has_submitted_reflection(session_id)
        AND can_read_session(session_id))
  );

-- Only on a completed session, only as yourself, only as a draft.
CREATE POLICY session_reflections_insert ON session_reflections
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND submitted_at IS NULL
    AND session_is_completed(session_id)
    AND can_read_session(session_id)
  );

CREATE POLICY session_reflections_update ON session_reflections
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY session_reflections_delete ON session_reflections
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND submitted_at IS NULL);
