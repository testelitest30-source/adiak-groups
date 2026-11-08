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
};

export const rpc = {
  claim_session: null,
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
