-- ============================================================
-- 055 – Moderation events: the corrections live logging leaves no trace of
-- ============================================================
-- WHY THIS CANNOT WAIT
-- During a live session the evaluator can undo a counted action, undo a logged
-- error or hesitation, step back to the previous task, reset a task, or reset
-- the timer. None of that was recorded. Undo deletes the row it undoes, and the
-- rest is client state, so a session that ran with three undone errors and a
-- restarted task looks identical afterwards to one that ran cleanly.
--
-- That matters twice. For the student, a reset task means the participant tried
-- it twice, and the recorded time and errors describe only the second attempt;
-- the reflection prompt should be able to say so. For the paper, the count of
-- undone entries is the first direct evidence of the observer load the
-- construct-validity discussion can only concede in general terms.
--
-- Like the review history, this is unrecoverable: a cohort that runs sessions
-- before logging exists has no such record, ever.
--
-- SHAPE
-- Append-only. The evaluator's client inserts one row at the moment of each
-- correction. Row-level security allows inserting only as yourself on a session
-- you may log, reading on sessions you may read, and nothing else: no update, no
-- delete. Deleting the session removes its events with it.
--
-- Nothing existing is read or written. Sessions run before this migration have
-- no events, not even the logging_started marker, and the interface says so
-- rather than reporting a clean session.

CREATE TABLE moderation_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Strict order within a session; a timestamp alone cannot guarantee it.
  seq           bigint GENERATED ALWAYS AS IDENTITY,
  session_id    uuid NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  task_id       uuid REFERENCES template_tasks(id) ON DELETE SET NULL,
  task_index    int,
  -- logging_started is written when the live cockpit opens. It is what lets the
  -- interface tell a session with no corrections from a session nobody was
  -- recording, without trusting a date.
  kind          text NOT NULL CHECK (kind IN (
                  'logging_started',
                  'undo_action', 'undo_error', 'undo_hesitation',
                  'step_back', 'task_reset', 'timer_reset')),
  -- The task timer when it happened, so a reset late in a task reads differently
  -- from one in the first seconds.
  timer_seconds numeric(8, 1),
  actor_id      uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  occurred_at   timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_moderation_events_session ON moderation_events(session_id, seq);

COMMENT ON TABLE moderation_events IS
  'Append-only record of corrections made while logging a live session: undos, step backs, task and timer resets. Absent for sessions run before migration 055.';

ALTER TABLE moderation_events ENABLE ROW LEVEL SECURITY;

-- The same access as observer notes and co-rating: whoever may log the session.
CREATE POLICY moderation_events_insert ON moderation_events
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND can_note_session(session_id));

CREATE POLICY moderation_events_read ON moderation_events
  FOR SELECT TO authenticated
  USING (can_note_session(session_id));
