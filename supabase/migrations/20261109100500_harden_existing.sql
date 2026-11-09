-- ADIAK 1.0 / Batch C: hardening of EXISTING objects (separately approved). Grants only; no function body changes.
--  * push_targets(mid) returned other users' push endpoints/keys to any signed-in caller -> service_role only
--  * internal helpers (_tag_award, _tags_eval, _perm, ...) were callable via the API -> revoked from clients
--  * 4 trigger functions were executable by PUBLIC/anon -> revoked
--  * anon/authenticated had INSERT/UPDATE/DELETE grants on public tables (RLS blocked them; every app write is an RPC)
-- Policy helpers used inside RLS (_can_class, _can_see_user, _chtag, _cperm, _gtag, _is_admin, _ptag) keep EXECUTE for authenticated.
do $$ begin
  if to_regprocedure('public.push_targets(bigint)') is null then raise exception 'pre-flight: push_targets missing (unexpected schema)'; end if;
end $$;

revoke execute on function
  public.push_targets(bigint), public._chan_ok(text, uuid), public._def_class(), public._msg_class(), public._norm_tag(text),
  public._perm(uuid, text), public._req(text), public._req_c(text, text), public._req_admin(), public._tag_award(uuid, public.tags, text),
  public._tags_eval(uuid), public._tg_push(), public._tg_grp(), public._tg_prof(), public._group_tag_fill(), public._same_class_in_group(),
  public._only_students_in_groups()
  from public, anon, authenticated;
grant execute on function public.push_targets(bigint) to service_role;

revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke all on public.push_config, public.push_subs, public.password_vault from anon, authenticated;
