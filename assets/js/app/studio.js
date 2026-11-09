/* =====================================================================
   studio.js — ADIAK 1.0 role workspaces in the student app (Purple Edition):
   · Teacher Studio  — welcome, class switcher, per-class workspace: overview, presentations
                       (events, teams, transparent draw, orders, final review, deadline, rubric,
                       feedback publishing, live), assignments (+ review, missing), announcements, issues.
   · Class Hub       — class leader (starosta): overview, announcements (perm), team coordination,
                       deadlines, issue reports to teachers. No assessment, no settings.
   · Classwork       — students: class announcements and assignments (submit, versions, feedback).
   Server-enforced; menus come from my_access. Loads after live.js, before main.js.
   ===================================================================== */
Object.assign(AZ, {
  "Teacher Studio": "Müəllim Studiyası", "Class Hub": "Sinif Mərkəzi", "Classwork": "Sinif işləri", "Good morning, {nm}": "Sabahınız xeyir, {nm}", "Good afternoon, {nm}": "Günortanız xeyir, {nm}",
  "Good evening, {nm}": "Axşamınız xeyir, {nm}", "Your classes": "Sinifləriniz", "{n} students": "{n} tələbə", "to review": "yoxlanacaq", "orders": "sıra", "issues": "problem",
  "Next up": "Növbəti", "Nothing scheduled": "Planlaşdırılmış iş yoxdur", "Quick actions": "Sürətli əməliyyatlar", "New presentation": "Yeni təqdimat", "Post announcement": "Elan yaz",
  "New assignment": "Yeni tapşırıq", "Review submissions": "Göndərişləri yoxla", "Class": "Sinif", "Assignments": "Tapşırıqlar", "Issues": "Problemlər", "Teams": "Komandalar",
  "Students without a team": "Komandasız tələbələr", "Title": "Başlıq", "Description": "Təsvir", "Start time": "Başlama vaxtı", "Final deadline": "Final son tarixi",
  "Minutes per team": "Komanda başına dəqiqə", "Create": "Yarat", "Save": "Saxla", "Participating teams": "İştirak edən komandalar", "Open for teams": "Komandalar üçün aç",
  "Run the draw": "Püşkü at", "Redraw": "Yenidən püşk", "Draw history": "Püşk tarixçəsi", "Change deadline": "Son tarixi dəyiş", "Finish": "Bitir",
  "Why are you changing the teams after the draw?": "Püşkdən sonra komandaları niyə dəyişirsiniz?", "Why is a new draw needed?": "Yeni püşk niyə lazımdır?",
  "Why is the deadline changing?": "Son tarix niyə dəyişir?", "New deadline (YYYY-MM-DD HH:MM):": "Yeni son tarix (İİİİ-AA-GG SS:DD):",
  "Draw the presentation order now?": "Təqdimat sırası indi püşkləsin?", "Open this presentation for the teams?": "Təqdimat komandalar üçün açılsın?",
  "Finish this presentation? It becomes read-only.": "Təqdimat bitirilsin? Yalnız oxumaq mümkün olacaq.", "Why finish before the live session?": "Canlı sessiyadan əvvəl niyə bitirirsiniz?",
  "Order": "Sıra", "Final file": "Final fayl", "Approve": "Təsdiqlə", "Return": "Qaytar", "What should the team change?": "Komanda nəyi dəyişməlidir?",
  "Rubric": "Meyarlar", "Criterion": "Meyar", "Max": "Maks", "Weight": "Çəki", "Add criterion": "Meyar əlavə et", "Add time criterion": "Vaxt meyarı əlavə et",
  "Target (min)": "Hədəf (dəq)", "Tolerance (s)": "Tolerans (san)", "Save rubric (new version)": "Meyarları saxla (yeni versiya)", "Publish feedback": "Rəyi dərc et",
  "Hide feedback": "Rəyi gizlət", "Published": "Dərc olunub", "Not published": "Dərc olunmayıb", "scored": "qiymətləndirilib", "Announcement for the event": "Təqdimat üçün elan",
  "Post": "Göndər", "Individual": "Fərdi", "Team": "Komanda", "Allow files": "Fayla icazə", "Publish": "Dərc et", "Close": "Bağla", "Reopen": "Yenidən aç",
  "Submitted": "Göndərilib", "Accepted": "Qəbul olunub", "Changes requested": "Düzəliş istənilib", "late": "gecikmiş", "Not submitted": "Göndərilməyib", "Accept": "Qəbul et",
  "Request changes": "Düzəliş istə", "Missing": "Çatışmayanlar", "Pinned": "Sabitlənib", "Pin": "Sabitlə", "Remove": "Sil", "Why remove it?": "Niyə silinir?",
  "Acknowledge": "Qəbul edildi", "Resolve": "Həll et", "Reply (optional):": "Cavab (istəyə bağlı):", "Report an issue to teachers": "Müəllimlərə problem bildir",
  "Send report": "Bildirişi göndər", "My reports": "Bildirişlərim", "Upcoming deadlines": "Yaxınlaşan son tarixlər", "Your work": "Sizin işiniz",
  "Submit work": "İşi göndər", "Note for the teacher": "Müəllimə qeyd", "Teacher feedback": "Müəllimin rəyi", "No assignments": "Tapşırıq yoxdur",
  "Choose a class": "Sinif seçin", "Back to welcome": "Xoş gəldin ekranına", "Live now": "İndi canlı", "Manage": "İdarə et", "status": "status",
  "acknowledged": "qəbul edildi", "resolved": "həll edildi", "No issues": "Problem yoxdur", "Class representative": "Sinif nümayəndəsi", "members": "üzv",
  "Edit": "Redaktə", "minutes": "dəqiqə", "Open live": "Canlını aç"
});
Object.assign(AZ_ERR, { "Only teachers of this class can create assignments": "Tapşırığı yalnız bu sinfin müəllimləri yarada bilər",
  "This assignment is not open for submissions": "Bu tapşırıq göndəriş üçün açıq deyil", "This work is already accepted. Ask your teacher to reopen it.": "Bu iş artıq qəbul olunub. Müəllimdən yenidən açmağı xahiş edin.",
  "Join a team first: this is a team assignment": "Əvvəlcə komandaya qoşulun: bu komanda tapşırığıdır", "Add a file or a note": "Fayl və ya qeyd əlavə edin",
  "Please give a reason (at least 5 characters).": "Səbəb yazın (ən az 5 simvol).", "At least two teams are needed for a draw": "Püşk üçün ən az iki komanda lazımdır",
  "The draw changed meanwhile. Reload and try again.": "Püşk bu arada dəyişib. Yeniləyib yenidən cəhd edin.", "Only the class representative can report class issues": "Sinif problemlərini yalnız sinif nümayəndəsi bildirə bilər" });

const ST = { cls: null, sec: "home", ev: null, home: null, ov: {}, rb: null, miss: {}, revealing: null };
const acc = () => (window.PX && PX.acc) || {};
const stTeaches = () => (acc().teaches || []).map(c => c.tag);
const stIsTeacher = () => !!PX.on && (stTeaches().length > 0 || (acc().admin && (CLS || []).length > 0));
const stTeachTag = t => !!acc().admin || stTeaches().includes(t);
const stLeads = () => acc().leads || [];
const stLeadPerm = (t, p) => stLeads().some(c => c.tag === t && (c.perms || []).includes(p));
const stClasses = () => { const a = acc(); if (a.admin && !(a.teaches || []).length) return (CLS || []).map(c => ({ tag: c.tag, title: c.title })); return a.teaches || []; };
const stInput = (id, attrs) => `<input id="${id}" ${attrs || ""}>`;
const stVal = id => { const e = document.getElementById(id); return e ? e.value : ""; };
const stIso = id => { const v = stVal(id); return v ? new Date(v).toISOString() : null; };
const stLocal = d => { if (!d) return ""; const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
function stGreet() { const h = new Date().getHours(), nm = (ME() || {}).name || ""; return tr(h < 12 ? "Good morning, {nm}" : h < 18 ? "Good afternoon, {nm}" : "Good evening, {nm}", { nm: esc(nm.split(" ")[0]) }); }
async function stHomeLoad() { const r = await sb.rpc("teacher_home"); if (!r.error) { ST.home = r.data; render(); } }
async function stOvLoad(tag) { const r = await sb.rpc("class_overview", { tag }); if (!r.error) { ST.ov[tag] = r.data; render(); } }
function stSetClass(tag) {
  ST.cls = tag; ST.sec = "overview"; ST.ev = null; try { localStorage.setItem("st-cls:" + uid, tag); } catch (e) {}
  if (ACLASS !== tag && typeof enterClass === "function" && (CLS || []).some(c => c.tag === tag)) {   // enterClass resets to Home: keep the Studio open
    const keep = { tab, sp, sheet }; try { enterClass(tag); } catch (e) {} tab = keep.tab === "home" ? "studio" : keep.tab; sp = keep.sp; sheet = keep.sheet; }
  stOvLoad(tag); render();
}
function stCurClass() {
  if (ST.cls && stClasses().some(c => c.tag === ST.cls)) return ST.cls;
  let last = null; try { last = localStorage.getItem("st-cls:" + uid); } catch (e) {}
  const L = stClasses(); ST.cls = (L.find(c => c.tag === last) || L.find(c => c.tag === ACLASS) || L[0] || {}).tag || null; return ST.cls;
}

/* ================= Teacher Studio ================= */
function stPage() {
  if (!PX.on) return `<div class="card mu">${tr("Loading…")}</div>`;
  if (ST.home === null) { ST.home = false; stHomeLoad(); }
  if (ST.sec === "home") return stWelcome();
  const tag = stCurClass(); if (!tag) return stWelcome();
  if (!ST.ov[tag]) { ST.ov[tag] = { loading: true }; stOvLoad(tag); }
  const secs = [["overview", ic("chart"), tr("Overview")], ["pres", ic("present"), tr("Presentations")], ["asg", ic("tasks"), tr("Assignments")], ["ann", ic("megaphone"), tr("Announcements")], ["iss", ic("flag"), tr("Issues")]];
  const body = ({ overview: stOverview, pres: stPres, asg: stAsg, ann: stAnn, iss: stIssues }[ST.sec] || stOverview)(tag);
  return `<div class="pxwrap"><div class="card sthead"><button class="s" onclick="ST.sec='home';render()">← ${tr("Back to welcome")}</button>
     <label class="stswitch">${ic("school")}<select onchange="stSetClass(this.value)" aria-label="${tr("Choose a class")}">${stClasses().map(c => `<option value="${esc(c.tag)}" ${c.tag === tag ? "selected" : ""}>${esc(c.tag)}${c.title ? " · " + esc(c.title) : ""}</option>`).join("")}</select></label></div>
   <div class="seg pxsecs" role="tablist">${secs.map(([k, i, t]) => `<button role="tab" class="${ST.sec === k ? "on" : ""}" aria-selected="${ST.sec === k}" onclick="ST.sec='${k}';ST.ev=null;render()">${i}<span>${t}</span></button>`).join("")}</div>${body}</div>`;
}
function stWelcome() {
  const h = ST.home || {}, cls = h.classes || stClasses().map(c => ({ tag: c.tag, title: c.title, students: "–", reviews: 0, orders: 0, issues: 0 })), nx = h.next, lv = h.live || [];
  return `<div class="pxwrap"><div class="card stwelcome"><div><div class="pxkick">${ic("cap")} ${tr("Teacher Studio")}</div><h2>${stGreet()}</h2>
     <p class="mu">${nx ? `${ic("calendar")} ${tr("Next up")}: <b>${esc(nx.title)}</b> · ${esc(nx.tag)} · ${pxDate(nx.at)} (${pxRel(nx.at)})` : tr("Nothing scheduled")}</p></div>
     ${lv.length ? `<div class="pxlive"><span class="livedot"></span><b>${tr("Live now")}:</b> ${lv.map(e => `<button class="s" onclick="openLive(${e.id})">${esc(e.title)} · ${esc(e.tag)}</button>`).join(" ")}</div>` : ""}</div>
   <div class="card"><b>${ic("school")} ${tr("Your classes")}</b><div class="stcls">${cls.map(c => `<button class="stc" onclick="stSetClass('${esc(c.tag)}')"><span class="cltag">${esc(c.tag)}</span>${c.title ? `<span class="mu">${esc(c.title)}</span>` : ""}
       <span class="mu">${tr("{n} students", { n: c.students })}</span><span class="stbad">${c.reviews ? pxChip(c.reviews + " " + tr("to review"), "warn") : ""}${c.orders ? pxChip(c.orders + " " + tr("orders"), "warn") : ""}${c.issues ? pxChip(c.issues + " " + tr("issues"), "warn") : ""}</span></button>`).join("") || `<p class="mu">${tr("No classes yet. An admin must create one.")}</p>`}</div></div>
   <div class="card"><b>${ic("bolt")} ${tr("Quick actions")}</b><div class="stqa">
     <button class="ok" onclick="stQuick('pres')">${ic("present")} ${tr("New presentation")}</button><button class="s" onclick="stQuick('asg')">${ic("tasks")} ${tr("New assignment")}</button>
     <button class="s" onclick="stQuick('ann')">${ic("megaphone")} ${tr("Post announcement")}</button><button class="s" onclick="stQuick('overview')">${ic("check")} ${tr("Review submissions")}</button></div></div></div>`;
}
function stQuick(sec) { const t = stCurClass(); if (!t) { toast(tr("Choose a class"), 1); return; } ST.sec = sec; ST.ev = sec === "pres" ? "new" : null; ST.newAsg = sec === "asg"; if (!ST.ov[t]) stOvLoad(t); render(); }
function stOverview(tag) {
  const o = ST.ov[tag] || {};
  if (o.loading) return `<div class="card mu">${tr("Loading…")}</div>`;
  const ev = o.events || [], asg = o.assignments || [];
  return `<div class="stkpi"><div class="card"><small>${tr("Students")}</small><b>${o.students ?? "–"}</b></div><div class="card"><small>${tr("Teams")}</small><b>${(o.teams || []).length}</b></div>
     <div class="card"><small>${tr("Students without a team")}</small><b>${(o.idle || []).length}</b></div><div class="card"><small>${tr("Issues")}</small><b>${o.issues_open ?? 0}</b></div></div>
   ${ev.map(e => `<div class="card"><div class="row sp"><b>${ic("present")} ${esc(e.title)}</b><span>${pxChip(pxStatus(e.status))} <button class="s" onclick="ST.sec='pres';ST.ev=${e.id};render()">${tr("Manage")}</button></span></div>
     <table class="sttab"><thead><tr><th>${tr("Team")}</th><th>${tr("Order")}</th><th>${tr("Final")}</th><th>${tr("Tasks")}</th></tr></thead><tbody>${(e.teams || []).map(t => `<tr><td>${esc(t.name)}</td><td>${pxStateChip(t.order)}</td><td>${pxStateChip(t.final)}</td><td>${t.tasks_done}/${t.tasks_done + t.tasks_open}</td></tr>`).join("")}</tbody></table></div>`).join("")}
   ${asg.length ? `<div class="card"><b>${ic("tasks")} ${tr("Assignments")}</b>${asg.map(a => `<div class="pxpart"><span>${esc(a.title)} <small class="mu">${a.due_at ? pxDate(a.due_at) : ""}</small></span><div class="bar"><i style="width:${a.expected ? Math.round(a.submitted / a.expected * 100) : 0}%"></i></div><b>${a.submitted}/${a.expected}${a.to_review ? " · " + a.to_review + " " + tr("to review") : ""}</b></div>`).join("")}</div>` : ""}
   ${(o.idle || []).length ? `<div class="card"><b>${ic("user")} ${tr("Students without a team")}</b><p>${o.idle.map(p => esc(p.name)).join(", ")}</p></div>` : ""}`;
}

/* ---------- presentations (teacher) ---------- */
function stPres(tag) {
  if (ST.ev === "new") return stEventForm(tag, null);
  const list = PX.ev.filter(e => e.class_tag === tag);
  if (ST.ev && pxEv(ST.ev)) return stEvent(pxEv(ST.ev));
  return `<div class="card"><div class="row sp"><b>${ic("present")} ${tr("Presentations")}</b><button class="ok" onclick="ST.ev='new';render()">${ic("plus")} ${tr("New presentation")}</button></div>
    ${list.map(e => `<div class="li" onclick="ST.ev=${e.id};render()">${ic("present")}<div class="g"><b>${esc(e.title)}</b><br><small class="mu">${pxStatus(e.status)}${e.starts_at ? " · " + pxDate(e.starts_at) : ""} · ${pxTeams(e.id).length} ${tr("Teams")}</small></div><span>›</span></div>`).join("") || `<p class="mu">${tr("No presentations yet")}</p>`}</div>`;
}
function stEventForm(tag, e) {
  return `<div class="card"><b>${ic("present")} ${e ? tr("Edit") : tr("New presentation")}</b><div class="stform">
    <label>${tr("Title")}${stInput("stt", `maxlength="80" value="${esc(e ? e.title : "")}"`)}</label>
    <label>${tr("Description")}<textarea id="std" maxlength="1000" rows="3">${esc(e ? e.descr : "")}</textarea></label>
    <label>${tr("Start time")}${stInput("sts", `type="datetime-local" value="${stLocal(e && e.starts_at)}"`)}</label>
    ${!e || e.status === "draft" ? `<label>${tr("Final deadline")}${stInput("stdue", `type="datetime-local" value="${stLocal(e && e.final_due)}"`)}</label>` : ""}
    <label>${tr("Minutes per team")}${stInput("stm", `type="number" min="1" max="60" value="${e ? e.slot_minutes : 7}"`)}</label></div>
    <div class="row"><button class="s" onclick="ST.ev=${e ? e.id : "null"};render()">${tr("Cancel")}</button><button class="ok" onclick="stSaveEvent(${e ? e.id : "null"},'${esc(tag)}')">${e ? tr("Save") : tr("Create")}</button></div></div>`;
}
async function stSaveEvent(id, tag) {
  const e = id && pxEv(id), due = (!e || e.status === "draft") ? stIso("stdue") : e.final_due;
  const r = await pxCall("pres_event_save", { e: id, cls: tag, ttl: stVal("stt"), dsc: stVal("std"), starts: stIso("sts"), due, slot: +stVal("stm") || 7 }, tr("Saved ✓"));
  if (r) { ST.ev = typeof r === "number" ? r : id; }
}
function stEvent(e) {
  const teams = pxTeams(e.id), d = pxDraw(e.id), all = PX.dr.filter(x => x.event_id === e.id).sort((a, b) => b.round - a.round), groups = G.filter(g => g.class_tag === e.class_tag);
  const frozen = !!e.frozen_at || ["live", "done"].includes(e.status), rb = PX.rb.filter(r => r.event_id === e.id).sort((a, b) => b.version - a.version)[0];
  const sc = PX.sc.filter(s => s.event_id === e.id && !s.superseded_at);
  const actions = `${e.status === "draft" ? `<button class="ok" onclick="ask(tr('Open this presentation for the teams?'),()=>pxCall('pres_event_status',{e:${e.id},st:'open',reason:null}))">${ic("play")} ${tr("Open for teams")}</button>` : ""}
    ${["open", "drawn"].includes(e.status) ? `<button class="ok" onclick="stDraw(${e.id})">${ic("dice")} ${d ? tr("Redraw") : tr("Run the draw")}</button>` : ""}
    ${["drawn", "live", "done"].includes(e.status) ? `<button class="s" onclick="openLive(${e.id})">${ic("expand")} ${tr("Open live")}</button>` : ""}
    ${["open", "drawn"].includes(e.status) ? `<button class="s" onclick="stDeadline(${e.id})">${ic("clock")} ${tr("Change deadline")}</button>` : ""}
    ${!frozen ? `<button class="s" onclick="ST.edit=${e.id};render()">${ic("edit")} ${tr("Edit")}</button>` : ""}
    ${["open", "drawn"].includes(e.status) ? `<button class="s" onclick="stFinish(${e.id})">${tr("Finish")}</button>` : ""}`;
  if (ST.edit === e.id) return stEventForm(e.class_tag, e);
  return `<div class="card"><button class="s" onclick="ST.ev=null;render()">← ${tr("Presentations")}</button><div class="row sp" style="margin-top:8px;flex-wrap:wrap"><div><h2 style="margin:0">${esc(e.title)}</h2>
      <small class="mu">${pxStatus(e.status)} · ${tr("Starts")}: ${pxDate(e.starts_at)} · ${tr("Deadline")}: ${pxDate(e.final_due)} · ${e.slot_minutes} ${tr("minutes")}</small></div></div><div class="stqa">${actions}</div></div>
   <div class="card"><b>${ic("groups")} ${tr("Participating teams")}</b><div class="stteams">${groups.map(g => { const on = teams.some(t => t.group_id === g.id);
      return `<label class="stchk"><input type="checkbox" ${on ? "checked" : ""} ${frozen ? "disabled" : ""} onchange="stTeamToggle(${e.id},${g.id},this.checked)"> ${esc(g.name)} <small class="mu">${mem(g.id).length} ${tr("members")}</small></label>`; }).join("") || `<p class="mu">${tr("No teams")}</p>`}</div></div>
   <div class="card"><b>${ic("present")} ${tr("Teams")}</b><table class="sttab"><thead><tr><th>#</th><th>${tr("Team")}</th><th>${tr("Order")}</th><th>${tr("Final file")}</th></tr></thead><tbody>
     ${teams.map(t => { const pos = d ? d.result.indexOf(t.group_id) + 1 : "–", sub = PX.sub.find(s => s.event_id === e.id && s.group_id === t.group_id && (s.state === "submitted" || s.state === "approved"));
       return `<tr><td>${pos || "–"}</td><td><b>${esc(t.group_name)}</b></td><td>${pxStateChip(t.speak_state)}
         ${t.speak_state === "submitted" ? `<button class="s sm" onclick="pxCall('pres_approve_order',{e:${e.id},g:${t.group_id}})">${tr("Approve")}</button>` : ""}
         ${["submitted", "approved", "needs_review"].includes(t.speak_state) && !frozen ? `<button class="s sm" onclick="stReturnOrder(${e.id},${t.group_id})">${tr("Return")}</button>` : ""}</td>
         <td>${sub ? `<button class="s sm" onclick="pxOpenFile(${sub.file_id})">${ic("eye")} v${sub.version}</button> ${pxStateChip(sub.state)}
           ${sub.state === "submitted" ? `<button class="ok sm" onclick="pxCall('pres_review_final',{sid:${sub.id},decision:'approve',msg:null},tr('Approved'))">${tr("Approve")}</button>` : ""}
           <button class="s sm" onclick="stReturnFinal(${sub.id})">${tr("Return")}</button>` : pxStateChip(t.final_state)}</td></tr>`; }).join("")}</tbody></table></div>
   ${all.length ? `<div class="card"><b>${ic("dice")} ${tr("Draw history")}</b>${all.map(x => `<div class="pxlog"><span>${tr("Round {n}", { n: x.round })}: ${x.result.map(g => esc((pxTeam(e.id, g) || {}).group_name || "?")).join(" → ")}</span>
      <span class="mu">${esc(pxPersonName(x.drawn_by))}${x.reason ? " · " + esc(x.reason) : ""}${x.superseded_at ? " · " + tr("History") : ""}</span><small class="mu">${pxDate(x.created_at)}</small></div>`).join("")}</div>` : ""}
   <div class="card"><b>${ic("megaphone")} ${tr("Announcement for the event")}</b><div class="row"><textarea id="stan" rows="2" maxlength="2000" style="flex:1"></textarea><button class="ok" onclick="stAnnounceEvent(${e.id})">${tr("Post")}</button></div>
     ${PX.an.filter(a => a.event_id === e.id).slice(0, 5).map(a => `<div class="pxann"><p>${esc(a.body)}</p><small class="mu">${pxDate(a.created_at)}</small></div>`).join("")}</div>
   ${stRubric(e, rb)}
   <div class="card"><div class="row sp"><b>${ic("star")} ${tr("Feedback")}</b>${e.scores_published_at ? pxChip(tr("Published"), "on") : pxChip(tr("Not published"))}</div>
     <p class="mu">${sc.length} ${tr("scored")}</p>${["live", "done"].includes(e.status) ? `<button class="${e.scores_published_at ? "s" : "ok"}" onclick="pxCall('pres_publish_scores',{e:${e.id},pub:${!e.scores_published_at}})">${e.scores_published_at ? tr("Hide feedback") : tr("Publish feedback")}</button>` : ""}</div>`;
}
async function stTeamToggle(e, g, on) {
  const d = pxDraw(e); let reason = null;
  if (d) { reason = prompt(tr("Why are you changing the teams after the draw?"), ""); if (!reason) { render(); return; } }
  await pxCall("pres_set_teams", { e, add_g: on ? [g] : null, rm_g: on ? null : [g], reason });
}
function stDraw(e) {
  const d = pxDraw(e); let reason = null;
  if (d) { reason = prompt(tr("Why is a new draw needed?"), ""); if (!reason) return; }
  const run = async () => { const before = d ? d.round : 0; if (await pxCall("pres_draw", { e, expected_round: before, reason })) { await pxLoad(); stReveal(e); } };
  if (d) run(); else ask(tr("Draw the presentation order now?"), run);
}
// draw reveal: names shuffle, then the stored server result appears one by one (purely visual)
function stReveal(e) {
  const d = pxDraw(e); if (!d) return; const names = d.result.map(g => (pxTeam(e, g) || {}).group_name || "?");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  $("#modal").innerHTML = `<div class="ov" onclick="if(event.target===this)closeM()"><div class="card streveal"><b>${ic("dice")} ${tr("Order of teams")} · ${tr("Round {n}", { n: d.round })}</b><div id="strv" class="strv"></div><ol id="stro" class="pxorder"></ol><button class="ok" onclick="closeM();render()">${tr("Close")}</button></div></div>`;
  const rv = $("#strv"), ro = $("#stro"); let k = 0;
  const reveal = () => { ro.innerHTML = names.map((n, i) => `<li style="animation-delay:${reduce ? 0 : i * 180}ms"><span class="ordn">${i + 1}</span><b>${esc(n)}</b></li>`).join(""); rv.textContent = ""; snd.ok(); if (!reduce) party(); };
  if (reduce) { reveal(); return; }
  const iv = setInterval(() => { rv.textContent = names[Math.floor(Math.random() * names.length)]; snd.click(); if (++k > 16) { clearInterval(iv); reveal(); } }, 70);
}
function stDeadline(e) {
  const ev = pxEv(e), v = prompt(tr("New deadline (YYYY-MM-DD HH:MM):"), stLocal(ev.final_due).replace("T", " ")); if (!v) return;
  const due = new Date(v.replace(" ", "T")); if (isNaN(due)) { toast(tr("Invalid date"), 1); return; }
  const reason = prompt(tr("Why is the deadline changing?"), ""); if (!reason) return;
  pxCall("pres_set_due", { e, due: due.toISOString(), reason }, tr("Saved ✓"));
}
Object.assign(AZ, { "Invalid date": "Tarix düzgün deyil", "Students": "Tələbələr", "No teams": "Komanda yoxdur" });
function stFinish(e) { ask(tr("Finish this presentation? It becomes read-only."), () => { const r = prompt(tr("Why finish before the live session?"), ""); if (r) pxCall("pres_event_status", { e, st: "done", reason: r }); }); }
function stReturnOrder(e, g) { const n = prompt(tr("What should the team change?"), ""); if (n !== null) pxCall("pres_return_order", { e, g, note: n }); }
function stReturnFinal(sid) { const n = prompt(tr("What should the team change?"), ""); if (n) pxCall("pres_review_final", { sid, decision: "return", msg: n }); }
async function stAnnounceEvent(e) { const t = stVal("stan"); if (!t.trim()) return; if (await pxCall("pres_announce", { e, txt: t.trim() }, tr("Sent ✓"))) { const x = $("#stan"); if (x) { x.value = ""; x.defaultValue = ""; } } }
function stRubric(e, rb) {
  if (!ST.rb || ST.rb.e !== e.id) ST.rb = { e: e.id, c: JSON.parse(JSON.stringify(rb ? rb.criteria : [{ key: "content", label: LANG === "az" ? "Məzmun" : "Content", max: 10, weight: 2 }, { key: "delivery", label: LANG === "az" ? "Çıxış" : "Delivery", max: 10, weight: 1 }, { key: "teamwork", label: LANG === "az" ? "Komanda işi" : "Teamwork", max: 5, weight: 1 }])) };
  const c = ST.rb.c;
  return `<div class="card"><div class="row sp"><b>${ic("star")} ${tr("Rubric")}</b>${rb ? `<small class="mu">v${rb.version}</small>` : ""}</div>
    <div class="strb">${c.map((x, i) => `<div class="strbr"><input value="${esc(x.label)}" maxlength="60" aria-label="${tr("Criterion")}" onchange="ST.rb.c[${i}].label=this.value;ST.rb.c[${i}].key=stKey(this.value,${i})">
      <label>${tr("Max")}<input type="number" min="1" max="100" value="${x.max}" onchange="ST.rb.c[${i}].max=+this.value"></label><label>${tr("Weight")}<input type="number" min="0.1" max="100" step="0.1" value="${x.weight || 1}" onchange="ST.rb.c[${i}].weight=+this.value"></label>
      ${x.kind === "duration" ? `<label>${tr("Target (min)")}<input type="number" min="1" max="120" value="${x.target_s / 60}" onchange="ST.rb.c[${i}].target_s=Math.round(+this.value*60)"></label><label>${tr("Tolerance (s)")}<input type="number" min="0" max="3600" value="${x.tolerance_s}" onchange="ST.rb.c[${i}].tolerance_s=+this.value"></label>` : ""}
      <button class="s sm" onclick="ST.rb.c.splice(${i},1);render()" aria-label="${tr("Remove")}">${ic("trash")}</button></div>`).join("")}</div>
    <div class="stqa"><button class="s" onclick="ST.rb.c.push({key:'c'+(ST.rb.c.length+1),label:'',max:10,weight:1});render()">${ic("plus")} ${tr("Add criterion")}</button>
    ${c.some(x => x.kind === "duration") ? "" : `<button class="s" onclick="ST.rb.c.push({key:'time',label:'${LANG === "az" ? "Vaxt idarəsi" : "Time management"}',kind:'duration',max:5,weight:1,target_s:${e.slot_minutes * 60},tolerance_s:30});render()">${ic("clock")} ${tr("Add time criterion")}</button>`}
    <button class="ok" onclick="stSaveRubric(${e.id})">${tr("Save rubric (new version)")}</button></div></div>`;
}
function stKey(label, i) { const k = fold(label || "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 20); return k || "c" + (i + 1); }
async function stSaveRubric(e) { const c = ST.rb.c.map((x, i) => ({ ...x, key: x.key || stKey(x.label, i) })); await pxCall("pres_rubric_save", { e, crit: c }, tr("Saved ✓")); }

/* ---------- assignments (teacher) ---------- */
function stAsg(tag) {
  const list = PX.asg.filter(a => a.class_tag === tag), cur = ST.asg && PX.asg.find(a => a.id === ST.asg);
  if (ST.newAsg || ST.editAsg) { const a = ST.editAsg && PX.asg.find(x => x.id === ST.editAsg);
    return `<div class="card"><b>${ic("tasks")} ${a ? tr("Edit") : tr("New assignment")}</b><div class="stform"><label>${tr("Title")}${stInput("sat", `maxlength="120" value="${esc(a ? a.title : "")}"`)}</label>
      <label>${tr("Description")}<textarea id="sad" rows="4" maxlength="4000">${esc(a ? a.descr : "")}</textarea></label><label>${tr("Deadline")}${stInput("sadue", `type="datetime-local" value="${stLocal(a && a.due_at)}"`)}</label>
      <label>${tr("Team")}<select id="sam" ${a && a.status !== "draft" ? "disabled" : ""}><option value="individual" ${a && a.mode === "team" ? "" : "selected"}>${tr("Individual")}</option><option value="team" ${a && a.mode === "team" ? "selected" : ""}>${tr("Team")}</option></select></label>
      <label class="stchk"><input id="saf" type="checkbox" ${!a || a.allow_files ? "checked" : ""}> ${tr("Allow files")}</label></div>
      <div class="row"><button class="s" onclick="ST.newAsg=false;ST.editAsg=null;render()">${tr("Cancel")}</button><button class="ok" onclick="stSaveAsg(${a ? a.id : "null"},'${esc(tag)}')">${a ? tr("Save") : tr("Create")}</button></div></div>`; }
  if (cur) return stAsgDetail(cur);
  return `<div class="card"><div class="row sp"><b>${ic("tasks")} ${tr("Assignments")}</b><button class="ok" onclick="ST.newAsg=true;render()">${ic("plus")} ${tr("New assignment")}</button></div>
    ${list.map(a => { const subs = PX.asub.filter(s => s.assignment_id === a.id && s.state === "submitted").length;
      return `<div class="li" onclick="ST.asg=${a.id};render()">${ic("tasks")}<div class="g"><b>${esc(a.title)}</b><br><small class="mu">${pxStatus(a.status === "published" ? "open" : a.status)} · ${a.mode === "team" ? tr("Team") : tr("Individual")}${a.due_at ? " · " + pxDate(a.due_at) : ""}</small></div>${subs ? pxChip(subs + " " + tr("to review"), "warn") : ""}<span>›</span></div>`; }).join("") || `<p class="mu">${tr("No assignments")}</p>`}</div>`;
}
async function stSaveAsg(id, tag) {
  const r = await pxCall("assignment_save", { aid: id, cls: tag, ttl: stVal("sat"), dsc: stVal("sad"), due: stIso("sadue"), md: stVal("sam") || "individual", files: !!($("#saf") || {}).checked }, tr("Saved ✓"));
  if (r) { ST.newAsg = false; ST.editAsg = null; ST.asg = typeof r === "number" ? r : id; }
}
function stAsgDetail(a) {
  if (ST.miss[a.id] === undefined && a.status !== "draft") { ST.miss[a.id] = null; sb.rpc("assignment_missing", { aid: a.id }).then(r => { ST.miss[a.id] = r.error ? [] : r.data; render(); }); }
  const subs = PX.asub.filter(s => s.assignment_id === a.id && s.state !== "superseded").sort((x, y) => y.id - x.id);
  const who = s => s.subject_group ? (grp(s.subject_group) || {}).name || "?" : pxPersonName(s.subject_user);
  return `<div class="card"><button class="s" onclick="ST.asg=null;render()">← ${tr("Assignments")}</button><div class="row sp" style="margin-top:8px;flex-wrap:wrap"><div><h2 style="margin:0">${esc(a.title)}</h2><small class="mu">${a.mode === "team" ? tr("Team") : tr("Individual")} · ${tr("Deadline")}: ${pxDate(a.due_at)}</small></div>
    <div class="stqa">${a.status === "draft" ? `<button class="ok" onclick="pxCall('assignment_status',{aid:${a.id},st:'published'})">${tr("Publish")}</button>` : a.status === "published" ? `<button class="s" onclick="pxCall('assignment_status',{aid:${a.id},st:'closed'})">${tr("Close")}</button>` : `<button class="s" onclick="pxCall('assignment_status',{aid:${a.id},st:'published'})">${tr("Reopen")}</button>`}
    <button class="s" onclick="ST.editAsg=${a.id};render()">${ic("edit")} ${tr("Edit")}</button></div></div>${a.descr ? `<p style="white-space:pre-wrap">${esc(a.descr)}</p>` : ""}</div>
   <div class="card"><b>${ic("inbox")} ${tr("Submissions")}</b>${subs.map(s => `<div class="li"><div class="g"><b>${esc(who(s))}</b> ${pxChip({ submitted: tr("Submitted"), accepted: tr("Accepted"), changes_requested: tr("Changes requested") }[s.state], s.state === "accepted" ? "on" : "warn")}${s.late ? " " + pxChip(tr("late"), "warn") : ""}
      <br><small class="mu">v${s.version} · ${pxDate(s.submitted_at)}${s.note ? " · " + esc(s.note) : ""}</small>${s.feedback ? `<br><small>${esc(s.feedback)}</small>` : ""}</div>
      <div class="pxfa">${s.path ? `<button class="s" onclick="stOpenClassFile('${esc(s.path)}')">${ic("eye")}</button>` : ""}${s.state === "submitted" ? `<button class="ok" onclick="pxCall('assignment_review',{sid:${s.id},decision:'accept',msg:null},tr('Accepted'))">${tr("Accept")}</button>` : ""}
      ${s.state !== "changes_requested" ? `<button class="s" onclick="stAsgChanges(${s.id})">${tr("Request changes")}</button>` : ""}</div></div>`).join("") || `<p class="mu">${tr("Not submitted")}</p>`}</div>
   ${a.status !== "draft" ? `<div class="card"><b>${ic("user")} ${tr("Missing")}</b><p>${ST.miss[a.id] === null ? tr("Loading…") : (ST.miss[a.id] || []).map(m => esc(m.name)).join(", ") || "—"}</p></div>` : ""}`;
}
function stAsgChanges(sid) { const n = prompt(tr("What should the team change?"), ""); if (n) pxCall("assignment_review", { sid, decision: "changes", msg: n }); }
async function stOpenClassFile(path) { const r = await sb.storage.from("class-files").createSignedUrl(path, 600); if (r.error || !r.data) { toast(trErr(r.error ? r.error.message : "File not found"), 1); return; } window.open(r.data.signedUrl, "_blank", "noopener"); }

/* ---------- announcements + issues (teacher & class leader) ---------- */
function stAnnForm(tag) {
  return `<div class="card"><b>${ic("megaphone")} ${tr("Post announcement")}</b><div class="stform"><label>${tr("Title")}${stInput("sant", 'maxlength="120"')}</label><label>${tr("Description")}<textarea id="sanb" rows="3" maxlength="4000"></textarea></label>
    <label class="stchk"><input id="sanp" type="checkbox"> ${tr("Pin")}</label></div><button class="ok" onclick="stPostAnn('${esc(tag)}')">${tr("Post")}</button></div>`;
}
async function stPostAnn(tag) {
  if (await pxCall("class_announce", { tag, ttl: stVal("sant"), txt: stVal("sanb"), pin: !!($("#sanp") || {}).checked, expires: null }, tr("Sent ✓"))) ["sant", "sanb"].forEach(i => { const x = $("#" + i); if (x) { x.value = ""; x.defaultValue = ""; } });
}
function stAnnList(tag, canRemove) {
  const L = PX.cann.filter(a => a.class_tag === tag && !a.removed_at).sort((a, b) => (b.pinned - a.pinned) || b.id - a.id);
  return L.map(a => `<div class="card stann${a.pinned ? " pin" : ""}"><div class="row sp"><b>${a.pinned ? ic("star") + " " : ""}${esc(a.title)}</b><small class="mu">${esc(a.author_name)} · ${pxDate(a.created_at)}</small></div><p style="white-space:pre-wrap;margin:6px 0 0">${esc(a.body)}</p>
    ${canRemove(a) ? `<button class="s sm" onclick="stRemoveAnn(${a.id})">${tr("Remove")}</button>` : ""}</div>`).join("") || `<div class="card mu">${tr("No announcements")}</div>`;
}
function stRemoveAnn(id) { const r = prompt(tr("Why remove it?"), ""); if (r !== null) pxCall("class_announce_remove", { aid: id, reason: r }); }
const stAnn = tag => stAnnForm(tag) + stAnnList(tag, () => true);
function stIssues(tag) {
  const L = PX.iss.filter(i => i.class_tag === tag);
  return `<div class="card"><b>${ic("flag")} ${tr("Issues")}</b>${L.map(i => `<div class="li"><div class="g"><b>${esc(i.title)}</b> ${pxChip(tr(i.status === "open" ? "Open" : i.status), i.status === "resolved" ? "on" : "warn")}<br><small class="mu">${esc(i.author_name)} · ${pxDate(i.created_at)}</small>${i.body ? `<p style="margin:4px 0 0">${esc(i.body)}</p>` : ""}${i.reply ? `<p class="mu" style="margin:4px 0 0">↳ ${esc(i.reply)}</p>` : ""}</div>
    <div class="pxfa">${i.status === "open" ? `<button class="s" onclick="stIssue(${i.id},'acknowledged')">${tr("Acknowledge")}</button>` : ""}${i.status !== "resolved" ? `<button class="ok" onclick="stIssue(${i.id},'resolved')">${tr("Resolve")}</button>` : ""}</div></div>`).join("") || `<p class="mu">${tr("No issues")}</p>`}</div>`;
}
function stIssue(id, st) { const r = prompt(tr("Reply (optional):"), ""); if (r === null) return; pxCall("class_issue_update", { iid: id, st, msg: r || null }); }

/* ================= Class Hub (class leader) ================= */
function hubPage() {
  if (!PX.on) return `<div class="card mu">${tr("Loading…")}</div>`;
  const L = stLeads(); if (!L.length) return `<div class="card mu">${tr("No longer available")}</div>`;
  const tag = (L.find(c => c.tag === ST.hub) || L[0]).tag; ST.hub = tag;
  if (!ST.ov[tag]) { ST.ov[tag] = { loading: true }; stOvLoad(tag); }
  const o = ST.ov[tag] || {}, mine = PX.iss.filter(i => i.author === uid);
  const dl = [...(o.events || []).filter(e => e.final_due).map(e => ({ t: e.title, at: e.final_due })), ...(o.assignments || []).filter(a => a.due_at).map(a => ({ t: a.title, at: a.due_at }))].sort((a, b) => new Date(a.at) - new Date(b.at));
  return `<div class="pxwrap"><div class="card stwelcome"><div><div class="pxkick">${ic("school")} ${tr("Class Hub")} · ${esc(tag)}</div><h2>${stGreet()}</h2><p class="mu">${tr("Class representative")}</p></div></div>
   ${o.loading ? `<div class="card mu">${tr("Loading…")}</div>` : `<div class="stkpi"><div class="card"><small>${tr("Students")}</small><b>${o.students}</b></div><div class="card"><small>${tr("Teams")}</small><b>${(o.teams || []).length}</b></div><div class="card"><small>${tr("Students without a team")}</small><b>${(o.idle || []).length}</b></div></div>
   <div class="grid2"><div class="card"><b>${ic("groups")} ${tr("Teams")}</b>${(o.teams || []).map(t => `<div class="pxpart"><span>${esc(t.name)}</span><div class="bar"><i style="width:${Math.round(t.members / t.capacity * 100)}%"></i></div><b>${t.members}/${t.capacity}</b></div>`).join("")}
     ${(o.idle || []).length ? `<p class="mu">${tr("Students without a team")}: ${o.idle.map(p => esc(p.name)).join(", ")}</p>` : ""}</div>
    <div class="card"><b>${ic("calendar")} ${tr("Upcoming deadlines")}</b>${dl.map(d => `<div class="pxlog"><span>${esc(d.t)}</span><small class="mu">${pxDate(d.at)} · ${pxRel(d.at)}</small></div>`).join("") || `<p class="mu">${tr("Nothing scheduled")}</p>`}</div></div>`}
   ${stLeadPerm(tag, "announce") ? stAnnForm(tag) : ""}${stAnnList(tag, a => a.author === uid)}
   ${stLeadPerm(tag, "report") ? `<div class="card"><b>${ic("flag")} ${tr("Report an issue to teachers")}</b><div class="stform"><label>${tr("Title")}${stInput("hit", 'maxlength="120"')}</label><label>${tr("Description")}<textarea id="hib" rows="3" maxlength="2000"></textarea></label></div>
     <button class="ok" onclick="hubReport('${esc(tag)}')">${tr("Send report")}</button>${mine.length ? `<div style="margin-top:10px"><b>${tr("My reports")}</b>${mine.map(i => `<div class="pxlog"><span>${esc(i.title)}</span> ${pxChip(tr(i.status === "open" ? "Open" : i.status), i.status === "resolved" ? "on" : "")}${i.reply ? `<span class="mu">↳ ${esc(i.reply)}</span>` : ""}</div>`).join("")}</div>` : ""}</div>` : ""}</div>`;
}
async function hubReport(tag) { if (await pxCall("class_issue_report", { tag, ttl: stVal("hit"), txt: stVal("hib") }, tr("Sent ✓"))) ["hit", "hib"].forEach(i => { const x = $("#" + i); if (x) { x.value = ""; x.defaultValue = ""; } }); }

/* ================= Classwork (students) ================= */
function cwPage() {
  if (!PX.on) return `<div class="card mu">${tr("Loading…")}</div>`;
  const u = ME(), tag = u.class_tag, asg = PX.asg.filter(a => a.class_tag === tag && a.status !== "draft").sort((a, b) => (a.due_at || "z").localeCompare(b.due_at || "z"));
  return `<div class="pxwrap"><h2 class="sttitle">${ic("megaphone")} ${tr("Announcements")}</h2>${stAnnList(tag, () => false)}
   <h2 class="sttitle">${ic("tasks")} ${tr("Assignments")}</h2>${asg.map(cwCard).join("") || `<div class="card mu">${tr("No assignments")}</div>`}</div>`;
}
function cwCard(a) {
  const u = ME(), mine = PX.asub.filter(s => s.assignment_id === a.id && (a.mode === "team" ? s.subject_group === u.group_id : s.subject_user === uid)).sort((x, y) => y.version - x.version);
  const act = mine.find(s => s.state === "submitted" || s.state === "accepted"), last = mine[0], open = a.status === "published" && (!act || act.state !== "accepted") && (a.mode !== "team" || u.group_id !== null);
  return `<div class="card"><div class="row sp" style="flex-wrap:wrap"><b>${esc(a.title)}</b><span>${a.due_at ? pxChip(ic("clock") + " " + pxDate(a.due_at), new Date(a.due_at) < pxNow() ? "warn" : "") : ""} ${pxChip(a.mode === "team" ? tr("Team") : tr("Individual"))}</span></div>
    ${a.descr ? `<p style="white-space:pre-wrap">${esc(a.descr)}</p>` : ""}
    <div class="cwmine"><small class="mu">${tr("Your work")}</small> ${last ? `${pxChip({ submitted: tr("Submitted"), accepted: tr("Accepted"), changes_requested: tr("Changes requested"), superseded: tr("History") }[last.state], last.state === "accepted" ? "on" : "warn")} <small class="mu">v${last.version} · ${pxDate(last.submitted_at)}${last.late ? " · " + tr("late") : ""}</small>${last.feedback ? `<p><b>${tr("Teacher feedback")}:</b> ${esc(last.feedback)}</p>` : ""}` : pxChip(tr("Not submitted"))}</div>
    ${open ? `<div class="stform">${a.allow_files ? `<input type="file" id="cwf${a.id}" accept=".${PX_EXT.join(",.")}">` : ""}<textarea id="cwn${a.id}" rows="2" maxlength="2000" placeholder="${tr("Note for the teacher")}"></textarea></div><button class="ok" onclick="cwSubmit(${a.id},${act ? act.id : "null"})">${ic("upload")} ${tr("Submit work")}</button>` : ""}</div>`;
}
async function cwSubmit(aid, act) {
  const a = PX.asg.find(x => x.id === aid), u = ME(), fi = $("#cwf" + aid), f = fi && fi.files[0], note = stVal("cwn" + aid);
  let path = null, mime = null;
  if (f) {
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    if (!PX_EXT.includes(ext)) { toast(tr("This file type is not allowed"), 1); return; }
    if (f.size > 26214400) { toast(tr("Files must be under 25 MB"), 1); return; }
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()); mime = PX_MIME[ext];
    path = `a${aid}/${a.mode === "team" ? "g" + u.group_id : uid}/${id}.${ext}`;
    toast(tr("Uploading…"));
    const up = await sb.storage.from("class-files").upload(path, f, { contentType: mime, upsert: false });
    if (up.error) { toast(trErr(up.error.message), 1); return; }
  } else if (!note.trim()) { toast(trErr("Add a file or a note"), 1); return; }
  await pxCall("assignment_submit", { aid, pth: path, fname: f ? f.name : null, fmime: mime, fsize: f ? f.size : null, nt: note, expected_active: act }, tr("Sent ✓"));
}

/* ================= registration + deep links ================= */
XPAGES.studio = { order: 0, title: () => tr("Teacher Studio"), icon: () => ic("cap"), show: () => stIsTeacher(), badge: () => ub(((ST.home || {}).classes || []).reduce((n, c) => n + (c.reviews || 0) + (c.orders || 0), 0)), body: stPage };
XPAGES.hub = { order: 2, title: () => tr("Class Hub"), icon: () => ic("school"), show: () => !!PX.on && stLeads().length > 0, body: hubPage };
XPAGES.classwork = { order: 3, title: () => tr("Classwork"), icon: () => ic("tasks"), show: () => !!PX.on && (ME() || {}).role === "student" && !!(ME() || {}).class_tag,
  badge: () => ub(PX.asg.filter(a => a.status === "published" && a.class_tag === (ME() || {}).class_tag && !PX.asub.some(s => s.assignment_id === a.id)).length), body: cwPage };
function openClassTarget(a) {
  const tag = a.tag;
  if (stTeachTag(tag) && stIsTeacher()) { ST.cls = tag; ST.sec = { announcements: "ann", assignments: "asg", issues: "iss" }[a.sec] || "overview"; ST.asg = a.sec === "assignments" ? a.id : null; goTab("studio"); return; }
  if (stLeads().some(c => c.tag === tag) && a.sec !== "assignments") { ST.hub = tag; goTab("hub"); return; }
  goTab("classwork");
}
// teachers land in Teacher Studio after login (desktop); a welcome card on the phone home
(window.xBoot = window.xBoot || []).push(() => { if (stIsTeacher() && tab === "home" && !phone() && !ST.landed) { ST.landed = true; tab = "studio"; ST.sec = "home"; } });
(window.xReload = window.xReload || []).push(() => { if (tab === "studio" || sp === "studio") { stHomeLoad(); const t = ST.cls; if (t) stOvLoad(t); } if ((tab === "hub" || sp === "hub") && ST.hub) stOvLoad(ST.hub); });
XHOME.unshift(() => stIsTeacher() ? `<div class="card pxhome" onclick="ST.sec='home';goTab('studio')" role="button" tabindex="0">${ic("cap", "pxbig")}<div><small class="mu">${tr("Teacher Studio")}</small><b>${stGreet()}</b><span class="mu">${tr("Your classes")}: ${stClasses().map(c => esc(c.tag)).join(", ")}</span></div><span>›</span></div>` : "");
