-- Pipa Clara schema (F3). Runs in the shared Supabase project "semestre".
-- Only CREATES objects with the pc_ prefix: no drop, no alter of anything else.
-- One transaction: if any statement fails, nothing is left half-created.

begin;

-- ---------------------------------------------------------------------------
-- Tables (PACKET §10). Ranges and text limits from PACKET §11 are enforced
-- here too, so bad data is rejected even if the form check is bypassed.
-- ---------------------------------------------------------------------------

create table public.pc_cisterns (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  length_m numeric(4, 2) not null check (length_m between 0.5 and 20),
  width_m numeric(4, 2) not null check (width_m between 0.5 and 20),
  max_height_cm numeric(6, 1) not null check (max_height_cm between 50 and 2000),
  households_count int not null check (households_count between 2 and 40),
  -- Short labels like "Depto 3", never full names (F5 checks each is ≤ 30 chars)
  household_labels text[] not null check (cardinality(household_labels) = households_count),
  created_at timestamptz not null default now()
);

create table public.pc_deliveries (
  id uuid primary key default gen_random_uuid(),
  cistern_id uuid not null references public.pc_cisterns (id) on delete cascade,
  organizer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  delivered_at timestamptz not null default now(),
  liters_claimed int not null check (liters_claimed between 1 and 40000),
  price_mxn int not null check (price_mxn between 1 and 20000),
  -- Pipa Clara fee per household (pilot: MXN 2)
  fee_mxn int not null default 2 check (fee_mxn between 0 and 100),
  pump_ran boolean not null default false,
  overflowed boolean not null default false,
  measured_liters int, -- null when the verdict is couldnt_measure
  verdict text not null check (verdict in ('consistent', 'short', 'couldnt_measure')),
  created_at timestamptz not null default now()
);

create table public.pc_readings (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.pc_deliveries (id) on delete cascade,
  organizer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('before', 'after')),
  level_cm numeric(6, 1) not null check (level_cm between 0 and 2000),
  photo_path text, -- path inside the pc_readings bucket: <organizer_id>/<file>
  driver_present boolean not null default false, -- CHARTER principle 1
  taken_at timestamptz not null default now(),
  unique (delivery_id, kind)
);

create table public.pc_shares (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.pc_deliveries (id) on delete cascade,
  organizer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  household_label text not null check (char_length(household_label) between 1 and 30),
  amount_mxn int not null check (amount_mxn >= 0),
  paid boolean not null default false
);

create table public.pc_challenges (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.pc_deliveries (id) on delete cascade,
  organizer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  raised_by text not null check (raised_by in ('driver', 'neighbor', 'organizer')),
  note text not null check (char_length(note) between 1 and 500),
  created_at timestamptz not null default now()
);

create index pc_cisterns_organizer_idx on public.pc_cisterns (organizer_id);
create index pc_deliveries_cistern_idx on public.pc_deliveries (cistern_id);
create index pc_deliveries_organizer_idx on public.pc_deliveries (organizer_id);
create index pc_readings_organizer_idx on public.pc_readings (organizer_id);
create index pc_shares_delivery_idx on public.pc_shares (delivery_id);
create index pc_shares_organizer_idx on public.pc_shares (organizer_id);
create index pc_challenges_delivery_idx on public.pc_challenges (delivery_id);
create index pc_challenges_organizer_idx on public.pc_challenges (organizer_id);

-- ---------------------------------------------------------------------------
-- Table privileges (a second lock behind RLS). Visitors without a session
-- (anon) get nothing; signed-in users get only what the app needs.
-- ---------------------------------------------------------------------------

revoke all on public.pc_cisterns, public.pc_deliveries, public.pc_readings,
  public.pc_shares, public.pc_challenges from anon, authenticated;
grant select, insert, update, delete on public.pc_cisterns, public.pc_deliveries,
  public.pc_readings, public.pc_shares to authenticated;
grant select, insert on public.pc_challenges to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security: each organizer sees and changes only her own rows.
-- (select auth.uid()) is evaluated once per query instead of once per row.
-- Child rows must also point at a parent the same organizer owns, so nobody
-- can attach a delivery to someone else's cistern even if she knew its id.
-- ---------------------------------------------------------------------------

alter table public.pc_cisterns enable row level security;
alter table public.pc_deliveries enable row level security;
alter table public.pc_readings enable row level security;
alter table public.pc_shares enable row level security;
alter table public.pc_challenges enable row level security;

-- pc_cisterns
create policy pc_cisterns_select on public.pc_cisterns for select to authenticated
  using (organizer_id = (select auth.uid()));
create policy pc_cisterns_insert on public.pc_cisterns for insert to authenticated
  with check (organizer_id = (select auth.uid()));
create policy pc_cisterns_update on public.pc_cisterns for update to authenticated
  using (organizer_id = (select auth.uid()))
  with check (organizer_id = (select auth.uid()));
create policy pc_cisterns_delete on public.pc_cisterns for delete to authenticated
  using (organizer_id = (select auth.uid()));

-- pc_deliveries
create policy pc_deliveries_select on public.pc_deliveries for select to authenticated
  using (organizer_id = (select auth.uid()));
create policy pc_deliveries_insert on public.pc_deliveries for insert to authenticated
  with check (
    organizer_id = (select auth.uid())
    and exists (select 1 from public.pc_cisterns c
                where c.id = cistern_id and c.organizer_id = (select auth.uid()))
  );
create policy pc_deliveries_update on public.pc_deliveries for update to authenticated
  using (organizer_id = (select auth.uid()))
  with check (
    organizer_id = (select auth.uid())
    and exists (select 1 from public.pc_cisterns c
                where c.id = cistern_id and c.organizer_id = (select auth.uid()))
  );
create policy pc_deliveries_delete on public.pc_deliveries for delete to authenticated
  using (organizer_id = (select auth.uid()));

-- pc_readings
create policy pc_readings_select on public.pc_readings for select to authenticated
  using (organizer_id = (select auth.uid()));
create policy pc_readings_insert on public.pc_readings for insert to authenticated
  with check (
    organizer_id = (select auth.uid())
    and exists (select 1 from public.pc_deliveries d
                where d.id = delivery_id and d.organizer_id = (select auth.uid()))
  );
create policy pc_readings_update on public.pc_readings for update to authenticated
  using (organizer_id = (select auth.uid()))
  with check (
    organizer_id = (select auth.uid())
    and exists (select 1 from public.pc_deliveries d
                where d.id = delivery_id and d.organizer_id = (select auth.uid()))
  );
create policy pc_readings_delete on public.pc_readings for delete to authenticated
  using (organizer_id = (select auth.uid()));

-- pc_shares
create policy pc_shares_select on public.pc_shares for select to authenticated
  using (organizer_id = (select auth.uid()));
create policy pc_shares_insert on public.pc_shares for insert to authenticated
  with check (
    organizer_id = (select auth.uid())
    and exists (select 1 from public.pc_deliveries d
                where d.id = delivery_id and d.organizer_id = (select auth.uid()))
  );
create policy pc_shares_update on public.pc_shares for update to authenticated
  using (organizer_id = (select auth.uid()))
  with check (
    organizer_id = (select auth.uid())
    and exists (select 1 from public.pc_deliveries d
                where d.id = delivery_id and d.organizer_id = (select auth.uid()))
  );
create policy pc_shares_delete on public.pc_shares for delete to authenticated
  using (organizer_id = (select auth.uid()));

-- pc_challenges: select and insert only. With RLS on and no update/delete
-- policy, nobody can edit or delete a challenge (CHARTER principle 2).
create policy pc_challenges_select on public.pc_challenges for select to authenticated
  using (organizer_id = (select auth.uid()));
create policy pc_challenges_insert on public.pc_challenges for insert to authenticated
  with check (
    organizer_id = (select auth.uid())
    and exists (select 1 from public.pc_deliveries d
                where d.id = delivery_id and d.organizer_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- Private photo bucket. Size and type limits are enforced by Supabase itself.
-- Files live under <organizer_id>/..., and each organizer can only reach her folder.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pc_readings', 'pc_readings', false, 5242880, array['image/jpeg', 'image/png']);

-- Read and upload only: a reading photo is evidence, so it can't be replaced or deleted
create policy pc_readings_photos_select on storage.objects for select to authenticated
  using (
    bucket_id = 'pc_readings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy pc_readings_photos_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pc_readings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

commit;
