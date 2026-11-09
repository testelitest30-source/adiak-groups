-- parol surəti həqiqi parolla yoxlanılır: uyğun gəlməyəndə parol qaytarılmır, vəziyyət "stale" olur
create or replace function admin_get_password(u uuid) returns table(pw text, source text, updated_at timestamptz) language plpgsql security definer set search_path=public as $$
begin perform _req('passwords');
 if _perm(u,'admin') then raise exception 'Admin passwords are private. Only the admin can change their own password.'; end if;
 return query
  select case when a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password)
              then extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()) end,
         case when a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password)
              then v.source else 'stale' end,
         v.updated_at
  from password_vault v join auth.users a on a.id=v.user_id where v.user_id=u;
end $$;

create or replace function admin_list_passwords() returns table(user_id uuid, name text, login text, role text, pw text, source text, updated_at timestamptz) language plpgsql security definer set search_path=public as $$
begin perform _req('passwords');
 return query
  select p.id,p.name,p.login,p.role,
   case when v.ct is not null and a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password)
        then extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()) end,
   case when v.ct is null then null
        when a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password) then v.source
        else 'stale' end,
   v.updated_at
  from profiles p join auth.users a on a.id=p.id left join password_vault v on v.user_id=p.id
  where not _perm(p.id,'admin') order by p.name;
end $$;