-- F3 acceptance test: a second Google account can't see or touch the first one's
-- rows or photos. Runs in the SQL editor by impersonating each account
-- (same mechanism Supabase uses for real requests: role + JWT "sub").
-- Everything it creates is rolled back at the end: it leaves NO data behind.
--
-- Before running: both accounts must have signed in once at www.pipa-clara.site.
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
  challenge_a uuid;
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
    insert into public.pc_challenges (delivery_id, raised_by, note)
      values (delivery_a, 'driver', 'prueba')
      returning id into challenge_a;

    select count(*) into n from public.pc_cisterns where id = cistern_a;
    names := array_append(names, 'A ve su propia cisterna');
    expected := array_append(expected, '1');
    actual := array_append(actual, n::text);

    begin
      insert into storage.objects (bucket_id, name) values ('pc_readings', uid_a::text || '/prueba-rls.jpg');
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '42501' then 'bloqueado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'A sube una foto a su carpeta');
    expected := array_append(expected, 'permitido');
    actual := array_append(actual, outcome);

    select count(*) into n from storage.objects where bucket_id = 'pc_readings' and name = uid_a::text || '/prueba-rls.jpg';
    names := array_append(names, 'A ve su propia foto');
    expected := array_append(expected, '1');
    actual := array_append(actual, n::text);

    -- Blocked twice over: no delete privilege on the table, and no delete policy
    begin
      delete from public.pc_challenges where id = challenge_a;
      get diagnostics n = row_count;
      outcome := case when n = 0 then 'no se borró' else 'se borró' end;
    exception when others then
      outcome := case when sqlstate = '42501' then 'no se borró' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'A intenta borrar un desacuerdo');
    expected := array_append(expected, 'no se borró');
    actual := array_append(actual, outcome);

    -- ===== As account B =====
    perform set_config('request.jwt.claims',
      json_build_object('sub', uid_b, 'role', 'authenticated')::text, true);

    select count(*) into n from public.pc_cisterns where id = cistern_a;
    names := array_append(names, 'B ve la cisterna de A');
    expected := array_append(expected, '0');
    actual := array_append(actual, n::text);

    select count(*) into n from public.pc_deliveries where id = delivery_a;
    names := array_append(names, 'B ve la pipa de A');
    expected := array_append(expected, '0');
    actual := array_append(actual, n::text);

    select count(*) into n from public.pc_challenges where delivery_id = delivery_a;
    names := array_append(names, 'B ve el desacuerdo de A');
    expected := array_append(expected, '0');
    actual := array_append(actual, n::text);

    select count(*) into n from storage.objects where bucket_id = 'pc_readings' and name like uid_a::text || '/%';
    names := array_append(names, 'B ve las fotos de A');
    expected := array_append(expected, '0');
    actual := array_append(actual, n::text);

    update public.pc_cisterns set name = 'CAMBIADA POR B' where id = cistern_a;
    get diagnostics n = row_count;
    names := array_append(names, 'B cambia la cisterna de A (filas cambiadas)');
    expected := array_append(expected, '0');
    actual := array_append(actual, n::text);

    delete from public.pc_cisterns where id = cistern_a;
    get diagnostics n = row_count;
    names := array_append(names, 'B borra la cisterna de A (filas borradas)');
    expected := array_append(expected, '0');
    actual := array_append(actual, n::text);

    begin
      insert into public.pc_deliveries (cistern_id, liters_claimed, price_mxn, verdict)
        values (cistern_a, 1, 1, 'short');
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '42501' then 'bloqueado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'B agrega una pipa a la cisterna de A');
    expected := array_append(expected, 'bloqueado');
    actual := array_append(actual, outcome);

    begin
      insert into public.pc_cisterns (organizer_id, name, length_m, width_m, max_height_cm, households_count, household_labels)
        values (uid_a, 'FALSA', 2, 2, 200, 2, array['Depto 1', 'Depto 2']);
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '42501' then 'bloqueado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'B crea una cisterna a nombre de A');
    expected := array_append(expected, 'bloqueado');
    actual := array_append(actual, outcome);

    begin
      insert into storage.objects (bucket_id, name) values ('pc_readings', uid_a::text || '/intrusa.jpg');
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '42501' then 'bloqueado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'B sube una foto a la carpeta de A');
    expected := array_append(expected, 'bloqueado');
    actual := array_append(actual, outcome);

    -- ===== As a visitor without a session =====
    reset role;
    perform set_config('request.jwt.claims', '', true);
    set local role anon;
    begin
      select count(*) into n from public.pc_cisterns;
      outcome := case when n = 0 then 'no ve nada' else n || ' filas' end;
    exception when others then
      outcome := case when sqlstate = '42501' then 'no ve nada' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'Visitante sin sesión ve cisternas');
    expected := array_append(expected, 'no ve nada');
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
