create or replace function public.admin_delete_user(u uuid) returns void
language plpgsql security definer set search_path to 'public' as $$
declare p profiles; g bigint;
begin
 select * into p from profiles where id=u;
 if not found then raise exception 'Person not found'; end if;
 if u=auth.uid() then raise exception 'You cannot delete yourself'; end if;
 if p.is_admin then raise exception 'Admin accounts cannot be deleted here'; end if;
 perform public._req_c('accounts',p.class_tag);
 g:=p.group_id;
 if g is not null then
  update profiles set group_id=null where id=u;
  delete from kicks where target_id=u;
  perform _fix_host(g);
  if not exists(select 1 from profiles where group_id=g) then delete from requests where group_id=g; end if;
 end if;
 delete from messages where sender=u;
 delete from auth.users where id=u;
end $$;
revoke execute on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;