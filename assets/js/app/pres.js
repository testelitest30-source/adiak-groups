/* =====================================================================
   pres.js — ADIAK 1.0: server-backed notification centre, deep links (openTarget) and the student
   Team Presentation Center (overview, draw position, speaking order, files + FINAL, tasks, event chat,
   announcements, published feedback). Loads after extras.js, before main.js.
   Everything here is enabled only when the server supports it (my_access RPC); otherwise the app
   behaves exactly as before. All rules are enforced server-side; the UI only mirrors them.
   ===================================================================== */
Object.assign(AZ, {
  "Presentations": "Təqdimatlar", "Presentation": "Təqdimat", "No presentations yet": "Hələ təqdimat yoxdur",
  "When your teacher creates a presentation for your class, it appears here with your team's workspace.": "Müəllim sinfiniz üçün təqdimat yaratdıqda, komandanızın iş sahəsi ilə birlikdə burada görünəcək.",
  "Overview": "İcmal", "Speaking order": "Çıxış sırası", "Files": "Fayllar", "Tasks": "Tapşırıqlar", "Feedback": "Rəy",
  "Deadline": "Son tarix", "Starts": "Başlayır", "Your team": "Komandanız", "Team position": "Komandanın sırası", "Draw pending": "Püşk hələ atılmayıb",
  "#{pos} of {n}": "{n} komandadan {pos}-ci", "Preparation": "Hazırlıq", "Ready": "Hazırdır", "Order approved": "Sıra təsdiqlənib", "Final approved": "Final təsdiqlənib",
  "Tasks done": "Bitmiş tapşırıqlar", "Live now": "İndi canlı", "Open live stage": "Canlı səhnəni aç", "presenting": "çıxış edir", "Up next": "Növbəti",
  "Choose your position": "Yerinizi seçin", "Free": "Boş", "You": "Siz", "Submit order": "Sıranı göndər", "Approve order": "Sıranı təsdiqlə", "Reopen order": "Sıranı yenidən aç",
  "Leave position": "Yeri burax", "Waiting for approval": "Təsdiq gözlənilir", "Approved": "Təsdiqlənib", "Needs review": "Yoxlanmalıdır", "Open": "Açıq",
  "Everyone must pick a different position, then anyone can submit.": "Hər kəs fərqli yer seçməlidir, sonra istənilən üzv göndərə bilər.",
  "{a} of {b} chosen": "{b} nəfərdən {a} seçib", "The team host or your teacher approves the order.": "Sıranı komanda hostu və ya müəllim təsdiqləyir.",
  "History": "Tarixçə", "Upload file": "Fayl yüklə", "FINAL PRESENTATION": "FİNAL TƏQDİMAT", "No final yet": "Hələ final yoxdur",
  "Pick a file below and press “Submit as final”.": "Aşağıdan fayl seçib “Final kimi göndər” düyməsini basın.", "Submit as final": "Final kimi göndər",
  "Pending review": "Yoxlanılır", "Returned for corrections": "Düzəliş üçün qaytarıldı", "Approved final": "Təsdiqlənmiş final", "approved by {nm}": "{nm} təsdiqləyib",
  "Locked: only your teacher can return it.": "Kilidlidir: yalnız müəllim geri qaytara bilər.", "Drafts and versions": "Qaralamalar və versiyalar",
  "No files yet": "Hələ fayl yoxdur", "Hide": "Gizlət", "Restore": "Bərpa et", "Hidden": "Gizlədilib", "Submit this file as the final version?": "Bu faylı final versiya kimi göndərək?",
  "Final presentations should be PDF so they open in the live viewer. Upload it anyway?": "Final təqdimat PDF olmalıdır ki, canlı baxışda açılsın. Yenə də yükləyək?",
  "This file type is not allowed": "Bu fayl tipinə icazə yoxdur", "Uploading…": "Yüklənir…", "Uploaded ✓": "Yükləndi ✓", "Submissions": "Göndərişlər",
  "New task": "Yeni tapşırıq", "Task title": "Tapşırığın adı", "Assign to": "Kimə", "Nobody": "Heç kim", "Add": "Əlavə et", "No tasks yet": "Hələ tapşırıq yoxdur",
  "to do": "görüləcək", "doing": "icrada", "done": "bitib", "cancelled": "ləğv edilib", "Mark done": "Bitdi", "Start": "Başla", "Reopen": "Yenidən aç", "Cancel task": "Ləğv et",
  "Team chat": "Komanda çatı", "Open chat": "Çatı aç", "Announcements": "Elanlar", "No announcements": "Elan yoxdur",
  "Feedback is not published yet.": "Rəy hələ dərc olunmayıb.", "Total": "Cəmi", "Reviewer {n}": "Rəyçi {n}", "Measured time": "Ölçülən vaxt",
  "Your team is not part of this presentation.": "Komandanız bu təqdimatda iştirak etmir.", "View only": "Yalnız baxış",
  "My presentations": "Mənim təqdimatlarım", "left team": "komandadan çıxıb", "participant": "iştirakçı", "uploads": "yükləmə",
  "draft": "qaralama", "open": "açıq", "drawn": "püşk atılıb", "live": "canlı", "finished": "bitib", "Final": "Final",
  "No longer available": "Artıq mövcud deyil", "You do not have access to this anymore.": "Bunu artıq görmək icazəniz yoxdur.",
  "Due {d}": "Son tarix: {d}", "in {t}": "{t} sonra", "{t} ago": "{t} əvvəl", "overdue": "vaxtı keçib", "Team draw": "Komandaların püşkü",
  "Order of teams": "Komandaların sırası", "Round {n}": "{n}-ci tur", "speakers": "natiqlər", "not chosen": "seçilməyib", "withdrawn": "çıxıb",
  "Version {v}": "Versiya {v}", "Reason": "Səbəb", "note": "qeyd", "min": "dəq", "h": "saat", "d": "gün"
});
Object.assign(AZ_ERR, {
  "You are not in a team for this presentation": "Bu təqdimatda komandanız yoxdur", "That position is already taken": "Bu yer artıq tutulub",
  "Every member must choose a different position first": "Əvvəlcə hər üzv fərqli yer seçməlidir", "The speaking order was already submitted": "Çıxış sırası artıq göndərilib",
  "An approved final already exists. Only staff can return it for corrections.": "Təsdiqlənmiş final artıq var. Yalnız müəllim düzəliş üçün qaytara bilər.",
  "The final version changed meanwhile. Reload and try again.": "Final versiya bu arada dəyişib. Yeniləyib yenidən cəhd edin.",
  "A submitted file cannot be hidden.": "Göndərilmiş fayl gizlədilə bilməz.", "Files must be under 25 MB": "Fayl 25 MB-dan kiçik olmalıdır",
  "This file type is not allowed": "Bu fayl tipinə icazə yoxdur", "Too many requests. Please wait a moment and try again.": "Çox sürətli. Bir az gözləyib yenidən cəhd edin.",
  "Only the team host or staff can approve the order": "Sıranı yalnız komanda hostu və ya müəllim təsdiqləyə bilər",
  "The task can only be assigned to a member of this team": "Tapşırıq yalnız bu komandanın üzvünə verilə bilər",
  "Only the assignee or the creator can update this task": "Tapşırığı yalnız icraçı və ya yaradan dəyişə bilər"
});

/* ---------- state ---------- */
const PX = { on: false, acc: null, notes: [], cann: [], asg: [], asub: [], iss: [], ev: [], et: [], dr: [], ro: [], sp: [], spf: [], fl: [], sub: [], tk: [], an: [], lv: [], ls: [], sc: [], rb: [], log: [],
  cur: null, sec: "overview", off: 0, tm: null, loaded: false, hist: null };
window.PX = PX;   // top-level const is not a window property; core.js (SN) and tests read window.PX
const pxTables = { pres_events: "ev", pres_event_teams: "et", pres_draws: "dr", pres_roster: "ro", pres_speakers: "sp", pres_speakers_final: "spf",
  pres_files: "fl", pres_submissions: "sub", pres_tasks: "tk", pres_announcements: "an", pres_live: "lv", pres_live_slots: "ls", pres_scores: "sc", pres_rubrics: "rb", pres_speaker_log: "log",
  class_announcements: "cann", assignments: "asg", assignment_submissions: "asub", class_issues: "iss" };
const pxOrder = { pres_events: "id", pres_files: "id", pres_submissions: "version", pres_announcements: "id", pres_speaker_log: "id", class_announcements: "id", assignments: "id", assignment_submissions: "id", class_issues: "id" };

async function pxBoot() {
  if (!sb || PX.on || PX.booting || !uid) return;
  PX.booting = true; PX.tried = uid;
  const r = await sb.rpc("my_access");
  PX.booting = false;
  if (r.error || !r.data) { PX.on = false; try { localStorage.removeItem("px-on:" + uid); } catch (e) {} render(); return; }   // server without ADIAK 1.0 migrations: feature stays off
  PX.on = true; PX.acc = r.data;
  try { localStorage.setItem("px-on:" + uid, "1"); localStorage.setItem("px-acc:" + uid, JSON.stringify(r.data)); } catch (e) {}
  try { const t0 = Date.now(), s = await sb.rpc("server_now"); if (!s.error && s.data) PX.off = new Date(s.data).getTime() - (t0 + Date.now()) / 2; } catch (e) {}
  await Promise.all([pxLoad(), pxNotesLoad()]);
  if (window.xBoot) xBoot.forEach(f => { try { f(); } catch (e) {} });
  if (!PX.tm) PX.tm = setInterval(pxTick, 1000);
  render();
}
async function pxLoad() {
  if (!PX.on) return;
  const keys = Object.keys(pxTables);
  const res = await Promise.all(keys.map(t => { let q = sb.from(t).select("*"); if (pxOrder[t]) q = q.order(pxOrder[t], { ascending: false }); return q.limit(t === "pres_speaker_log" ? 300 : 1000); }));
  res.forEach((r, i) => { if (!r.error && r.data) PX[pxTables[keys[i]]] = r.data; });
  PX.loaded = true;
}
let pxT = null;
function pxSched() { clearTimeout(pxT); pxT = setTimeout(async () => { await pxLoad(); if (window.xReload) xReload.forEach(f => { try { f(); } catch (e) {} }); render(); }, 250); }
// realtime: the existing room channel forwards every table change here first
function onDbChange(t, ev) {
  if (!PX.on) return false;
  if (t === "notifications") { if (ev.eventType === "INSERT" && ev.new && ev.new.user_id === uid) pxIncoming(ev.new); else pxNotesLoad().then(render); return true; }
  if (t.startsWith("pres_") || t.startsWith("class_") || t.startsWith("assignment")) { pxSched(); return true; }
  return false;
}
async function pxCall(fn, a, msgOk) {
  const r = await sb.rpc(fn, a);
  if (r.error) { toast(trErr(r.error.message), 1); snd.err(); return null; }
  if (msgOk) { toast(msgOk); snd.ok(); }
  pxSched(); return r.data === null ? true : r.data;
}

/* ---------- formatting ---------- */
const PX_MON = { az: ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avq", "sen", "okt", "noy", "dek"], en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] };
const pxDate = d => { if (!d) return "—"; const x = new Date(d), m = PX_MON[LANG === "az" ? "az" : "en"][x.getMonth()];
  return x.getDate() + " " + m + (x.getFullYear() !== new Date().getFullYear() ? " " + x.getFullYear() : "") + ", " + String(x.getHours()).padStart(2, "0") + ":" + String(x.getMinutes()).padStart(2, "0"); };
const pxDur = ms => { ms = Math.max(0, Math.round(ms / 1000)); const m = Math.floor(ms / 60), s = ms % 60; return m + ":" + String(s).padStart(2, "0"); };
function pxRel(d) {
  const ms = new Date(d).getTime() - (Date.now() + PX.off), a = Math.abs(ms) / 60000;
  const t = a < 60 ? Math.round(a) + " " + tr("min") : a < 1440 ? Math.round(a / 60) + " " + tr("h") : Math.round(a / 1440) + " " + tr("d");
  return ms >= 0 ? tr("in {t}", { t }) : tr("{t} ago", { t });
}
const pxNow = () => Date.now() + PX.off;
const pxStatus = s => ({ draft: tr("draft"), open: tr("open"), drawn: tr("drawn"), live: tr("live"), done: tr("finished") }[s] || s);
const pxPersonName = id => P[id] ? P[id].name : (PX.ro.find(r => r.user_id === id) || {}).user_name || "?";

/* ---------- server notifications ---------- */
const NK = {
  "pres.opened": ["New presentation: {title}", "Open it to see your team workspace."], "pres.team_added": ["Your team takes part in {title}", ""],
  "pres.draw": ["Draw result: you present #{pos} of {n}", "{title}"], "pres.redraw": ["New draw (round {round}): you present #{pos}", "{title}"],
  "pres.redraw_needed": ["Team list changed: a new draw is needed", "{title}"], "pres.order_submitted": ["{team} submitted its speaking order", "Review and approve it."],
  "pres.order_approved": ["Speaking order approved", "{title}"], "pres.order_returned": ["Speaking order reopened", "{note}"],
  "pres.order_reopened": ["{who} left: choose positions again", "{title}"], "pres.order_review": ["{team}: approved order needs review", "{who} left the team."],
  "pres.final_submitted": ["{team} submitted final version {v}", "{file}"], "pres.final_approved": ["Final presentation approved (v{v})", "{title}"],
  "pres.final_returned": ["Final version returned for corrections", "{note}"], "pres.task_assigned": ["New task: {task}", "{title}"],
  "pres.announce": ["Announcement: {title}", "{text}"], "pres.due_changed": ["Deadline changed: {title}", "Check the new deadline."],
  "pres.rem24": ["Final presentation due in 24 hours", "{title}"], "pres.rem2": ["Final presentation due in 2 hours", "{title}"],
  "pres.live_now": ["Your team is presenting now", "{title}"], "pres.next_up": ["Your team is up next", "{title}"], "pres.scores": ["Feedback published", "{title}"],
  "req.new": ["{nm} wants to join {g}", "Open Requests"], "req.voting": ["Vote opened for {nm}", "Cast your vote in Requests"],
  "req.voting_mine": ["Members are voting on your request", "{g}"], "req.approved_host": ["Majority approved {nm}", "Your final decision is needed"],
  "req.approved_mine": ["Members approved your request", "Waiting for the host's final decision"], "req.declined": ["Your join request was closed", "{g}"],
  "inv.new": ["{g} invited you!", "Open Requests to accept"], "kick.vote": ["Kick vote for {nm}", "Cast your vote in Requests"],
  "points.add": ["+{n} points!", "Your total is now {total}"], "tag.new": ["New tag! {emoji} {name}", ""],
  "group.joined": ["You joined {g}", "Welcome to the group!"], "group.member_joined": ["{nm} joined your group", ""], "group.removed": ["You are no longer in {g}", ""],
  "chat.mention": ["{nm} mentioned you", "{text}"], "class.announce": ["{title}", "{text}"], "class.assignment": ["New assignment: {title}", "Open it to see the details."],
  "class.assignment_due": ["Deadline changed: {title}", "Check the new deadline."], "class.submission": ["New submission: {title}", "{who}"],
  "class.review_accept": ["Accepted: {title}", "{note}"], "class.review_changes": ["Changes requested: {title}", "{note}"],
  "class.issue": ["Class issue reported: {title}", ""], "class.issue_update": ["Your report was updated: {title}", "{status}"]
};
Object.assign(AZ, {
  "New presentation: {title}": "Yeni təqdimat: {title}", "Open it to see your team workspace.": "Komanda iş sahəsini görmək üçün açın.", "Your team takes part in {title}": "Komandanız {title} təqdimatında iştirak edir",
  "Draw result: you present #{pos} of {n}": "Püşk nəticəsi: {n} komandadan {pos}-cisiniz", "New draw (round {round}): you present #{pos}": "Yeni püşk ({round}-ci tur): {pos}-cisiniz",
  "Team list changed: a new draw is needed": "Komanda siyahısı dəyişdi: yeni püşk lazımdır", "{team} submitted its speaking order": "{team} çıxış sırasını göndərdi", "Review and approve it.": "Yoxlayın və təsdiqləyin.",
  "Speaking order approved": "Çıxış sırası təsdiqləndi", "Speaking order reopened": "Çıxış sırası yenidən açıldı", "{who} left: choose positions again": "{who} komandadan çıxdı: yerləri yenidən seçin",
  "{team}: approved order needs review": "{team}: təsdiqlənmiş sıra yoxlanmalıdır", "{who} left the team.": "{who} komandadan çıxdı.", "{team} submitted final version {v}": "{team} final versiyanı göndərdi (v{v})",
  "Final presentation approved (v{v})": "Final təqdimat təsdiqləndi (v{v})", "Final version returned for corrections": "Final versiya düzəliş üçün qaytarıldı", "New task: {task}": "Yeni tapşırıq: {task}",
  "Announcement: {title}": "Elan: {title}", "Deadline changed: {title}": "Son tarix dəyişdi: {title}", "Check the new deadline.": "Yeni tarixə baxın.",
  "Final presentation due in 24 hours": "Final təqdimatın son tarixinə 24 saat qalıb", "Final presentation due in 2 hours": "Final təqdimatın son tarixinə 2 saat qalıb",
  "Your team is presenting now": "İndi sizin komandanız çıxış edir", "Your team is up next": "Növbəti sizin komandanızdır", "Feedback published": "Rəy və qiymətlər dərc olundu",
  "{nm} wants to join {g}": "{nm} {g} qrupuna qoşulmaq istəyir", "Members are voting on your request": "Üzvlər müraciətinizə səs verir", "Majority approved {nm}": "Əksəriyyət {nm} üçün razılıq verdi",
  "Members approved your request": "Üzvlər müraciətinizi təsdiqlədi", "Waiting for the host's final decision": "Hostun son qərarı gözlənilir", "Your join request was closed": "Qoşulma müraciətiniz bağlandı",
  "{g} invited you!": "{g} sizi dəvət etdi!", "+{n} points!": "+{n} xal!", "New tag! {emoji} {name}": "Yeni nişan! {emoji} {name}", "You joined {g}": "{g} qrupuna qoşuldunuz",
  "{nm} joined your group": "{nm} qrupunuza qoşuldu", "You are no longer in {g}": "Artıq {g} qrupunda deyilsiniz", "{nm} mentioned you": "{nm} sizi qeyd etdi",
  "New assignment: {title}": "Yeni tapşırıq: {title}", "Open it to see the details.": "Təfərrüatları görmək üçün açın.", "New submission: {title}": "Yeni təhvil: {title}",
  "Accepted: {title}": "Qəbul olundu: {title}", "Changes requested: {title}": "Düzəliş istənilir: {title}", "Class issue reported: {title}": "Sinif problemi bildirildi: {title}",
  "Your report was updated: {title}": "Bildirişinizə baxıldı: {title}"
});
function pxNoteText(n) {
  const k = NK[n.kind] || [n.kind, ""], p = Object.assign({}, n.params || {});
  if (p.due) p.due = pxDate(p.due);
  return { t: tr(k[0], p), b: tr(k[1], p) };
}
async function pxNotesLoad() {
  const r = await sb.rpc("notes_list", { lim: 60 });
  if (!r.error && Array.isArray(r.data)) PX.notes = r.data;
}
const pxUnread = () => PX.on ? PX.notes.filter(n => !n.read_at).length : 0;
function pxReadAll() { if (!PX.on || !PX.notes.some(n => !n.read_at)) return; const now = new Date().toISOString(); PX.notes.forEach(n => { if (!n.read_at) n.read_at = now; }); sb.rpc("notes_read", { ids: null }).then(() => {}, () => {}); }
function pxIncoming(n) {
  if (PX.notes.some(x => x.id === n.id)) return;
  PX.notes.unshift(n); PX.notes = PX.notes.slice(0, 100);
  const x = pxNoteText(n);
  (snd[n.kind.startsWith("pres.live") || n.kind.startsWith("pres.next") ? "alert" : "ding"] || snd.ding)();
  try {
    const box = $("#toasts"), e = document.createElement("div");
    e.className = "nt"; e.innerHTML = "<b>" + esc(x.t) + "</b>" + (x.b ? "<small>" + esc(x.b) + "</small>" : "");
    e.onclick = () => { e.remove(); pxOpenNote(n.id); }; box.appendChild(e);
    while (box.children.length > 3) box.removeChild(box.firstChild); setTimeout(() => { if (e.remove) e.remove(); }, 6500);
  } catch (e) {}
  if (window.pxSched && (n.kind.startsWith("pres.") || n.kind.startsWith("class."))) pxSched();
  render();
}
function pxOpenNote(id) {
  const n = PX.notes.find(x => x.id === id); if (!n) return;
  if (!n.read_at) { n.read_at = new Date().toISOString(); sb.rpc("notes_read", { ids: [id] }).then(() => {}, () => {}); }
  notesOpen = false; go(n.target && n.target.k ? n.target : null);
}
function pxNoteRows() {
  const srv = PX.on ? PX.notes.map(n => ({ srv: true, id: n.id, time: new Date(n.created_at).getTime(), read: !!n.read_at, ...pxNoteText(n) })) : [];
  const loc = NOTES.map((n, i) => ({ srv: false, i, time: n.time, read: n.read, t: n.t, b: n.b }));
  const all = srv.concat(loc).sort((a, b) => b.time - a.time).slice(0, 80);
  if (!all.length) return "<p class='mu'>" + tr("No notifications yet") + "</p>";
  return all.map(n => `<div class="nrow${n.read ? "" : " un"}" onclick="${n.srv ? `pxOpenNote(${n.id})` : `go(NOTES[${n.i}].act)`}"><b>${esc(n.t)}</b>${n.b ? `<br><span class="mu">${esc(n.b)}</span>` : ""}<br><small>${ago(n.time)}</small></div>`).join("");
}

/* ---------- deep links ---------- */
function openTarget(a) {
  menuOpen = false; notesOpen = false;
  if (a.k === "home") { goTab("home"); return; }
  if (a.k === "groups") { goTab("groups"); return; }
  if (a.k === "live" || (a.k === "pres" && a.sec === "live")) { if (window.openLive) { openLive(a.event); return; } }
  if (a.k === "class") { if (window.openClassTarget) { openClassTarget(a); return; } goTab("home"); return; }
  if (a.k === "pres") {
    if (!PX.ev.some(e => e.id === a.event)) { toast(tr("You do not have access to this anymore."), 1); return; }
    PX.cur = a.event; PX.sec = a.sec && a.sec !== "draw" ? a.sec : "overview";
    if (PX.sec === "chat" && !phone()) { const g = pxMyGroup(a.event); if (g) conv = "p:" + a.event + ":" + g; }
    goTab("pres"); return;
  }
  render();
}

/* ---------- model helpers ---------- */
const pxEv = id => PX.ev.find(e => e.id === id);
const pxDraw = e => PX.dr.find(d => d.event_id === e && !d.superseded_at);
const pxTeams = e => PX.et.filter(t => t.event_id === e && !t.removed_at);
const pxTeam = (e, g) => PX.et.find(t => t.event_id === e && t.group_id === g);
const pxRoster = (e, g) => PX.ro.filter(r => r.event_id === e && r.group_id === g && (r.left_at == null || r.participant));
const pxActive = (e, g) => PX.ro.filter(r => r.event_id === e && r.group_id === g && r.left_at == null);
function pxMyGroup(e) { const r = PX.ro.find(x => x.event_id === e && x.user_id === uid && (x.left_at == null || x.participant)); return r ? r.group_id : null; }
const pxMember = e => { const ev = pxEv(e); const g = pxMyGroup(e); return !!g && !!ev && !ev.frozen_at && ["draft", "open", "drawn"].includes(ev.status) && PX.ro.some(r => r.event_id === e && r.user_id === uid && r.left_at == null); };
const pxIsStaff = tag => !!PX.acc && (PX.acc.admin || (PX.acc.teaches || []).some(c => c.tag === tag));
function pxPos(e, g) { const d = pxDraw(e); if (!d) return null; const i = d.result.indexOf(g); return i < 0 ? null : { pos: i + 1, n: d.result.length, round: d.round }; }
function pxReadiness(e, g) {
  const t = pxTeam(e, g); if (!t) return { pct: 0, parts: [] };
  const tk = PX.tk.filter(k => k.event_id === e && k.group_id === g && k.status !== "cancelled"), done = tk.filter(k => k.status === "done").length;
  const parts = [[tr("Order approved"), t.speak_state === "approved" ? 1 : t.speak_state === "submitted" ? .5 : 0],
    [tr("Final approved"), t.final_state === "approved" ? 1 : t.final_state === "submitted" ? .6 : 0],
    [tr("Tasks done"), tk.length ? done / tk.length : 1]];
  return { pct: Math.round(parts.reduce((a, p) => a + p[1], 0) / parts.length * 100), parts, done, total: tk.length };
}
function pxMyEvents() {
  return PX.ev.filter(e => e.status !== "draft" || pxIsStaff(e.class_tag)).sort((a, b) => {
    const ma = pxMyGroup(a.id) ? 0 : 1, mb = pxMyGroup(b.id) ? 0 : 1; if (ma !== mb) return ma - mb;
    const sa = a.status === "done" ? 1 : 0, sb2 = b.status === "done" ? 1 : 0; if (sa !== sb2) return sa - sb2; return b.id - a.id; });
}
const pxActionCount = () => {
  if (!PX.on) return 0; let n = 0;
  PX.ev.forEach(e => { const g = pxMyGroup(e.id); if (!g || !pxMember(e.id)) return; const t = pxTeam(e.id, g);
    if (t && t.speak_state === "open" && !PX.sp.some(s => s.event_id === e.id && s.group_id === g && s.user_id === uid)) n++;
    n += PX.tk.filter(k => k.event_id === e.id && k.group_id === g && k.assignee === uid && (k.status === "todo" || k.status === "doing")).length; });
  return n;
};

/* ---------- live helpers (shared with live.js) ---------- */
function pxLiveElapsed(l) { if (!l) return 0; return l.elapsed_ms + (l.state === "running" && l.slot_started_at ? pxNow() - new Date(l.slot_started_at).getTime() : 0); }
function pxTick() { document.querySelectorAll("[data-lv]").forEach(el => { const l = PX.lv.find(x => x.event_id === +el.dataset.lv); if (!l) return;
  const el2 = pxLiveElapsed(l), rem = l.duration_s * 1000 - el2; el.textContent = el.dataset.mode === "elapsed" ? pxDur(el2) : (rem < 0 ? "−" : "") + pxDur(Math.abs(rem));
  el.classList.toggle("over", rem < 0); el.classList.toggle("warn", rem >= 0 && rem < 60000); }); }

/* ---------- UI ---------- */
const pxChip = (txt, cls) => `<span class="chip ${cls || ""}">${txt}</span>`;
function pxStateChip(s) { return { open: pxChip(tr("Open")), submitted: pxChip(tr("Waiting for approval"), "warn"), approved: pxChip(ic("check") + " " + tr("Approved"), "on"), needs_review: pxChip(tr("Needs review"), "warn"),
  none: pxChip(tr("No final yet")), returned: pxChip(tr("Returned for corrections"), "warn") }[s] || pxChip(esc(s)); }
function pxRing(p) { const r = 26, c = 2 * Math.PI * r; return `<svg class="pxring" viewBox="0 0 64 64" role="img" aria-label="${p}%"><circle cx="32" cy="32" r="${r}" class="bg"/><circle cx="32" cy="32" r="${r}" class="fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}"/><text x="32" y="37" text-anchor="middle">${p}%</text></svg>`; }

function pxPage() {
  if (!PX.on) return `<div class="card mu">${tr("Loading…")}</div>`;
  const list = pxMyEvents();
  if (!list.length) return `<div class="card pxempty">${ic("present", "pxbig")}<h3>${tr("No presentations yet")}</h3><p class="mu">${tr("When your teacher creates a presentation for your class, it appears here with your team's workspace.")}</p></div>${pxHistoryCard()}`;
  if (!PX.cur || !pxEv(PX.cur)) PX.cur = list[0].id;
  const ev = pxEv(PX.cur), g = pxMyGroup(ev.id);
  const picker = list.length > 1 ? `<div class="seg pxevs">${list.map(e => `<button class="${e.id === ev.id ? "on" : ""}" onclick="PX.cur=${e.id};PX.sec='overview';render()">${esc(e.title)} ${e.status === "live" ? `<span class="chip live">${tr("live")}</span>` : ""}</button>`).join("")}</div>` : "";
  const secs = [["overview", ic("present"), tr("Overview")], ["order", ic("groups"), tr("Speaking order")], ["files", ic("file"), tr("Files")], ["tasks", ic("tasks"), tr("Tasks")], ["chat", ic("chat"), tr("Team chat")], ["feedback", ic("star"), tr("Feedback")]];
  const nav = g ? `<div class="seg pxsecs" role="tablist">${secs.map(([k, i, t]) => `<button role="tab" aria-selected="${PX.sec === k}" class="${PX.sec === k ? "on" : ""}" onclick="pxSec('${k}')">${i}<span>${t}</span></button>`).join("")}</div>` : "";
  const body = !g ? pxOverview(ev, null) : ({ overview: pxOverview, order: pxOrderSec, files: pxFiles, tasks: pxTasks, chat: pxChat, feedback: pxFeedback }[PX.sec] || pxOverview)(ev, g);
  return `<div class="pxwrap">${picker}${pxHeader(ev, g)}${nav}${body}</div>`;
}
function pxSec(k) {
  const ev = pxEv(PX.cur), g = ev && pxMyGroup(ev.id);
  if (k === "chat" && g) { const ch = "p:" + ev.id + ":" + g; if (phone()) { openChat(ch); return; } conv = ch; }
  PX.sec = k; render();
}
function pxHeader(ev, g) {
  const t = g && pxTeam(ev.id, g), pos = g && pxPos(ev.id, g), rd = g ? pxReadiness(ev.id, g) : null;
  const live = ev.status === "live" ? pxLiveBanner(ev) : "";
  return `<div class="card pxhead"><div class="pxh1"><div style="min-width:0"><div class="pxkick">${ic("present")} ${tr("Presentation")} · ${pxStatus(ev.status)}</div><h2>${esc(ev.title)}</h2>
   <div class="pxmeta">${ev.starts_at ? `<span>${ic("calendar")} ${tr("Starts")}: <b>${pxDate(ev.starts_at)}</b></span>` : ""}${ev.final_due ? `<span class="${new Date(ev.final_due) < pxNow() ? "late" : ""}">${ic("clock")} ${tr("Deadline")}: <b>${pxDate(ev.final_due)}</b> · ${pxRel(ev.final_due)}</span>` : ""}
   ${t ? `<span>${ic("groups")} ${tr("Your team")}: <b>${esc(t.group_name)}</b></span>` : ""}</div></div>
   ${rd ? `<div class="pxrd" title="${tr("Preparation")}">${pxRing(rd.pct)}<small>${tr("Preparation")}</small></div>` : ""}</div>
   ${g ? `<div class="pxstrip"><div><small>${tr("Team position")}</small><b>${pos ? tr("#{pos} of {n}", pos) : tr("Draw pending")}</b></div><div><small>${tr("Speaking order")}</small>${pxStateChip(t.speak_state)}</div><div><small>${tr("Final")}</small>${pxStateChip(t.final_state)}</div><div><small>${tr("Tasks")}</small><b>${rd.done}/${rd.total}</b></div></div>`
     : `<p class="mu" style="margin:8px 0 0">${tr("Your team is not part of this presentation.")} · ${tr("View only")}</p>`}${live}</div>`;
}
function pxLiveBanner(ev) {
  const l = PX.lv.find(x => x.event_id === ev.id), ls = PX.ls.filter(s => s.event_id === ev.id).sort((a, b) => a.slot_index - b.slot_index);
  if (!l) return ""; const cur = ls.find(s => s.slot_index === l.slot_index), nx = ls.find(s => s.slot_index > l.slot_index && s.status === "pending");
  return `<div class="pxlive"><span class="livedot"></span><div style="flex:1;min-width:0"><b>${tr("Live now")}:</b> ${cur ? esc(cur.group_name) + " " + tr("presenting") : ""}${nx ? ` · ${tr("Up next")}: ${esc(nx.group_name)}` : ""}</div>
   <b class="lvt" data-lv="${ev.id}">${pxDur(l.duration_s * 1000 - pxLiveElapsed(l))}</b>${window.openLive ? `<button class="ok" onclick="openLive(${ev.id})">${ic("expand")} ${tr("Open live stage")}</button>` : ""}</div>`;
}
function pxOverview(ev, g) {
  const d = pxDraw(ev.id), an = PX.an.filter(a => a.event_id === ev.id);
  const order = d ? `<div class="card"><div class="row sp"><b>${ic("dice")} ${tr("Order of teams")}</b><small class="mu">${tr("Round {n}", { n: d.round })} · ${pxDate(d.created_at)}</small></div><ol class="pxorder">${d.result.map((gid, i) => { const t = pxTeam(ev.id, gid);
    return `<li class="${gid === g ? "me" : ""}"><span class="ordn">${i + 1}</span><b>${esc(t ? t.group_name : "?")}</b>${gid === g ? pxChip(tr("Your team"), "on") : ""}</li>`; }).join("")}</ol></div>` : "";
  const rd = g ? pxReadiness(ev.id, g) : null;
  const todo = g ? PX.tk.filter(k => k.event_id === ev.id && k.group_id === g && (k.status === "todo" || k.status === "doing")).slice(0, 5) : [];
  return `<div class="grid2">${g ? `<div class="card"><b>${ic("check")} ${tr("Preparation")}</b>${rd.parts.map(([n, v]) => `<div class="pxpart"><span>${n}</span><div class="bar"><i style="width:${Math.round(v * 100)}%"></i></div></div>`).join("")}
     ${todo.length ? `<div class="pxtodo">${todo.map(k => `<div class="li" onclick="pxSec('tasks')">${ic("tasks")}<div class="g">${esc(k.title)}<br><small class="mu">${k.assignee ? esc(pxPersonName(k.assignee)) : tr("Nobody")}${k.due ? " · " + tr("Due {d}", { d: pxDate(k.due) }) : ""}</small></div></div>`).join("")}</div>` : ""}</div>` : ""}
   <div class="card"><b>${ic("megaphone")} ${tr("Announcements")}</b>${an.length ? an.slice(0, 6).map(a => `<div class="pxann"><p>${esc(a.body)}</p><small class="mu">${pxDate(a.created_at)}</small></div>`).join("") : `<p class="mu">${tr("No announcements")}</p>`}</div>
   ${order}${ev.descr ? `<div class="card"><p style="white-space:pre-wrap;margin:0">${esc(ev.descr)}</p></div>` : ""}</div>`;
}
function pxOrderSec(ev, g) {
  const t = pxTeam(ev.id, g), act = pxActive(ev.id, g), n = act.length, sp = PX.sp.filter(s => s.event_id === ev.id && s.group_id === g);
  const frozen = PX.spf.filter(s => s.event_id === ev.id && s.group_id === g).sort((a, b) => a.position - b.position);
  if (frozen.length) return `<div class="card"><b>${ic("lock")} ${tr("Speaking order")}</b><ol class="pxorder">${frozen.map(f => `<li class="${f.user_id === uid ? "me" : ""}"><span class="ordn">${f.placed ? f.position : "–"}</span><b>${esc(f.user_name)}</b>${f.placed ? "" : pxChip(tr("not chosen"), "warn")}</li>`).join("")}</ol></div>`;
  const mine = sp.find(s => s.user_id === uid), host = (grp(g) || {}).host_id === uid, chosen = sp.filter(s => !s.withdrawn).length, member = pxMember(ev.id), open = t.speak_state === "open";
  const slots = Array.from({ length: Math.max(n, sp.length) }, (_, i) => { const s = sp.find(x => x.position === i + 1), me = s && s.user_id === uid;
    return `<button class="pxslot${s ? " taken" : ""}${me ? " me" : ""}${s && s.withdrawn ? " gone" : ""}" ${open && member && (!s || me) ? `onclick="${me ? `pxCall('pres_unpick',{e:${ev.id}})` : `pxCall('pres_pick',{e:${ev.id},pos:${i + 1}})`}"` : "disabled"} aria-pressed="${!!me}">
      <span class="ordn">${i + 1}</span><span class="pxsn">${s ? esc(pxPersonName(s.user_id)) + (s.withdrawn ? " · " + tr("withdrawn") : "") : tr("Free")}</span>${me ? `<small>${tr("You")}</small>` : ""}</button>`; }).join("");
  const log = PX.log.filter(l => l.event_id === ev.id && l.group_id === g).slice(0, 8);
  return `<div class="card"><div class="row sp"><b>${ic("groups")} ${tr("Choose your position")}</b>${pxStateChip(t.speak_state)}</div>
   <p class="mu">${open ? tr("Everyone must pick a different position, then anyone can submit.") : tr("The team host or your teacher approves the order.")} · ${tr("{a} of {b} chosen", { a: chosen, b: n })}</p>
   <div class="pxslots">${slots}</div>
   <div class="row" style="margin-top:12px;flex-wrap:wrap">${open && member && chosen === n && n > 0 ? `<button class="ok" onclick="pxCall('pres_submit_order',{e:${ev.id}},'${tr("Sent ✓")}')">${ic("check")} ${tr("Submit order")}</button>` : ""}
    ${t.speak_state === "submitted" && host ? `<button class="ok" onclick="pxCall('pres_approve_order',{e:${ev.id},g:${g}},'${tr("Approved")}')">${ic("check")} ${tr("Approve order")}</button>` : ""}
    ${["submitted", "needs_review"].includes(t.speak_state) && host ? `<button class="s" onclick="pxCall('pres_return_order',{e:${ev.id},g:${g},note:null})">${ic("refresh")} ${tr("Reopen order")}</button>` : ""}</div></div>
   ${log.length ? `<div class="card"><b>${ic("clock")} ${tr("History")}</b>${log.map(l => `<div class="pxlog"><span>${esc(pxPersonName(l.actor || l.user_id))}</span> <span class="mu">${esc(l.action)}${l.after_pos ? " → " + l.after_pos : ""}${l.note ? " · " + esc(l.note) : ""}</span><small class="mu">${pxDate(l.at)}</small></div>`).join("")}</div>` : ""}`;
}
const PX_EXT = ["pdf", "pptx", "ppt", "odp", "key", "docx", "doc", "xlsx", "xls", "odt", "txt", "png", "jpg", "jpeg", "webp", "gif", "mp4", "mov", "mp3", "m4a", "zip"];
const PX_MIME = { pdf: "application/pdf", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation", ppt: "application/vnd.ms-powerpoint", odp: "application/vnd.oasis.opendocument.presentation",
  key: "application/vnd.apple.keynote", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", doc: "application/msword", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel", odt: "application/vnd.oasis.opendocument.text", txt: "text/plain", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif",
  mp4: "video/mp4", mov: "video/quicktime", mp3: "audio/mpeg", m4a: "audio/mp4", zip: "application/zip" };
async function pxSha(f) { try { if (f.size > 26214400 || !crypto.subtle) return null; const h = await crypto.subtle.digest("SHA-256", await f.arrayBuffer()); return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join(""); } catch (e) { return null; } }
async function pxUpload(inp, e, g) {
  const f = inp.files[0]; inp.value = ""; if (!f) return;
  const ext = (f.name.split(".").pop() || "").toLowerCase();
  if (!PX_EXT.includes(ext)) { toast(tr("This file type is not allowed"), 1); snd.err(); return; }
  if (f.size > 26214400) { toast(tr("Files must be under 25 MB"), 1); snd.err(); return; }
  const id = (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ (Math.random() * 16 >> c / 4)).toString(16)));
  const path = `e${e}/g${g}/${id}.${ext}`, mime = PX_MIME[ext];
  toast(tr("Uploading…"));
  const up = await sb.storage.from("team-files").upload(path, f, { contentType: mime, upsert: false });
  if (up.error) { toast(trErr(up.error.message), 1); snd.err(); return; }
  const sha = await pxSha(f);
  if (await pxCall("pres_add_file", { e, pth: path, fname: f.name, fmime: mime, fsize: f.size, fsha: sha }, tr("Uploaded ✓"))) {
    const dup = sha && PX.fl.find(x => x.event_id === e && x.group_id === g && x.sha256 === sha);
    if (dup) toast(tr("Same content as {name}", { name: dup.name }));
  }
}
Object.assign(AZ, { "Same content as {name}": "Məzmun {name} ilə eynidir" });
async function pxOpenFile(fid) {
  const f = PX.fl.find(x => x.id === fid); if (!f) return;
  const r = await sb.storage.from("team-files").createSignedUrl(f.path, 600);
  if (r.error || !r.data) { toast(trErr(r.error ? r.error.message : "File not found"), 1); return; }
  window.open(r.data.signedUrl, "_blank", "noopener");
}
function pxSubmitFinal(fid, act) {
  const f = PX.fl.find(x => x.id === fid); if (!f) return;
  const go2 = () => ask(tr("Submit this file as the final version?"), () => pxCall("pres_submit_final", { fid, expected_active: act }, tr("Sent ✓")));
  if (!/\.pdf$/i.test(f.path)) ask(tr("Final presentations should be PDF so they open in the live viewer. Upload it anyway?"), go2); else go2();
}
function pxFiles(ev, g) {
  const files = PX.fl.filter(f => f.event_id === ev.id && f.group_id === g), subs = PX.sub.filter(s => s.event_id === ev.id && s.group_id === g);
  const act = subs.find(s => s.state === "submitted" || s.state === "approved"), last = subs[0], member = pxMember(ev.id);
  const fname = id => { const f = files.find(x => x.id === id); return f ? f.name : "?"; };
  const fin = act ? `<div class="pxfinal ${act.state}"><div class="pxfl">${act.state === "approved" ? ic("lock") : ic("clock")}<div style="min-width:0"><small>${tr("FINAL PRESENTATION")} · ${tr("Version {v}", { v: act.version })}</small>
      <b>${esc(fname(act.file_id))}</b><span class="mu">${act.state === "approved" ? tr("approved by {nm}", { nm: esc(pxPersonName(act.reviewed_by)) }) + " · " + pxDate(act.reviewed_at) : tr("Pending review")}</span>
      ${act.state === "approved" ? `<small class="mu">${tr("Locked: only your teacher can return it.")}</small>` : ""}</div></div><button class="s" onclick="pxOpenFile(${act.file_id})">${ic("eye")} ${tr("Open")}</button></div>`
    : `<div class="pxfinal none"><div class="pxfl">${ic("flag")}<div><small>${tr("FINAL PRESENTATION")}</small><b>${tr("No final yet")}</b>${last && last.state === "returned" ? `<span class="warnt">${tr("Returned for corrections")}: ${esc(last.note || "")}</span>` : `<span class="mu">${tr("Pick a file below and press “Submit as final”.")}</span>`}</div></div></div>`;
  const rows = files.map(f => { const s = subs.find(x => x.file_id === f.id && (x.state === "submitted" || x.state === "approved")), inSub = subs.some(x => x.file_id === f.id);
    return `<div class="li pxfile${f.hidden_at ? " hid" : ""}"><span class="ic2">${ic("file")}</span><div class="g"><b>${esc(f.name)}</b>${s ? " " + pxChip(tr("Final"), "on") : ""}${f.hidden_at ? " " + pxChip(tr("Hidden")) : ""}<br><small class="mu">${esc(f.uploader_name)} · ${pxDate(f.created_at)} · ${fsize(f.size)}</small></div>
      <div class="pxfa"><button class="s" onclick="pxOpenFile(${f.id})" aria-label="${tr("Open")}">${ic("eye")}</button>
      ${member && !f.hidden_at && !act ? `<button class="ok" onclick="pxSubmitFinal(${f.id},null)">${ic("flag")} ${tr("Submit as final")}</button>` : member && !f.hidden_at && act && act.state === "submitted" && act.file_id !== f.id ? `<button class="s" onclick="pxSubmitFinal(${f.id},${act.id})">${ic("flag")} ${tr("Submit as final")}</button>` : ""}
      ${member && !inSub && f.uploader === uid ? (f.hidden_at ? `<button class="s" onclick="pxCall('pres_unhide_file',{fid:${f.id}})">${tr("Restore")}</button>` : `<button class="s" onclick="pxCall('pres_hide_file',{fid:${f.id},reason:null})">${tr("Hide")}</button>`) : ""}</div></div>`; }).join("");
  const hist = subs.length ? `<div class="card"><b>${ic("layers")} ${tr("Submissions")}</b>${subs.map(s => `<div class="pxlog"><span>${tr("Version {v}", { v: s.version })} · ${esc(fname(s.file_id))}</span> <span class="mu">${{ submitted: tr("Pending review"), approved: tr("Approved"), returned: tr("Returned for corrections"), superseded: tr("History") }[s.state]}${s.note ? " · " + esc(s.note) : ""}</span><small class="mu">${pxDate(s.reviewed_at || s.submitted_at)}</small></div>`).join("")}</div>` : "";
  return `<div class="card">${fin}</div><div class="card"><div class="row sp"><b>${ic("layers")} ${tr("Drafts and versions")}</b>${member ? `<label class="btn ok upl">${ic("upload")} ${tr("Upload file")}<input type="file" hidden accept=".${PX_EXT.join(",.")}" onchange="pxUpload(this,${ev.id},${g})"></label>` : ""}</div>${rows || `<p class="mu">${tr("No files yet")}</p>`}</div>${hist}`;
}
function pxTasks(ev, g) {
  const tk = PX.tk.filter(k => k.event_id === ev.id && k.group_id === g).sort((a, b) => (a.status === "done") - (b.status === "done") || (a.due || "z").localeCompare(b.due || "z"));
  const member = pxMember(ev.id), act = pxActive(ev.id, g), rd = pxReadiness(ev.id, g);
  const row = k => `<div class="li pxtask ${k.status}"><button class="pxchk" ${member && (k.assignee === uid || k.created_by === uid || !k.assignee) && k.status !== "cancelled" ? `onclick="pxCall('pres_task_status',{tid:${k.id},st:'${k.status === "done" ? "todo" : "done"}'})"` : "disabled"} aria-pressed="${k.status === "done"}" aria-label="${tr("Mark done")}">${k.status === "done" ? ic("check") : ""}</button>
    <div class="g"><b>${esc(k.title)}</b><br><small class="mu">${k.assignee ? esc(pxPersonName(k.assignee)) : tr("Nobody")} · ${tr(k.status === "todo" ? "to do" : k.status)}${k.due ? " · " + tr("Due {d}", { d: pxDate(k.due) }) : ""}</small></div>
    ${member && k.status === "todo" && k.assignee === uid ? `<button class="s" onclick="pxCall('pres_task_status',{tid:${k.id},st:'doing'})">${tr("Start")}</button>` : ""}
    ${member && k.created_by === uid && k.status !== "cancelled" && k.status !== "done" ? `<button class="s" onclick="pxCall('pres_task_status',{tid:${k.id},st:'cancelled'})" aria-label="${tr("Cancel task")}">${ic("ban")}</button>` : ""}</div>`;
  return `${member ? `<div class="card"><b>${ic("plus")} ${tr("New task")}</b><div class="pxform"><input id="pxtt" maxlength="140" placeholder="${tr("Task title")}"><select id="pxta"><option value="">${tr("Nobody")}</option>${act.map(r => `<option value="${r.user_id}">${esc(r.user_name)}</option>`).join("")}</select><input id="pxtd" type="datetime-local"><button class="ok" onclick="pxAddTask(${ev.id},${g})">${tr("Add")}</button></div></div>` : ""}
   <div class="card"><div class="row sp"><b>${ic("tasks")} ${tr("Tasks")}</b><span class="mu">${tr("Tasks done")}: ${rd.done}/${rd.total}</span></div><div class="bar"><i style="width:${rd.total ? Math.round(rd.done / rd.total * 100) : 0}%"></i></div>${tk.map(row).join("") || `<p class="mu">${tr("No tasks yet")}</p>`}</div>`;
}
async function pxAddTask(e, g) {
  const t = ($("#pxtt") || {}).value || "", a = ($("#pxta") || {}).value || null, d = ($("#pxtd") || {}).value;
  if (!t.trim()) { toast(tr("Task title"), 1); return; }
  if (await pxCall("pres_task_save", { tid: null, e, g, ttl: t.trim(), who: a || null, due_at: d ? new Date(d).toISOString() : null })) { const i = $("#pxtt"); if (i) { i.value = ""; i.defaultValue = ""; } }
}
function pxChat(ev, g) {
  const ch = "p:" + ev.id + ":" + g;
  if (phone()) return `<div class="card"><p class="mu">${tr("Team chat")}</p><button class="ok" onclick="openChat('${ch}')">${ic("chat")} ${tr("Open chat")}</button></div>`;
  if (conv !== ch) conv = ch;
  return `<div class="pxchat">${thread()}</div>`;
}
function pxFeedback(ev, g) {
  if (!ev.scores_published_at) return `<div class="card mu">${tr("Feedback is not published yet.")}</div>`;
  const sc = PX.sc.filter(s => s.event_id === ev.id && s.group_id === g && !s.superseded_at);
  if (!sc.length) return `<div class="card mu">${tr("Feedback is not published yet.")}</div>`;
  const rb = id => PX.rb.find(r => r.id === id);
  return sc.map((s, i) => { const r = rb(s.rubric_id), cr = r ? r.criteria : [];
    return `<div class="card"><div class="row sp"><b>${tr("Reviewer {n}", { n: i + 1 })}</b><b class="pxtotal">${tr("Total")}: ${(+s.total).toFixed(1)}</b></div>
      ${cr.map(c => `<div class="pxpart"><span>${esc(c.label)}${c.kind === "duration" && s.auto && s.auto.duration_s != null ? ` <small class="mu">(${tr("Measured time")}: ${pxDur(s.auto.duration_s * 1000)})</small>` : ""}</span><div class="bar"><i style="width:${Math.round((s.scores[c.key] || 0) / c.max * 100)}%"></i></div><b>${s.scores[c.key]}/${c.max}</b></div>`).join("")}
      ${s.comment ? `<p style="white-space:pre-wrap">${esc(s.comment)}</p>` : ""}</div>`; }).join("");
}
async function pxHistoryLoad() { const r = await sb.rpc("pres_my_history"); if (!r.error) { PX.hist = r.data || []; render(); } }
function pxHistoryCard() {
  if (PX.hist === null) { PX.hist = []; pxHistoryLoad(); }
  const h = (PX.hist || []).filter(x => !PX.ev.some(e => e.id === x.event_id && pxMyGroup(e.id)));
  if (!h.length) return "";
  return `<div class="card"><b>${ic("archive")} ${tr("My presentations")}</b>${h.map(x => `<div class="pxlog"><span>${esc(x.title)} · ${esc(x.group_name || "")}</span> <span class="mu">${pxStatus(x.status)} · ${x.participant ? tr("participant") : tr("left team")} · ${x.uploads} ${tr("uploads")}</span></div>`).join("")}</div>`;
}
// chat integration
function pxConvTitle(k) { const [, e, g] = k.split(":"), ev = pxEv(+e), t = ev && pxTeam(+e, +g); return (ev ? ev.title : tr("Presentation")) + (t ? " · " + t.group_name : ""); }
function pxChatItems() {
  if (!PX.on) return [];
  return PX.ev.filter(e => e.status !== "draft").map(e => { const g = pxMyGroup(e.id); if (!g) return null;
    return { ch: "p:" + e.id + ":" + g, t: pxConvTitle("p:" + e.id + ":" + g), d: tr("Team chat"), a: `<div class="av" style="background:var(--adia-primary-fill)">${ic("present")}</div>`, c: "" }; }).filter(Boolean);
}

// shown from the first paint when this account already had the feature (no sidebar shift after start)
const pxKnown = () => { try { return !!uid && localStorage.getItem("px-on:" + uid) === "1"; } catch (e) { return false; } };
XPAGES.pres = { order: 1, title: () => tr("Presentations"), icon: () => ic("present"), badge: () => ub(pxActionCount()), show: () => PX.on || pxKnown(), body: pxPage };
// home card: next presentation step (students)
function pxHomeCard() {
  if (!PX.on) return ""; const e = pxMyEvents().find(x => x.status !== "done" && pxMyGroup(x.id)); if (!e) return "";
  const g = pxMyGroup(e.id), rd = pxReadiness(e.id, g), pos = pxPos(e.id, g);
  return `<div class="card pxhome" onclick="PX.cur=${e.id};PX.sec='overview';goTab('pres')" role="button" tabindex="0">${pxRing(rd.pct)}<div style="min-width:0"><small class="mu">${ic("present")} ${tr("Presentation")}${e.status === "live" ? " · " + tr("Live now") : ""}</small><b>${esc(e.title)}</b><span class="mu">${pos ? tr("#{pos} of {n}", pos) : tr("Draw pending")}${e.final_due ? " · " + tr("Deadline") + " " + pxRel(e.final_due) : ""}</span></div><span>›</span></div>`;
}
// home cards contributed by modules (presentation progress, teacher studio, class hub)
const XHOME = [pxHomeCard];
function xHomeCards() { return XHOME.map(f => { try { return f(); } catch (e) { return ""; } }).join(""); }
// boot also after a cached start or a re-login (the "first ready" hook does not fire then); once per signed-in user
setInterval(() => { if (sb && uid && typeof ME === "function" && ME() && PX.tried !== uid && !PX.booting) pxBoot(); if (!uid && PX.on) { PX.on = false; PX.tried = null; PX.notes = []; PX.acc = null; } }, 700);
