-- ============================================================
-- 037 – Practice (warm-up) tasks
-- ============================================================
-- A task can be marked as practice: it runs in sessions like any other
-- task (timer, logging, questions) but is excluded from every aggregate
-- metric, chart, and report summary, and it stays pinned at the start
-- of the session even when a randomized task-order strategy is used.

ALTER TABLE template_tasks
  ADD COLUMN is_practice boolean NOT NULL DEFAULT false;
