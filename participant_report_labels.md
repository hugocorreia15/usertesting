# Participant Report Labels

This note specifies which participant labels the study-summary **report PDF**
(generated from the `/summary` page via `dashboard/src/lib/pdfGenerator.ts`)
should print in the per-participant section, beyond the participant form's
default fields.

Two layers feed a participant:

- **Form defaults** — the fixed fields the product's participant form always
  collects (`Name*`, `Email`, `Age`, `Gender`, `Occupation`,
  `Tech Proficiency`, `Notes`). These land in `Participant.attributes`
  (free-form `JSON`, `app/db/models.py`) and surface as
  `ParticipantInfo.attributes: Dict[str, str]`
  (`app/schemas/participants.py`).
- **Custom attributes** — extra free-form keys a study may set, e.g. merged
  from a Tobii Pro Lab `ParticipantVariables.tsv`
  (`app/services/participant_tsv.py`) into the same `attributes` map. The
  schema is intentionally study-defined, so the report must read whatever is
  present rather than assume a fixed set.
- **Computed labels** — quality/behaviour values derived at the read layer
  (`app/services/study_repository.py`: `get_participant_details`,
  `compare_participants`). These are always available for any participant
  with recordings.

## Default labels

These always print, one row per field, even when blank (blank → `—`).

| Label           | Source key (`attributes`) | Notes                                              |
|-----------------|---------------------------|----------------------------------------------------|
| Name            | `Name` / `display_name`   | Required on the form; falls back to `display_name` then `Participant {key[:8]}`. |
| Email           | `Email`                   | Optional contact field.                            |
| Age             | `Age`                     | Free-form (exact age or band, e.g. `18–23`).       |
| Gender          | `Gender`                  | Free-form / study vocabulary.                      |
| Occupation      | `Occupation`              | Free-form.                                         |
| Tech Proficiency| `Tech Proficiency`        | Self-rated; useful covariate for UI studies.       |
| Notes           | `Notes`                   | Facilitator free text.                             |

## Recommended custom labels

### (a) Captured custom attributes

Free `attributes` keys a study may set (e.g. via `ParticipantVariables.tsv`).
They print **only when present** for that participant — empty keys are
skipped so the report stays organized rather than padded with `—` rows.

| Label                | Source (`attributes` key, study-defined) | Why it's useful in a report                                   |
|----------------------|------------------------------------------|---------------------------------------------------------------|
| Handedness           | `Handedness`                             | Explains scan-path asymmetry and pointer-side bias.           |
| Vision correction    | `Vision correction`                      | Glasses/contacts/none — a known eye-tracking data-quality driver. |
| First language       | `First language`                         | Confounds reading-order and text-stimulus dwell metrics.      |
| Session / Condition group | `Condition` / `Group`               | Identifies the experimental arm for between-group reads.      |
| Device               | `Device`                                 | Tobii vs webcam vs screen — sets the accuracy expectation.    |
| Location             | `Location`                               | Lab vs remote/field — frames environmental noise.             |
| Consent ref          | `Consent ref`                            | Auditable ethics linkage without exposing PII in the body.    |

### (b) Computed quality / behaviour labels

Derived from the participant's recordings; always print.

| Label                 | Source (computed)                                              | Why it's useful in a report                                   |
|-----------------------|----------------------------------------------------------------|---------------------------------------------------------------|
| Sessions              | `overview.total_sessions`                                      | Sample size per participant.                                  |
| Total duration        | `overview.total_duration_minutes` / `_hours`                   | Exposure / engagement volume.                                 |
| Avg session duration  | `overview.average_session_duration`                            | Per-session engagement at a glance.                           |
| Validity %            | `overview.average_validity_rate`                               | Headline data-quality indicator.                              |
| Data-quality grade    | `performance_metrics.data_quality_grade`                       | One-glance pass/concern flag for the reader.                  |
| Consistency           | `performance_metrics.consistency_score` / `validity_consistency` | Stability of quality across sessions.                       |
| Efficiency            | `data_efficiency` (`compare_participants`)                     | Valid ÷ total samples — usable-data yield.                    |
| Learning trend        | `performance_metrics.trend_description`                        | Improving / Stable / Declining over the session series.       |
| Samples               | `overview.total_gaze_samples` / `total_samples`               | Raw data volume backing the metrics.                          |
| Study span            | `overview.study_span_days`                                     | Time window the sessions cover (longitudinal context).        |
| Avg fixation duration | `fixation_duration_mean_ms` (plugin analysis)                  | Core attention/processing-depth behaviour metric.             |
| Fixation count        | `fixation_count` (plugin analysis)                             | Visual sampling intensity.                                    |
| Saccade count         | `saccade_count` (plugin analysis)                              | Search vs settled-viewing behaviour.                          |
| Dwell on top zone     | `zone_dwell_time_ms` (plugin analysis)                         | Attention allocation to the dominant AOI/zone.                |

> Plugin-derived behaviour metrics (fixation/saccade/dwell) print when the
> study's plugin produced them; otherwise the label is omitted (treated like
> a captured attribute, not shown as `—`).

## Rendering note

The per-participant section should be **complete but organized**:

- **Default labels** always render (7 rows), blank values shown as `—`.
- **Captured custom attributes** render only when the key is present and
  non-empty for that participant; empty/missing keys are skipped entirely
  (no `—` clutter).
- **Computed labels** always render — they exist for every participant with
  recordings; plugin-only behaviour metrics are skipped when the plugin did
  not emit them.

This keeps the identity/defaults block fixed and predictable while the
custom/behaviour blocks adapt to what each study actually captured.
