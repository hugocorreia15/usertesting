-- ============================================================
-- 028 – Backfill action_count from optimal_actions
--        for session df394a2e-5ea2-42f5-b8b6-ad0a27fc22dc
-- ============================================================
-- One-off data patch: in this study some task_results were saved with
-- action_count = 0 (or NULL) because actions weren't tracked live.
-- For that single session, set action_count to the task's
-- optimal_actions value so the report metrics reflect the intended
-- baseline. Idempotent: re-running matches zero rows.
-- WHERE-clause is scoped to one session id, so this migration is a
-- no-op in any environment that doesn't have that session.

-- ── Preview (uncomment to dry-run before applying) ──
-- SELECT tr.id,
--        tt.name            AS task_name,
--        tr.action_count    AS current_action_count,
--        tt.optimal_actions AS will_become
--   FROM task_results tr
--   JOIN template_tasks tt ON tt.id = tr.task_id
--  WHERE tr.session_id = 'df394a2e-5ea2-42f5-b8b6-ad0a27fc22dc'
--    AND (tr.action_count IS NULL OR tr.action_count = 0)
--    AND tt.optimal_actions IS NOT NULL
--    AND tt.optimal_actions > 0
--  ORDER BY tr.sort_order;

UPDATE task_results AS tr
   SET action_count = tt.optimal_actions
  FROM template_tasks AS tt
 WHERE tr.task_id = tt.id
   AND tr.session_id = 'df394a2e-5ea2-42f5-b8b6-ad0a27fc22dc'
   AND (tr.action_count IS NULL OR tr.action_count = 0)
   AND tt.optimal_actions IS NOT NULL
   AND tt.optimal_actions > 0;
