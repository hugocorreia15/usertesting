export interface Template {
  id: string;
  name: string;
  description: string | null;
  user_id: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateTask {
  id: string;
  template_id: string;
  sort_order: number;
  name: string;
  description: string | null;
  complexity: "simple" | "complex";
  optimal_time_seconds: number | null;
  optimal_actions: number | null;
  created_at: string;
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

export interface SusAnswer {
  id: string;
  session_id: string;
  question_number: number;
  score: number;
  created_at: string;
}

// Extended types with relations
export interface TemplateWithRelations extends Template {
  template_tasks: TemplateTask[];
  template_error_types: TemplateErrorType[];
  template_questions: TemplateQuestion[];
}

export interface TestSessionWithRelations extends TestSession {
  templates: Template;
  participants: Participant;
  task_results: TaskResultWithRelations[];
  interview_answers: InterviewAnswer[];
  sus_answers: SusAnswer[];
}

export interface TaskResultWithRelations extends TaskResult {
  template_tasks: TemplateTask;
  error_logs: ErrorLog[];
  hesitation_logs: HesitationLog[];
}
