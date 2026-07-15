-- ============================================================
-- 045 – Spectator observation notes (ROADMAP 2.3)
-- ============================================================
-- Anyone who can read a session (its creator, org full members, and
-- students assigned to its project) can follow it live on a read-only
-- observe page and attach timestamped notes. Notes never touch the
-- evaluator's metrics; they are a parallel qualitative record.
--
-- Per the 043 lesson, the cross-table check lives in a SECURITY
-- DEFINER helper — policies never subquery other tables directly.

CREATE TABLE observer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- display convenience; auth.users is not client-readable
  author_email text,
  note text NOT NULL,
  -- current_task_index at the moment the note was taken (null = general)
  task_index int,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_observer_notes_session ON observer_notes(session_id);

CREATE OR REPLACE FUNCTION can_note_session(sid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM test_sessions ts
    WHERE ts.id = sid AND ts.user_id = auth.uid()
  ) OR can_read_org_session(sid);
$$;

REVOKE ALL ON FUNCTION can_note_session(uuid) FROM public;
GRANT EXECUTE ON FUNCTION can_note_session(uuid) TO authenticated;

ALTER TABLE observer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY observer_notes_select ON observer_notes FOR SELECT TO authenticated
  USING (can_note_session(session_id));

CREATE POLICY observer_notes_insert ON observer_notes FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND can_note_session(session_id));

-- Authors manage their own notes
CREATE POLICY observer_notes_delete ON observer_notes FOR DELETE TO authenticated
  USING (author_id = auth.uid());
