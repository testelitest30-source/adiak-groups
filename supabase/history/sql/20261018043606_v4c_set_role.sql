-- admin: tələbəni müəllim etmək və ya əksinə (müəllim olanda qrupdan çıxarılır, xalı sıfırlanmır)
create function admin_set_role(u uuid, r text) returns void language plpgsql security definer set search_path=public as $$
declare g bigint;
begin perform _req_admin();
 if r not in ('student','teacher') then raise exception 'Role must be student or teacher'; end if;
 if exists(select 1 from profiles where id=u and is_admin) then raise exception 'The Host account has no role'; end if;
 if r='teacher' then
  select group_id into g from profiles where id=u;
  if g is not null then update profiles set group_id=null where id=u; delete from kicks where target_id=u; perform _fix_host(g); end if;
  delete from requests where user_id=u; delete from invites where user_id=u;
 end if;
 update profiles set role=r where id=u;
end $$;
revoke execute on function admin_set_role(uuid,text) from public, anon;
grant execute on function admin_set_role(uuid,text) to authenticated;