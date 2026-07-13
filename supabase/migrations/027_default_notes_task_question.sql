-- ============================================================
-- 027 – Ensure every task has a default "Notes" open-text question
-- ============================================================
-- Participants always get a free-form Notes textbox per task so they
-- can write anything they want for that specific task. New tasks get
-- it from the template editor; this backfills the existing ones.
-- Idempotent: only inserts where no question with text "Notes" exists
-- on that task.

INSERT INTO task_questions (task_id, sort_order, question_text, question_type)
SELECT t.id,
       COALESCE((SELECT MAX(sort_order) + 1
                   FROM task_questions q2
                  WHERE q2.task_id = t.id), 0),
       'Notes',
       'open'
  FROM template_tasks t
 WHERE NOT EXISTS (
         SELECT 1 FROM task_questions q
          WHERE q.task_id = t.id
            AND lower(q.question_text) = 'notes'
       );
