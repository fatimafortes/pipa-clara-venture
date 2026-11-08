-- W3 / Blueprint condition 4: did anyone come back on their own?
-- Read-only: run it in the SQL editor whenever you want. Changes nothing.
-- One row per organizer, by id only (no emails). Days are counted in Mexico City time,
-- so a sign-in at 11 pm and another at 1 am the next morning are two different days.
-- A tester came back when dias_con_entrada is 2 or more.

select
  organizer_id,
  count(distinct (created_at at time zone 'America/Mexico_City')::date) as dias_con_entrada,
  min((created_at at time zone 'America/Mexico_City')::date) as primera_entrada,
  max((created_at at time zone 'America/Mexico_City')::date) as ultima_entrada,
  case
    when count(distinct (created_at at time zone 'America/Mexico_City')::date) >= 2 then 'sí'
    else 'no'
  end as regreso
from public.pc_events
where name = 'signed_in'
group by organizer_id
order by dias_con_entrada desc, ultima_entrada desc;
