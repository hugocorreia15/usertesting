-- Add user_id to main tables
alter table templates add column user_id uuid references auth.users(id);
alter table participants add column user_id uuid references auth.users(id);
alter table test_sessions add column user_id uuid references auth.users(id);

-- Add is_public flag to templates
alter table templates add column is_public boolean not null default false;

-- Enable RLS on all tables
alter table templates enable row level security;
alter table template_tasks enable row level security;
alter table template_error_types enable row level security;
alter table template_questions enable row level security;
alter table participants enable row level security;
alter table test_sessions enable row level security;
alter table task_results enable row level security;
alter table error_logs enable row level security;
alter table hesitation_logs enable row level security;
alter table interview_answers enable row level security;

-- Templates: visible if public or owned
create policy "templates_select" on templates for select using (
  is_public = true or auth.uid() = user_id
);
create policy "templates_insert" on templates for insert with check (
  auth.uid() = user_id
);
create policy "templates_update" on templates for update using (
  auth.uid() = user_id
);
create policy "templates_delete" on templates for delete using (
  auth.uid() = user_id
);

-- Template children: access follows parent template
create policy "template_tasks_select" on template_tasks for select using (
  exists (select 1 from templates where id = template_tasks.template_id and (is_public = true or auth.uid() = user_id))
);
create policy "template_tasks_insert" on template_tasks for insert with check (
  exists (select 1 from templates where id = template_tasks.template_id and auth.uid() = user_id)
);
create policy "template_tasks_update" on template_tasks for update using (
  exists (select 1 from templates where id = template_tasks.template_id and auth.uid() = user_id)
);
create policy "template_tasks_delete" on template_tasks for delete using (
  exists (select 1 from templates where id = template_tasks.template_id and auth.uid() = user_id)
);

create policy "template_error_types_select" on template_error_types for select using (
  exists (select 1 from templates where id = template_error_types.template_id and (is_public = true or auth.uid() = user_id))
);
create policy "template_error_types_insert" on template_error_types for insert with check (
  exists (select 1 from templates where id = template_error_types.template_id and auth.uid() = user_id)
);
create policy "template_error_types_update" on template_error_types for update using (
  exists (select 1 from templates where id = template_error_types.template_id and auth.uid() = user_id)
);
create policy "template_error_types_delete" on template_error_types for delete using (
  exists (select 1 from templates where id = template_error_types.template_id and auth.uid() = user_id)
);

create policy "template_questions_select" on template_questions for select using (
  exists (select 1 from templates where id = template_questions.template_id and (is_public = true or auth.uid() = user_id))
);
create policy "template_questions_insert" on template_questions for insert with check (
  exists (select 1 from templates where id = template_questions.template_id and auth.uid() = user_id)
);
create policy "template_questions_update" on template_questions for update using (
  exists (select 1 from templates where id = template_questions.template_id and auth.uid() = user_id)
);
create policy "template_questions_delete" on template_questions for delete using (
  exists (select 1 from templates where id = template_questions.template_id and auth.uid() = user_id)
);

-- Participants: full CRUD for owner
create policy "participants_select" on participants for select using (
  auth.uid() = user_id
);
create policy "participants_insert" on participants for insert with check (
  auth.uid() = user_id
);
create policy "participants_update" on participants for update using (
  auth.uid() = user_id
);
create policy "participants_delete" on participants for delete using (
  auth.uid() = user_id
);

-- Test sessions: full CRUD for owner
create policy "test_sessions_select" on test_sessions for select using (
  auth.uid() = user_id
);
create policy "test_sessions_insert" on test_sessions for insert with check (
  auth.uid() = user_id
);
create policy "test_sessions_update" on test_sessions for update using (
  auth.uid() = user_id
);
create policy "test_sessions_delete" on test_sessions for delete using (
  auth.uid() = user_id
);

-- Task results: access via parent test_session
create policy "task_results_select" on task_results for select using (
  exists (select 1 from test_sessions where id = task_results.session_id and auth.uid() = user_id)
);
create policy "task_results_insert" on task_results for insert with check (
  exists (select 1 from test_sessions where id = task_results.session_id and auth.uid() = user_id)
);
create policy "task_results_update" on task_results for update using (
  exists (select 1 from test_sessions where id = task_results.session_id and auth.uid() = user_id)
);
create policy "task_results_delete" on task_results for delete using (
  exists (select 1 from test_sessions where id = task_results.session_id and auth.uid() = user_id)
);

-- Interview answers: access via parent test_session
create policy "interview_answers_select" on interview_answers for select using (
  exists (select 1 from test_sessions where id = interview_answers.session_id and auth.uid() = user_id)
);
create policy "interview_answers_insert" on interview_answers for insert with check (
  exists (select 1 from test_sessions where id = interview_answers.session_id and auth.uid() = user_id)
);
create policy "interview_answers_update" on interview_answers for update using (
  exists (select 1 from test_sessions where id = interview_answers.session_id and auth.uid() = user_id)
);
create policy "interview_answers_delete" on interview_answers for delete using (
  exists (select 1 from test_sessions where id = interview_answers.session_id and auth.uid() = user_id)
);

-- Error logs: access via task_results -> test_sessions
create policy "error_logs_select" on error_logs for select using (
  exists (
    select 1 from task_results tr
    join test_sessions ts on ts.id = tr.session_id
    where tr.id = error_logs.task_result_id and auth.uid() = ts.user_id
  )
);
create policy "error_logs_insert" on error_logs for insert with check (
  exists (
    select 1 from task_results tr
    join test_sessions ts on ts.id = tr.session_id
    where tr.id = error_logs.task_result_id and auth.uid() = ts.user_id
  )
);
create policy "error_logs_update" on error_logs for update using (
  exists (
    select 1 from task_results tr
    join test_sessions ts on ts.id = tr.session_id
    where tr.id = error_logs.task_result_id and auth.uid() = ts.user_id
  )
);
create policy "error_logs_delete" on error_logs for delete using (
  exists (
    select 1 from task_results tr
    join test_sessions ts on ts.id = tr.session_id
    where tr.id = error_logs.task_result_id and auth.uid() = ts.user_id
  )
);

-- Hesitation logs: access via task_results -> test_sessions
create policy "hesitation_logs_select" on hesitation_logs for select using (
  exists (
    select 1 from task_results tr
    join test_sessions ts on ts.id = tr.session_id
    where tr.id = hesitation_logs.task_result_id and auth.uid() = ts.user_id
  )
);
create policy "hesitation_logs_insert" on hesitation_logs for insert with check (
  exists (
    select 1 from task_results tr
    join test_sessions ts on ts.id = tr.session_id
    where tr.id = hesitation_logs.task_result_id and auth.uid() = ts.user_id
  )
);
create policy "hesitation_logs_update" on hesitation_logs for update using (
  exists (
    select 1 from task_results tr
    join test_sessions ts on ts.id = tr.session_id
    where tr.id = hesitation_logs.task_result_id and auth.uid() = ts.user_id
  )
);
create policy "hesitation_logs_delete" on hesitation_logs for delete using (
  exists (
    select 1 from task_results tr
    join test_sessions ts on ts.id = tr.session_id
    where tr.id = hesitation_logs.task_result_id and auth.uid() = ts.user_id
  )
);
