-- Persona-test fix: what the organizer actually paid the driver, which can be
-- less than the price he asked when the verdict is "short". She decides; the app
-- only does the arithmetic. null = she hasn't changed it, so the full price was paid.
-- Only adds one column to a pc_ table; nothing else in "semestre" is touched.

alter table public.pc_deliveries
  add column paid_mxn int check (paid_mxn between 0 and 20000);
