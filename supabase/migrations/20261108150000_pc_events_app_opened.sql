-- W6 fix: add 'app_opened' to pc_events' fixed list of names.
-- Sessions don't expire, so a returning organizer is usually already signed in and never
-- passes through the Google screen (no 'signed_in'). Opening /app is the visit itself.
-- Only replaces the CHECK on pc_events (a pc_ table); nothing else in "semestre" is touched.
-- Uses the exact constraint name: if it were different, this fails and nothing changes.

begin;

alter table public.pc_events drop constraint pc_events_name_check;
alter table public.pc_events add constraint pc_events_name_check check (name in (
  'signed_in', 'app_opened', 'cistern_created', 'delivery_saved',
  'verdict_viewed', 'summary_sent', 'challenge_saved'
));

commit;
