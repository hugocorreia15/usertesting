-- ============================================================
-- 062 – How much participant data a protocol edit would destroy
-- ============================================================
-- Removing a question from a template deletes every answer given to it, in
-- every session already run, through the cascade on question_id. That is
-- sometimes what the author wants and sometimes a protocol edit made without
-- realising what it takes with it. The interface cannot warn about it without
-- knowing the counts, and counting in the browser would mean reading every
-- answer row to discard all but its length.
--
-- One function, three counts, guarded by the same access rule the editor
-- itself obeys: if you cannot use the template you learn nothing about it, not
-- even how many answers it has.

CREATE OR REPLACE FUNCTION template_answer_counts(tid uuid)
RETURNS TABLE (kind text, ref_id uuid, n bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  -- Answers to per-task questions.
  SELECT 'task_question'::text, tq.id, count(tqa.id)
    FROM task_questions tq
    JOIN template_tasks tt ON tt.id = tq.task_id
    LEFT JOIN task_question_answers tqa ON tqa.question_id = tq.id
   WHERE tt.template_id = tid
     AND can_use_template(tid)
   GROUP BY tq.id
  HAVING count(tqa.id) > 0

  UNION ALL

  -- Answers to interview questions.
  SELECT 'interview_question'::text, q.id, count(ia.id)
    FROM template_questions q
    LEFT JOIN interview_answers ia ON ia.question_id = q.id
   WHERE q.template_id = tid
     AND can_use_template(tid)
   GROUP BY q.id
  HAVING count(ia.id) > 0

  UNION ALL

  -- Errors logged against a typed error taxonomy.
  SELECT 'error_type'::text, et.id, count(el.id)
    FROM template_error_types et
    LEFT JOIN error_logs el ON el.error_type_id = et.id
   WHERE et.template_id = tid
     AND can_use_template(tid)
   GROUP BY et.id
  HAVING count(el.id) > 0;
$$;

REVOKE ALL ON FUNCTION template_answer_counts(uuid) FROM public;
GRANT EXECUTE ON FUNCTION template_answer_counts(uuid) TO authenticated;

COMMENT ON FUNCTION template_answer_counts(uuid) IS
  'Per question and error type, how many participant records a removal would cascade away. Only rows with a count above zero are returned, so an untouched protocol returns nothing.';
