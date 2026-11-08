-- ADIAK 1.0 / M6 bug fix (existing): delete_message() sets body='' and file_path=null, which violates
-- messages_body_check, so deleting a message has always failed (production: 0 deleted of 279 messages).
-- Relax the check for soft-deleted rows only; every other row keeps exactly the old rule.
do $$ begin
  if pg_get_constraintdef((select oid from pg_constraint where conname = 'messages_body_check'))
     <> 'CHECK (((char_length(body) <= 1000) AND ((file_path IS NOT NULL) OR (char_length(body) >= 1))))' then
    raise exception 'pre-flight: messages_body_check differs from the reviewed baseline';
  end if;
end $$;
alter table public.messages drop constraint messages_body_check;
alter table public.messages add constraint messages_body_check
  check (char_length(body) <= 1000 and (deleted or file_path is not null or char_length(body) >= 1));
