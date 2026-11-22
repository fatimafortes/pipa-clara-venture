-- Week 15 acceptance test: collections (pc_collections, pc_collection_shares) and the
-- opt-in (pc_optins). Runs in the SQL editor by impersonating each account (role + JWT
-- "sub"), like f3-rls-test.sql. Everything it creates is rolled back: it leaves NO data.
--
-- Before running: the Week 15 migration has run, and both accounts have signed in once.
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
  cistern_b uuid;
  collection_a uuid;
  collection_a2 uuid;
  share_a uuid;
  delivery_a uuid;
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
      values ('PRUEBA RLS', 2, 2, 200, 2, array['Casa 1', 'Casa 2'])
      returning id into cistern_a;
    insert into public.pc_collections (cistern_id, price_mxn, fee_mxn)
      values (cistern_a, 1500, 10)
      returning id into collection_a;
    insert into public.pc_collection_shares (collection_id, household_label, amount_mxn)
      values (collection_a, 'Casa 1', 755), (collection_a, 'Casa 2', 755);
    select id into share_a from public.pc_collection_shares
      where collection_id = collection_a and household_label = 'Casa 1';

    select count(*) into n from public.pc_collection_shares where collection_id = collection_a;
    names := array_append(names, 'A ve las partes de su colecta');
    expected := array_append(expected, '2');
    actual := array_append(actual, n::text);

    -- The 100% rule, in the database: a pipa can't come from a collection with a missing share
    update public.pc_collection_shares set state = 'received' where id = share_a;
    begin
      insert into public.pc_deliveries (cistern_id, liters_claimed, price_mxn, verdict, collection_id, fee_total_mxn)
        values (cistern_a, 10000, 1500, 'consistent', collection_a, 10);
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '42501' then 'bloqueado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'A registra la pipa con 1 de 2 partes');
    expected := array_append(expected, 'bloqueado');
    actual := array_append(actual, outcome);

    begin
      update public.pc_collection_shares set state = 'promised' where collection_id = collection_a and household_label = 'Casa 2';
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '23514' then 'rechazado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'Una promesa sin fecha');
    expected := array_append(expected, 'rechazado');
    actual := array_append(actual, outcome);

    update public.pc_collection_shares set state = 'received' where collection_id = collection_a;
    insert into public.pc_deliveries (cistern_id, liters_claimed, price_mxn, verdict, collection_id, fee_total_mxn)
      values (cistern_a, 10000, 1500, 'consistent', collection_a, 10)
      returning id into delivery_a;
    names := array_append(names, 'A registra la pipa con 2 de 2 partes');
    expected := array_append(expected, 'permitido');
    actual := array_append(actual, case when delivery_a is null then 'bloqueado' else 'permitido' end);

    begin
      insert into public.pc_deliveries (cistern_id, liters_claimed, price_mxn, verdict, collection_id, fee_total_mxn)
        values (cistern_a, 10000, 1500, 'consistent', collection_a, 10);
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '23505' then 'rechazado (ya tiene pipa)' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'A registra la misma colecta dos veces');
    expected := array_append(expected, 'rechazado (ya tiene pipa)');
    actual := array_append(actual, outcome);

    update public.pc_collection_shares set state = 'pending' where id = share_a;
    get diagnostics n = row_count;
    names := array_append(names, 'A cambia una parte después de pedir (filas cambiadas)');
    expected := array_append(expected, '0');
    actual := array_append(actual, n::text);

    -- A second collection of A, still open, for the "B links to it" check below
    insert into public.pc_collections (cistern_id, price_mxn) values (cistern_a, 1500)
      returning id into collection_a2;

    -- ===== As account B =====
    perform set_config('request.jwt.claims',
      json_build_object('sub', uid_b, 'role', 'authenticated')::text, true);

    select count(*) into n from public.pc_collections where id = collection_a;
    names := array_append(names, 'B ve la colecta de A');
    expected := array_append(expected, '0');
    actual := array_append(actual, n::text);

    select count(*) into n from public.pc_collection_shares where collection_id = collection_a;
    names := array_append(names, 'B ve las partes de A (quién ya dio)');
    expected := array_append(expected, '0');
    actual := array_append(actual, n::text);

    update public.pc_collections set price_mxn = 1 where id = collection_a;
    get diagnostics n = row_count;
    names := array_append(names, 'B cambia la colecta de A (filas cambiadas)');
    expected := array_append(expected, '0');
    actual := array_append(actual, n::text);

    delete from public.pc_collections where id = collection_a;
    get diagnostics n = row_count;
    names := array_append(names, 'B borra la colecta de A (filas borradas)');
    expected := array_append(expected, '0');
    actual := array_append(actual, n::text);

    begin
      insert into public.pc_collections (cistern_id, price_mxn) values (cistern_a, 1);
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '42501' then 'bloqueado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'B abre una colecta en la cisterna de A');
    expected := array_append(expected, 'bloqueado');
    actual := array_append(actual, outcome);

    begin
      insert into public.pc_collection_shares (collection_id, household_label, amount_mxn)
        values (collection_a, 'Intrusa', 1);
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '42501' then 'bloqueado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'B agrega una parte a la colecta de A');
    expected := array_append(expected, 'bloqueado');
    actual := array_append(actual, outcome);

    -- B links her own pipa to A's collection
    insert into public.pc_cisterns (name, length_m, width_m, max_height_cm, households_count, household_labels)
      values ('PRUEBA RLS B', 2, 2, 200, 2, array['Casa 1', 'Casa 2'])
      returning id into cistern_b;
    begin
      insert into public.pc_deliveries (cistern_id, liters_claimed, price_mxn, verdict, collection_id)
        values (cistern_b, 10000, 1500, 'consistent', collection_a2);
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '42501' then 'bloqueado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'B liga su pipa a la colecta de A');
    expected := array_append(expected, 'bloqueado');
    actual := array_append(actual, outcome);

    -- ===== Opt-in: as a visitor without a session =====
    reset role;
    perform set_config('request.jwt.claims', '', true);
    set local role anon;

    begin
      insert into public.pc_optins (contact, contact_kind, housing, consent)
        values ('prueba-rls@example.com', 'email', 'vecindad', true);
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate = '42501' then 'bloqueado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'Visitante se apunta (con consentimiento)');
    expected := array_append(expected, 'permitido');
    actual := array_append(actual, outcome);

    begin
      insert into public.pc_optins (contact, contact_kind, housing, consent)
        values ('prueba-rls@example.com', 'email', 'vecindad', false);
      outcome := 'permitido';
    exception when others then
      outcome := case when sqlstate in ('42501', '23514') then 'rechazado' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'Visitante se apunta SIN consentimiento');
    expected := array_append(expected, 'rechazado');
    actual := array_append(actual, outcome);

    begin
      select count(*) into n from public.pc_optins;
      outcome := case when n = 0 then 'no ve nada' else n || ' filas' end;
    exception when others then
      outcome := case when sqlstate = '42501' then 'no ve nada' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'Visitante lee los opt-ins');
    expected := array_append(expected, 'no ve nada');
    actual := array_append(actual, outcome);

    begin
      delete from public.pc_optins;
      get diagnostics n = row_count;
      outcome := case when n = 0 then 'no se borró' else 'se borró' end;
    exception when others then
      outcome := case when sqlstate = '42501' then 'no se borró' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'Visitante borra los opt-ins');
    expected := array_append(expected, 'no se borró');
    actual := array_append(actual, outcome);

    begin
      select count(*) into n from public.pc_collections;
      outcome := case when n = 0 then 'no ve nada' else n || ' filas' end;
    exception when others then
      outcome := case when sqlstate = '42501' then 'no ve nada' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'Visitante ve colectas');
    expected := array_append(expected, 'no ve nada');
    actual := array_append(actual, outcome);

    -- ===== Opt-in: a signed-in account can add one but not read them either =====
    reset role;
    perform set_config('request.jwt.claims',
      json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      select count(*) into n from public.pc_optins;
      outcome := case when n = 0 then 'no ve nada' else n || ' filas' end;
    exception when others then
      outcome := case when sqlstate = '42501' then 'no ve nada' else 'error: ' || sqlerrm end;
    end;
    names := array_append(names, 'A (con sesión) lee los opt-ins');
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
