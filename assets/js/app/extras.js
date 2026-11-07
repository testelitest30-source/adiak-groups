/* =====================================================================
   extras.js  -  Yeni funksiyalar (hamısı yalnız brauzer tərəfindədir, bazaya toxunmur)

   Bölmələr:
     1  Mövzu (Avtomatik / Açıq / Tünd)
     2  Köməkçilər
     3  Rütbə irəliləyişi və medallar
     4  Xal qrafiki (profil pəncərəsində)
     5  Liderlər podiumu və həftənin ulduzu
     6  Qruplar siyahısı: axtarış və filtr
     7  Komanda statistikası
     8  Şəkil böyüdücü
     9  Çat: qaralama, @qeyd, aşağı düyməsi, oxunmamış xətti, çat axtarışı
    10  Bağlantı xəbərdarlığı (oflayn)
    11  Telefon üçün alt menyu (tab bar)
    12  Ümumi axtarış paneli (Ctrl+K)
    13  Alətlər: təqdimat taymeri və təsadüfi seçim
    14  Klaviatura qısayolları
    15  Hər render-dən sonra işləyən qeydlər

   Yüklənmə sırası: ... → app/pages.js → app/extras.js → app/main.js
   ===================================================================== */

/* ================= 1. MÖVZU ================= */
let THEME = "auto";
try { const t = localStorage.getItem("theme"); if (t === "light" || t === "dark") THEME = t; } catch (e) {}

// Mövzunu <html data-theme> ilə tətbiq edir (auto = sistemin seçimi)
function applyTheme() {
  const r = document.documentElement;
  if (THEME === "auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", THEME);
}
function setTheme(t) {
  if (t !== "auto" && t !== "light" && t !== "dark") return;
  THEME = t;
  try { localStorage.setItem("theme", t); } catch (e) {}
  applyTheme();
  render();
}
const cycleTheme = () => setTheme(THEME === "auto" ? "light" : THEME === "light" ? "dark" : "auto");
const themeIcon = () => THEME === "dark" ? ic("moon") : THEME === "light" ? ic("sun") : ic("half");
// Ayarlardakı 3 düymə
const themeSw = () => `<span class="seg">${[["auto", ic("half"), tr("Auto")], ["light", ic("sun"), tr("Light")], ["dark", ic("moon"), tr("Dark")]]
  .map(([k, i, t]) => `<button class="${THEME === k ? "on" : ""}" onclick="setTheme('${k}')">${i} ${t}</button>`).join("")}</span>`;
applyTheme();

/* ================= 2. KÖMƏKÇİLƏR ================= */
// Axtarış üçün: böyük/kiçik hərf və diakritikləri (ə, ı, ö, ü, ş, ç, ğ) nəzərə almır → "eli" = "Əli"
const fold = s => String(s == null ? "" : s).toLowerCase()
  .replace(/ə/g, "e").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const mmss = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
const isFieldEl = el => !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
const noMatch = txt => `<p class="mu empty">${ic("search")} ${txt}</p>`;

/* ================= 3. RÜTBƏ İRƏLİLƏYİŞİ VƏ MEDALLAR ================= */
const rankIdx = p => { let i = 0; RANKS.forEach((r, j) => { if (p >= r[1]) i = j; }); return i; };
// Növbəti rütbəyə neçə xal qalıb (ən yüksək rütbədədirsə null)
function toNext(p) {
  const nx = RANKS[rankIdx(p.points) + 1];
  return nx ? { need: nx[1] - p.points, name: tr(nx[0]) } : null;
}
const nextRankText = p => { const n = toNext(p); return n ? tr("{n} pts to {r}", { n: n.need, r: n.name }) : ic("crown")+" "+tr("Top rank reached"); };

// Xal artıb yeni rütbəyə çatanda bayram edir (core.js-dəki diff() çağırır)
function rankUpCheck(o, u) {
  if (rankIdx(u.points) > rankIdx(o.pts)) { party(); notify("🚀 " + tr("New rank: {r}", { r: rank(u.points).name }), tr("Keep going!"), null, "ok"); }
}

// Şagirdin medalları (xal, təqdimat, qrup və sinif sırasına görə hesablanır)
function badgesOf(p) {
  const st = statsOf(p.id), g = p.group_id !== null ? grp(p.group_id) : null;
  const top3 = ranked().slice(0, 3).some(x => x.id === p.id && x.points > 0);
  return [
    { i: "🌱", t: tr("First points"), d: tr("Earn your first point"), on: p.points > 0 },
    { i: "🎙️", t: tr("Speaker"), d: tr("Reach {n} points", { n: RANKS[1][1] }), on: p.points >= RANKS[1][1] },
    { i: "🎤", t: tr("Orator"), d: tr("Reach {n} points", { n: RANKS[2][1] }), on: p.points >= RANKS[2][1] },
    { i: "🎼", t: tr("Maestro"), d: tr("Reach {n} points", { n: RANKS[3][1] }), on: p.points >= RANKS[3][1] },
    { i: "📣", t: tr("Presenter"), d: tr("Give your first presentation"), on: st.n >= 1 },
    { i: "🔁", t: tr("Regular speaker"), d: tr("Give 3 presentations"), on: st.n >= 3 },
    { i: "🎯", t: tr("High score"), d: tr("Get a score of 8 or more"), on: st.best >= 8 },
    { i: "🤝", t: tr("Team player"), d: tr("Join a team"), on: !!g },
    { i: "🛡️", t: tr("Team captain"), d: tr("Host a team"), on: !!g && g.host_id === p.id },
    { i: "🏅", t: tr("Class podium"), d: tr("Be in the top 3 of your class"), on: top3 }
  ];
}
const badgeGrid = L => `<div class="bdgs">${L.map(b => `<div class="bdg ${b.on ? "on" : "off"}" title="${esc(b.t)} · ${esc(b.d)}"><span class="bi">${b.i}</span><small>${esc(b.t)}</small></div>`).join("")}</div>`;
const isStudentP = p => !!p && !p.is_admin && p.role !== "teacher" && !(p.perms || []).includes("admin");
// Ana səhifədəki "Medallar" kartı
function medalsCard() {
  const u = ME(); if (!isStudentP(u)) return "";
  const L = badgesOf(u), n = L.filter(b => b.on).length;
  return `<div class="card medc"><div class="row sp"><b>${ic("medal")} ${tr("Medals")}</b><span class="chip${n ? " on" : ""}">${n}/${L.length}</span></div>${badgeGrid(L)}</div>`;
}

/* ================= 4. XAL QRAFİKİ ================= */
// Xalın zaman üzrə yığılmış dəyişməsi (ev: PE-də bu şagirdin yazıları, yeni → köhnə)
function sparkline(ev) {
  const L = ev.slice().reverse();
  if (L.length < 2) return "";
  let s = 0; const pts = L.map(e => (s = Math.max(0, s + e.amount)));
  const W = 300, H = 64, mx = Math.max(...pts, 1), mn = Math.min(...pts, 0), rg = (mx - mn) || 1;
  const X = i => Math.round(i / (pts.length - 1) * (W - 10) + 5), Y = v => Math.round(H - 8 - ((v - mn) / rg) * (H - 18));
  const d = pts.map((v, i) => (i ? "L" : "M") + X(i) + " " + Y(v)).join(" "), last = pts.length - 1;
  return `<div class="sparkw"><span class="mu">${tr("Points over time")}</span><svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${tr("Points over time")}">
   <defs><linearGradient id="spg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--ac);stop-opacity:.35"/><stop offset="1" style="stop-color:var(--ac);stop-opacity:0"/></linearGradient></defs>
   <path d="${d} L${X(last)} ${H} L${X(0)} ${H} Z" fill="url(#spg)"/>
   <path d="${d}" fill="none" style="stroke:var(--ac)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
   </svg></div>`;
}
// Profil pəncərəsinə əlavə olunan hissə: qrafik + medallar
function profileExtras(p, st) {
  return sparkline(st.ev);
}

/* ================= 5. LİDERLƏR PODİUMU VƏ HƏFTƏNİN ULDUZU ================= */
// Son 7 gündə qazanılan xallar (yalnız bu sinfin şagirdləri)
function weekGain() {
  const since = Date.now() - 7 * 864e5, ids = new Set(ppl().map(x => x.id)), m = {};
  PE.forEach(e => { if (e.amount > 0 && ids.has(e.user_id) && new Date(e.created_at).getTime() >= since) m[e.user_id] = (m[e.user_id] || 0) + e.amount; });
  return m;
}
function podiumCard() {
  const R = ranked().filter(p => p.points > 0).slice(0, 3);
  if (!R.length) return `<div class="card podc"><b>${ic("trophy")} ${tr("Leaders")}</b><p class="mu">${tr("No points yet")}</p></div>`;
  const wk = weekGain(), sid = Object.keys(wk).sort((a, b) => wk[b] - wk[a])[0], star = sid && P[sid];
  const order = R.length === 3 ? [1, 0, 2] : R.length === 2 ? [1, 0] : [0];   // 2-ci, 1-ci, 3-cü
  const cols = order.map(i => { const p = R[i], h = [104, 78, 58][i];
    return `<div class="pod" onclick="showProfile('${p.id}')">${i === 0 ? '<span class="crown">'+crownArt()+'</span>' : ""}${av(p, "big")}<b class="pn">${esc(p.name.split(" ")[0])}</b><span class="pp">${p.points} ${tr("pts")}</span><div class="pstep s${i + 1}" style="height:${h}px">${["🥇", "🥈", "🥉"][i]}</div></div>`; }).join("");
  return `<div class="card podc"><div class="row sp"><b>${ic("trophy")} ${tr("Leaders")}</b><button class="s" onclick="showAll()">${tr("See all")} →</button></div><div class="podium">${cols}</div>
   ${star ? `<div class="starline" onclick="showProfile('${star.id}')">${ic("star")} ${tr("This week's star")}: <b>${esc(star.name)}</b> <span class="chip on">+${wk[sid]}</span></div>` : ""}</div>`;
}
// Ana səhifənin ortasındakı podium + medallar
const homeMid = () => podiumCard();

/* ================= 6. QRUPLAR SİYAHISI: AXTARIŞ VƏ FİLTR ================= */
let gFilter = "all", gQuery = "";
// Filtr və axtarışa uyğun qruplar (qrup adı və ya üzvün adı ilə)
function groupsList() {
  let L = visG(); const me = ME();
  if (gFilter === "free") L = L.filter(g => mem(g.id).length < g.capacity);
  else if (gFilter === "mine") L = L.filter(g => me.group_id === g.id);
  const q = fold(gQuery.trim());
  if (q) L = L.filter(g => fold(g.name).includes(q) || mem(g.id).some(p => fold(p.name).includes(q)));
  return L;
}
const setGF = f => { gFilter = f; render(); };
// Yazanda səhifəni yox, yalnız siyahını yeniləyir (klaviatura bağlanmasın)
function gSearch(v) { gQuery = v; const e = $("#glist"); if (e) e.innerHTML = groupsHtml() || noMatch(tr("No groups match")); }
function groupsBlock() {
  const n = visG().length; if (!n) return "";
  const bar = n >= 3 ? `<div class="gfbar"><input id="gq" type="search" class="gq" autocomplete="off" placeholder="${tr("Search groups or members…")}" value="${esc(gQuery)}" oninput="gSearch(this.value)">
    <span class="seg">${[["all", tr("All")], ["free", tr("Free spots")], ["mine", tr("Mine")]].map(([k, t]) => `<button class="${gFilter === k ? "on" : ""}" onclick="setGF('${k}')">${t}</button>`).join("")}</span></div>` : "";
  return `${bar}<div id="glist">${groupsHtml() || noMatch(tr("No groups match"))}</div>`;
}

/* ================= 7. KOMANDA STATİSTİKASI ================= */
function teamStats(g) {
  const m = mem(g.id), sum = m.reduce((a, x) => a + x.points, 0), avg = m.length ? Math.round(sum / m.length * 10) / 10 : 0;
  const rk = visG().map(x => ({ id: x.id, v: teamPts(x) })).sort((a, b) => b.v - a.v), pos = rk.findIndex(x => x.id === g.id) + 1;
  return `<div class="stat tstat"><div><b>${sum}</b><span class="mu">${tr("Team points")}</span></div><div><b>${avg}</b><span class="mu">${tr("Average")}</span></div><div><b>${pos || "—"}/${rk.length}</b><span class="mu">${tr("Team rank")}</span></div></div>`;
}

/* ================= 8. ŞƏKİL BÖYÜDÜCÜ ================= */
function openImg(src) {
  closeImg();
  const o = document.createElement("div"); o.id = "lb"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true");
  o.onclick = e => { if (e.target === o || e.target.classList.contains("lbx")) closeImg(); };
  const im = document.createElement("img"); im.src = src; im.alt = "";
  const a = document.createElement("a"); a.href = src; a.target = "_blank"; a.rel = "noopener"; a.className = "lbdl"; a.textContent = "⬇ " + tr("Open original");
  const x = document.createElement("button"); x.className = "lbx s"; x.textContent = "✕"; x.setAttribute("aria-label", tr("Close"));
  o.append(im, a, x); document.body.appendChild(o);
}
function closeImg() { const o = $("#lb"); if (o) o.remove(); }

/* ================= 9. ÇAT ================= */
let stickBottom = false;                       // mesaj göndərəndə çatı aşağı sürüşdürür
let ENTER = { ch: null, id: 0, fresh: false }; // çata girəndə axırıncı oxunmuş mesajın nömrəsi (oxunmamış xətti üçün)
let CHQ = "";                                  // çat siyahısındakı axtarış

// --- @qeydlər ---
const myFirst = () => { const u = ME(); return u ? fold(u.name.split(" ")[0]) : ""; };
const cleanTag = n => n.replace(/[.-]+$/, "");
// Artıq təmizlənmiş (esc edilmiş) mətndə @ad işarələrini rəngləyir
function mentions(h) {
  const me = myFirst();
  return h.replace(/(^|\s)@([\p{L}\d_.-]{2,30})/gu, (m, a, n) => { const c = cleanTag(n), rest = n.slice(c.length);
    return c.length < 2 ? m : a + `<span class="mention${fold(c) === me ? " me" : ""}">@${c}</span>` + rest; });
}
const mentionsMe = m => !!m && !!m.body && (m.body.match(/(^|\s)@[\p{L}\d_.-]{2,30}/gu) || []).some(t => fold(cleanTag(t.trim().slice(1))) === myFirst());

// --- Qaralama: yarımçıq yazılan mesaj çatdan çıxanda itmir ---
const draftKey = c => "draft:" + uid + ":" + c;
function draftSave(v) { if (!conv || !uid) return; try { if (v) localStorage.setItem(draftKey(conv), v); else localStorage.removeItem(draftKey(conv)); } catch (e) {} }
function draftGet(c) { try { return localStorage.getItem(draftKey(c)) || ""; } catch (e) { return ""; } }
addEventListener("input", e => { const t = e.target; if (t && t.id === "tx" && typeof EDT !== "undefined" && !EDT) draftSave(t.value); }, true);

// --- Aşağı düyməsi ---
function toBottom() { const m = $("#msgs"); if (m) m.scrollTop = m.scrollHeight; }
function updToBot() {
  const m = $("#msgs"), b = $("#tobot"); if (!b) return;
  b.classList.toggle("show", !!m && m.scrollHeight - m.scrollTop - m.clientHeight > 140);
}
addEventListener("scroll", e => { if (e.target && e.target.id === "msgs") updToBot(); }, true);

// --- Oxunmamış mesajlar xətti ---
// render() hər dəfə çağırır: çat yeni açılıbsa, "axırıncı oxunan" nöqtəsini yadda saxlayır
function trackEnter() {
  const vc = typeof visibleConv === "function" ? visibleConv() : null;
  if (!vc) { ENTER.ch = null; return; }
  if (ENTER.ch !== vc) ENTER = { ch: vc, id: SEEN[vc] || 0, fresh: true };
}

// --- Çat siyahısında axtarış ---
function chSearch(v) { CHQ = v; const e = $("#cllist"); if (e) e.innerHTML = chatRows(); }

/* ================= 10. BAĞLANTI XƏBƏRDARLIĞI ================= */
function netBanner() {
  let b = $("#offl");
  if (navigator.onLine === false) {
    if (!b) { b = document.createElement("div"); b.id = "offl"; b.setAttribute("role", "status"); document.body.appendChild(b); }
    b.textContent = "📡 " + tr("You are offline. Changes will not be saved.");
  } else if (b) b.remove();
}
addEventListener("offline", netBanner);
addEventListener("online", () => { netBanner(); if (screen === "app") toast(tr("Back online ✓")); if (typeof ready !== "undefined" && ready && uid) refresh(true); });
netBanner();

/* ================= 11. TELEFON ÜÇÜN ALT MENYU ================= */
function tabbar() {
  if (sheet && sp === "chat" && conv) return "";   // çat açıqdırsa yazı sahəsinə yer qalsın
  const active = !sheet || !sp ? "home" : ["groups", "chat", "req"].includes(sp) ? sp : "menu";
  const T = [["home", ic("home"), tr("Home"), ""], ["groups", ic("groups"), tr("Groups"), ""], ["chat", ic("chat"), tr("Chat"), ub(totalUnread())], ["req", ic("inbox"), tr("Requests"), ub(inboxCount())], ["menu", ic("menu"), tr("Menu"), ub(unreadNotes())]];
  return `<nav id="tabbar" aria-label="${tr("Menu")}">${T.map(([k, i, t, b]) => `<button class="tb${active === k ? " on" : ""}" onclick="${k === "menu" ? "menuOpen=true;render()" : `goTab('${k}')`}"><span class="ti">${i}${b}</span><span class="tl">${t}</span></button>`).join("")}</nav>`;
}
// Klaviatura açılanda alt menyunu gizlədir
addEventListener("focusin", e => { if (isFieldEl(e.target)) document.documentElement.classList.add("kbd"); });
addEventListener("focusout", () => setTimeout(() => { if (!isFieldEl(document.activeElement)) document.documentElement.classList.remove("kbd"); }, 60));

/* ================= 12. ÜMUMİ AXTARIŞ PANELİ (Ctrl+K) ================= */
let palOpen = false, palSel = 0, palItems = [];
// Axtarışa uyğun nəticələri qurur: səhifələr, şəxslər, qruplar, əməliyyatlar
function palBuild(q) {
  const f = fold(q.trim()), u = ME(), out = [];
  const hit = (...a) => !f || a.some(s => fold(s).includes(f));
  [["home", ic("home"), tr("Home")], ["groups", ic("groups"), tr("Groups")], ["chat", ic("chat"), tr("Chat")], ["req", ic("inbox"), tr("Requests & idle")], ["notes", ic("bell"), tr("Notifications")], ["tools", ic("tools"), tr("Tools")], ["settings", ic("settings"), tr("Settings")]]
    .forEach(([k, i, t]) => { if (hit(t)) out.push({ sec: tr("Pages"), i, t, run: () => goTab(k) }); });
  if (f) {
    Object.values(P).filter(p => p.id !== uid && (p.is_admin || p.role === "teacher" || sameClass(p)) && hit(p.name)).slice(0, 6)
      .forEach(p => out.push({ sec: tr("People"), i: ic("user"), t: p.name, s: p.group_id !== null ? gname(p.group_id) : (isStudentP(p) ? tr("idle") : tr("teacher")), run: () => showProfile(p.id) }));
    visG().filter(g => hit(g.name)).slice(0, 4)
      .forEach(g => out.push({ sec: tr("Groups"), i: ic("groups"), t: g.name, s: mem(g.id).length + "/" + g.capacity, run: () => goTab("groups", g.id) }));
  }
  const acts = [
    [ic("half"), tr("Toggle theme"), () => cycleTheme()],
    [muted ? ic("sound") : ic("soundOff"), muted ? tr("Sounds on") : tr("Sounds off"), () => toggleMute()],
    [ic("globe"), LANG === "az" ? "English" : "Azərbaycanca", () => setLang(LANG === "az" ? "en" : "az")]
  ];
  if (isStaff(u) && CLS.length > 1) acts.push(["⇄", tr("Switch class"), () => leaveClass()]);
  if (can("panel")) acts.push([ic("wrench"), tr("Admin panel"), () => window.open("admin/", "_blank")]);
  acts.push([ic("logout"), tr("Log out"), () => confirmLogout()]);
  acts.forEach(([i, t, run]) => { if (hit(t)) out.push({ sec: tr("Actions"), i, t, run }); });
  return out;
}
function palDraw() {
  const L = $("#pall"); if (!L) return;
  if (!palItems.length) { L.innerHTML = noMatch(tr("No results")); return; }
  let last = "", h = "";
  palItems.forEach((it, i) => {
    if (it.sec !== last) { last = it.sec; h += `<div class="palsec">${esc(it.sec)}</div>`; }
    h += `<div class="palrow${i === palSel ? " on" : ""}" data-i="${i}" role="option" onmousemove="palHover(${i})" onclick="palRun(${i})"><span class="pali">${it.i}</span><span class="palt">${esc(it.t)}</span>${it.s ? `<small class="mu">${esc(it.s)}</small>` : ""}</div>`;
  });
  L.innerHTML = h;
  const on = L.querySelector(".palrow.on"); if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest" });
}
function palFilter(v) { palItems = palBuild(v); palSel = 0; palDraw(); }
function palHover(i) { if (palSel === i) return; palSel = i; document.querySelectorAll("#pall .palrow").forEach((r, k) => r.classList.toggle("on", k === i)); }
function palRun(i) { const it = palItems[i]; closePal(); if (it) setTimeout(it.run, 0); }
function palKey(e) {
  if (e.key === "ArrowDown") { e.preventDefault(); if (palItems.length) { palSel = (palSel + 1) % palItems.length; palDraw(); } }
  else if (e.key === "ArrowUp") { e.preventDefault(); if (palItems.length) { palSel = (palSel - 1 + palItems.length) % palItems.length; palDraw(); } }
  else if (e.key === "Enter") { e.preventDefault(); palRun(palSel); }
}
function openPalette() {
  if (screen !== "app" || !ME() || palOpen) return;
  palOpen = true; menuOpen = false; palItems = palBuild(""); palSel = 0;
  const o = document.createElement("div"); o.id = "pal";
  o.onclick = e => { if (e.target === o) closePal(); };
  o.innerHTML = `<div class="palbox" role="dialog" aria-modal="true"><div class="palin"><span>${ic("search")}</span><input id="palq" autocomplete="off" spellcheck="false" placeholder="${tr("Search people, groups, pages…")}" oninput="palFilter(this.value)" onkeydown="palKey(event)"><kbd>Esc</kbd></div><div id="pall" role="listbox"></div><div class="palhint mu">↑ ↓ · Enter · Esc</div></div>`;
  document.body.appendChild(o); palDraw();
  const i = $("#palq"); if (i) i.focus();
}
function closePal() { palOpen = false; const o = $("#pal"); if (o) o.remove(); }

/* ================= 13. ALƏTLƏR: TƏQDİMAT TAYMERİ VƏ TƏSADÜFİ SEÇİM ================= */
/* ---- Taymer ---- */
let TM = { dur: 300, left: 300, end: 0, run: false, done: false, iv: null }, wakeLock = null;
const TM_C = 553;                                                   // halqanın uzunluğu (2·π·88)
const tmLeft = () => TM.run ? Math.max(0, Math.ceil((TM.end - Date.now()) / 1000)) : TM.left;
const tmState = l => TM.done ? "end" : l <= 10 && (TM.run || l < TM.dur) ? "crit" : l <= 60 && (TM.run || l < TM.dur) ? "warn" : "";
async function wakeOn() { try { if (navigator.wakeLock && !wakeLock) { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => { wakeLock = null; }); } } catch (e) {} }
function wakeOff() { try { if (wakeLock) wakeLock.release(); } catch (e) {} wakeLock = null; }
function tmSet(sec) { if (TM.run) return; TM.dur = TM.left = Math.max(60, Math.min(5940, sec)); TM.done = false; render(); }
function tmStart() {
  if (TM.run) return;
  if (TM.done || TM.left <= 0) { TM.left = TM.dur; TM.done = false; }
  TM.end = Date.now() + TM.left * 1000; TM.run = true;
  clearInterval(TM.iv); TM.iv = setInterval(tmTick, 250); wakeOn(); snd.pop(); render();
}
function tmPause() { if (!TM.run) return; TM.left = tmLeft(); TM.run = false; clearInterval(TM.iv); TM.iv = null; wakeOff(); render(); }
function tmReset() { clearInterval(TM.iv); TM.iv = null; TM.run = false; TM.done = false; TM.left = TM.dur; wakeOff(); render(); }
function tmFinish() {
  clearInterval(TM.iv); TM.iv = null; TM.run = false; TM.left = 0; TM.done = true; wakeOff();
  snd.alert(); setTimeout(snd.alert, 500); setTimeout(snd.alert, 1000);
  try { if (navigator.vibrate) navigator.vibrate([300, 150, 300]); } catch (e) {}
  notify("⏱ " + tr("Time's up!"), "", null, "alert"); render();
}
// Hər 250 ms: yalnız rəqəm və halqanı yeniləyir (bütün səhifəni yox)
function tmUpd() {
  const l = tmLeft(), d = $("#tmDisp"), r = $("#tmRing"), b = $("#tmBox");
  if (d) d.textContent = mmss(l);
  if (r) r.style.strokeDashoffset = (TM_C * (1 - (TM.dur ? l / TM.dur : 0))).toFixed(1);
  if (b) b.className = "tmbox " + tmState(l);
  tmPill();
}
function tmTick() { if (!TM.run) return; if (tmLeft() <= 0) tmFinish(); else tmUpd(); }
// Başqa səhifədə olanda yuxarıda kiçik taymer nişanı
function tmPill() {
  let p = $("#tpill");
  const started = TM.run || (!TM.done && TM.left > 0 && TM.left < TM.dur), onTools = phone() ? (sheet && sp === "tools") : tab === "tools";
  if (!(started && screen === "app" && !onTools)) { if (p) p.remove(); return; }
  if (!p) { p = document.createElement("button"); p.id = "tpill"; p.className = "tpill"; p.onclick = () => goTab("tools"); document.body.appendChild(p); }
  p.innerHTML = ic("clock")+" "+mmss(tmLeft());
  p.classList.toggle("crit", tmLeft() <= 10);
}
function timerCard() {
  const l = tmLeft(), off = (TM_C * (1 - (TM.dur ? l / TM.dur : 0))).toFixed(1);
  return `<div class="card tmcard"><b>${ic("clock")} ${tr("Presentation timer")}</b>
   <div class="presets">${[3, 5, 7, 10, 15].map(m => `<button class="s${TM.dur === m * 60 ? " on" : ""}" ${TM.run ? "disabled" : ""} onclick="tmSet(${m * 60})">${tr("{n} min", { n: m })}</button>`).join("")}</div>
   <div id="tmBox" class="tmbox ${tmState(l)}"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="tmbg" cx="100" cy="100" r="88"/><circle id="tmRing" class="tmfg" cx="100" cy="100" r="88" transform="rotate(-90 100 100)" style="stroke-dasharray:${TM_C};stroke-dashoffset:${off}"/></svg>
    <div class="tmc"><div id="tmDisp" class="tmd" role="timer">${mmss(l)}</div><small class="mu">${TM.done ? ic("bell")+" "+tr("Time's up!") : TM.run ? tr("Timer running") : "&nbsp;"}</small></div></div>
   <div class="row tmbtns"><button class="s" ${TM.run ? "disabled" : ""} onclick="tmSet(TM.dur-60)" aria-label="−1 ${tr("min")}">−1</button>
    ${TM.run ? `<button onclick="tmPause()" style="flex:1">⏸ ${tr("Pause")}</button>` : `<button class="ok" onclick="tmStart()" style="flex:1">▶ ${TM.done ? tr("Restart") : TM.left < TM.dur ? tr("Resume") : tr("Start")}</button>`}
    <button class="s" onclick="tmReset()" title="${tr("Reset")}" aria-label="${tr("Reset")}">↺</button><button class="s" ${TM.run ? "disabled" : ""} onclick="tmSet(TM.dur+60)" aria-label="+1 ${tr("min")}">+1</button></div></div>`;
}

/* ---- Təsadüfi seçim ---- */
let PK = { src: null, win: null, shown: "", done: [], order: null, busy: false, skip: true };
// Seçim mənbəyi: "class" | "idle" | "g:<qrup nömrəsi>"
function pkSrc() {
  const u = ME(), s = PK.src;
  if (s === "class" || s === "idle") return s;
  if (s && s.startsWith("g:") && grp(+s.slice(2))) return s;
  return !isStaff(u) && u.group_id !== null ? "g:" + u.group_id : "class";
}
function pkPool() {
  const s = pkSrc();
  return s === "idle" ? idle() : s.startsWith("g:") ? mem(+s.slice(2)) : ppl();
}
const pkSet = v => { PK.src = v; PK.win = null; PK.order = null; PK.shown = ""; PK.done = []; render(); };
const pkSkip = v => { PK.skip = !!v; render(); };
function pkReset() { PK.win = null; PK.order = null; PK.shown = ""; PK.done = []; render(); }
// Adları sürətlə dəyişdirib sonda birini seçir
function pkRoll() {
  if (PK.busy) return;
  const pool = pkPool();
  if (!pool.length) { toast(tr("Nobody to pick from"), 1); snd.err(); return; }
  const cand = PK.skip ? pool.filter(p => !PK.done.includes(p.id)) : pool;
  if (!cand.length) { toast(tr("Everyone has been picked. Press Reset to start again."), 1); snd.err(); return; }
  PK.busy = true; PK.order = null; PK.win = null;
  const final = cand[Math.floor(Math.random() * cand.length)]; let n = 0;
  const step = () => {
    n++;
    if (n < 18) {
      PK.shown = pool[Math.floor(Math.random() * pool.length)].name;
      const e = $("#pkname"); if (e) e.textContent = PK.shown;
      snd.click(); setTimeout(step, 55 + n * 9);
    } else {
      PK.shown = final.name; PK.win = final.id; if (!PK.done.includes(final.id)) PK.done.push(final.id);
      PK.busy = false; snd.ok(); party(); render();
    }
  };
  render(); step();
}
// Çıxış sırasını təsadüfi qarışdırır
function pkOrder() {
  if (PK.busy) return;
  const pool = pkPool().slice();
  if (!pool.length) { toast(tr("Nobody to pick from"), 1); snd.err(); return; }
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  PK.order = pool.map(p => p.id); PK.win = null; PK.shown = ""; snd.ok(); render();
}
function pkCopy() {
  const t = (PK.order || []).filter(id => P[id]).map((id, i) => (i + 1) + ". " + P[id].name).join("\n");
  try { navigator.clipboard.writeText(t).then(() => toast(tr("Copied")), () => {}); } catch (e) {}
}
function pickerCard() {
  const u = ME(), s = pkSrc(), pool = pkPool(), w = PK.win && P[PK.win];
  const opts = [["class", tr("Whole class")], ["idle", tr("Idle")]].concat(visG().map(g => ["g:" + g.id, g.name + (!isStaff(u) && u.group_id === g.id ? " (" + tr("my group") + ")" : "")]));
  const left = PK.skip ? pool.filter(p => !PK.done.includes(p.id)).length : pool.length;
  return `<div class="card pkcard"><b>${ic("dice")} ${tr("Random picker")}</b>
   <div class="row" style="margin-top:8px"><select id="pksrc" style="flex:1;min-width:0" ${PK.busy ? "disabled" : ""} onchange="pkSet(this.value)">${opts.map(([v, t]) => `<option value="${esc(v)}" ${v === s ? "selected" : ""}>${esc(t)}</option>`).join("")}</select><span class="chip">${pool.length} ${ic("user")}</span></div>
   <div class="pkshow${w ? " win" : ""}${PK.busy ? " roll" : ""}">${w ? av(w, "huge") : '<span class="pkq">'+ic("dice")+'</span>'}<div id="pkname" class="pkname">${esc(PK.shown || tr("Who presents?"))}</div></div>
   <div class="row"><button class="ok" style="flex:1" ${PK.busy ? "disabled" : ""} onclick="pkRoll()">${ic("target")} ${tr("Pick someone")}</button><button class="s" style="flex:1" ${PK.busy ? "disabled" : ""} onclick="pkOrder()">${ic("shuffle")} ${tr("Speaking order")}</button></div>
   <label class="pkopt"><input type="checkbox" ${PK.skip ? "checked" : ""} onchange="pkSkip(this.checked)"> ${tr("Skip people already picked")} <span class="mu">${PK.done.length ? "· " + tr("{n} left", { n: left }) : ""}</span></label>
   ${PK.done.length || PK.order || PK.win ? `<button class="s" style="width:100%" onclick="pkReset()">↺ ${tr("Reset")}</button>` : ""}
   ${PK.order ? `<div class="pkord"><div class="row sp"><b>${tr("Speaking order")}</b><button class="s" onclick="pkCopy()">${ic("copy")} ${tr("Copy")}</button></div>${PK.order.filter(id => P[id]).map((id, i) => `<div class="li" onclick="showProfile('${id}')"><span class="ordn">${i + 1}</span>${av(P[id])}<div class="g">${esc(P[id].name)}</div></div>`).join("")}</div>` : ""}</div>`;
}
const toolsPage = () => `<div class="grid2 toolsg">${timerCard()}${pickerCard()}</div>`;

/* ================= 14. KLAVİATURA QISAYOLLARI ================= */
// Esc: ən üstdəki pəncərəni bağlayır. Bir şey bağlandısa true qaytarır
function escClose() {
  if (palOpen) { closePal(); return true; }
  if ($("#lb")) { closeImg(); return true; }
  if ($("#mm")) { msgMenuClose(); return true; }
  if (typeof apOn !== "undefined" && apOn) { apClose(); return true; }
  if ($("#cam")) { camClose(); return true; }
  if (pm) { closeProfile(); return true; }
  const m = $("#modal"); if (m && m.innerHTML) { closeM(); return true; }
  if (menuOpen) { goBack(); return true; }
  return false;
}
addEventListener("keydown", e => {
  if (e.key === "Escape") { if (escClose()) e.preventDefault(); return; }
  if (screen !== "app" || !ME()) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && (e.key === "k" || e.key === "K")) { e.preventDefault(); palOpen ? closePal() : openPalette(); return; }
  if (e.key === "/" && !mod && !e.altKey && !isFieldEl(e.target) && !palOpen) { e.preventDefault(); openPalette(); }
});

/* ================= 15. HƏR RENDER-DƏN SONRA ================= */
// render() sonunda çağırılır: çat qaralaması, oxunmamış xəttinə sürüşmə, aşağı düyməsi, taymer nişanı
function afterRender() {
  try {
    const t = $("#tx");
    if (t && conv && !t.value && t.dataset.dr !== conv) {
      t.dataset.dr = conv;
      const d = draftGet(conv);
      if (d && !(typeof EDT !== "undefined" && EDT)) t.value = d;
    }
    if (ENTER.fresh && ENTER.ch === conv) {
      const m = $("#msgs"), d = m && m.querySelector(".usep");
      if (m && $("#tx")) {
        ENTER.fresh = false;
        if (d) m.scrollTo({ top: Math.max(0, m.scrollTop + d.getBoundingClientRect().top - m.getBoundingClientRect().top - 36), behavior: "auto" });
      }
    }
    updToBot(); tmPill();
  } catch (e) {}
}
