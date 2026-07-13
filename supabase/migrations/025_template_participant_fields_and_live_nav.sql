-- ============================================================
-- 025 – Template-defined participant fields + live task navigation
-- ============================================================

-- ── 1. Custom participant field definitions, scoped to a template ──
CREATE TABLE template_participant_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text'
    CHECK (field_type IN ('text', 'number', 'textarea', 'select')),
  options jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_tpf_template ON template_participant_fields(template_id);

-- ── 2. A participant's value for a given template field ──
CREATE TABLE participant_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES template_participant_fields(id) ON DELETE CASCADE,
  value text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (participant_id, field_id)
);
CREATE INDEX idx_pfv_participant ON participant_field_values(participant_id);
CREATE INDEX idx_pfv_field ON participant_field_values(field_id);

-- ── 3. Live session: persisted current-task pointer so the
--      participant view follows the evaluator (incl. back-nav) ──
ALTER TABLE test_sessions
  ADD COLUMN current_task_index int NOT NULL DEFAULT 0;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE template_participant_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_field_values ENABLE ROW LEVEL SECURITY;

-- ── template_participant_fields: follow template ownership
--    (mirrors template_questions policies in 002) ──
CREATE POLICY "tpf_select" ON template_participant_fields FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM templates
    WHERE id = template_participant_fields.template_id
      AND (is_public = true OR auth.uid() = user_id)
  )
);
CREATE POLICY "tpf_insert" ON template_participant_fields FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM templates
    WHERE id = template_participant_fields.template_id
      AND auth.uid() = user_id
  )
);
CREATE POLICY "tpf_update" ON template_participant_fields FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM templates
    WHERE id = template_participant_fields.template_id
      AND auth.uid() = user_id
  )
);
CREATE POLICY "tpf_delete" ON template_participant_fields FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM templates
    WHERE id = template_participant_fields.template_id
      AND auth.uid() = user_id
  )
);

-- Anon (join flow) can read field definitions. Labels are not
-- sensitive; kept permissive in line with the project's anon model.
CREATE POLICY "Anon can read participant field definitions"
  ON template_participant_fields FOR SELECT
  TO anon
  USING (true);

-- ── participant_field_values: owner full CRUD via participant ──
CREATE POLICY "pfv_select" ON participant_field_values FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM participants p
    WHERE p.id = participant_field_values.participant_id
      AND auth.uid() = p.user_id
  )
);
CREATE POLICY "pfv_insert" ON participant_field_values FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM participants p
    WHERE p.id = participant_field_values.participant_id
      AND auth.uid() = p.user_id
  )
);
CREATE POLICY "pfv_update" ON participant_field_values FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM participants p
    WHERE p.id = participant_field_values.participant_id
      AND auth.uid() = p.user_id
  )
);
CREATE POLICY "pfv_delete" ON participant_field_values FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM participants p
    WHERE p.id = participant_field_values.participant_id
      AND auth.uid() = p.user_id
  )
);

-- Anon (join flow) can write & read back their own values.
-- Mirrors the permissive anon participant insert policy (021/022).
CREATE POLICY "Anon can insert participant field values for join flow"
  ON participant_field_values FOR INSERT
  TO anon
  WITH CHECK (true);
CREATE POLICY "Anon can read participant field values for join flow"
  ON participant_field_values FOR SELECT
  TO anon
  USING (true);
