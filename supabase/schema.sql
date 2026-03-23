-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table users (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  name text,
  created_at timestamptz default now(),
  trial_start timestamptz,
  subscription_tier text default 'free',
  subscription_status text default 'active'
);

-- Profiles (account holder + family members)
create table profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  name text not null,
  relationship text,
  ui_mode text default 'standard',
  avatar_url text,
  date_of_birth date,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- Medications
create table medications (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade,
  name text not null,
  generic_name text,
  dose_strength text,
  dose_unit text,
  form text,
  what_for text,
  prescriber text,
  pharmacy_name text,
  pharmacy_phone text,
  supply_count integer,
  supply_last_updated timestamptz,
  start_date date,
  end_date date,
  status text default 'active',
  pill_color text,
  pill_shape text,
  pill_imprint text,
  is_critical boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- Medication schedules
create table medication_schedules (
  id uuid default uuid_generate_v4() primary key,
  medication_id uuid references medications(id) on delete cascade,
  frequency text not null,
  times_of_day text[],
  days_of_week integer[],
  interval_hours integer,
  as_needed boolean default false,
  created_at timestamptz default now()
);

-- Dose logs
create table dose_logs (
  id uuid default uuid_generate_v4() primary key,
  medication_id uuid references medications(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  scheduled_time timestamptz,
  confirmed_time timestamptz,
  status text not null,
  confirmed_by text,
  notes text,
  created_at timestamptz default now()
);

-- Streaks
create table streaks (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade unique,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_active_date date,
  freeze_used_this_month boolean default false,
  updated_at timestamptz default now()
);

-- Drug interactions
create table medication_interactions (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade,
  medication_id_1 uuid references medications(id) on delete cascade,
  medication_id_2 uuid references medications(id) on delete cascade,
  severity text,
  description text,
  recommendation text,
  detected_at timestamptz default now()
);

-- Family alerts config
create table caregiver_alerts (
  id uuid default uuid_generate_v4() primary key,
  caregiver_profile_id uuid references profiles(id) on delete cascade,
  patient_profile_id uuid references profiles(id) on delete cascade,
  alert_delay_minutes integer default 60,
  active boolean default true,
  created_at timestamptz default now()
);

-- Clarity conversations
create table clarity_conversations (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table clarity_messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references clarity_conversations(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create table clarity_daily_usage (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade,
  date date default current_date,
  question_count integer default 0,
  unique(profile_id, date)
);

-- Notification queue (server-side scheduling)
create table notification_queue (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade,
  medication_id uuid references medications(id) on delete cascade,
  scheduled_for timestamptz not null,
  type text not null,
  payload jsonb,
  sent_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz default now()
);

-- Row level security
alter table users enable row level security;
alter table profiles enable row level security;
alter table medications enable row level security;
alter table medication_schedules enable row level security;
alter table dose_logs enable row level security;
alter table streaks enable row level security;
alter table medication_interactions enable row level security;
alter table caregiver_alerts enable row level security;
alter table clarity_conversations enable row level security;
alter table clarity_messages enable row level security;
alter table clarity_daily_usage enable row level security;
alter table notification_queue enable row level security;

-- Basic RLS policies (users can only see their own data)
create policy "Users can view own data" on users for all using (auth.uid() = id);
create policy "Users can view own profiles" on profiles for all using (user_id = auth.uid());
create policy "Users can view own medications" on medications for all using (profile_id in (select id from profiles where user_id = auth.uid()));
create policy "Users can view own schedules" on medication_schedules for all using (medication_id in (select id from medications where profile_id in (select id from profiles where user_id = auth.uid())));
create policy "Users can view own dose logs" on dose_logs for all using (profile_id in (select id from profiles where user_id = auth.uid()));
create policy "Users can view own streaks" on streaks for all using (profile_id in (select id from profiles where user_id = auth.uid()));
create policy "Users can view own interactions" on medication_interactions for all using (profile_id in (select id from profiles where user_id = auth.uid()));
create policy "Users can view own caregiver alerts" on caregiver_alerts for all using (caregiver_profile_id in (select id from profiles where user_id = auth.uid()));
create policy "Users can view own conversations" on clarity_conversations for all using (profile_id in (select id from profiles where user_id = auth.uid()));
create policy "Users can view own clarity" on clarity_messages for all using (conversation_id in (select id from clarity_conversations where profile_id in (select id from profiles where user_id = auth.uid())));
create policy "Users can view own clarity usage" on clarity_daily_usage for all using (profile_id in (select id from profiles where user_id = auth.uid()));
create policy "Users can view own notifications" on notification_queue for all using (profile_id in (select id from profiles where user_id = auth.uid()));

-- Helper RPC for clarity usage increment
create or replace function increment_clarity_usage(p_profile_id uuid, p_date date)
returns void as $$
begin
  insert into clarity_daily_usage (profile_id, date, question_count)
  values (p_profile_id, p_date, 1)
  on conflict (profile_id, date)
  do update set question_count = clarity_daily_usage.question_count + 1;
end;
$$ language plpgsql security definer;
