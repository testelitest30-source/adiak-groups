-- ADIAK 1.0 / Batch B (PENDING - needs the owner's explicit approval to enable pg_cron in production).
-- Move to supabase/migrations/ only after approval. Jobs run as postgres and call service-only functions.
create extension if not exists pg_cron;
select cron.schedule('adiak-reminders', '*/5 * * * *', $$select public.pres_due_reminders()$$);
select cron.schedule('adiak-push-sweep', '* * * * *', $$select public.push_sweep()$$);
select cron.schedule('adiak-push-purge', '17 3 * * *', $$select public.push_purge()$$);
-- rollback (non-destructive): select cron.unschedule('adiak-reminders'); select cron.unschedule('adiak-push-sweep'); select cron.unschedule('adiak-push-purge');
