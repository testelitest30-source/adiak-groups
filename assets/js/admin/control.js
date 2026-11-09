/* =====================================================================
   control.js — ADIAK 1.0 Control Center modules inside the existing Ledger admin (admin/index.html).
   Admin level: Operations overview, Presentations, Notification delivery, Audit log.
   Owner only (Nurəli Qasımlı; checked again by every RPC): Platform settings & feature flags, owner
   transfer, Diagnostics (jobs, storage, errors, migrations, incomplete accounts, build).
   Read models come from ops_* RPCs; they never contain secrets. Loads after admin.js.
   ===================================================================== */
Object.assign(ADM, {
  "Operations": "Əməliyyatlar", "Presentations": "Təqdimatlar", "Delivery": "Çatdırılma", "Audit log": "Audit jurnalı", "Platform": "Platforma", "Diagnostics": "Diaqnostika",
  "Platform health and activity at a glance.": "Platformanın vəziyyəti və fəallıq bir baxışda.", "active in {0} min": "{0} dəq-də aktiv", "classes": "sinif", "teams": "komanda",
  "admins": "admin", "leaders": "nümayəndə", "upcoming presentations": "gələn təqdimat", "open assignments": "açıq tapşırıq", "notifications in {0} h": "{0} saatda bildiriş",
  "failed pushes in {0} h": "{0} saatda uğursuz push", "accounts without profile": "profilsiz hesab", "Live now": "İndi canlı", "Owner": "Sahib", "since": "sahibdir:",
  "Feature switches": "Funksiya açarları", "Presentation Center": "Təqdimat Mərkəzi", "Live mode": "Canlı rejim", "Assignments": "Tapşırıqlar", "Android push": "Android push",
  "Maintenance mode": "Texniki xidmət rejimi", "Maintenance message": "Texniki xidmət mesajı", "Only the owner can change these. Every change is audited.": "Bunları yalnız sahib dəyişə bilər. Hər dəyişiklik audit olunur.",
  "Transfer ownership": "Sahibliyi ötür", "The new owner gets full control. You stay an admin.": "Yeni sahib tam nəzarət alır. Siz admin qalırsınız.", "Reason": "Səbəb",
  "Transfer": "Ötür", "Push delivery to Android devices (FCM).": "Android cihazlarına push çatdırılması (FCM).", "queued": "növbədə", "sending": "göndərilir", "sent": "göndərildi",
  "retry": "təkrar", "dead": "uğursuz", "invalid": "etibarsız", "cancelled": "ləğv", "Active devices": "Aktiv cihazlar", "Disabled devices": "Deaktiv cihazlar",
  "Invalid tokens ({0} days)": "Etibarsız tokenlər ({0} gün)", "Last successful send": "Son uğurlu göndəriş", "Oldest waiting": "Ən köhnə gözləyən", "Recent errors": "Son xətalar",
  "No errors": "Xəta yoxdur", "Every change to presentations and platform settings.": "Təqdimatlarda və platforma ayarlarında hər dəyişiklik.", "Older": "Daha köhnə",
  "All": "Hamısı", "Background jobs": "Fon işləri", "pg_cron is not installed yet (needs the owner's approval).": "pg_cron hələ quraşdırılmayıb (sahibin təsdiqi lazımdır).",
  "Storage": "Yaddaş", "objects": "obyekt", "Errors": "Xətalar", "Migrations": "Miqrasiyalar", "Accounts without a profile": "Profili olmayan hesablar",
  "Kept on purpose: they are never deleted automatically.": "Qəsdən saxlanılır: heç vaxt avtomatik silinmir.", "internal": "daxili", "external": "xarici", "never signed in": "heç daxil olmayıb",
  "Build": "Yığım", "Backups are managed in the Supabase dashboard (Database → Backups); their status is not readable from here.": "Ehtiyat nüsxələr Supabase panelində idarə olunur (Database → Backups); onların vəziyyəti buradan oxunmur.",
  "All presentation events across classes.": "Bütün siniflər üzrə təqdimatlar.", "Open in Teacher Studio": "Müəllim Studiyasında aç", "Open live": "Canlını aç", "No presentations yet": "Hələ təqdimat yoxdur",
  "Teams": "Komandalar", "Status": "Status", "Class": "Sinif", "Deadline": "Son tarix", "ADIAK 1.0 features are not installed on this server yet.": "ADIAK 1.0 funksiyaları bu serverdə hələ quraşdırılmayıb.",
  "on": "açıq", "off": "bağlı", "Save": "Saxla", "Saved": "Saxlanıldı", "Loading…": "Yüklənir…"
});
window.CC = null;
const CC = { acc: null, ov: null, push: null, audit: [], src: "all", jobs: null, stor: null, errs: null, migs: null, inc: null, ev: null, tried: false };
async function ccBoot() {
  if (CC.tried || !sb || !ME || typeof has !== "function" || !has("panel")) return; CC.tried = true;
  const r = await sb.rpc("my_access"); if (r.error || !r.data) { CC.acc = false; return; }
  CC.acc = r.data; window.ADM_OWNER = !!r.data.owner; adminRerender();
}
setInterval(() => { if (ME && !CC.tried) ccBoot(); if (!ME && CC.tried) { CC.tried = false; CC.acc = null; window.ADM_OWNER = false; } }, 600);
const ccRpc = async (fn, a) => { const r = await sb.rpc(fn, a || {}); if (r.error) { toast(r.error.message, 1); return null; } return r.data; };
const ccStat = (i, n, l) => `<div class="stat"><div class="ico">${ic(i)}</div><div><b>${n}</b><span>${l}</span></div></div>`;
const ccDate = d => d ? new Date(d).toLocaleString(LANG === "az" ? "az" : "en", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
const ccNA = () => `<div class="panel"><p class="hint">ADIAK 1.0 features are not installed on this server yet.</p></div>`;
function ccLoad(k) { // lazy per module
  const set = (key, p) => p.then(d => { CC[key] = d || (key === "audit" ? [] : {}); draw(); });
  if (k === "ops") set("ov", ccRpc("ops_overview"));
  if (k === "delivery") set("push", ccRpc("ops_push_stats"));
  if (k === "audit") set("audit", ccRpc("ops_audit", { src: CC.src, before_id: null, lim: 50 }));
  if (k === "presx") sb.from("pres_events").select("*").order("id", { ascending: false }).then(r => { CC.ev = r.error ? [] : r.data; draw(); });
  if (k === "diag") { set("jobs", ccRpc("ops_jobs")); set("stor", ccRpc("ops_storage")); set("errs", ccRpc("ops_errors", { lim: 30 })); set("migs", ccRpc("ops_migrations")); set("inc", ccRpc("ops_incomplete_accounts")); }
  if (k === "platform") set("ov", ccRpc("ops_overview"));
}
const ccNeed = (k, key) => { if (CC[key] === null || CC[key] === undefined) { CC[key] = false; ccLoad(k); return true; } return CC[key] === false; };

function ccOps() {
  if (!CC.acc) return head("Operations", "Platform health and activity at a glance.") + ccNA();
  if (ccNeed("ops", "ov")) return head("Operations", "Platform health and activity at a glance.") + `<div class="panel"><p class="hint">Loading…</p></div>`;
  const o = CC.ov;
  return head("Operations", "Platform health and activity at a glance.", `<button class="s" onclick="CC.ov=null;draw()">${ic("refresh")}</button>`) +
   `<div class="stats">${ccStat("cap", o.students, "students")}${ccStat("user", o.teachers, "teachers")}${ccStat("school", o.classes, "classes")}${ccStat("puzzle", o.teams, "teams")}${ccStat("dot", o.active_15m, "active in 15 min")}${ccStat("shield", o.admins, "admins")}</div>
   <div class="stats">${ccStat("present", o.events_upcoming, "upcoming presentations")}${ccStat("tasks", o.assignments_open, "open assignments")}${ccStat("bell", o.notifications_24h, "notifications in 24 h")}${ccStat("ban", o.push_failed_24h, "failed pushes in 24 h")}${ccStat("user", o.incomplete_accounts, "accounts without profile")}${ccStat("star", o.leaders, "leaders")}</div>
   ${(o.live_now || []).length ? `<div class="panel"><h3>Live now</h3>${o.live_now.map(e => `<div class="pc"><div class="grow"><b>${esc(e.title)}</b> <small>${esc(e.tag)}</small></div><a class="btn s" href="../index.html">${ic("present")} Open live</a></div>`).join("")}</div>` : ""}
   <div class="panel"><h3>Owner</h3><p>${o.owner ? `<b>${esc(o.owner.name)}</b> · <span>since</span> <span class="mono">${ccDate(o.owner.since)}</span>` : "—"}</p></div>`;
}
function ccPres() {
  if (!CC.acc) return head("Presentations", "All presentation events across classes.") + ccNA();
  if (CC.ev === null) { CC.ev = false; ccLoad("presx"); }
  const L = CC.ev || [];
  return head("Presentations", "All presentation events across classes.", `<a class="btn" href="../index.html">${ic("cap")} Open in Teacher Studio</a>`) +
   `<div class="panel"><table class="tbl"><thead><tr><th>Class</th><th>Presentations</th><th>Status</th><th>Deadline</th></tr></thead><tbody>${L.map(e => `<tr><td class="mono">${esc(e.class_tag)}</td><td><b>${esc(e.title)}</b></td><td><span class="chip">${esc(e.status)}</span></td><td class="mono">${ccDate(e.final_due)}</td></tr>`).join("")}</tbody></table>${L.length ? "" : empty(ic("present"), "No presentations yet")}</div>`;
}
function ccDelivery() {
  if (!CC.acc) return head("Delivery", "Push delivery to Android devices (FCM).") + ccNA();
  if (ccNeed("delivery", "push")) return head("Delivery", "Push delivery to Android devices (FCM).") + `<div class="panel"><p class="hint">Loading…</p></div>`;
  const p = CC.push, o = p.outbox || {};
  return head("Delivery", "Push delivery to Android devices (FCM).", `<button class="s" onclick="CC.push=null;draw()">${ic("refresh")}</button>`) +
   `<div class="stats">${["queued", "sending", "sent", "retry", "dead", "invalid", "cancelled"].map(s => ccStat(s === "sent" ? "check" : s === "dead" || s === "invalid" ? "ban" : "clock", o[s] || 0, s)).join("")}</div>
   <div class="stats">${ccStat("monitor", p.devices_active, "Active devices")}${ccStat("ban", p.devices_disabled, "Disabled devices")}${ccStat("key", p.invalid_tokens_7d, "Invalid tokens (7 days)")}</div>
   <div class="panel"><p><b>Last successful send</b>: <span class="mono">${ccDate(p.last_ok)}</span> · <b>Oldest waiting</b>: <span class="mono">${ccDate(p.oldest_due)}</span></p>
   <h3>Recent errors</h3><table class="tbl"><tbody>${(p.recent_errors || []).map(e => `<tr><td class="mono">${ccDate(e.at)}</td><td><span class="chip">${esc(e.status)}</span></td><td class="mono">${e.http || ""}</td><td>${esc(e.error || "")}</td><td class="mono">${e.attempts}</td></tr>`).join("")}</tbody></table>${(p.recent_errors || []).length ? "" : `<p class="hint">No errors</p>`}</div>`;
}
function ccAudit() {
  if (!CC.acc) return head("Audit log", "Every change to presentations and platform settings.") + ccNA();
  if (CC.auditLoaded !== CC.src) { CC.auditLoaded = CC.src; ccLoad("audit"); }
  const L = CC.audit || [];
  return head("Audit log", "Every change to presentations and platform settings.", `<div class="seg">${[["all", "All"], ["presentations", "Presentations"], ["platform", "Platform"]].map(([k, t]) => `<button class="${CC.src === k ? "on" : ""}" onclick="CC.src='${k}';draw()">${t}</button>`).join("")}</div>`) +
   `<div class="panel"><table class="tbl"><tbody>${L.map(a => `<tr><td class="mono">${ccDate(a.at)}</td><td>${esc(a.actor)}</td><td><span class="chip">${esc(a.entity)}</span> ${esc(a.action)}</td><td class="mono">${esc(a.target || "")}</td><td>${esc(a.reason || "")}</td></tr>`).join("")}</tbody></table>
   ${L.length >= 50 ? `<button class="s" onclick="ccOlder()">Older</button>` : ""}</div>`;
}
async function ccOlder() { const last = CC.audit[CC.audit.length - 1]; if (!last) return; const d = await ccRpc("ops_audit", { src: CC.src, before_id: last.id, lim: 50 }); if (d) { CC.audit = CC.audit.concat(d); draw(); } }
function ccPlatform() {
  if (!window.ADM_OWNER) return head("Platform", "Only the owner can change these. Every change is audited.") + ccNA();
  if (ccNeed("platform", "ov")) return head("Platform", "Only the owner can change these. Every change is audited.") + `<div class="panel"><p class="hint">Loading…</p></div>`;
  const f = CC.ov.flags || {}, flag = (k, l) => { const on = (f[k] ?? "true") !== "false" && (k !== "maintenance" || f[k] === "true");
    return `<div class="pc"><div class="grow"><b>${l}</b> <small class="mono">${k}</small></div><button class="${on ? "" : "s"}" onclick="ccFlag('${k}','${on ? "false" : "true"}')">${on ? "on" : "off"}</button></div>`; };
  const admins = P.filter(p => isAdm(p) && p.id !== ME.id);
  return head("Platform", "Only the owner can change these. Every change is audited.") +
   `<div class="panel"><h3>Feature switches</h3>${flag("pres_enabled", "Presentation Center")}${flag("live_enabled", "Live mode")}${flag("assignments_enabled", "Assignments")}${flag("push_enabled", "Android push")}${flag("maintenance", "Maintenance mode")}
    <div class="row wrap" style="margin-top:10px"><input id="ccmm" maxlength="300" placeholder="Maintenance message" value="${esc(f.maintenance_msg || "")}" style="flex:1"><button class="s" onclick="ccFlag('maintenance_msg',document.getElementById('ccmm').value)">Save</button></div></div>
   <div class="panel"><h3>Transfer ownership</h3><p class="hint">The new owner gets full control. You stay an admin.</p><div class="row wrap"><select id="ccown">${admins.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select>
    <input id="ccwhy" maxlength="300" placeholder="Reason" style="flex:1"><button class="d" onclick="ccTransfer()">Transfer</button></div></div>`;
}
async function ccFlag(k, v) { const r = await sb.rpc("owner_set_flag", { k, v }); if (r.error) { toast(r.error.message, 1); return; } toast("Saved"); CC.ov = null; draw(); }
function ccTransfer() { const u = $("#ccown").value, why = $("#ccwhy").value; if (!u) return; confirmBox("Transfer ownership", async () => { const r = await sb.rpc("owner_transfer", { new_owner: u, reason: why }); if (r.error) { toast(r.error.message, 1); return; } CC.tried = false; ccBoot(); }); }
function ccDiag() {
  if (!window.ADM_OWNER) return head("Diagnostics", "") + ccNA();
  if (CC.jobs === null) { CC.jobs = false; ccLoad("diag"); }
  const j = CC.jobs || {}, b = window.ADIAK_BUILD || {};
  return head("Diagnostics", "", `<button class="s" onclick="CC.jobs=null;draw()">${ic("refresh")}</button>`) +
   `<div class="panel"><h3>Background jobs</h3>${j.installed === false ? `<p class="hint">pg_cron is not installed yet (needs the owner's approval).</p>` :
     `<table class="tbl"><tbody>${(j.jobs || []).map(x => `<tr><td><b>${esc(x.name)}</b></td><td class="mono">${esc(x.schedule)}</td><td>${x.active ? "on" : "off"}</td></tr>`).join("")}</tbody></table>
      <table class="tbl"><tbody>${(j.runs || []).map(x => `<tr><td class="mono">${ccDate(x.start)}</td><td>${esc(x.job)}</td><td><span class="chip">${esc(x.status)}</span></td><td>${esc(x.message || "")}</td></tr>`).join("")}</tbody></table>`}</div>
   <div class="panel"><h3>Storage</h3><table class="tbl"><tbody>${(CC.stor || []).map ? (CC.stor || []).map(s => `<tr><td class="mono">${esc(s.bucket)}</td><td>${s.objects} objects</td><td class="mono">${(s.bytes / 1048576).toFixed(1)} MB</td><td class="mono">${s.limit ? (s.limit / 1048576) + " MB" : ""}</td></tr>`).join("") : ""}</tbody></table>
     <p class="hint">Backups are managed in the Supabase dashboard (Database → Backups); their status is not readable from here.</p></div>
   <div class="panel"><h3>Accounts without a profile</h3><p class="hint">Kept on purpose: they are never deleted automatically.</p><table class="tbl"><tbody>${(CC.inc || []).map ? (CC.inc || []).map(a => `<tr><td class="mono">${esc(a.email)}</td><td><span class="chip">${a.internal ? "internal" : "external"}</span></td><td class="mono">${ccDate(a.created_at)}</td><td>${a.last_sign_in_at ? ccDate(a.last_sign_in_at) : "never signed in"}</td></tr>`).join("") : ""}</tbody></table></div>
   <div class="panel"><h3>Errors</h3><table class="tbl"><tbody>${(CC.errs || []).map ? (CC.errs || []).map(e => `<tr><td class="mono">${ccDate(e.at)}</td><td>${esc(e.kind || "")}</td><td>${esc(e.err || "")}</td></tr>`).join("") : ""}</tbody></table>${(CC.errs || []).length ? "" : `<p class="hint">No errors</p>`}</div>
   <div class="panel"><h3>Migrations</h3><p class="mono" style="font-size:12px">${(CC.migs || []).map ? (CC.migs || []).map(m => esc(m.version + " " + m.name)).join("<br>") : ""}</p></div>
   <div class="panel"><h3>Build</h3><p class="mono">ADIAK ${esc(window.ADIAK_VERSION || "1.0.0")} ${b.sha ? "· " + esc(String(b.sha).slice(0, 7)) + " · run " + esc(String(b.run)) : ""}</p></div>`;
}
// register into the Ledger tab list (permission "ops" = admin, "owner" = owner only)
TABS.splice(1, 0, ["ops", ic("monitor"), "Operations", "ops"], ["presx", ic("present"), "Presentations", "ops"], ["delivery", ic("bell"), "Delivery", "ops"], ["audit", ic("archive"), "Audit log", "ops"]);
TABS.push(["platform", ic("shield"), "Platform", "owner"], ["diag", ic("bolt"), "Diagnostics", "owner"]);
window.CC = CC;
Object.assign(XADM, { ops: ccOps, presx: ccPres, delivery: ccDelivery, audit: ccAudit, platform: ccPlatform, diag: ccDiag });
