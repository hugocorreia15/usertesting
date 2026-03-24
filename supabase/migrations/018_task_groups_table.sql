-- ============================================================
-- 018 – Create task_groups table, replace complexity string
-- ============================================================

-- 1. Create task_groups table
CREATE TABLE task_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_groups_template_id ON task_groups(template_id);

-- 2. RLS
ALTER TABLE task_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_groups_select" ON task_groups FOR SELECT
USING (
  EXISTS (SELECT 1 FROM templates WHERE id = task_groups.template_id AND (is_public = true OR auth.uid() = user_id))
);

CREATE POLICY "task_groups_manage" ON task_groups FOR ALL
USING (
  EXISTS (SELECT 1 FROM templates WHERE id = task_groups.template_id AND auth.uid() = user_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM templates WHERE id = task_groups.template_id AND auth.uid() = user_id)
);

-- Anon can read task groups via active invitation
CREATE POLICY "Anon can read task groups via invitation" ON task_groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM session_invitations si
    WHERE si.template_id = task_groups.template_id AND si.is_active = true
  )
);

-- 3. Migrate existing data: create groups from distinct complexity values
INSERT INTO task_groups (template_id, name, sort_order)
SELECT template_id, complexity, ROW_NUMBER() OVER (PARTITION BY template_id ORDER BY complexity) - 1
FROM (SELECT DISTINCT template_id, complexity FROM template_tasks WHERE complexity IS NOT NULL AND complexity != '') sub;

-- 4. Add group_id column
ALTER TABLE template_tasks ADD COLUMN group_id UUID REFERENCES task_groups(id) ON DELETE SET NULL;

-- 5. Populate group_id from existing complexity values
UPDATE template_tasks tt
SET group_id = tg.id
FROM task_groups tg
WHERE tg.template_id = tt.template_id AND tg.name = tt.complexity;

-- 6. Drop complexity column
ALTER TABLE template_tasks DROP COLUMN complexity;
