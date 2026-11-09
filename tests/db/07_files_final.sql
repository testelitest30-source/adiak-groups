-- Files and final version: path/owner/type/size validated, one active submission, approved final locked, history kept.
select test.mk_event() as e \gset
insert into storage.objects(bucket_id, name, owner) values
 ('team-files', 'e' || :e || '/g1/11111111-1111-4111-8111-111111111111.pptx', test.id('s2')),
 ('team-files', 'e' || :e || '/g1/22222222-2222-4222-8222-222222222222.pdf', test.id('s2')),
 ('team-files', 'e' || :e || '/g2/33333333-3333-4333-8333-333333333333.pdf', test.id('s4')),
 ('team-files', 'e' || :e || '/g1/44444444-4444-4444-8444-444444444444.exe', test.id('s2'));
select test.as(test.id('s2'));
select test.lives(format($q$select public.pres_add_file(%s, 'e%s/g1/11111111-1111-4111-8111-111111111111.pptx', 'Slides v1.pptx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', 1000)$q$, :e, :e), 'member registers an upload');
select test.throws(format($q$select public.pres_add_file(%s, 'e%s/g2/33333333-3333-4333-8333-333333333333.pdf', 'x.pdf', 'application/pdf', 10)$q$, :e, :e),
  'invalid file path', 'cannot register a file into another team');
select test.throws(format($q$select public.pres_add_file(%s, 'e%s/g1/44444444-4444-4444-8444-444444444444.exe', 'x.exe', 'application/x-msdownload', 10)$q$, :e, :e),
  'invalid file path|not allowed', 'disallowed type rejected');
select test.throws(format($q$select public.pres_add_file(%s, 'e%s/g1/22222222-2222-4222-8222-222222222222.pdf', 'big.pdf', 'application/pdf', 30000000)$q$, :e, :e),
  '25 MB', 'oversized file rejected');
select test.throws(format($q$select public.pres_add_file(%s, 'e%s/g1/55555555-5555-4555-8555-555555555555.pdf', 'ghost.pdf', 'application/pdf', 10)$q$, :e, :e),
  'not found', 'unregistered storage object rejected');
select test.as(test.id('s3'));
select test.throws(format($q$select public.pres_add_file(%s, 'e%s/g1/22222222-2222-4222-8222-222222222222.pdf', 'v2.pdf', 'application/pdf', 10)$q$, :e, :e),
  'not found', 'cannot claim an object uploaded by someone else');
select test.as(test.id('s2'));
select public.pres_add_file(:e, 'e' || :e || '/g1/22222222-2222-4222-8222-222222222222.pdf', 'Slides v2.pdf', 'application/pdf', 2000) as f2 \gset
select test.as_db();
select min(id) as f1 from public.pres_files where event_id = :e \gset
-- storage policy: who can read/insert objects
select test.as(test.id('s4'));
select test.eq((select count(*)::int from storage.objects where bucket_id = 'team-files' and name like 'e' || :e || '/g1/%'), 0, 'other team cannot see team 1 objects (storage RLS)');
select test.eq((select count(*)::int from public.pres_files where event_id = :e and group_id = 1), 0, 'other team cannot see team 1 file rows');
select test.throws(format($q$insert into storage.objects(bucket_id, name, owner) values ('team-files', 'e%s/g1/66666666-6666-4666-8666-666666666666.pdf', auth.uid())$q$, :e),
  'row-level security', 'other team cannot upload into team 1 folder');
select test.as(test.id('s1'));
select test.eq((select count(*)::int from storage.objects where bucket_id = 'team-files' and name like 'e' || :e || '/g1/%'), 3, 'own team sees its objects');
select test.as_db();
select md5(string_agg(name, ',' order by name)) as objsig from storage.objects where bucket_id = 'team-files' \gset
select test.as(test.id('s1'));
update storage.objects set name = name || 'x' where bucket_id = 'team-files';
delete from storage.objects where bucket_id = 'team-files';
select test.as_db();
select test.eq((select md5(string_agg(name, ',' order by name)) from storage.objects where bucket_id = 'team-files'), :'objsig', 'client UPDATE/DELETE on team files affects 0 rows (no policy)');
select test.as(test.id('s1'));
select test.as(test.id('tpres'));
select test.eq((select count(*)::int from public.pres_files where event_id = :e), 2, 'class staff sees all team files');
-- final submission
select test.as(test.id('s3'));
select test.lives(format('select public.pres_submit_final(%s, null)', :f1), 'member submits v1 as final');
select test.throws(format('select public.pres_submit_final(%s, null)', :f2), 'changed meanwhile', 'stale client (concurrent submit) rejected');
select test.as_db();
select id as s1 from public.pres_submissions where event_id = :e and state = 'submitted' \gset
select test.as(test.id('s2'));
select test.lives(format('select public.pres_submit_final(%s, %s)', :f2, :s1), 'resubmission before review creates version 2');
select test.as_db();
select test.eq((select state from public.pres_submissions where id = :s1), 'superseded', 'version 1 kept as superseded');
select id as s2 from public.pres_submissions where event_id = :e and state = 'submitted' \gset
select test.eq((select version from public.pres_submissions where id = :s2), 2, 'version numbering');
select test.as(test.id('s1'));
select test.throws(format('select public.pres_review_final(%s, ''approve'')', :s2), 'permission', 'student cannot approve a final');
select test.throws(format('select public.pres_hide_file(%s)', :f1), 'cannot be hidden|only the uploader', 'submitted file cannot be hidden');
select test.as(test.id('tpres'));
select test.lives(format('select public.pres_review_final(%s, ''approve'', ''Looks good'')', :s2), 'staff approves version 2');
select test.as(test.id('s2'));
select test.throws(format('select public.pres_submit_final(%s, %s)', :f1, :s2), 'approved final already exists', 'team cannot replace an approved final');
select test.throws(format('select public.pres_hide_file(%s)', :f2), 'cannot be hidden', 'approved file cannot be hidden');
select test.as_db();
select test.throws(format('update public.pres_submissions set file_id = %s where id = %s', :f1, :s2), 'protected', 'approved submission cannot be repointed (even by owner)');
select test.throws(format('update public.pres_submissions set state = ''submitted'' where id = %s', :s2), 'invalid submission transition', 'approved -> submitted is illegal');
select test.throws(format('delete from public.pres_submissions where id = %s', :s2), 'cannot be deleted', 'submissions cannot be deleted');
select test.throws(format('delete from public.pres_files where id = %s', :f2), 'cannot be deleted', 'files cannot be deleted');
select test.throws(format($q$insert into public.pres_submissions(event_id, group_id, file_id, version, state, submitted_by) values (%s, 1, %s, 9, 'approved', test.id('s2'))$q$, :e, :f1),
  'duplicate key', 'a second active/approved final is impossible (unique index)');
select test.as(test.id('tpres'));
select test.throws(format('select public.pres_review_final(%s, ''return'')', :s2), 'reason', 'return requires a note');
select test.lives(format('select public.pres_review_final(%s, ''return'', ''Please fix slide 4'')', :s2), 'staff returns the approved final for corrections');
select test.as(test.id('s2'));
select test.lives(format('select public.pres_submit_final(%s, null)', :f1), 'new submission after return');
select test.as_db();
select test.eq((select max(version) from public.pres_submissions where event_id = :e), 3, 'new submission is version 3');
select test.eq((select array_agg(state order by version) from public.pres_submissions where event_id = :e), array['superseded','returned','submitted'],
  'complete version/approval history preserved');
select test.ok((select count(*) >= 5 from public.pres_audit where entity = 'pres_submissions' and event_id = :e), 'every submission change audited');
select test.ok(exists(select 1 from public.pres_audit where entity = 'pres_submissions' and reason = 'Please fix slide 4'), 'return reason stored in audit');
-- hide/unhide drafts (audited)
insert into storage.objects(bucket_id, name, owner) values ('team-files', 'e' || :e || '/g1/77777777-7777-4777-8777-777777777777.pdf', test.id('s3'));
select test.as(test.id('s3'));
select public.pres_add_file(:e, 'e' || :e || '/g1/77777777-7777-4777-8777-777777777777.pdf', 'draft.pdf', 'application/pdf', 50) as f3 \gset
select test.as(test.id('s2'));
select test.throws(format('select public.pres_hide_file(%s)', :f3), 'only the uploader', 'member cannot hide someone else''s draft');
select test.as(test.id('s3'));
select test.lives(format('select public.pres_hide_file(%s, ''old draft'')', :f3), 'uploader hides own draft');
select test.lives(format('select public.pres_unhide_file(%s)', :f3), 'uploader restores it');
select test.as_db();
select test.eq((select count(*)::int from public.pres_audit where entity = 'pres_files' and entity_id = :f3::text and action = 'update'), 2, 'hide and unhide audited');
