-- Templates
create table templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table template_tasks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade,
  sort_order int not null default 0,
  name text not null,
  description text,
  complexity text not null check (complexity in ('simple', 'complex')),
  optimal_time_seconds int,
  optimal_actions int,
  created_at timestamptz default now()
);

create table template_error_types (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade,
  code text not null,
  label text not null,
  created_at timestamptz default now()
);

create table template_questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade,
  sort_order int not null default 0,
  question_text text not null,
  created_at timestamptz default now()
);

-- Participants
create table participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  age int,
  gender text,
  occupation text,
  tech_proficiency text check (tech_proficiency in ('low', 'medium', 'high')),
  notes text,
  created_at timestamptz default now()
);

-- Test Sessions
create table test_sessions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id),
  participant_id uuid not null references participants(id),
  evaluator_name text not null,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

create table task_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references test_sessions(id) on delete cascade,
  task_id uuid not null references template_tasks(id),
  completion_status text check (completion_status in ('success', 'partial', 'failure', 'skipped')),
  time_seconds numeric,
  action_count int,
  error_count int default 0,
  hesitation_count int default 0,
  seq_rating int check (seq_rating between 1 and 7),
  notes text,
  created_at timestamptz default now()
);

create table error_logs (
  id uuid primary key default gen_random_uuid(),
  task_result_id uuid not null references task_results(id) on delete cascade,
  error_type_id uuid references template_error_types(id),
  timestamp_seconds numeric,
  description text,
  created_at timestamptz default now()
);

create table hesitation_logs (
  id uuid primary key default gen_random_uuid(),
  task_result_id uuid not null references task_results(id) on delete cascade,
  timestamp_seconds numeric,
  note text,
  created_at timestamptz default now()
);

create table interview_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references test_sessions(id) on delete cascade,
  question_id uuid not null references template_questions(id),
  answer_text text,
  created_at timestamptz default now()
);
