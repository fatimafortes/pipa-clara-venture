-- W3 acceptance test: the event log pc_events. Each account only reads and adds
-- its own rows, nobody can edit or delete them, and only the fixed names are accepted.
-- Runs in the SQL editor by impersonating each account (role + JWT "sub"), like f3-rls-test.sql.
-- Everything it creates is rolled back at the end: it leaves NO data behind.
--
-- Before running: the Week 13 migration has run, and both accounts have signed in once.
-- Edit ONLY the two emails on the lines marked "<-- EDIT".

create temp table if not exists pc_rls_results (
  n serial, check_name text, expected text, actual text
);
truncate pc_rls_results;

do $$
declare
  email_a text := 'PRIMERA_CUENTA@gmail.com';  -- <-- EDIT: account A
  email_b text := 'SEGUNDA_CUENTA@gmail.com';  -- <-- EDIT: account B
  uid_a uuid;
  uid_b uuid;
  cistern_a uuid;
  delivery_a uuid;
  event_a uuid;
  n int;
  outcome text;
  names text[] := '{}';
  expected text[] := '{}';
  actual text[] := '{}';
begin
  select id into uid_a from auth.users where email = email_a;
  select id into uid_b from auth.users where email = email_b;
  if uid_a is null or uid_b is null then
    raise exception 'No encontré una de las dos cuentas. ¿Ya entraron las dos a www.pipa-clara.site? ¿Están bien escritos los correos?';
  end if;
  if uid_a = uid_b then
    raise exception 'Pusiste el mismo correo dos veces.';
  end if;

  begin -- everything inside this block is undone at the end

    -- ===== As account A =====
    perform set_config('request.jwt.claims',
      json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);
    set local role authenticated;

    insert into public.pc_cisterns (name, length_m, width_m, max_height_cm, households_count, household_labels)
      values ('PRUEBA RLS', 2, 2, 200, 2, array['Depto 1', 'Depto 2'])
      returning id into cistern_a;
    insert into public.pc_deliveries (cistern_id, liters_claimed, price_mxn, verdict)
      values (cistern_a, 10000, 1800, 'consistent')
      returning id into delivery_a;

    begin
      insert into public.pc_events (name) values ('signed_in') returning id into event_a;
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '42501' then 'bloqueado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'A registra un evento suyo');
    expected := array_append(expected, 'permitido');
    actual := array_append(actual, outcome);

    begin
      insert into public.pc_events (name, delivery_id) values ('delivery_saved', delivery_a);
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '42501' then 'bloqueado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'A registra un evento de su propia pipa');
    expected := array_append(expected, 'permitido');
    actual := array_append(actual, outcome);

    select count(*) into n from public.pc_events where organizer_id = uid_a and created_at >= now();
    names := array_append(names, 'A ve sus propios eventos (de esta prueba)');
    expected := array_append(expected, '2');
    actual := array_append(actual, n::text);

    begin
      insert into public.pc_events (name) values ('robo');
      outcome := 'aceptado';
    exception when others then
      outcome := case when sqlstate = '23514' then 'rechazado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'Un nombre de evento desconocido');
    expected := array_append(expected, 'rechazado');
    actual := array_append(actual, outcome);

    -- Blocked twice over: no update/delete privilege on the table, and no policy for them
    begin
      update public.pc_events set name = 'summary_sent' where id = event_a;
      get diagnostics n = row_count;
      outcome := case when n = 0 then 'no se cambió' else 'se cambió' end;
    exception when others then
      outcome := case when sqlstate = '42501' then 'no se cambió' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'A intenta cambiar su evento');
    expected := array_append(expected, 'no se cambió');
    actual := array_append(actual, outcome);

    begin
      delete from public.pc_events where id = event_a;
      get diagnostics n = row_count;
      outcome := case when n = 0 then 'no se borró' else 'se borró' end;
    exception when others then
      outcome := case when sqlstate = '42501' then 'no se borró' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'A intenta borrar su evento');
    expected := array_append(expected, 'no se borró');
    actual := array_append(actual, outcome);

    -- ===== As account B =====
    perform set_config('request.jwt.claims',
      json_build_object('sub', uid_b, 'role', 'authenticated')::text, true);

    select count(*) into n from public.pc_events where organizer_id = uid_a;
    names := array_append(names, 'B ve los eventos de A');
    expected := array_append(expected, '0');
    actual := array_append(actual, n::text);

    begin
      insert into public.pc_events (name, delivery_id) values ('verdict_viewed', delivery_a);
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '42501' then 'bloqueado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'B registra un evento con la pipa de A');
    expected := array_append(expected, 'bloqueado');
    actual := array_append(actual, outcome);

    begin
      insert into public.pc_events (organizer_id, name) values (uid_a, 'signed_in');
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '42501' then 'bloqueado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'B registra un evento a nombre de A');
    expected := array_append(expected, 'bloqueado');
    actual := array_append(actual, outcome);

    begin
      update public.pc_events set name = 'summary_sent' where id = event_a;
      get diagnostics n = row_count;
      outcome := case when n = 0 then 'no se cambió' else 'se cambió' end;
    exception when others then
      outcome := case when sqlstate = '42501' then 'no se cambió' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'B intenta cambiar un evento de A');
    expected := array_append(expected, 'no se cambió');
    actual := array_append(actual, outcome);

    begin
      delete from public.pc_events where id = event_a;
      get diagnostics n = row_count;
      outcome := case when n = 0 then 'no se borró' else 'se borró' end;
    exception when others then
      outcome := case when sqlstate = '42501' then 'no se borró' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'B intenta borrar un evento de A');
    expected := array_append(expected, 'no se borró');
    actual := array_append(actual, outcome);

    -- ===== As a visitor without a session =====
    reset role;
    perform set_config('request.jwt.claims', '', true);
    set local role anon;
    begin
      select count(*) into n from public.pc_events;
      outcome := case when n = 0 then 'no ve nada' else n || ' filas' end;
    exception when others then
      outcome := case when sqlstate = '42501' then 'no ve nada' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'Visitante sin sesión ve eventos');
    expected := array_append(expected, 'no ve nada');
    actual := array_append(actual, outcome);

    begin
      insert into public.pc_events (organizer_id, name) values (uid_a, 'signed_in');
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '42501' then 'bloqueado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'Visitante sin sesión registra un evento');
    expected := array_append(expected, 'bloqueado');
    actual := array_append(actual, outcome);

    raise exception 'pc_rls_rollback';
  exception when others then
    if sqlerrm <> 'pc_rls_rollback' then
      names := array_append(names, 'Error inesperado');
      expected := array_append(expected, 'ninguno');
      actual := array_append(actual, sqlerrm);
    end if;
  end;

  insert into pc_rls_results (check_name, expected, actual)
  select names[i], expected[i], actual[i] from generate_subscripts(names, 1) as i;
end $$;

select
  check_name as prueba,
  expected as esperado,
  actual as resultado,
  case when expected = actual then 'PASA' else 'FALLA' end as estado
from pc_rls_results
order by n;
