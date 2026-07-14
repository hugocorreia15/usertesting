-- ============================================================
-- 038 – Indexes on hot foreign-key columns
-- ============================================================
-- Found by the k6 load tests: at 15 concurrent participants the nested
-- participant live-session select started failing with 57014 (statement
-- timeout). Postgres does not auto-index FK columns, so every PostgREST
-- embed (task_results by session_id, logs/answers by task_result_id,
-- template children by template_id, dashboard lists by user_id) was a
-- sequential scan; concurrency multiplied them past the 8 s API
-- statement timeout.

-- Session children (participant live view, session detail, exports)
CREATE INDEX IF NOT EXISTS idx_task_results_session_id
  ON task_results(session_id);
CREATE INDEX IF NOT EXISTS idx_task_results_task_id
  ON task_results(task_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_task_result_id
  ON error_logs(task_result_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type_id
  ON error_logs(error_type_id);
CREATE INDEX IF NOT EXISTS idx_hesitation_logs_task_result_id
  ON hesitation_logs(task_result_id);
CREATE INDEX IF NOT EXISTS idx_interview_answers_session_id
  ON interview_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_answers_question_id
  ON interview_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_sus_answers_session_id
  ON sus_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_task_question_answers_question_id
  ON task_question_answers(question_id);

-- Template children (template detail, analytics, join flow)
CREATE INDEX IF NOT EXISTS idx_template_tasks_template_id
  ON template_tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_template_questions_template_id
  ON template_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_error_types_template_id
  ON template_error_types(template_id);

-- Ownership scans (dashboard lists, owner RLS checks)
CREATE INDEX IF NOT EXISTS idx_templates_user_id
  ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id
  ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id
  ON test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_template_id
  ON test_sessions(template_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_participant_id
  ON test_sessions(participant_id);
