-- W3 / Blueprint condition 4: did anyone come back on their own?
-- Read-only: run it in the SQL editor whenever you want. Changes nothing.
-- One row per organizer, by id only (no emails). Days are counted in Mexico City time,
-- so a visit at 11 pm and another at 1 am the next morning are two different days.
-- A visit is ANY event (W6 fix): a returning organizer is usually still signed in, so she
-- leaves app_opened / verdict_viewed rows, not a new signed_in. Google sign-ins are shown apart.
-- A tester came back when dias_con_visita is 2 or more.

with days as (
  select
    organizer_id,
    name,
    (created_at at time zone 'America/Mexico_City')::date as day
  from public.pc_events
)
select
  organizer_id,
  count(distinct day) as dias_con_visita,
  count(distinct day) filter (where name = 'signed_in') as dias_con_entrada_google,
  min(day) as primera_visita,
  max(day) as ultima_visita,
  case when count(distinct day) >= 2 then 'sí' else 'no' end as regreso
from days
group by organizer_id
order by dias_con_visita desc, ultima_visita desc;
