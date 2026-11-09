-- ADIAK 1.0 / Batch B: scheduled jobs (approved by the owner 2026-11-09). Jobs run as postgres and call class C functions.
--   adiak-reminders  every 5 min  pres_due_reminders(): deadline reminders (deduplicated per deadline)
--   adiak-push-sweep every minute push_sweep(): wakes push-fcm only when deliveries are due or a lease expired
--   adiak-push-purge daily 03:17  push_purge(): drops old outbox rows (sent > 30 d, dead/invalid/cancelled > 90 d)
-- Idempotent: re-scheduling replaces a job of the same name. Skipped where pg_cron is not available (local test DB).
-- Rollback (non-destructive): select cron.unschedule(j) from unnest(array['adiak-reminders','adiak-push-sweep','adiak-push-purge']) j;
do $$ begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    raise notice 'pg_cron not available here: jobs not scheduled'; return;
  end if;
  create extension if not exists pg_cron;
  perform cron.schedule('adiak-reminders',  '*/5 * * * *', 'select public.pres_due_reminders()');
  perform cron.schedule('adiak-push-sweep', '* * * * *',   'select public.push_sweep()');
  perform cron.schedule('adiak-push-purge', '17 3 * * *',  'select public.push_purge()');
end $$;
