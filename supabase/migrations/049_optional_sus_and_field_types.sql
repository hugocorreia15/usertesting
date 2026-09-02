-- ============================================================
-- 049 – SUS becomes optional; participant fields gain question types
-- ============================================================
-- 1. SUS was hard-wired on ("SUS is implicit and always on", migration
--    034). It is now an entry in templates.instruments like the others,
--    so a study that does not want it can leave it out.
--
--    Every existing template is backfilled with 'sus' so no running or
--    completed study changes behaviour. This is the only statement here
--    that touches data, and it only APPENDS a value to an array — no row
--    is deleted and no existing value is overwritten.
--
-- 2. Participant fields could only be text, number, textarea or select.
--    They now also offer multiple choice and rating, matching the task
--    question types.
--
--    The existing four values stay valid and no stored row is rewritten;
--    'textarea' and 'select' are simply relabelled in the UI as
--    "Open Text" and "Single Choice". Renaming them in the database
--    would have meant an UPDATE across live studies for no functional
--    gain.

-- ── 1. SUS as an explicit instrument ──
UPDATE templates
   SET instruments = array_append(instruments, 'sus')
 WHERE NOT ('sus' = ANY (instruments));

COMMENT ON COLUMN templates.instruments IS
  'Post-session instruments to administer: any of sus, nasa_tlx, ueq_s.';

-- ── 2. Two more participant field types ──
ALTER TABLE template_participant_fields
  DROP CONSTRAINT IF EXISTS template_participant_fields_field_type_check;

ALTER TABLE template_participant_fields
  ADD CONSTRAINT template_participant_fields_field_type_check
  CHECK (field_type IN (
    'text',            -- short free text
    'number',
    'textarea',        -- shown as "Open Text"
    'select',          -- shown as "Single Choice"
    'multiple_choice',
    'rating'
  ));

-- Bounds for 'rating'; ignored by every other type.
ALTER TABLE template_participant_fields
  ADD COLUMN IF NOT EXISTS rating_min int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rating_max int NOT NULL DEFAULT 5;

COMMENT ON COLUMN template_participant_fields.rating_min IS
  'Lower bound when field_type = rating.';
COMMENT ON COLUMN template_participant_fields.rating_max IS
  'Upper bound when field_type = rating.';

-- Multi-select answers are stored in participant_field_values.value as a
-- JSON array of the chosen options; every other type stores plain text.
-- src/lib/participant-fields.ts is the single place that encodes and
-- decodes this, and tolerates legacy plain strings.
