-- ADIAK 1.0: pin search_path on the last pre-existing function the security advisor flags (function_search_path_mutable).
-- The trigger body only reads NEW.* fields and touches no relation, so behaviour cannot change.
do $$ begin
  if md5(pg_get_functiondef('public._only_students_in_groups()'::regprocedure)) is null then raise exception 'pre-flight: function missing'; end if;
end $$;
alter function public._only_students_in_groups() set search_path = pg_catalog, public;
-- rollback: alter function public._only_students_in_groups() reset search_path;
