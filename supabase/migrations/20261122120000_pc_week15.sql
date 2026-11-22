-- Week 15: collections ("Juntar antes de pedir", F1) and the opt-in (F5).
-- Runs in the shared Supabase project "semestre". Only creates pc_ objects or adds
-- columns/policies to pc_ tables: no drop, no alter of anything else. All or nothing.

begin;

-- ---------------------------------------------------------------------------
-- pc_collections: the organizer collects every household's share BEFORE ordering.
-- The status is not stored, it is derived (so it can never be stale):
--   collecting = some share not received · ready = all received · ordered = a delivery points here.
-- Pipa Clara never holds money: this only records what she collected in cash.
-- ---------------------------------------------------------------------------

create table public.pc_collections (
  id uuid primary key default gen_random_uuid(),
  cistern_id uuid not null references public.pc_cisterns (id) on delete cascade,
  organizer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  price_mxn int not null check (price_mxn between 1 and 20000), -- what the pipero asks
  fee_mxn int not null default 10 check (fee_mxn between 0 and 500), -- Pipa Clara, per pipa in total
  agreed_date date, -- the date the group agreed; the group's decision, not the app's
  created_at timestamptz not null default now()
);

create table public.pc_collection_shares (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.pc_collections (id) on delete cascade,
  organizer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  household_label text not null check (char_length(household_label) between 1 and 30),
  amount_mxn int not null check (amount_mxn between 0 and 20500),
  state text not null default 'pending' check (state in ('pending', 'promised', 'received')),
  -- "promete el viernes": a promise needs a date, and only a promise has one
  promised_for date,
  check ((state = 'promised') = (promised_for is not null)),
  unique (collection_id, household_label)
);

create index pc_collections_organizer_idx on public.pc_collections (organizer_id);
create index pc_collections_cistern_idx on public.pc_collections (cistern_id);
create index pc_collection_shares_collection_idx on public.pc_collection_shares (collection_id);
create index pc_collection_shares_organizer_idx on public.pc_collection_shares (organizer_id);

-- A delivery registered from a collection points to it. unique = a collection is
-- turned into a pipa once, so nobody collects the same shares twice.
-- fee_total_mxn: the fee for the whole pipa when it came from a collection ($10),
-- instead of fee_mxn × households (which can't be exactly $10 for 6 households).
alter table public.pc_deliveries
  add column collection_id uuid unique references public.pc_collections (id) on delete set null,
  add column fee_total_mxn int check (fee_total_mxn between 0 and 500);

-- Second lock: visitors get nothing
revoke all on public.pc_collections, public.pc_collection_shares from anon, authenticated;
grant select, insert, update, delete on public.pc_collections, public.pc_collection_shares to authenticated;

alter table public.pc_collections enable row level security;
alter table public.pc_collection_shares enable row level security;

-- pc_collections: only her own, and only on her own cistern
create policy pc_collections_select on public.pc_collections for select to authenticated
  using (organizer_id = (select auth.uid()));
create policy pc_collections_insert on public.pc_collections for insert to authenticated
  with check (
    organizer_id = (select auth.uid())
    and exists (select 1 from public.pc_cisterns c
                where c.id = cistern_id and c.organizer_id = (select auth.uid()))
  );
create policy pc_collections_update on public.pc_collections for update to authenticated
  using (organizer_id = (select auth.uid()))
  with check (
    organizer_id = (select auth.uid())
    and exists (select 1 from public.pc_cisterns c
                where c.id = cistern_id and c.organizer_id = (select auth.uid()))
  );
create policy pc_collections_delete on public.pc_collections for delete to authenticated
  using (organizer_id = (select auth.uid()));

-- pc_collection_shares: only her own, and only on her own collection
create policy pc_collection_shares_select on public.pc_collection_shares for select to authenticated
  using (organizer_id = (select auth.uid()));
create policy pc_collection_shares_insert on public.pc_collection_shares for insert to authenticated
  with check (
    organizer_id = (select auth.uid())
    and exists (select 1 from public.pc_collections c
                where c.id = collection_id and c.organizer_id = (select auth.uid()))
  );
create policy pc_collection_shares_update on public.pc_collection_shares for update to authenticated
  using (organizer_id = (select auth.uid()))
  with check (
    organizer_id = (select auth.uid())
    and exists (select 1 from public.pc_collections c
                where c.id = collection_id and c.organizer_id = (select auth.uid()))
  );
create policy pc_collection_shares_delete on public.pc_collection_shares for delete to authenticated
  using (organizer_id = (select auth.uid()));

-- Once the pipa is registered, the collection's shares are a record: they can't change.
-- (Restrictive: it narrows the policies above instead of adding to them.)
create policy pc_collection_shares_frozen on public.pc_collection_shares
  as restrictive for update to authenticated
  using (not exists (select 1 from public.pc_deliveries d
                     where d.collection_id = pc_collection_shares.collection_id));

-- A delivery may only point to her own collection, and only when EVERY share is received
-- ("Listo para pedir" only at 100%, enforced by the database too).
-- Restrictive: added on top of the existing pc_deliveries policies, which stay as they are.
create policy pc_deliveries_collection_insert on public.pc_deliveries
  as restrictive for insert to authenticated
  with check (
    collection_id is null
    or (
      exists (select 1 from public.pc_collections c
              where c.id = collection_id and c.organizer_id = (select auth.uid())
                and c.cistern_id = pc_deliveries.cistern_id)
      and exists (select 1 from public.pc_collection_shares s
                  where s.collection_id = pc_deliveries.collection_id)
      and not exists (select 1 from public.pc_collection_shares s
                      where s.collection_id = pc_deliveries.collection_id and s.state <> 'received')
    )
  );
create policy pc_deliveries_collection_update on public.pc_deliveries
  as restrictive for update to authenticated
  using (true)
  with check (
    collection_id is null
    or exists (select 1 from public.pc_collections c
               where c.id = collection_id and c.organizer_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- pc_optins (F5): "¿Organizas la pipa de tu vecindad o edificio?"
-- Anyone may ADD one; nobody without the service role may read, change or delete them.
-- The founder reads them in the Supabase dashboard (table editor), never from the app.
-- ---------------------------------------------------------------------------

create table public.pc_optins (
  id uuid primary key default gen_random_uuid(),
  contact text not null check (char_length(contact) between 3 and 80),
  contact_kind text not null check (contact_kind in ('email', 'whatsapp')),
  housing text not null check (housing in ('vecindad', 'edificio', 'privada', 'otra')),
  consent boolean not null check (consent), -- explicit consent is required, never assumed
  created_at timestamptz not null default now()
);

revoke all on public.pc_optins from anon, authenticated;
grant insert on public.pc_optins to anon, authenticated;

alter table public.pc_optins enable row level security;

-- Insert only. No select/update/delete policy: with RLS on, those are denied to everyone
-- except the service role (dashboard).
create policy pc_optins_insert on public.pc_optins for insert to anon, authenticated
  with check (consent);

commit;
