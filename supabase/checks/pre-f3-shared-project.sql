-- Read-only checks before F3, for the shared Supabase project "semestre".
-- Nothing here creates, changes or deletes anything. Run each query in the SQL editor.

-- 1. Name collisions: should return 0 rows for both queries.
select table_schema, table_name
from information_schema.tables
where table_name like 'pc\_%';

select id, public
from storage.buckets
where id like 'pc%';

-- 2. Triggers on auth.users: every new Google user of ANY app in this project fires them.
--    If one inserts into another app's table (e.g. a "profiles" trigger), a Pipa Clara
--    sign-in could fail or create a stray row there.
select tgname, pg_get_triggerdef(t.oid) as definition
from pg_trigger t
where tgrelid = 'auth.users'::regclass
  and not tgisinternal;

-- 3. Storage policies: they apply to storage.objects across ALL buckets.
--    Any row whose qual / with_check does NOT mention a bucket_id would also open pc_readings.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects';
