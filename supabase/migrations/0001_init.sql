-- Taste Test App / Inscription Test — schema
-- Mirrors the data model of the original localStorage-based prototype
-- (test2parmi5_sessions_v3 / test2parmi5_submissions_v3 / test2parmi5_selected_session_v1),
-- moved into shared Postgres tables so admin, participants, and the sign-up
-- kiosk can all see the same live data from different devices.

create extension if not exists pgcrypto;

-- ── sessions ────────────────────────────────────────────────────────────
-- One row per test ("session" in the prototype). Exactly one session can be
-- "active" at a time — that's the one shown on the participant name-select
-- screen and on the Inscription sign-up page.
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  store_name text,
  day text,
  place text,
  slot_labels text[] not null default array['12h - 12h30', '12h30 - 13h', '13h - 13h30'],
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- at most one active session at a time
create unique index if not exists sessions_one_active
  on sessions ((true))
  where is_active;

-- ── participants ────────────────────────────────────────────────────────
-- Registered via the Inscription form (or seeded). codes/truth_order are the
-- 5 sample codes and the A/B truth assignment ("2 vs 3" grouping) — this is
-- the admin-only correspondence data, never meant to be surfaced to the
-- participant who owns it.
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  name text not null,
  creneau text not null,
  codes text[] not null,
  truth_order text[] not null,
  created_at timestamptz not null default now()
);

create index if not exists participants_session_id_idx on participants(session_id);

-- ── submissions ─────────────────────────────────────────────────────────
-- One row per participant's completed test. A participant re-submitting
-- (shouldn't normally happen, but the prototype allowed it) overwrites
-- their previous row.
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  bloc2 text[] not null,
  bloc3 text[] not null,
  intensity int not null check (intensity between 0 and 100),
  description text default '',
  submitted_at timestamptz not null default now(),
  unique (participant_id)
);

create index if not exists submissions_session_id_idx on submissions(session_id);

-- ── atomic "set active session" ────────────────────────────────────────
create or replace function set_active_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update sessions set is_active = false where is_active = true;
  update sessions set is_active = true where id = p_session_id;
end;
$$;

-- ── row level security ─────────────────────────────────────────────────
-- NOTE: this mirrors the prototype's actual security model, which is a
-- client-side passcode gate (UI only) and nothing else — anyone with the
-- anon/publishable key could already read everything in localStorage via
-- devtools in the original. These policies keep that same (lack of) access
-- control rather than inventing new guarantees the app doesn't otherwise
-- have. Real per-role access control would need Supabase Auth and is out
-- of scope here — flagged for follow-up if this ever handles sensitive data.
alter table sessions enable row level security;
alter table participants enable row level security;
alter table submissions enable row level security;

create policy "sessions_select" on sessions for select using (true);
create policy "sessions_insert" on sessions for insert with check (true);
create policy "sessions_update" on sessions for update using (true) with check (true);
create policy "sessions_delete" on sessions for delete using (true);

create policy "participants_select" on participants for select using (true);
create policy "participants_insert" on participants for insert with check (true);
create policy "participants_update" on participants for update using (true) with check (true);
create policy "participants_delete" on participants for delete using (true);

create policy "submissions_select" on submissions for select using (true);
create policy "submissions_insert" on submissions for insert with check (true);
create policy "submissions_update" on submissions for update using (true) with check (true);
create policy "submissions_delete" on submissions for delete using (true);

-- ── realtime ────────────────────────────────────────────────────────────
-- Cross-device live sync (admin edits / sign-ups / submissions propagate
-- without a manual refresh) — idempotent, safe to re-run.
do $$
begin
  execute 'alter publication supabase_realtime add table public.sessions';
exception when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.participants';
exception when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.submissions';
exception when duplicate_object then null;
end $$;
