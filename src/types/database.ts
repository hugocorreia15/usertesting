import type { ReviewMode, ReviewStatus } from "@/lib/review-gate";
import type { ParticipantFieldType } from "@/lib/participant-fields";
export interface Template {
  id: string;
  name: string;
  description: string | null;
  user_id: string | null;
  org_id: string | null;
  org_group_id: string | null;
  repo_url: string | null;
  is_public: boolean;
  instruments: string[];
  review_mode: ReviewMode;
  review_status: ReviewStatus;
  review_note: string | null;
  review_submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  approval_invalidated_at: string | null;
  consent_text: string | null;
  require_inspection: boolean;
  created_at: string;
  updated_at: string;
}

// ── Heuristic inspection (migration 052) ────────────────────

export type InspectionStatus = "collecting" | "consolidating" | "closed";
export type InspectionSubjectKind = "own" | "comparator";

export interface HeuristicSet {
  id: string;
  name: string;
  description: string | null;
  org_id: string | null;
  user_id: string | null;
  is_builtin: boolean;
  created_at: string;
}

export interface Heuristic {
  id: string;
  set_id: string;
  sort_order: number;
  code: string | null;
  name: string;
  description: string | null;
}

export interface Inspection {
  id: string;
  template_id: string;
  heuristic_set_id: string | null;
  subject_kind: InspectionSubjectKind;
  subject_name: string;
  subject_url: string | null;
  status: InspectionStatus;
  created_by: string | null;
  created_at: string;
  collection_closed_at: string | null;
  closed_at: string | null;
}

export interface InspectionEvaluator {
  id: string;
  inspection_id: string;
  user_id: string;
  /** Null while the pass is open. Set once, by submit_inspection_pass(). */
  submitted_at: string | null;
  created_at: string;
}

export interface InspectionFinding {
  id: string;
  inspection_id: string;
  evaluator_id: string;
  heuristic_id: string | null;
  location: string | null;
  description: string;
  /** Nielsen's 0..4 scale. */
  severity: number | null;
  evidence_path: string | null;
  /** Set during consolidation; the only field that may change once frozen. */
  problem_id: string | null;
  created_at: string;
}

export interface InspectionProblem {
  id: string;
  inspection_id: string;
  title: string;
  notes: string | null;
  heuristic_id: string | null;
  agreed_severity: number | null;
  sort_order: number;
  /** Whether usability testing showed this predicted problem (migration 056). */
  test_outcome: "untested" | "confirmed" | "not_observed";
  outcome_note: string | null;
  /** Created by accepting a model suggestion (migration 058). */
  assisted: boolean;
  created_at: string;
}

/** A model's proposal during consolidation, kept as made (migration 058). */
export interface AiSuggestion {
  id: string;
  inspection_id: string;
  kind: "merge" | "heuristic";
  payload: {
    clusters: {
      title: string;
      findingIds: string[];
      heuristicCode: string | null;
      severity: number | null;
    }[];
    discarded?: { reason: string; count: number }[];
  };
  model: string | null;
  status: "open" | "accepted" | "dismissed";
  requested_by: string | null;
  created_at: string;
  resolved_at: string | null;
}

/** A problem testing showed that the inspection did not predict. */
export interface TestProblem {
  id: string;
  template_id: string;
  title: string;
  severity: number | null;
  heuristic_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

/** A session in which a predicted or test-only problem was seen. */
export interface ProblemEvidence {
  id: string;
  template_id: string;
  inspection_problem_id: string | null;
  test_problem_id: string | null;
  session_id: string;
  created_by: string | null;
  created_at: string;
}

export interface TaskGroup {
  id: string;
  template_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface TemplateTask {
  id: string;
  template_id: string;
  group_id: string | null;
  sort_order: number;
  name: string;
  description: string | null;
  optimal_time_seconds: number | null;
  optimal_actions: number | null;
  is_practice: boolean;
  created_at: string;
  /** The inspection problem this task was written to confirm. */
  from_problem_id: string | null;
}

export interface TemplateErrorType {
  id: string;
  template_id: string;
  code: string;
  label: string;
  created_at: string;
}

export interface TemplateQuestion {
  id: string;
  template_id: string;
  sort_order: number;
  question_text: string;
  created_at: string;
}

export interface TemplateParticipantField {
  id: string;
  template_id: string;
  label: string;
  field_type: ParticipantFieldType;
  rating_min: number | null;
  rating_max: number | null;
  options: string[] | null;
  sort_order: number;
  created_at: string;
}

export interface ParticipantFieldValue {
  id: string;
  participant_id: string;
  field_id: string;
  value: string | null;
  created_at: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string | null;
  age: number | null;
  gender: string | null;
  occupation: string | null;
  tech_proficiency: "low" | "medium" | "high" | null;
  notes: string | null;
  user_id: string | null;
  auth_user_id: string | null;
  is_anonymous: boolean;
  created_at: string;
}

export interface TestSession {
  id: string;
  template_id: string;
  participant_id: string;
  evaluator_name: string;
  status: "planned" | "in_progress" | "completed";
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  user_id: string | null;
  org_id: string | null;
  join_code: string | null;
  current_task_index: number;
  task_order_strategy: "fixed" | "shuffled" | "latin_square";
  is_pilot: boolean;
  consent_accepted_at: string | null;
  consent_method: "join_form" | "recorded_by_evaluator" | null;
  created_at: string;
}

export interface TaskResult {
  id: string;
  session_id: string;
  task_id: string;
  completion_status: "success" | "partial" | "failure" | "skipped" | null;
  time_seconds: number | null;
  action_count: number | null;
  error_count: number;
  hesitation_count: number;
  seq_rating: number | null;
  sort_order: number;
  notes: string | null;
  created_at: string;
}

export interface ErrorLog {
  id: string;
  task_result_id: string;
  error_type_id: string | null;
  timestamp_seconds: number | null;
  description: string | null;
  created_at: string;
}

export interface HesitationLog {
  id: string;
  task_result_id: string;
  timestamp_seconds: number | null;
  note: string | null;
  created_at: string;
}

export interface InterviewAnswer {
  id: string;
  session_id: string;
  question_id: string;
  answer_text: string | null;
  created_at: string;
}

export interface InstrumentAnswer {
  id: string;
  session_id: string;
  instrument: string;
  item_number: number;
  score: number;
  created_at: string;
}

export interface SusAnswer {
  id: string;
  session_id: string;
  question_number: number;
  score: number;
  created_at: string;
}

export interface TaskQuestion {
  id: string;
  task_id: string;
  sort_order: number;
  question_text: string;
  question_type: "open" | "single_choice" | "multiple_choice" | "rating" | "audio" | "video" | "photo";
  options: string[] | null;
  rating_min: number | null;
  rating_max: number | null;
  created_at: string;
}

export interface TaskQuestionAnswer {
  id: string;
  task_result_id: string;
  question_id: string;
  answer_text: string | null;
  selected_options: string[] | null;
  rating_value: number | null;
  media_url: string | null;
  created_at: string;
}

export interface SessionInvitation {
  id: string;
  code: string;
  template_id: string;
  user_id: string;
  evaluator_name: string;
  selected_task_ids: string[];
  collected_fields: string[];
  task_order_strategy: "fixed" | "shuffled" | "latin_square";
  is_active: boolean;
  max_responses: number | null;
  response_count: number;
  created_at: string;
  expires_at: string | null;
}

// Inter-rater reliability co-scores (migration 046)
export interface RaterScore {
  id: string;
  session_id: string;
  task_id: string;
  rater_id: string;
  rater_email: string | null;
  completion_status: "success" | "partial" | "failure" | "skipped" | null;
  action_count: number | null;
  error_count: number | null;
  hesitation_count: number | null;
  seq_rating: number | null;
  created_at: string;
  updated_at: string;
}

// Spectator observation notes (migration 045)
export type ReviewEventKind =
  | "mode_changed"
  | "submitted"
  | "approved"
  | "changes_requested"
  | "invalidated"
  | "returned_to_draft";

/** Append-only review history (migration 054). Written only by trigger. */
export interface TemplateReviewEvent {
  id: string;
  seq: number;
  template_id: string;
  event: ReviewEventKind;
  review_mode: string;
  actor_id: string | null;
  note: string | null;
  /** The protocol as submitted, on submission events only. */
  protocol_snapshot: Record<string, unknown> | null;
  /** The one event migration 054 created to describe a template's state then. */
  backfilled: boolean;
  created_at: string;
}

export interface SessionReflection {
  id: string;
  session_id: string;
  user_id: string;
  surprised: string;
  protocol_change: string;
  may_have_led: string;
  /** Null while a private draft. Set once, by submit_session_reflection(). */
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ObserverNote {
  id: string;
  session_id: string;
  author_id: string;
  author_email: string | null;
  note: string;
  task_index: number | null;
  created_at: string;
}

// Teams / organizations (migration 041)
export interface Organization {
  id: string;
  name: string;
  created_by: string;
  default_review_mode: ReviewMode;
  default_consent_text: string | null;
  default_instruments: string[];
  /** Opt-in for model suggestions during consolidation (migration 058). */
  ai_suggestions_enabled: boolean;
  created_at: string;
}

export interface OrganizationMember {
  org_id: string;
  user_id: string;
  role: "owner" | "member" | "student";
  member_email: string | null;
  created_at: string;
}

export interface OrganizationInvite {
  id: string;
  org_id: string;
  code: string;
  label: string | null;
  role: "owner" | "member" | "student";
  invited_by: string;
  accepted_by: string | null;
  accepted_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface TemplateMember {
  template_id: string;
  user_id: string;
  created_at: string;
}

// First-class org groups (migration 047)
export interface OrgGroup {
  id: string;
  org_id: string;
  name: string;
  /** Where the team's code lives (migration 057). Any forge, not only GitHub. */
  repo_url: string | null;
  created_at: string;
}

export interface OrgGroupMember {
  group_id: string;
  user_id: string;
  member_email: string | null;
  created_at: string;
}

export interface OrganizationWithRelations extends Organization {
  organization_members: OrganizationMember[];
  organization_invites: OrganizationInvite[];
}

// Auto-instrumentation events (migration 040)
export interface AutoEvent {
  id: string;
  session_id: string;
  event_type: "click" | "keydown" | "navigation";
  occurred_at: string;
  path: string | null;
  detail: string | null;
  created_at: string;
}

// Qualitative coding (migration 039)
export interface TemplateCode {
  id: string;
  template_id: string;
  code: string;
  description: string | null;
  color: string;
  sort_order: number;
  created_at: string;
}

// Exactly one of the two answer references is set
export interface AnswerCode {
  id: string;
  code_id: string;
  task_question_answer_id: string | null;
  interview_answer_id: string | null;
  created_at: string;
}

// Extended types with relations
export interface TemplateWithRelations extends Template {
  task_groups: TaskGroup[];
  template_tasks: TemplateTask[];
  template_error_types: TemplateErrorType[];
  template_questions: TemplateQuestion[];
  template_participant_fields: TemplateParticipantField[];
  template_codes?: TemplateCodeWithAnswers[];
}

export interface TemplateCodeWithAnswers extends TemplateCode {
  answer_codes: AnswerCode[];
}

export interface TestSessionWithRelations extends TestSession {
  templates: Template;
  participants: Participant;
  task_results: TaskResultWithRelations[];
  interview_answers: InterviewAnswer[];
  sus_answers: SusAnswer[];
  instrument_answers: InstrumentAnswer[];
}

export interface TemplateTaskWithQuestions extends TemplateTask {
  task_questions: TaskQuestion[];
}

export interface TaskResultWithRelations extends TaskResult {
  template_tasks: TemplateTaskWithQuestions;
  error_logs: ErrorLog[];
  hesitation_logs: HesitationLog[];
  task_question_answers: TaskQuestionAnswer[];
}
