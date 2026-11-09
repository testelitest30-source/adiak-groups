// Saxta (mock) məlumat. Real tələbə məlumatı DEYİL. Testlər bunu Supabase cavabı kimi verir.
export const REF = "epenklutnevjvgpsjehp";
export const IDS = {
  student: "00000000-0000-4000-8000-000000000001",
  student2: "00000000-0000-4000-8000-000000000002",
  idle: "00000000-0000-4000-8000-000000000003",
  teacher: "00000000-0000-4000-8000-000000000010",
  admin: "00000000-0000-4000-8000-000000000020",
};

const now = Date.now();
const iso = (minAgo) => new Date(now - minAgo * 60000).toISOString();

export const profiles = [
  { id: IDS.student, name: "Aysel Məmmədova", avatar: null, points: 34, group_id: 1, is_admin: false, perms: [], role: "student", class_tag: "10A" },
  { id: IDS.student2, name: "Rəşad Əliyev", avatar: null, points: 27, group_id: 1, is_admin: false, perms: [], role: "student", class_tag: "10A" },
  { id: IDS.idle, name: "Nigar Quliyeva", avatar: null, points: 12, group_id: null, is_admin: false, perms: [], role: "student", class_tag: "10A" },
  { id: IDS.teacher, name: "Müəllim Həsənov", avatar: null, points: 0, group_id: null, is_admin: false, perms: ["panel", "points"], role: "teacher", class_tag: null },
  { id: "00000000-0000-4000-8000-000000000004", name: "Elvin Hüseynov", avatar: null, points: 41, group_id: 2, is_admin: false, perms: [], role: "student", class_tag: "10A" },
  { id: "00000000-0000-4000-8000-000000000005", name: "Ləman Səfərova", avatar: null, points: 19, group_id: 2, is_admin: false, perms: [], role: "student", class_tag: "10A" },
  { id: "00000000-0000-4000-8000-000000000006", name: "Orxan Quliyev", avatar: null, points: 8, group_id: null, is_admin: false, perms: [], role: "student", class_tag: "10A" },
  { id: IDS.admin, name: "Admin Test", avatar: null, points: 0, group_id: null, is_admin: true, perms: ["admin"], role: "student", class_tag: null },
];

export const tables = {
  profiles,
  groups: [
    { id: 1, name: "Alfa", capacity: 4, host_id: IDS.student, class_tag: "10A", created_at: iso(600) },
    { id: 2, name: "Beta", capacity: 4, host_id: "00000000-0000-4000-8000-000000000004", class_tag: "10A", created_at: iso(500) },
  ],
  app_settings: [{ key: "max_groups", value: "6" }],
  messages: [
    { id: 5, sender: IDS.teacher, channel: "all", body: "Sabah təqdimatlar saat 10:00-da başlayır.", created_at: iso(30), class_tag: "10A" },
    { id: 4, sender: IDS.student, channel: "g:1", body: "Slaydları birlikdə yoxlayaq 👍", created_at: iso(2), class_tag: "10A" },
    { id: 3, sender: IDS.student2, channel: "g:1", body: "Mən giriş hissəsini hazırladım.", created_at: iso(2.5), class_tag: "10A" },
    { id: 2, sender: IDS.student2, channel: "g:1", body: "Bəli, qrupa göndərdim.", created_at: iso(3), class_tag: "10A" },
    { id: 1, sender: IDS.student, channel: "g:1", body: "Salam, tapşırıq hazırdır?", created_at: iso(5), class_tag: "10A" },
  ],
  requests: [{ id: 1, user_id: IDS.idle, group_id: 1, stage: "pending", created_at: iso(15) }],
  join_ballots: [], kicks: [], kick_ballots: [],
  invites: [{ id: 1, user_id: IDS.idle, group_id: 2, by: "00000000-0000-4000-8000-000000000004", created_at: iso(20) }],
  point_events: [
    { id: 3, user_id: IDS.student, amount: 10, kind: "host", reason: "Təqdimat", by: IDS.teacher, created_at: iso(60 * 24) },
    { id: 2, user_id: IDS.student, amount: 14, kind: "host", reason: "Fəallıq", by: IDS.teacher, created_at: iso(60 * 72) },
    { id: 1, user_id: IDS.student, amount: 10, kind: "host", reason: "Komanda işi", by: IDS.teacher, created_at: iso(60 * 120) },
  ],
  sessions: [],
  tags: [{ id: 1, name: "Natiq", emoji: "🎤", color: "#7959D6", descr: "Ən yaxşı çıxış", reward: 5 }],
  user_tags: [{ user_id: IDS.student, tag_id: 1 }],
  msg_reactions: [{ message_id: 2, user_id: IDS.student, emoji: "👍" }],
  archives: [{ id: 1, title: "10A · 1-ci gün", created_at: iso(60 * 48), class_tag: "10A" }],
  archived_messages: [],
  feedback: [{ id: 1, user_id: IDS.student2, body: "Çatda şəkil yükləmək bəzən yavaş olur.", kind: "bug", created_at: iso(90), file: null }],
  class_staff: [], stickers: [],
  // ---- ADIAK 1.0: Presentation Center (event 1: teams Alfa(1) + Beta(2), drawn, Alfa presents 2nd) ----
  pres_events: [{ id: 1, class_tag: "10A", title: "Ekologiya layihəsi — final təqdimatlar", descr: "Hər komanda 7 dəqiqə.", starts_at: new Date(now + 2 * 864e5).toISOString(),
    final_due: new Date(now + 20 * 3600e3).toISOString(), slot_minutes: 7, status: "drawn", frozen_at: null, scores_published_at: null, created_at: iso(3000) }],
  pres_event_teams: [{ event_id: 1, group_id: 1, group_name: "Alfa", speak_state: "open", final_state: "submitted", removed_at: null },
    { event_id: 1, group_id: 2, group_name: "Beta", speak_state: "approved", final_state: "approved", removed_at: null }],
  pres_draws: [{ id: 1, event_id: 1, round: 1, participants: [1, 2], result: [2, 1], drawn_by: IDS.teacher, reason: null, created_at: iso(600), superseded_at: null }],
  pres_roster: [
    { id: 1, event_id: 1, group_id: 1, user_id: IDS.student, user_name: "Aysel Məmmədova", left_at: null, participant: false },
    { id: 2, event_id: 1, group_id: 1, user_id: IDS.student2, user_name: "Rəşad Əliyev", left_at: null, participant: false },
    { id: 3, event_id: 1, group_id: 2, user_id: "00000000-0000-4000-8000-000000000004", user_name: "Elvin Hüseynov", left_at: null, participant: false },
    { id: 4, event_id: 1, group_id: 2, user_id: "00000000-0000-4000-8000-000000000005", user_name: "Ləman Səfərova", left_at: null, participant: false }],
  pres_speakers: [{ event_id: 1, group_id: 1, user_id: IDS.student2, position: 1, withdrawn: false, chosen_at: iso(30) }],
  pres_speakers_final: [], pres_speaker_log: [{ id: 1, event_id: 1, group_id: 1, user_id: IDS.student2, actor: IDS.student2, action: "pick", before_pos: null, after_pos: 1, note: null, at: iso(30) }],
  pres_files: [
    { id: 2, event_id: 1, group_id: 1, path: "e1/g1/22222222-2222-4222-8222-222222222222.pdf", name: "Ekologiya — final.pdf", mime: "application/pdf", size: 2450000, uploader: IDS.student2, uploader_name: "Rəşad Əliyev", created_at: iso(90), hidden_at: null },
    { id: 1, event_id: 1, group_id: 1, path: "e1/g1/11111111-1111-4111-8111-111111111111.pptx", name: "Qaralama v1.pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", size: 5120000, uploader: IDS.student, uploader_name: "Aysel Məmmədova", created_at: iso(900), hidden_at: null }],
  pres_submissions: [{ id: 1, event_id: 1, group_id: 1, file_id: 2, version: 1, state: "submitted", submitted_by: IDS.student2, submitted_at: iso(80), reviewed_by: null, reviewed_at: null, note: null }],
  pres_tasks: [
    { id: 1, event_id: 1, group_id: 1, title: "Giriş slaydını hazırla", assignee: IDS.student, due: new Date(now + 6 * 3600e3).toISOString(), status: "todo", created_by: IDS.student2 },
    { id: 2, event_id: 1, group_id: 1, title: "Statistika qrafiki", assignee: IDS.student2, due: null, status: "done", created_by: IDS.student2 }],
  pres_announcements: [{ id: 1, event_id: 1, body: "Təqdimatı PDF formatında yükləyin.", author: IDS.teacher, created_at: iso(200) }],
  pres_live: [{ event_id: 1, state: "idle", slot_index: 0, slot_started_at: null, paused_at: null, elapsed_ms: 0, duration_s: 420, version: 0, speaker_index: 0 }],
  pres_live_slots: [], pres_scores: [], pres_rubrics: [], pres_staff_notes: [],
  class_announcements: [], assignments: [], assignment_submissions: [], class_issues: [],
};

export const rpc = {
  claim_session: null,
  my_access: { uid: IDS.student, role: "student", owner: false, admin: false, perms: [], class: "10A", group: 1, teaches: [], leads: [] },
  server_now: new Date().toISOString(),
  notes_list: [{ id: 7, user_id: IDS.student, kind: "pres.task_assigned", params: { title: "Ekologiya layihəsi", task: "Giriş slaydını hazırla" }, target: { k: "pres", event: 1, group: 1, sec: "tasks" }, created_at: iso(12), read_at: null }],
  notes_read: 1, pres_my_history: [],
  staff_classes: [{ tag: "10A" }],
  class_choices: [],
  admin_list_passwords: [],
};

// supabase-js 2.45 sessiyanı localStorage-dan oxuyur; vaxtı bitməyibsə şəbəkəyə getmir.
function b64url(o) { return Buffer.from(JSON.stringify(o)).toString("base64url"); }
export function fakeSession(userId) {
  const exp = Math.floor(Date.now() / 1000) + 24 * 3600;
  const access_token = `${b64url({ alg: "none", typ: "JWT" })}.${b64url({ sub: userId, exp, role: "authenticated", aud: "authenticated" })}.mock`;
  const user = { id: userId, aud: "authenticated", role: "authenticated", email: "mock@classroom.app", user_metadata: {}, app_metadata: {} };
  return { key: `sb-${REF}-auth-token`, value: JSON.stringify({ access_token, refresh_token: "mock-refresh", token_type: "bearer", expires_in: 86400, expires_at: exp, user }) };
}

// Bildirişlər brauzerdə saxlanır (localStorage "notes:<uid>"), Supabase-də yox
export function fakeNotes() {
  const t = Date.now();
  return [
    { id: 3, t: "📬 1 müraciət sizi gözləyir", b: "Müraciətləri aç", act: { k: "req" }, time: t - 6e5, read: false },
    { id: 2, t: "🏷️ Yeni teq!", b: "🎤 Natiq", act: null, time: t - 36e5, read: false },
    { id: 1, t: "+10 xal", b: "Təqdimat", act: null, time: t - 864e5, read: true },
  ];
}
