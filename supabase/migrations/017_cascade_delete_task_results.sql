-- ============================================================
-- 017 – Add ON DELETE CASCADE to all template child FKs
-- ============================================================
-- Without CASCADE, updating a template (delete + re-insert) fails
-- when sessions/answers reference template tasks/questions/error_types.

-- task_results → template_tasks
ALTER TABLE task_results DROP CONSTRAINT task_results_task_id_fkey;
ALTER TABLE task_results
  ADD CONSTRAINT task_results_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES template_tasks(id) ON DELETE CASCADE;

-- error_logs → template_error_types
ALTER TABLE error_logs DROP CONSTRAINT error_logs_error_type_id_fkey;
ALTER TABLE error_logs
  ADD CONSTRAINT error_logs_error_type_id_fkey
  FOREIGN KEY (error_type_id) REFERENCES template_error_types(id) ON DELETE CASCADE;

-- interview_answers → template_questions
ALTER TABLE interview_answers DROP CONSTRAINT interview_answers_question_id_fkey;
ALTER TABLE interview_answers
  ADD CONSTRAINT interview_answers_question_id_fkey
  FOREIGN KEY (question_id) REFERENCES template_questions(id) ON DELETE CASCADE;
