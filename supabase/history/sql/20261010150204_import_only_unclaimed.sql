create or replace function admin_import_students(names text[]) returns table(slot_name text, new_name text, new_login text, temp_password text) language plpgsql security definer set search_path=public as $$
declare slots uuid[]; i int; j int:=0; raw text; parts text[]; fn text; ln text; base text; idt text; k int; nm text; pw text; u uuid; olds text;
begin perform _req_admin();
 -- only accounts nobody has claimed yet (password never changed) are given to the new names
 select array_agg(p.id order by p.login) into slots from profiles p join auth.users a on a.id=p.id
  where not p.is_admin and coalesce(a.raw_user_meta_data->>'must_change','')='true';
 if names is null or array_length(names,1) is null then raise exception 'No names given'; end if;
 if array_length(names,1)>coalesce(array_length(slots,1),0) then raise exception 'Only % unused accounts are left, but % names were given',coalesce(array_length(slots,1),0),array_length(names,1); end if;
 for i in 1..array_length(names,1) loop
  raw:=regexp_replace(trim(names[i]),'\s+',' ','g'); continue when raw='';
  j:=j+1; u:=slots[j]; parts:=string_to_array(raw,' ');
  fn:=regexp_replace(translate(lower(parts[1]),'əıöüçşğ','eioucsg'),'[^a-z0-9]','','g');
  ln:=regexp_replace(translate(lower(parts[array_length(parts,1)]),'əıöüçşğ','eioucsg'),'[^a-z0-9]','','g');
  base:=case when array_length(parts,1)>1 and ln<>'' then fn||'.'||left(ln,1) else fn end;
  if base='' then base:='student'||j; end if;
  idt:=base; k:=1;
  while exists(select 1 from auth.users where email=idt||'@classroom.app' and id<>u) loop k:=k+1; idt:=base||k; end loop;
  nm:=left(raw,30); k:=1;
  while exists(select 1 from profiles where name=nm and id<>u) loop k:=k+1; nm:=left(raw,26)||' '||k; end loop;
  select name into olds from profiles where id=u; pw:=_pwgen();
  update profiles set name=nm, login=idt||'@classroom.app' where id=u;
  update auth.users set email=idt||'@classroom.app' where id=u;
  update auth.identities set identity_data=jsonb_set(identity_data,'{email}',to_jsonb(idt||'@classroom.app')) where user_id=u and provider='email';
  perform _set_temp(u,pw);
  slot_name:=olds; new_name:=nm; new_login:=idt; temp_password:=pw; return next;
 end loop;
end $$;