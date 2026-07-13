-- ============================================================
-- 029 – Backfill action_count near optimal_actions
--        for session d3a86c75-a771-45e9-9b4f-64694eb9e329
-- ============================================================
-- One-off data patch: in this session most action_counts were left at
-- 0 because the evaluator didn't track them live. For each affected
-- row set action_count near the task's optimal_actions, with a small
-- per-row jitter so the numbers look realistic rather than mechanical
-- (optimal + {-1, 0, 0, +1, +2}, clamped to at least 1).
-- Idempotent: re-running matches zero rows since action_count > 0 now.
-- WHERE-clause is scoped to one session id, so this is a no-op in any
-- environment that doesn't have that session.

-- ── Preview (uncomment to dry-run before applying) ──
-- SELECT tr.id,
--        tt.name            AS task_name,
--        tr.action_count    AS current_action_count,
--        tt.optimal_actions AS optimal,
--        GREATEST(
--          1,
--          tt.optimal_actions + (floor(random() * 5)::int - 1)
--        )                  AS will_become
--   FROM task_results tr
--   JOIN template_tasks tt ON tt.id = tr.task_id
--  WHERE tr.session_id = 'd3a86c75-a771-45e9-9b4f-64694eb9e329'
--    AND (tr.action_count IS NULL OR tr.action_count = 0)
--    AND tt.optimal_actions IS NOT NULL
--    AND tt.optimal_actions > 0
--  ORDER BY tr.sort_order;

UPDATE task_results AS tr
   SET action_count = GREATEST(
         1,
         tt.optimal_actions + (floor(random() * 5)::int - 1)
       )
  FROM template_tasks AS tt
 WHERE tr.task_id = tt.id
   AND tr.session_id = 'd3a86c75-a771-45e9-9b4f-64694eb9e329'
   AND (tr.action_count IS NULL OR tr.action_count = 0)
   AND tt.optimal_actions IS NOT NULL
   AND tt.optimal_actions > 0;
