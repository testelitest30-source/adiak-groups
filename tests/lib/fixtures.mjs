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
  { id: IDS.admin, name: "Admin Test", avatar: null, points: 0, group_id: null, is_admin: true, perms: ["admin"], role: "student", class_tag: null },
];

export const tables = {
  profiles,
  groups: [{ id: 1, name: "Alfa", capacity: 4, host_id: IDS.student, class_tag: "10A", created_at: iso(600) }],
  app_settings: [{ key: "max_groups", value: "6" }],
  messages: [
    { id: 2, sender: IDS.student2, channel: "g:1", body: "Bəli, qrupa göndərdim.", created_at: iso(3), class_tag: "10A" },
    { id: 1, sender: IDS.student, channel: "g:1", body: "Salam, tapşırıq hazırdır?", created_at: iso(5), class_tag: "10A" },
  ],
  requests: [], join_ballots: [], kicks: [], kick_ballots: [], invites: [],
  point_events: [], sessions: [], tags: [], user_tags: [], msg_reactions: [],
  archives: [], archived_messages: [], feedback: [], class_staff: [], stickers: [],
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
