-- ============================================================
-- 016 – Allow flexible task group names (replace simple/complex constraint)
-- ============================================================

-- Drop the old CHECK constraint that only allowed 'simple' and 'complex'
ALTER TABLE template_tasks DROP CONSTRAINT IF EXISTS template_tasks_complexity_check;

-- Set a NOT NULL default so the column always has a value
ALTER TABLE template_tasks ALTER COLUMN complexity SET DEFAULT 'Simple';
