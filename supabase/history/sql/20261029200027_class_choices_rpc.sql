create or replace function public.class_choices() returns table(tag text,title text) language sql stable security definer set search_path to 'public' as $f$
 select c.tag,c.title from classes c
 where exists(select 1 from profiles me where me.id=auth.uid() and me.role='student' and me.class_tag is null and not public._perm(me.id,'admin'))
 order by c.tag $f$;
revoke all on function public.class_choices() from public, anon;
grant execute on function public.class_choices() to authenticated;