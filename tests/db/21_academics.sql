-- Class announcements, assignments + submissions, class-leader issues, overviews; class isolation.
update public.class_staff set perms = '{groups,chats,accounts,announce,report}' where user_id = test.id('tnone');
-- announcements
select test.as(test.id('s1'));
select test.throws($q$select public.class_announce('c1', 'Hello', 'text')$q$, 'permission', 'student cannot post class announcements');
select test.as(test.id('tnone'));
select test.lives($q$select public.class_announce('c1', 'Room change', 'We meet in 204 on Friday')$q$, 'class leader posts an announcement');
select test.throws($q$select public.class_announce('c2', 'Hi', 'x')$q$, 'permission', 'class leader cannot post to another class');
select test.as(test.id('tpres'));
select test.lives($q$select public.class_announce('c1', 'Exam', 'Bring calculators', true)$q$, 'teacher posts a pinned announcement');
select test.as_db();
select test.ok((select count(*) >= 6 from public.notifications where kind = 'class.announce' and user_id in (test.id('s1'), test.id('s2'), test.id('s3'), test.id('s4'), test.id('s5'), test.id('s6'))),
  'class students notified');
select test.as(test.id('x1'));
select test.eq((select count(*)::int from public.class_announcements), 0, 'other class sees none');
select test.as(test.id('s2'));
select test.eq((select count(*)::int from public.class_announcements), 2, 'class student sees both');
-- assignments
select test.as(test.id('tnone'));
select test.throws($q$select public.assignment_save(null, 'c1', 'Essay', '', null, 'individual', true)$q$, 'only teachers', 'class leader cannot create assignments');
select test.as(test.id('tpres'));
select public.assignment_save(null, 'c1', 'Essay', 'Write 500 words', now() + interval '2 days', 'individual', true) as a1 \gset
select public.assignment_save(null, 'c1', 'Team poster', '', now() - interval '1 hour', 'team', false) as a2 \gset
select test.as(test.id('s1'));
select test.eq((select count(*)::int from public.assignments), 0, 'drafts are invisible to students');
select test.throws(format($q$select public.assignment_submit(%s, null, null, null, null, 'done')$q$, :a1), 'not open', 'cannot submit to a draft');
select test.as(test.id('tpres'));
select public.assignment_status(:a1, 'published'); select public.assignment_status(:a2, 'published');
select test.as_db();
insert into storage.objects(bucket_id, name, owner) values ('class-files', 'a' || :a1 || '/' || test.id('s1') || '/11111111-1111-4111-8111-111111111111.pdf', test.id('s1'));
select test.as(test.id('s2'));
select test.throws(format($q$insert into storage.objects(bucket_id, name, owner) values ('class-files', 'a%s/%s/22222222-2222-4222-8222-222222222222.pdf', auth.uid())$q$, :a1, test.id('s1')),
  'row-level security', 'cannot upload into another student''s folder');
select test.as(test.id('s1'));
select test.lives(format($q$select public.assignment_submit(%s, 'a%s/%s/11111111-1111-4111-8111-111111111111.pdf', 'essay.pdf', 'application/pdf', 1000, 'first draft')$q$, :a1, :a1, test.id('s1')),
  'student submits a file');
select test.throws(format($q$select public.assignment_submit(%s, null, null, null, null, 'v2')$q$, :a1), 'changed meanwhile', 'stale client refused');
select id as sub1 from public.assignment_submissions where assignment_id = :a1 \gset
select test.lives(format($q$select public.assignment_submit(%s, null, null, null, null, 'v2 note', %s)$q$, :a1, :sub1), 'resubmission creates version 2');
select test.lives(format($q$select public.assignment_submit(%s, null, null, null, null, 'team work')$q$, :a2), 'team assignment: s1 submits for team 1 (late allowed)');
select test.as(test.id('s2'));
select test.eq((select count(*)::int from public.assignment_submissions where assignment_id = :a1), 0, 'students cannot see each other''s individual work');
select test.as(test.id('s6'));
select test.throws(format($q$select public.assignment_submit(%s, null, null, null, null, 'x')$q$, :a2), 'join a team', 'idle student cannot submit team work');
select test.as(test.id('x1'));
select test.throws(format($q$select public.assignment_submit(%s, null, null, null, null, 'x')$q$, :a1), 'another class|not open', 'other class cannot submit');
select test.as(test.id('tpres'));
select id as sub2 from public.assignment_submissions where assignment_id = :a1 and state = 'submitted' \gset
select test.throws(format($q$select public.assignment_review(%s, 'changes', '')$q$, :sub2), 'what to change', 'change request needs feedback');
select test.lives(format($q$select public.assignment_review(%s, 'accept', 'Well done')$q$, :sub2), 'teacher accepts');
select test.as(test.id('s1'));
select test.throws(format($q$select public.assignment_submit(%s, null, null, null, null, 'v3', %s)$q$, :a1, :sub2), 'already accepted', 'accepted work cannot be replaced by the student');
select test.as_db();
select test.eq((select array_agg(state order by version) from public.assignment_submissions where assignment_id = :a1), array['superseded','accepted'], 'version history kept');
select test.throws(format('delete from public.assignment_submissions where assignment_id = %s', :a1), 'cannot be deleted', 'submissions cannot be deleted');
select test.ok(exists(select 1 from public.notifications where kind = 'class.review_accept' and user_id = test.id('s1')), 'student notified of the review');
select test.ok((select late from public.assignment_submissions where assignment_id = :a2 limit 1) is not false, 'late team submission flagged');
-- missing + overview + teacher home
select test.as(test.id('tpres'));
select test.ok((select count(*) from public.assignment_missing(:a1)) = 5, 'missing list: 5 of 6 students have not submitted');
select test.ok((public.class_overview('c1')->>'students')::int = 6 and jsonb_array_length(public.class_overview('c1')->'assignments') = 2, 'class overview');
select test.ok(jsonb_array_length(public.teacher_home()->'classes') = 1, 'teacher home lists the teacher''s classes');
select test.throws($q$select public.class_overview('c2')$q$, 'permission', 'teacher cannot open another class overview');
select test.as(test.id('tnone'));
select test.ok((public.class_overview('c1')->>'students')::int = 6, 'class leader sees the class hub overview');
select test.throws(format('select * from public.assignment_missing(%s)', :a1), 'permission', 'class leader cannot see teacher-only lists');
-- issues
select test.lives($q$select public.class_issue_report('c1', 'Projector broken', 'Room 204')$q$, 'class leader reports an issue');
select test.as(test.id('s1'));
select test.throws($q$select public.class_issue_report('c1', 'x issue', '')$q$, 'only the class representative', 'normal student cannot use the class report channel');
select test.eq((select count(*)::int from public.class_issues), 0, 'students cannot read class issues');
select test.as(test.id('tpres'));
select test.lives($q$select public.class_issue_update((select id from public.class_issues limit 1), 'resolved', 'Fixed')$q$, 'teacher resolves the issue');
select test.as_db();
select test.ok(exists(select 1 from public.notifications where kind = 'class.issue_update' and user_id = test.id('tnone')), 'reporter notified');
