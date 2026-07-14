-- ============================================================
-- 033 – Task order strategy (randomization / counterbalancing)
-- ============================================================
-- Methodology feature: sessions can present tasks in a fixed order
-- (default, current behavior), independently shuffled per session, or
-- rotated Latin-square style so each task appears at each position
-- equally often across consecutive sessions. The strategy is chosen at
-- session/invitation creation, the concrete order is materialized into
-- task_results.sort_order as before, and the strategy is recorded on
-- the session for reporting.

ALTER TABLE test_sessions
  ADD COLUMN task_order_strategy text NOT NULL DEFAULT 'fixed'
  CHECK (task_order_strategy IN ('fixed', 'shuffled', 'latin_square'));

ALTER TABLE session_invitations
  ADD COLUMN task_order_strategy text NOT NULL DEFAULT 'fixed'
  CHECK (task_order_strategy IN ('fixed', 'shuffled', 'latin_square'));
