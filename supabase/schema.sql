-- StudySync schema. Run in Supabase SQL editor.
create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, target_attendance numeric not null default 75 check (target_attendance between 1 and 99),
  created_at timestamptz not null default now()
);
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into profiles(id, full_name) values (new.id, new.raw_user_meta_data->>'full_name'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create table semesters (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, kind text not null default 'odd' check (kind in ('odd','even')), academic_year text,
  start_date date, end_date date, is_active boolean not null default false, archived boolean not null default false,
  created_at timestamptz not null default now(), check (end_date is null or start_date is null or end_date >= start_date)
);
create table subjects (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  semester_id uuid not null references semesters(id) on delete cascade,
  name text not null, code text, faculty text, credits numeric not null default 3 check (credits >= 0),
  category text, color text default '#0f766e', created_at timestamptz not null default now()
);
create table syllabus_units (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  title text not null, description text, priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  deadline date, notes text, created_at timestamptz not null default now()
);
create table syllabus_topics (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  unit_id uuid not null references syllabus_units(id) on delete cascade,
  title text not null, estimated_minutes int, status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  completed_on date, notes text, created_at timestamptz not null default now()
);
create table syllabus_subtopics (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references syllabus_topics(id) on delete cascade,
  title text not null, status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  created_at timestamptz not null default now()
);
create table tasks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  title text not null, description text, due_date date, priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  category text, completed boolean not null default false, created_at timestamptz not null default now()
);
create table study_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  topic text, session_date date not null default current_date, start_time time, end_time time, minutes int not null check (minutes > 0 and minutes <= 1440),
  notes text, created_at timestamptz not null default now()
);
create table study_plans (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  plan_date date not null, start_time time not null, end_time time not null, topic text,
  status text not null default 'planned' check (status in ('planned','completed','skipped')), notes text,
  created_at timestamptz not null default now(), check (end_time > start_time)
);
create table assessments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  name text not null, category text not null default 'cie' check (category in ('cie','quiz','assignment','lab','see','other')),
  marks numeric not null check (marks >= 0), max_marks numeric not null check (max_marks > 0),
  weight numeric not null default 1 check (weight >= 0), assessed_on date,
  created_at timestamptz not null default now(), check (marks <= max_marks)
);
create table grading_rules (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Default', grade text not null, min_percent numeric not null check (min_percent between 0 and 100),
  grade_point numeric not null check (grade_point >= 0), created_at timestamptz not null default now()
);
create table semester_gpa_records (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  semester_id uuid not null references semesters(id) on delete cascade,
  sgpa numeric not null check (sgpa >= 0), credits numeric not null check (credits >= 0),
  created_at timestamptz not null default now(), unique (user_id, semester_id)
);
create table exams (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  title text not null, category text, exam_at timestamptz not null, venue text, created_at timestamptz not null default now()
);
create table attendance_records (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  class_date date not null default current_date, status text not null check (status in ('present','absent','on_duty','holiday')),
  topic text, notes text, created_at timestamptz not null default now()
);
create table mood_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date, mood text not null check (mood in ('excellent','good','neutral','low','very_low')),
  motivation int check (motivation between 1 and 5), energy int check (energy between 1 and 5),
  productivity int check (productivity between 1 and 5), stress int check (stress between 1 and 5),
  notes text, created_at timestamptz not null default now()
);

-- Indexes
create index on subjects(user_id, semester_id); create index on tasks(user_id, due_date);
create index on study_sessions(user_id, session_date); create index on assessments(user_id, subject_id);
create index on attendance_records(user_id, subject_id, class_date); create index on exams(user_id, exam_at);
create index on mood_entries(user_id, entry_date); create index on syllabus_units(user_id, subject_id);

-- Row Level Security on every user-owned table
do $$ declare t text; begin
  foreach t in array array['semesters','subjects','syllabus_units','syllabus_topics','syllabus_subtopics','tasks','study_sessions','study_plans','assessments','grading_rules','semester_gpa_records','exams','attendance_records','mood_entries'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "own rows" on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
alter table profiles enable row level security;
create policy "own profile" on profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
