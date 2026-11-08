-- Week 13: event log (W3) and the repeated "before" reading (W4).
-- Runs in the shared Supabase project "semestre". Only creates or adds to pc_ objects:
-- no drop, no alter of anything else. One transaction: all or nothing.

begin;

-- ---------------------------------------------------------------------------
-- pc_events (PACKET A1): one row per action, so a return visit is visible
-- without asking anyone. Fixed list of names, no free text, no IP, no device data.
-- ---------------------------------------------------------------------------

create table public.pc_events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (name in (
    'signed_in', 'cistern_created', 'delivery_saved',
    'verdict_viewed', 'summary_sent', 'challenge_saved'
  )),
  delivery_id uuid references public.pc_deliveries (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index pc_events_organizer_created_idx on public.pc_events (organizer_id, created_at);

-- Second lock: visitors get nothing; signed-in users can only read and add
revoke all on public.pc_events from anon;
revoke all on public.pc_events from authenticated;
grant select, insert on public.pc_events to authenticated;

alter table public.pc_events enable row level security;

-- Select and insert only. With RLS on and no update/delete policy, the log can't be rewritten.
create policy pc_events_select on public.pc_events for select to authenticated
  using (organizer_id = (select auth.uid()));
create policy pc_events_insert on public.pc_events for insert to authenticated
  with check (
    organizer_id = (select auth.uid())
    and (
      delivery_id is null
      or exists (select 1 from public.pc_deliveries d
                 where d.id = delivery_id and d.organizer_id = (select auth.uid()))
    )
  );

-- ---------------------------------------------------------------------------
-- W4 precision check (PACKET A2): the "before" level read a second time, after
-- pulling the stick out. null = measured once (default 2 cm error per reading).
-- Nothing reads it until W4 ships; adding it now means one migration this week.
-- ---------------------------------------------------------------------------

alter table public.pc_readings
  add column repeat_level_cm numeric(6, 1) check (repeat_level_cm between 0 and 2000);

commit;
