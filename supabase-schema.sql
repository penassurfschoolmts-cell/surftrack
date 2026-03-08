-- ─────────────────────────────────────────────────────────────
-- PENAS' SURFTRACK — Supabase Database Schema
-- Run this entire file in Supabase → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────

-- STUDENTS
create table students (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text unique not null,
  phone       text,
  avatar      text,
  notes       text,
  join_date   timestamptz default now(),
  created_at  timestamptz default now()
);

-- MEMBERSHIPS (one active record per student)
create table memberships (
  id                   uuid primary key default gen_random_uuid(),
  student_id           uuid references students(id) on delete cascade,
  tier_id              text not null,   -- matches MEMBERSHIP_TIERS id in app
  active_week_entries  int default 0,
  week_start           timestamptz,
  created_at           timestamptz default now(),
  unique(student_id)
);

-- PUNCH CARDS (one active card per student)
create table punch_cards (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references students(id) on delete cascade,
  balance     int default 0,
  created_at  timestamptz default now(),
  unique(student_id)
);

-- ENTRY LOG (every entry attempt)
create table entry_log (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid references students(id) on delete cascade,
  method       text not null,   -- 'membership' | 'punchcard' | 'denied'
  note         text,
  is_guest     boolean default false,
  guest_name   text,
  created_at   timestamptz default now()
);

-- PUNCH CARD HISTORY (every balance change)
create table punch_card_history (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references students(id) on delete cascade,
  delta       int not null,     -- positive = loaded, negative = used
  note        text,
  created_at  timestamptz default now()
);

-- LESSON LOG
create table lesson_log (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references students(id) on delete cascade,
  lesson_type text not null,    -- 'group' | 'private'
  label       text,
  class_name  text,
  punch_cost  int,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Allows only authenticated users (your staff) to read/write
-- ─────────────────────────────────────────────────────────────
alter table students          enable row level security;
alter table memberships       enable row level security;
alter table punch_cards       enable row level security;
alter table entry_log         enable row level security;
alter table punch_card_history enable row level security;
alter table lesson_log        enable row level security;

-- Policy: authenticated users can do everything
create policy "Authenticated full access" on students          for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on memberships       for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on punch_cards       for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on entry_log         for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on punch_card_history for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on lesson_log        for all using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- HANDY VIEWS (useful for exports / reporting)
-- ─────────────────────────────────────────────────────────────

-- Full student summary
create view student_summary as
select
  s.id,
  s.name,
  s.email,
  s.phone,
  s.join_date,
  m.tier_id,
  m.active_week_entries,
  m.week_start,
  pc.balance as punch_balance
from students s
left join memberships m on m.student_id = s.id
left join punch_cards pc on pc.student_id = s.id;

-- Entry log with student names
create view entry_log_detailed as
select
  el.id,
  s.name as student_name,
  s.email,
  el.method,
  el.note,
  el.is_guest,
  el.guest_name,
  el.created_at
from entry_log el
join students s on s.id = el.student_id
order by el.created_at desc;

-- Revenue summary
create view revenue_summary as
select
  s.name,
  s.email,
  m.tier_id,
  pc.balance as remaining_punches,
  (select count(*) from entry_log el where el.student_id = s.id) as total_entries,
  (select count(*) from lesson_log ll where ll.student_id = s.id) as total_lessons
from students s
left join memberships m on m.student_id = s.id
left join punch_cards pc on pc.student_id = s.id;
