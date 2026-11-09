/* =====================================================================
   live.js — ADIAK 1.0 Live Presentation System.
   Stage (projector / classroom display): current team + speaker, large server-synchronised timer,
   full team order with recorded durations, approved final material in a PDF viewer.
   Operator console (staff): start, pause/resume, complete team (stop), next/previous/skip team,
   next speaker, time correction with reason, private notes, rubric scoring with the measured duration.
   The server is the source of truth (pres_live + pres_live_slots); this file only renders and calls RPCs.
   ===================================================================== */
Object.assign(AZ, {
  "Live presentation": "Canlı təqdimat", "Stage": "Səhnə", "Projector view": "Proyektor görünüşü", "Exit projector": "Proyektordan çıx",
  "Now presenting": "İndi çıxış edir", "Speaker": "Natiq", "Next team": "Növbəti komanda", "Previous team": "Əvvəlki komanda", "Skip team": "Komandanı keç",
  "Complete team": "Komandanı bitir", "Start live session": "Canlı sessiyanı başlat", "Pause": "Fasilə", "Resume": "Davam et", "End session": "Sessiyanı bitir",
  "Next speaker": "Növbəti natiq", "Previous speaker": "Əvvəlki natiq", "Time correction": "Vaxt düzəlişi", "Remaining": "Qalan vaxt", "Elapsed": "Keçən vaxt",
  "Waiting to start": "Başlamağı gözləyir", "Session finished": "Sessiya bitdi", "Order": "Sıra", "presented": "çıxış edib", "skipped": "keçildi", "upcoming": "gözləyir",
  "Presentation material": "Təqdimat materialı", "No approved final for this team": "Bu komandanın təsdiqlənmiş finalı yoxdur",
  "This file cannot be previewed here. Open it instead.": "Bu faylı burada göstərmək mümkün deyil. Ayrıca açın.", "Page {a} / {b}": "Səhifə {a} / {b}",
  "Full screen": "Tam ekran", "Notes (private)": "Qeydlər (gizli)", "Save note": "Qeydi saxla", "Assessment": "Qiymətləndirmə", "Save score": "Qiyməti saxla",
  "Comment for the team": "Komandaya rəy", "Override reason (needed if the time score differs)": "Dəyişiklik səbəbi (vaxt balı fərqlənirsə lazımdır)",
  "No rubric yet. Create one in Teacher Studio.": "Hələ meyar yoxdur. Müəllim Studiyasında yaradın.", "Saved ✓": "Saxlanıldı ✓",
  "Start the live session now? The team list and speaking orders will be frozen.": "Canlı sessiya başlasın? Komanda siyahısı və çıxış sıraları dondurulacaq.",
  "Mark this team as finished and stop its timer?": "Bu komanda bitmiş sayılsın və vaxt dayandırılsın?", "Move to the next team?": "Növbəti komandaya keçək?",
  "Skip this team? It will be recorded as skipped.": "Bu komanda keçilsin? Keçildi kimi qeyd olunacaq.", "End the live session for everyone?": "Canlı sessiya hamı üçün bitsin?",
  "Go back to the previous team? Its recorded time continues.": "Əvvəlki komandaya qayıdaq? Onun qeydə alınmış vaxtı davam edəcək.",
  "Add or remove time (minutes, e.g. 1 or -1):": "Vaxt əlavə et və ya azalt (dəqiqə, məs. 1 və ya -1):", "Why? (at least 5 characters)": "Səbəb? (ən az 5 simvol)",
  "Reconnecting…": "Yenidən qoşulur…", "measured": "ölçülüb", "not recorded yet": "hələ qeydə alınmayıb", "Teams": "Komandalar"
});
Object.assign(AZ_ERR, { "The live state changed meanwhile. Refresh and try again.": "Canlı vəziyyət bu arada dəyişib. Yeniləyib yenidən cəhd edin.",
  "Run the draw before starting the live session": "Canlı sessiyadan əvvəl püşk atın", "This team is already completed": "Bu komanda artıq bitib",
  "This team has finished. Move to the next team.": "Bu komanda bitib. Növbəti komandaya keçin.", "No team at that position": "Bu sırada komanda yoxdur", "No speaker at that position": "Bu sırada natiq yoxdur" });

const LV = { e: null, proj: false, pdf: null, page: 1, pages: 0, fid: null, url: null, busy: false, raf: null };
function openLive(e) { LV.e = +e; if (pm) closeM(); goTab("live"); setTimeout(lvTimerLoop, 50); }
const lvEv = () => pxEv(LV.e), lvL = () => PX.lv.find(x => x.event_id === LV.e);
const lvSlots = () => PX.ls.filter(s => s.event_id === LV.e).sort((a, b) => a.slot_index - b.slot_index);
const lvStaff = () => { const ev = lvEv(); return !!ev && pxIsStaff(ev.class_tag); };
function lvTimerLoop() {   // smooth large timer on the stage (server timestamps + measured clock offset)
  cancelAnimationFrame(LV.raf);
  const step = () => { if (tab !== "live" && sp !== "live") return; const el = document.getElementById("lvbig"), l = lvL();
    if (el && l) { const e2 = pxLiveElapsed(l), rem = l.duration_s * 1000 - e2; el.textContent = (rem < 0 ? "−" : "") + pxDur(Math.abs(rem));
      el.className = "lvbig" + (rem < 0 ? " over" : rem < 60000 ? " warn" : "") + (l.state === "paused" ? " paused" : "");
      const bar = document.getElementById("lvbar"); if (bar) bar.style.width = Math.min(100, e2 / (l.duration_s * 10 || 1)) + "%";
      const ee = document.getElementById("lvel"); if (ee) ee.textContent = pxDur(e2); }
    LV.raf = requestAnimationFrame(step); };
  LV.raf = requestAnimationFrame(step);
}
async function lvDo(fn, extra, q) {
  const l = lvL(); if (!l || LV.busy) return;
  const run = async () => { LV.busy = true; const r = await pxCall(fn, Object.assign({ e: LV.e, ver: l.version }, extra || {})); LV.busy = false;
    if (r) { const x = PX.lv.find(v => v.event_id === LV.e); if (x && typeof r === "number") x.version = r; } };
  if (q) ask(q, run); else run();
}
function lvAdjust() {
  const m = prompt(tr("Add or remove time (minutes, e.g. 1 or -1):"), "1"); if (m === null) return; const n = Math.round(parseFloat(m) * 60);
  if (!n) return; const r = prompt(tr("Why? (at least 5 characters)"), ""); if (!r) return;
  lvDo("live_adjust", { delta_s: n, reason: r });
}
function lvProj(on) {
  LV.proj = on; document.documentElement.classList.toggle("lvproj", on);
  try { if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); else if (!on && document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
  render();
}
addEventListener("keydown", e => { if (tab === "live" && LV.proj && e.key === "Escape") lvProj(false); if (tab === "live" && LV.pdf && !isTyping(document.activeElement)) { if (e.key === "ArrowRight" || e.key === "PageDown") lvPage(1); if (e.key === "ArrowLeft" || e.key === "PageUp") lvPage(-1); } });

/* ---------- PDF viewer (pdf.js, lazy, local) ---------- */
function lvLoadPdfLib() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return new Promise((ok, bad) => { const s = document.createElement("script"); s.src = "assets/vendor/pdfjs/pdf.min.js";
    s.onload = () => { pdfjsLib.GlobalWorkerOptions.workerSrc = "assets/vendor/pdfjs/pdf.worker.min.js"; ok(pdfjsLib); }; s.onerror = bad; document.head.appendChild(s); });
}
async function lvOpenMaterial(fid) {
  const f = PX.fl.find(x => x.id === fid); if (!f) return;
  if (LV.fid === fid && LV.pdf) return;
  LV.fid = fid; LV.pdf = null; LV.page = 1; LV.pages = 0;
  const r = await sb.storage.from("team-files").createSignedUrl(f.path, 3600);
  if (r.error || !r.data) { toast(trErr(r.error ? r.error.message : "File not found"), 1); return; }
  LV.url = r.data.signedUrl;
  if (!/\.pdf$/i.test(f.path)) { render(); return; }
  try {
    const lib = await lvLoadPdfLib();
    LV.pdf = await lib.getDocument({ url: LV.url, isEvalSupported: false, disableAutoFetch: false }).promise;   // isEvalSupported:false = CVE-2024-4367 mitigation
    LV.pages = LV.pdf.numPages; render(); setTimeout(lvDraw, 30);
  } catch (e) { LV.pdf = null; toast(tr("This file cannot be previewed here. Open it instead."), 1); render(); }
}
async function lvDraw() {
  const c = document.getElementById("lvcanvas"); if (!c || !LV.pdf) return;
  const pg = await LV.pdf.getPage(LV.page), box = c.parentElement, w = box.clientWidth || 800, h = box.clientHeight || 600;
  const v0 = pg.getViewport({ scale: 1 }), sc = Math.min(w / v0.width, h / v0.height) * (window.devicePixelRatio || 1);
  const v = pg.getViewport({ scale: sc }); c.width = v.width; c.height = v.height; c.style.width = v.width / (window.devicePixelRatio || 1) + "px";
  await pg.render({ canvasContext: c.getContext("2d"), viewport: v }).promise; c.dataset.p = LV.page;
  const lb = document.getElementById("lvpg"); if (lb) lb.textContent = tr("Page {a} / {b}", { a: LV.page, b: LV.pages });
}
function lvPage(d) { if (!LV.pdf) return; const n = Math.min(LV.pages, Math.max(1, LV.page + d)); if (n !== LV.page) { LV.page = n; lvDraw(); } }
function lvFull() { const v = document.getElementById("lvviewer"); try { if (v && v.requestFullscreen) v.requestFullscreen().then(() => setTimeout(lvDraw, 200)).catch(() => {}); } catch (e) {} }
addEventListener("fullscreenchange", () => setTimeout(lvDraw, 150));

/* ---------- page ---------- */
function lvPage0() {
  const ev = lvEv();
  if (!PX.on || !ev) return `<div class="card mu">${tr("No longer available")}</div>`;
  const l = lvL(), slots = lvSlots(), staff = lvStaff(), cur = l && slots.find(s => s.slot_index === l.slot_index);
  const draw = pxDraw(ev.id), order = slots.length ? slots : (draw ? draw.result.map((g, i) => ({ slot_index: i, group_id: g, group_name: (pxTeam(ev.id, g) || {}).group_name || "?", status: "pending", duration_ms: 0 })) : []);
  const spk = cur ? PX.spf.filter(s => s.event_id === ev.id && s.group_id === cur.group_id).sort((a, b) => a.position - b.position) : [];
  const speaker = spk[l ? l.speaker_index : 0], nextSlot = l && order.find(s => s.slot_index > l.slot_index && s.status === "pending");
  const fin = cur && PX.sub.find(s => s.event_id === ev.id && s.group_id === cur.group_id && s.state === "approved");
  if (fin && LV.fid !== fin.file_id) setTimeout(() => lvOpenMaterial(fin.file_id), 0);
  if (!fin && LV.fid) { LV.fid = null; LV.pdf = null; }
  const state = !l || l.state === "idle" ? tr("Waiting to start") : l.state === "ended" ? tr("Session finished") : l.state === "paused" ? tr("Pause") : tr("Now presenting");
  const stage = `<section class="card lvstage" aria-live="polite">
    <div class="lvtop"><span class="pxkick">${l && l.state === "running" ? '<span class="livedot"></span>' : ic("present")} ${esc(ev.title)}</span><span class="chip">${state}</span></div>
    <div class="lvnow"><small>${tr("Now presenting")}</small><h1>${cur ? esc(cur.group_name) : "—"}</h1>
      ${speaker ? `<div class="lvspk">${ic("mic")} ${tr("Speaker")}: <b>${esc(speaker.user_name)}</b> <span class="mu">(${(l.speaker_index || 0) + 1}/${spk.length})</span></div>` : ""}</div>
    <div class="lvtime"><div id="lvbig" class="lvbig">${l ? pxDur(l.duration_s * 1000 - pxLiveElapsed(l)) : "0:00"}</div><div class="lvsub"><span>${tr("Elapsed")}: <b id="lvel">${l ? pxDur(pxLiveElapsed(l)) : "0:00"}</b></span><span>${tr("Remaining")}</span></div><div class="bar lvbarw"><i id="lvbar" style="width:0%"></i></div></div>
    ${nextSlot ? `<div class="lvnext">${ic("next")} ${tr("Up next")}: <b>${esc(nextSlot.group_name)}</b></div>` : ""}</section>`;
  const list = `<section class="card lvorder"><b>${ic("dice")} ${tr("Order")}</b><ol>${order.map(s => `<li class="${s.status}${l && s.slot_index === l.slot_index && l.state !== "idle" ? " cur" : ""}"><span class="ordn">${s.slot_index + 1}</span><span class="g">${esc(s.group_name)}</span>
     <small>${s.status === "done" ? tr("presented") + " · " + pxDur(s.duration_ms) : s.status === "skipped" ? tr("skipped") : s.status === "presenting" ? tr("presenting") : tr("upcoming")}</small></li>`).join("")}</ol></section>`;
  const viewer = `<section class="card lvmat"><div class="row sp"><b>${ic("file")} ${tr("Presentation material")}</b>${LV.pdf ? `<span class="row" style="gap:6px"><button class="s" onclick="lvPage(-1)" aria-label="${tr("Previous")}">${ic("prev")}</button><span id="lvpg" class="mu">${tr("Page {a} / {b}", { a: LV.page, b: LV.pages })}</span><button class="s" onclick="lvPage(1)" aria-label="${tr("Next")}">${ic("next")}</button><button class="s" onclick="lvFull()" aria-label="${tr("Full screen")}">${ic("expand")}</button></span>` : ""}</div>
     <div id="lvviewer" class="lvviewer">${LV.pdf ? `<canvas id="lvcanvas"></canvas>` : fin && LV.url ? `<div class="mu lvnone">${tr("This file cannot be previewed here. Open it instead.")}<br><a class="btn s" href="${esc(LV.url)}" target="_blank" rel="noopener">${ic("eye")} ${tr("Open")}</a></div>` : `<div class="mu lvnone">${fin ? tr("Loading…") : tr("No approved final for this team")}</div>`}</div></section>`;
  const ops = staff ? lvConsole(ev, l, cur, spk) : "";
  return `<div class="lvwrap${LV.proj ? " proj" : ""}"><div class="lvbarTop row sp"><button class="s" onclick="goTab('pres')">← ${tr("Back")}</button><button class="s" onclick="lvProj(${!LV.proj})">${ic("monitor")} ${LV.proj ? tr("Exit projector") : tr("Projector view")}</button></div>
    <div class="lvgrid"><div class="lvmain">${stage}${(staff || fin) ? viewer : ""}</div><div class="lvside">${list}${ops}</div></div></div>`;
}
function lvConsole(ev, l, cur, spk) {
  const st = l ? l.state : "idle", last = lvSlots().length && l && l.slot_index >= lvSlots().length - 1;
  const btn = (fn, label, icon, q, cls, dis) => `<button class="${cls || "s"}" ${dis ? "disabled" : ""} onclick="lvDo('${fn}',null,${q ? `tr(${esc(JSON.stringify(q))})` : "null"})">${ic(icon)} ${tr(label)}</button>`;
  const controls = st === "idle" ? (ev.status === "drawn" ? btn("live_start", "Start live session", "play", "Start the live session now? The team list and speaking orders will be frozen.", "ok") : `<p class="mu">${tr("Run the draw before starting the live session")}</p>`)
    : st === "ended" ? `<p class="mu">${tr("Session finished")}</p>`
    : `${st === "running" ? btn("live_pause", "Pause", "pause") : btn("live_resume", "Resume", "play", null, "ok", cur && cur.status !== "presenting")}
       ${btn("live_complete_team", "Complete team", "stop", "Mark this team as finished and stop its timer?", "s", !cur || cur.status !== "presenting")}
       ${btn("live_next", "Next team", "next", "Move to the next team?", "ok", last)}
       ${btn("live_prev", "Previous team", "prev", "Go back to the previous team? Its recorded time continues.", "s", !l || l.slot_index === 0)}
       ${btn("live_skip", "Skip team", "ban", "Skip this team? It will be recorded as skipped.", "s", last)}
       <button class="s" ${!spk.length || l.speaker_index >= spk.length - 1 ? "disabled" : ""} onclick="lvDo('live_next_speaker',{dir:1})">${ic("mic")} ${tr("Next speaker")}</button>
       <button class="s" ${!spk.length || !l.speaker_index ? "disabled" : ""} onclick="lvDo('live_next_speaker',{dir:-1})">${tr("Previous speaker")}</button>
       <button class="s" onclick="lvAdjust()">${ic("clock")} ${tr("Time correction")}</button>
       ${btn("live_end", "End session", "power", "End the live session for everyone?", "d")}`;
  const notes = cur ? `<div class="lvnotes"><b>${ic("edit")} ${tr("Notes (private)")}</b>
      <textarea id="lvnote" rows="2" maxlength="2000"></textarea><button class="s" onclick="lvSaveNote(${cur.group_id})">${tr("Save note")}</button>
      ${(LV.notes || []).filter(n => n.group_id === cur.group_id).slice(0, 4).map(n => `<p class="mu lvn">${esc(n.body)} <small>· ${esc(n.author_name)}</small></p>`).join("")}</div>` : "";
  return `<section class="card lvops"><b>${ic("settings")} ${tr("Operator")}</b><div class="lvbtns">${controls}</div>${notes}${cur && st !== "idle" ? lvScore(ev, cur) : ""}</section>`;
}
Object.assign(AZ, { "Operator": "Operator" });
async function lvNotes() { const r = await sb.from("pres_staff_notes").select("*").eq("event_id", LV.e).order("id", { ascending: false }).limit(50); if (!r.error) LV.notes = r.data; }
async function lvSaveNote(g) { const t = ($("#lvnote") || {}).value || ""; if (!t.trim()) return; if (await pxCall("live_note", { e: LV.e, g, txt: t.trim() }, tr("Saved ✓"))) { const x = $("#lvnote"); if (x) { x.value = ""; x.defaultValue = ""; } await lvNotes(); render(); } }
function lvScore(ev, cur) {
  const rb = PX.rb.filter(r => r.event_id === ev.id).sort((a, b) => b.version - a.version)[0];
  if (!rb) return `<div class="lvscore"><b>${ic("star")} ${tr("Assessment")}</b><p class="mu">${tr("No rubric yet. Create one in Teacher Studio.")}</p></div>`;
  const mine = PX.sc.find(s => s.event_id === ev.id && s.group_id === cur.group_id && s.reviewer === uid && !s.superseded_at), dur = cur.duration_ms;
  return `<div class="lvscore"><b>${ic("star")} ${tr("Assessment")} · ${esc(cur.group_name)}</b>${rb.criteria.map(c => {
      const auto = c.kind === "duration" && cur.status === "done" ? lvDurScore(dur, c) : null, v = mine ? mine.scores[c.key] : auto;
      return `<label class="lvcrit"><span>${esc(c.label)} <small class="mu">/ ${c.max}${c.kind === "duration" ? ` · ${cur.status === "done" ? tr("measured") + " " + pxDur(dur) + " → " + auto : tr("not recorded yet")}` : ""}</small></span>
        <input type="number" min="0" max="${c.max}" step="1" data-k="${esc(c.key)}" value="${v == null ? "" : v}" inputmode="numeric"></label>`; }).join("")}
     <textarea id="lvcmt" rows="2" maxlength="2000" placeholder="${tr("Comment for the team")}">${mine ? esc(mine.comment) : ""}</textarea>
     <input id="lvovr" maxlength="300" placeholder="${tr("Override reason (needed if the time score differs)")}">
     <button class="ok" onclick="lvSaveScore(${cur.group_id})">${ic("check")} ${tr("Save score")}</button></div>`;
}
function lvDurScore(ms, c) { const d = Math.abs(ms / 1000 - c.target_s), t = c.tolerance_s; return d <= t ? c.max : (!t || d >= 2 * t) ? 0 : Math.round(c.max * (1 - (d - t) / t)); }
async function lvSaveScore(g) {
  const sc = {}; let bad = false; document.querySelectorAll(".lvscore input[data-k]").forEach(i => { if (i.value === "") bad = true; sc[i.dataset.k] = Number(i.value); });
  if (bad) { toast(tr("Give a score for every criterion"), 1); return; }
  await pxCall("pres_score", { e: LV.e, g, sc, cmt: ($("#lvcmt") || {}).value || "", override_reason: ($("#lvovr") || {}).value || null }, tr("Saved ✓"));
}
Object.assign(AZ, { "Give a score for every criterion": "Hər meyar üçün bal verin", "Previous": "Əvvəlki", "Next": "Növbəti" });
XPAGES.live = { order: 99, title: () => tr("Live presentation"), icon: () => ic("present"), show: () => false, body: () => { if (LV.e && lvStaff() && !LV.notesLoaded) { LV.notesLoaded = true; lvNotes().then(render); } return lvPage0(); } };
(window.xReload = window.xReload || []).push(() => { if (tab === "live" && LV.e && lvStaff()) lvNotes(); });
// the DOM morph resets canvas attributes: redraw the current PDF page after every render of the live page
(window.XAFTER = window.XAFTER || []).push(() => { if ((tab === "live" || sp === "live") && LV.pdf) { const c = document.getElementById("lvcanvas"); if (c && !c.width) lvDraw(); else if (c && c.dataset.p != LV.page) lvDraw(); } });
