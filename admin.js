/* =====================================================================
   admin.js  -  ADIAK Team Maker admin paneli
   Bölmələr:  1 Köməkçilər · 2 Giriş · 3 Məlumat · 4 Ümumi görünüş · 5 Dashboard · 6 İnsanlar
              7 Qruplar · 8 Çatlar · 9 Parollar · 10 Gün sonu / İdxal / Ayarlar · 11 Başlanğıc
   Hər əməliyyat bazada ayrıca yetki ilə qorunur: bu fayl yalnız lazım olan düymələri göstərir.
   ===================================================================== */

/* ---------- 1. KÖMƏKÇİLƏR ---------- */
const $=s=>document.querySelector(s);
// HTML-ə təhlükəsiz mətn yazmaq üçün
const _esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
// Məlumat gizli işarələrlə əhatə olunur ki, tərcümə mühərriki ona toxunmasın (i18n-admin.js bu işarələri silir)
const esc=s=>"\u0001"+_esc(s)+"\u0002";
// Vəziyyət: sb=Supabase, ME=giriş etmiş adam, P=insanlar, G=qruplar, M=mesajlar, AR=arxivlər, PW=parol siyahısı
let sb=null,uid=null,ME=null,P=[],G=[],M=[],AR=[],PW=[],SET={max_groups:"6"},online=new Set(),chan=null;
let tab="dash",pf="all",pq="",chSel="all",pwq="",pwFilter="all",pwShown=new Set(),pwAll=false,impText="",dayLabel="",dayDis=false,npRole="student";
let pressing=false,pressTs=0,pendingDraw=false,lastSig="",tm=null,tt=null;

// Yetki siyahısı: açarlar bazadakı perms ilə eynidir
const PERMS=[
 {k:"points",i:"⭐",t:"Give points",d:"Add or remove points for students."},
 {k:"groups",i:"👥",t:"Manage groups",d:"Put students into groups, move or remove them, edit groups."},
 {k:"chats",i:"💬",t:"Moderate chats",d:"Read every chat and delete messages or whole chats."},
 {k:"passwords",i:"🔑",t:"See & reset passwords",d:"See students' passwords and make new temporary ones. Never admins'."},
 {k:"panel",i:"🖥️",t:"Open this admin panel",d:"Enter the panel. Each tab still needs its own permission."},
 {k:"admin",i:"🛡️",t:"Full admin",d:"Everything, including permissions, import, closing the day and settings."}];

// Mənim bu yetkim varmı? (admin hər şeyi edə bilər)
const has=p=>!!ME&&(ME.is_admin||(ME.perms||[]).includes("admin")||(ME.perms||[]).includes(p));
const isAdm=p=>!!p&&(p.is_admin||(p.perms||[]).includes("admin"));
// Rol açarı: host / admin / teacher / student
const roleKey=p=>p.is_admin?"host":isAdm(p)?"admin":p.role==="teacher"?"teacher":"student";
const ROLE_LABEL={host:"Host",admin:"🛡 Admin",teacher:"👩‍🏫 Teacher",student:"🎓 Student"};
const roleChip=p=>`<span class="chip ${roleKey(p)}">${ROLE_LABEL[roleKey(p)]}</span>`;
// Adamın yetkilərini kiçik nişanlarla göstərir
const permChips=p=>isAdm(p)?`<span class="chip">Full access</span>`:PERMS.filter(x=>(p.perms||[]).includes(x.k)).map(x=>`<span class="chip" title="${esc(tr(x.t))}">${x.i} ${esc(tr(x.t).split(" ")[0])}</span>`).join("");
const nm=id=>{const p=P.find(x=>x.id===id);return p?p.name:"?"};
const short=l=>String(l||"").replace("@classroom.app","");
const gname=id=>{const g=G.find(x=>x.id===id);return g?g.name:"—"};
const maxG=()=>+SET.max_groups||6;
const val=i=>$("#"+i).value;
const isStudent=p=>!p.is_admin&&p.role!=="teacher";
// Avatar: şəkil və ya rəngli baş hərf
const avatar=(p,lg)=>{let h=0;for(const c of p.name)h=(h*31+c.charCodeAt(0))%360;return`<div class="av${lg?" lg":""}" style="background:hsl(${h},55%,48%)">${p.avatar?`<img src="${esc(p.avatar)}" alt="">`:esc(p.name[0].toUpperCase())}${online.has(p.id)?"<i></i>":""}</div>`};
// Ekranın altında qısa xəbər
function toast(m,bad){const t=$("#toast");t.textContent=admToast(m);t.className="show"+(bad?" bad":"");clearTimeout(tt);tt=setTimeout(()=>{t.className=""},3600)}
// Pəncərə açır / bağlayır
const modal=(h,small)=>{$("#modal").innerHTML=`<div class="ov" onclick="if(event.target===this)closeM()"><div class="sheet${small?" sm":""}">${h}</div></div>`};
const closeM=()=>{$("#modal").innerHTML=""};
// Təsdiq pəncərəsi
function confirmBox(t,fn,label){modal(`<div class="sheet-h"><h3 style="margin:0">Are you sure?</h3></div><div class="sheet-b"><p>${t}</p><div class="row" style="margin-top:16px"><button class="s" onclick="closeM()">Cancel</button><button class="d" id="yes">${label||"Yes, do it"}</button></div></div>`,true);$("#yes").onclick=()=>{closeM();fn()}}
function copy(t){try{navigator.clipboard.writeText(t);toast("Copied ✓")}catch(e){toast("Select and copy it by hand",1)}}
// Bazadakı funksiyanı çağırır; uğurlu olsa məlumatı yeniləyir. Xəta olsa qırmızı xəbər göstərir.
async function call(fn,args,ok){const {data,error}=await sb.rpc(fn,args);if(error){toast(error.message,1);return null}if(ok)toast(ok);await load();return data==null?true:data}

/* ---------- 2. GİRİŞ ---------- */
const normId=v=>{v=String(v||"").trim().toLowerCase();return v.includes("@")?v:v+"@classroom.app"};
function loginView(msg){$("#root").innerHTML=`<div class="panel login">${admLang()}<div style="font-size:38px">🛠️</div><h2>ADIAK Admin</h2><p class="mu">Sign in with an account that has panel access.</p><label class="l">ID</label><input id="li" placeholder="for example ali.m" autocapitalize="none" autocomplete="username"><label class="l">Password</label><input id="lp" type="password" autocomplete="current-password" onkeydown="if(event.key==='Enter')doLogin()"><div class="err">${esc(msg||"")}</div><button style="width:100%" onclick="doLogin()">Sign in</button></div>`}
async function doLogin(){const {data,error}=await sb.auth.signInWithPassword({email:normId(val("li")),password:val("lp")});if(error){loginView(tr("Wrong ID or password"));return}uid=data.user.id;await enter()}
function noAccess(){$("#root").innerHTML=`<div class="panel login">${admLang()}<div style="font-size:38px">🔒</div><h2>No access</h2><p class="mu">This account is not allowed to open the admin panel. An admin can allow it in People → Permissions.</p><div class="row"><button class="s" onclick="signOut()">Sign out</button><a href="index.html"><button>Student site</button></a></div></div>`}
async function signOut(){if(chan){try{await sb.removeChannel(chan)}catch(e){}chan=null}try{await sb.auth.signOut({scope:"local"})}catch(e){}uid=null;ME=null;loginView()}
// Giriş etmiş adamın profilini oxuyur; "panel" yetkisi yoxdursa içəri buraxmır
async function enter(){const r=await sb.from("profiles").select("*").eq("id",uid).single();ME=r.data;if(!ME||!has("panel")){noAccess();return}await load();subscribe()}
// Real vaxt: bazada dəyişiklik olanda avtomatik yenilənir
const LOADT=["profiles","groups","app_settings","messages","archives","archived_messages","password_vault"];let pendT=new Set();
function subscribe(){if(chan)return;chan=sb.channel("room")
 .on("postgres_changes",{event:"*",schema:"public"},ev=>{if(!LOADT.includes(ev.table))return;pendT.add(ev.table);clearTimeout(tm);tm=setTimeout(()=>{const ts=[...pendT];pendT=new Set();load(ts)},300)})
 .on("presence",{event:"sync"},()=>{const o=Object.keys(chan.presenceState()).sort().join();if(o!==[...online].sort().join()){online=new Set(Object.keys(chan.presenceState()));draw()}}).subscribe()}

/* ---------- 3. MƏLUMAT ---------- */
// Bazadan lazım olan hər şeyi yükləyir. Məlumat dəyişməyibsə səhifəni yenidən çəkmir (klik itməsin).
async function load(tables){
 const all=!tables||!tables.length,w=t=>all||tables.includes(t);
 const none=Promise.resolve({data:null});
 const [p,g,s,m,a,pw]=await Promise.all([w("profiles")?sb.from("profiles").select("*").order("name"):none,w("groups")?sb.from("groups").select("*").order("id"):none,w("app_settings")?sb.from("app_settings").select("*"):none,
  has("chats")&&w("messages")?sb.from("messages").select("*").order("id",{ascending:false}).limit(800):none,
  (has("chats")||has("admin"))&&w("archives")?sb.from("archives").select("*").order("id",{ascending:false}):none,
  tab==="pass"&&has("passwords")&&(all||w("profiles")||w("password_vault"))?sb.rpc("admin_list_passwords"):none]);
 if(p.error){toast(p.error.message,1);return}
 if(p.data)P=p.data;if(g.data)G=g.data;(s.data||[]).forEach(x=>{SET[x.key]=x.value});if(m.data)M=[...m.data].reverse();if(a.data)AR=a.data;if(pw.data)PW=pw.data;ME=P.find(x=>x.id===uid)||ME;if(all||tables.includes("profiles"))await loadCls();
 if(tab==="day"&&(all||w("archives")||w("archived_messages")))for(const x of AR){try{const r=await sb.from("archived_messages").select("id",{count:"exact",head:true}).eq("archive_id",x.id);x.n=r.count||0}catch(e){x.n=0}}
 const sig=JSON.stringify([P.map(x=>[x.id,x.name,x.points,x.group_id,x.login,x.role,(x.perms||[]).join(),x.is_admin,x.pw_updated_at]),G.map(x=>[x.id,x.name,x.capacity,x.host_id]),M.length,M.length?M[M.length-1].id:0,AR.map(x=>[x.id,x.n]),SET.max_groups,JSON.stringify([TG,UT,SC,CS,P.map(x=>x.class_tag)]),PW.map(x=>[x.user_id,x.source,x.updated_at])]);
 if(sig!==lastSig){lastSig=sig;draw()}
}

/* ---------- 4. ÜMUMİ GÖRÜNÜŞ ---------- */
// Hər tab üçün lazım olan yetki
const TABS=[["dash","📊","Dashboard","panel"],["people","👥","People","panel"],["groups","🧩","Groups","panel"],["classes","🏫","Classes","classes"],["tags","🏷️","Tags","tags"],["chats","💬","Chats","chats"],["pass","🔑","Passwords","passwords"],["day","🗂️","Close the day","admin"],["import","📥","Import names","admin"],["settings","⚙️","Settings","admin"]];
const visibleTabs=()=>isStar()?[{k:"classes",i:"🏫",t:"My classes"}]:TABS.filter(t=>(t[3]==="classes"||t[3]==="tags")?has("admin"):has(t[3])).map(t=>({k:t[0],i:t[1],t:t[2]}));
const switchTab=k=>{tab=k;if(k==="pass"||k==="day")lastSig="";draw();if(k==="pass"||k==="day")load()};
// Yan menyu + seçilmiş səhifə. Düymə basılarkən gözləyir ki, klik itməsin.
function draw(){if(!ME)return;if(pressing&&Date.now()-pressTs<2500){pendingDraw=true;return}if(typingNow()){pendingDraw=true;return}pendingDraw=false;
 const sy=window.scrollY,mn=$(".main"),ms=mn?mn.scrollTop:0;
 const tabs=visibleTabs();if(!tabs.find(t=>t.k===tab))tab=tabs[0].k;
 const page={dash,people,groups,chats,pass:passPage,day,import:imp,settings,classes:clsPage,tags:tagPage}[tab]();
 $("#root").innerHTML=`<div class="app"><aside class="side"><div class="brand"><div class="logo">🛠️</div><div><b>ADIAK Admin</b><small>Team Maker control panel</small></div></div>
  <nav class="nav">${tabs.map(t=>`<button class="${tab===t.k?"on":""}" onclick="switchTab('${t.k}')"><span class="i">${t.i}</span>${t.t}</button>`).join("")}</nav>
  ${admLang()}<div class="me"><div class="row">${avatar(ME)}<div class="grow"><b>${esc(ME.name)}</b><div style="margin-top:3px">${roleChip(ME)}</div></div></div><button onclick="signOut()">Sign out</button><a href="index.html">← Student site</a></div></aside>
  <main class="main">${page}</main></div>`;
 if(tab==="chats"){const m=$("#mlist");if(m)m.scrollTop=m.scrollHeight}
 try{window.scrollTo(0,sy);const m2=$(".main");if(m2)m2.scrollTop=ms}catch(e){}}
// Dil dəyişəndə cari ekranı yenidən çəkir
function adminRerender(){if(!uid){loginView();return}if(ME&&has("panel"))draw();else if(ME)noAccess();else loginView()}
const head=(t,s,right)=>`<div class="page-h"><div><h1>${t}</h1><p>${s}</p></div><div class="row wrap">${right||""}</div></div>`;
const empty=(e,t)=>`<div class="empty"><span class="e">${e}</span>${t}</div>`;

/* ---------- 5. DASHBOARD ---------- */
function dash(){const st=P.filter(isStudent),te=P.filter(p=>p.role==="teacher"),idle=st.filter(p=>p.group_id==null),staff=P.filter(p=>isAdm(p)||(p.perms||[]).length||p.role==="teacher");
 const stat=(i,n,l)=>`<div class="stat"><div class="ico">${i}</div><div><b>${n}</b><span>${l}</span></div></div>`;
 const last=M.filter(m=>m.sender).slice(-6).reverse();
 return head("Dashboard","Welcome, "+esc(ME.name)+". Here is what is happening right now.")+
 `<div class="stats">${stat("🎓",st.length,"students")}${stat("👩‍🏫",te.length,"teachers")}${stat("🧩",G.length+" / "+maxG(),"groups")}${stat("🕓",idle.length,"idle students")}${stat("🟢",online.size,"online now")}${has("chats")?stat("💬",M.length,"messages"):stat("🛡️",P.filter(isAdm).length,"admins")}</div>
 <div class="panel"><h3>Team &amp; permissions</h3><p class="hint">Who can do what. Open a person to change it with the switches.</p>
  <div class="plist">${staff.map(p=>`<div class="pc" onclick="person('${p.id}')">${avatar(p)}<div class="grow"><b>${esc(p.name)}</b><div class="chips">${roleChip(p)}${permChips(p)}</div></div></div>`).join("")||empty("👥","No staff yet")}</div></div>
 <div class="panel"><h3>Quick actions</h3><p class="hint">Shortcuts to the things you do most.</p><div class="row wrap">
  ${has("panel")?`<button onclick="switchTab('people')">👥 People</button>`:""}${has("admin")?`<button onclick="switchTab('import')">📥 Import names</button><button class="s" onclick="switchTab('day')">🗂️ Close the day</button>`:""}${has("passwords")?`<button class="s" onclick="switchTab('pass')">🔑 Passwords</button>`:""}${has("admin")?`<button class="s" onclick="addPerson()">➕ Add person</button><button class="s" onclick="switchTab('classes')">🏫 Classes</button>`:""}</div></div>
 ${has("chats")?`<div class="panel"><h3>Latest messages</h3>${last.map(m=>`<div class="msg"><div><b>${esc(nm(m.sender))}</b> <small>${esc(title(m.channel))}</small><br>${esc(m.body||"📎 "+(m.file_name||"file"))}</div></div>`).join("")||empty("💬","No messages yet")}</div>`:""}`}

/* ---------- 6. İNSANLAR ---------- */
const PF=[["all","All"],["students","Students"],["teachers","Teachers"],["admins","Admins"],["idle","Idle"]];
// Filtr + axtarış
function match(p){const q=pq.trim().toLowerCase();if(q&&!p.name.toLowerCase().includes(q)&&!short(p.login).includes(q)&&!(p.class_tag||"").includes(q))return false;
 return pf==="all"||(pf==="students"&&isStudent(p))||(pf==="teachers"&&p.role==="teacher")||(pf==="admins"&&isAdm(p))||(pf==="idle"&&isStudent(p)&&p.group_id==null)}
const plist=()=>P.filter(match).map(p=>`<div class="pc" onclick="person('${p.id}')">${avatar(p)}<div class="grow"><b>${esc(p.name)}</b><span class="mono mu" style="font-size:13px">${esc(short(p.login))}</span><div class="chips">${roleChip(p)}${isStudent(p)&&p.group_id!=null?`<span class="chip">${esc(gname(p.group_id))}</span>`:isStudent(p)?'<span class="chip ok">idle</span>':""}${isStudent(p)?`<span class="chip${p.class_tag?"":" warn"}">${p.class_tag?esc(p.class_tag):"no class group"}</span>`:""}${permChips(p)}</div></div>${isStudent(p)?`<div class="pts">${p.points}</div>`:""}</div>`).join("")||empty("🔍","Nobody found");
function people(){return head("People",P.length+" accounts. Tap a person to manage them.",has("admin")?`<button onclick="addPerson()">➕ Add person</button>`:"")+
 `<div class="toolbar"><input placeholder="Search by name or ID…" value="${esc(pq)}" oninput="pq=this.value;$('#plist').innerHTML=plist()"><div class="seg">${PF.map(([k,t])=>`<button class="${pf===k?"on":""}" onclick="pf='${k}';draw()">${t}</button>`).join("")}</div></div><div class="plist" id="plist">${plist()}</div>`}

// Bir adamın bütün idarəsi: profil, xal, YETKİLƏR, parol, qrup, sessiya
function person(id){const p=P.find(x=>x.id===id);if(!p)return;const g=G.find(x=>x.id===p.group_id),adminViewer=has("admin"),pm=p.perms||[];
 const sec=(t,body,cls)=>`<div class="sec ${cls||""}"><h4>${t}</h4>${body}</div>`;
 const permBlock=p.is_admin?`<p class="mu" style="margin:0">The Host account always has every right.</p>`
  :adminViewer?`<p class="mu" style="margin:0 0 6px">Tick or untick to give or take a permission. It is saved at once.</p>
    ${PERMS.map(x=>`<label class="prow"><span class="pi">${x.i}</span><span class="pt"><b>${tr(x.t)}</b><small>${tr(x.d)}</small></span><span class="sw"><input type="checkbox" ${pm.includes(x.k)?"checked":""} onchange="togglePerm('${id}','${x.k}',this)"><i></i></span></label>`).join("")}
    <div class="row wrap" style="margin-top:10px"><button class="s sm" onclick="presetPerms('${id}',['points','groups'])">👩‍🏫 Teacher preset</button><button class="s sm" onclick="presetPerms('${id}',[])">Remove all</button></div>`
  :`<div class="row wrap">${isAdm(p)?'<span class="chip admin">🛡 Full admin</span>':PERMS.filter(x=>pm.includes(x.k)).map(x=>`<span class="chip">${x.i} ${tr(x.t)}</span>`).join("")||'<span class="mu">No special permissions.</span>'}</div><p class="mu" style="margin:8px 0 0;font-size:13px">Only admins can change permissions.</p>`;
 modal(`<div class="sheet-h"><div class="row">${avatar(p,true)}<div class="grow"><h3 style="margin:0">${esc(p.name)}</h3><span class="mono mu">${esc(short(p.login))}</span><div class="row wrap" style="margin-top:6px">${roleChip(p)}${isStudent(p)?(g?`<span class="chip">${esc(g.name)}</span>`:'<span class="chip ok">idle</span>'):""}</div></div><button class="s sm" onclick="closeM()">✕</button></div></div>
 <div class="sheet-b">
  ${adminViewer?sec("✏️ Profile",`<label class="l" style="margin-top:0">Name</label><div class="row"><input id="e_name" value="${esc(p.name)}" maxlength="30"><button onclick="saveName('${id}')">Save</button></div>
     <label class="l">ID (what they type to log in)</label><div class="row"><input id="e_id" value="${esc(short(p.login))}" autocapitalize="none"><button onclick="saveId('${id}')">Save</button></div>
     ${p.is_admin?"":`<label class="l">Role</label><div class="seg"><button class="${p.role!=="teacher"?"on":""}" onclick="setRole('${id}','student')">🎓 Student</button><button class="${p.role==="teacher"?"on":""}" onclick="setRole('${id}','teacher')">👩‍🏫 Teacher</button></div>`}`):""}
  ${has("points")&&isStudent(p)?sec("⭐ Points",`<div class="row" style="margin-bottom:8px"><b style="font-size:22px">${p.points}</b><span class="mu">points now</span></div><div class="row"><input id="e_pts" type="number" inputmode="numeric" placeholder="e.g. 8 (or -3)" onkeydown="if(event.key==='Enter')addPts('${id}')"><button class="ok" onclick="addPts('${id}')">Add points</button></div>`):""}
  ${has("groups")&&isStudent(p)?sec("🏷 Class group number",`<p class="mu" style="margin:0 0 8px">Students are asked for it at first login. Teams only contain students of the same class group. Leave empty to ask the student again.</p><div class="row"><input id="e_tag" value="${esc(p.class_tag||"")}" maxlength="12" placeholder="e.g. 636s" autocapitalize="none" onkeydown="if(event.key==='Enter')saveTag('${id}')"><button onclick="saveTag('${id}')">Save</button></div>${p.group_id!=null?`<p class="mu" style="margin:8px 0 0;font-size:13px">Remove the person from their team before changing the number.</p>`:""}`):""}
  ${sec("🧾 Permissions (Yetkilər)",permBlock)}
  ${has("passwords")?(p.is_admin||isAdm(p)?sec("🔑 Password",`<p style="margin:0">🔒 Admin passwords are private. Only the admin can change their own (Settings → Change password).</p>`,"locked"):sec("🔑 Password",`<div id="pwbox"><span class="mu">Loading…</span></div>`)):""}
  ${has("groups")&&isStudent(p)&&G.length?sec("👥 Group",`<p style="margin:0 0 8px">Now: <b>${g?esc(g.name):"no group"}</b></p><div class="row wrap"><select id="e_move">${G.map(x=>`<option value="${x.id}" ${x.id===p.group_id?"selected":""}>${esc(x.name)}</option>`).join("")}</select><button onclick="mvMember('${id}')">Move here</button>${g?`<button class="s" onclick="rmMember('${id}')">Remove</button>`:""}</div>`):""}
  ${adminViewer&&!p.is_admin?sec("🚪 Session",`<button class="s" onclick="forceOut('${id}')">Sign out everywhere</button>`):""}
 </div>`);
 if(has("passwords")&&!isAdm(p))loadPw(id)}
async function saveName(id){if(await call("admin_set_name",{u:id,nm:val("e_name")},"Name saved"))person(id)}
async function saveTag(id){if(await call("admin_set_class_tag",{u:id,t:val("e_tag")},"Class group saved"))person(id)}
async function saveId(id){if(await call("admin_set_login",{u:id,idt:val("e_id")},"ID saved"))person(id)}
async function setRole(id,r){if(await call("admin_set_role",{u:id,r},"Role changed"))person(id)}
async function addPts(id){const n=parseInt(val("e_pts"),10);if(!n){toast("Type a number",1);return}if(await call("add_points",{u:id,n},(n>0?"+":"")+n+" points"))person(id)}
// Yetki açarı: basan kimi saxlanır; admin hüququ vermək təsdiq tələb edir
async function togglePerm(id,k,box){const p=P.find(x=>x.id===id),cur=new Set(p.perms||[]);
 const apply=async()=>{box.checked?cur.add(k):cur.delete(k);const ok=await call("admin_set_perms",{u:id,p:[...cur]},"Permissions saved");if(ok)person(id);else box.checked=!box.checked};
 if(k==="admin"&&box.checked){box.checked=false;confirmBox(tr("Give <b>full admin</b> rights to <b>{name}</b>? They can then do everything in this panel.",{name:esc(p.name)}),async()=>{box.checked=true;await apply()},tr("Yes, make admin"));return}
 await apply()}
async function presetPerms(id,list){if(await call("admin_set_perms",{u:id,p:list},"Permissions saved"))person(id)}
async function forceOut(id){if(await call("admin_force_logout",{u:id},"Signed out everywhere"))person(id)}
async function rmMember(id){if(await call("admin_remove_member",{u:id},"Removed from the group"))person(id)}
async function mvMember(id){if(await call("admin_move_member",{u:id,g:+val("e_move")},"Moved"))person(id)}
// Yeni adam: tələbə və ya müəllim. Limit yoxdur (30-dan çox ola bilər).
function addPerson(){npRole="student";modal(`<div class="sheet-h"><h3 style="margin:0">➕ Add a person</h3><p class="mu" style="margin:6px 0 0">No limit of 30. The ID is made automatically: first name, dot, first letter of the surname.</p></div><div class="sheet-b">
  <label class="l">Role</label><div class="seg" id="npseg"><button class="on" onclick="setNp('student')">🎓 Student</button><button onclick="setNp('teacher')">👩‍🏫 Teacher</button></div>
  <label class="l">Full name</label><input id="np_name" placeholder="Əli Məmmədov" maxlength="30" onkeydown="if(event.key==='Enter')doAddPerson()">
  <div class="row" style="margin-top:18px"><button class="s" onclick="closeM()">Cancel</button><button onclick="doAddPerson()">Create</button></div></div>`);setTimeout(()=>{const i=$("#np_name");if(i&&i.focus)i.focus()},50)}
function setNp(r){npRole=r;const b=document.querySelectorAll("#npseg button");if(b[0]){b[0].className=r==="student"?"on":"";b[1].className=r==="teacher"?"on":""}}
async function doAddPerson(){const raw=val("np_name").trim();if(!raw){toast("Type a name",1);return}const {data,error}=await sb.rpc("admin_create_user",{raw,r:npRole});if(error){toast(error.message,1);return}await load();const r=(data||[])[0];
 if(r)modal(`<div class="sheet-h"><h3 style="margin:0">✅ ${esc(r.new_name)} added</h3></div><div class="sheet-b"><p>ID: <b class="mono">${esc(r.new_login)}</b></p><div class="big">${esc(r.temp_password)}</div><p class="mu">Give them the ID and this temporary password. They choose their own password at the first login. You can see it later in the Passwords tab.</p><div class="row"><button onclick="copy('${esc(r.new_login)} / ${esc(r.temp_password)}')">Copy</button><button class="s" onclick="closeM()">Close</button></div></div>`,true)}

/* ---------- 7. QRUPLAR ---------- */
function groups(){const canEdit=has("groups");
 return head("Groups",G.length+" of "+maxG()+" groups created")+`<div class="gcards">${G.map(g=>{const mem=P.filter(p=>p.group_id===g.id),pct=Math.min(100,Math.round(mem.length/g.capacity*100));
  return`<div class="panel"><div class="row sp"><h3>${esc(g.name)}</h3><span class="chip">${esc(g.class_tag||"—")} · ${mem.length}/${g.capacity}</span></div><div class="bar"><i style="width:${pct}%"></i></div>
   <p class="mu" style="margin:0 0 8px">Host: ${esc(g.host_id?nm(g.host_id):"—")}</p>
   ${mem.map(p=>`<div class="li pc" style="box-shadow:none;margin-bottom:6px" onclick="person('${p.id}')">${avatar(p)}<div class="grow"><b>${esc(p.name)}${p.id===g.host_id?" 👑":""}</b></div><span class="mu">${p.points} pts</span></div>`).join("")||empty("🪑","No members yet")}
   ${canEdit?`<div class="row wrap" style="margin-top:10px"><button class="s sm" onclick="gEdit(${g.id})">✏️ Edit</button><button class="d sm" onclick="gDel(${g.id})">🗑 Delete</button></div>`:""}</div>`}).join("")||`<div class="panel">${empty("🧩","No groups yet. Students create them on the main site.")}</div>`}</div>`}
function gEdit(id){const g=G.find(x=>x.id===id),mem=P.filter(p=>p.group_id===id);modal(`<div class="sheet-h"><h3 style="margin:0">✏️ Edit group</h3></div><div class="sheet-b"><label class="l">Name</label><input id="g_name" value="${esc(g.name)}" maxlength="30"><label class="l">Max members (1-10, not below ${mem.length})</label><input id="g_cap" type="number" min="1" max="10" value="${g.capacity}"><label class="l">Host</label><select id="g_host">${mem.map(p=>`<option value="${p.id}" ${p.id===g.host_id?"selected":""}>${esc(p.name)}</option>`).join("")||"<option value=''>(no members)</option>"}</select><div class="row" style="margin-top:18px"><button class="s" onclick="closeM()">Cancel</button><button onclick="gSave(${id})">Save</button></div></div>`,true)}
async function gSave(id){if(await call("admin_group_update",{g:id,nm:val("g_name"),cap:+val("g_cap"),host:val("g_host")||null},"Group saved"))closeM()}
function gDel(id){confirmBox("Delete this group? Its members become idle and its chat is removed.",async()=>{await call("admin_delete_group",{g:id},"Group deleted")})}

/* ---------- 8. ÇATLAR ---------- */
const title=k=>k==="all"?tr("Everyone"):k[0]==="g"?gname(+k.slice(2))+" ("+tr("group")+")":k.split(":").slice(1).map(nm).join(" & ");
function chans(){const c={};M.forEach(x=>{const o=c[x.channel]||(c[x.channel]={k:x.channel,n:0,last:0});o.n++;o.last=Math.max(o.last,x.id)});return Object.values(c).sort((a,b)=>b.last-a.last)}
function chats(){const cs=chans();if(!cs.find(c=>c.k===chSel)&&cs[0])chSel=cs[0].k;const t=M.filter(m=>m.channel===chSel).slice(-200);
 return head("Chats","Read and moderate every conversation. Deleted messages cannot be restored.",`<button class="d" onclick="clearAll()">🗑 Delete ALL chats</button>`)+
 `<div class="chats"><div class="panel list">${cs.map(c=>`<div class="citem ${c.k===chSel?"on":""}" onclick="chSel='${esc(c.k)}';draw()"><span>${esc(title(c.k))}</span><span class="chip">${c.n}</span></div>`).join("")||empty("💬","No chats")}</div>
  <div class="panel"><div class="row sp" style="margin-bottom:10px"><h3>${esc(title(chSel))}</h3><button class="d sm" onclick="clearCh()">Clear this chat</button></div>
  <div class="msgs" id="mlist">${t.map(m=>`<div class="msg"><div class="grow"><b>${esc(m.sender?nm(m.sender):tr("System"))}</b> <small>${new Date(m.created_at).toLocaleString(LANG==="az"?"az":undefined)}</small><br>${m.file_path?`📎 ${esc(m.file_name)} `:""}${esc(m.body)}</div><button class="s sm" title="Delete" onclick="delMsg(${m.id})">🗑</button></div>`).join("")||empty("💬","No messages")}</div></div></div>`}
const delMsg=id=>confirmBox("Delete this message?",async()=>{await call("admin_delete_message",{i:id},"Message deleted")});
const clearCh=()=>confirmBox(tr("Delete ALL messages in <b>{name}</b>?",{name:esc(title(chSel))}),async()=>{await call("admin_clear_channel",{ch:chSel},"Chat cleared")});
const clearAll=()=>confirmBox(tr("Delete <b>every</b> message in <b>every</b> chat ({n} messages)? This cannot be undone.",{n:M.length}),async()=>{await call("admin_clear_all_chats",{},"All chats cleared")});

/* ---------- 9. PAROLLAR ---------- */
const PW_STATUS={temp:["warn","Temporary"],student:["ok","Set by student"],stale:["bad","Changed, reset to see"],none:["","No copy"]};
const pwKey=r=>r.pw?(r.source||"temp"):(r.source==="stale"?"stale":"none");
// Bir adamın parolunu açır (adminlərin parolu heç vaxt göstərilmir)
async function loadPw(id){const box=$("#pwbox");if(!box)return;const r=await sb.rpc("admin_get_password",{u:id});if(r.error){box.innerHTML=`<span class="mu">${esc(r.error.message)}</span>`;return}pwView(id,(r.data||[])[0])}
let pwOne=false;
function pwView(id,row){const box=$("#pwbox");if(!box)return;const reset=has("passwords")?`<button class="s sm" onclick="resetPw('${id}')">🔑 Reset</button>`:"";
 if(!row)return box.innerHTML=`<p class="mu" style="margin:0 0 10px">No copy saved yet. Reset the password to create a new one you can see.</p>${reset}`;
 if(row.source==="stale"||!row.pw)return box.innerHTML=`<p class="mu" style="margin:0 0 10px">The student changed it before copies were turned on, so it cannot be shown. Reset to create a visible one.</p>${reset}`;
 const st=PW_STATUS[row.source]||PW_STATUS.temp;
 box.innerHTML=`<div class="pwbox"><div class="v" id="pwv">${pwOne?esc(row.pw):"••••••••"}</div><button class="s sm" onclick="pwOne=!pwOne;pwView('${id}',window.__row)">${pwOne?"🙈 Hide":"👁 Show"}</button><button class="s sm" onclick="copy(window.__row.pw)">Copy</button></div>
  <div class="row wrap" style="margin-top:10px"><span class="chip ${st[0]}">${st[1]}</span><span class="mu" style="font-size:13px">${row.updated_at?new Date(row.updated_at).toLocaleString(LANG==="az"?"az":undefined):""}</span><span class="grow"></span>${reset}</div>`;window.__row=row}
async function resetPw(id){const p=P.find(x=>x.id===id);confirmBox(tr("Create a new temporary password for <b>{name}</b>? The old one stops working and they are signed out.",{name:esc(p?p.name:tr("this person"))}),async()=>{const pw=await call("admin_reset_password",{u:id});if(typeof pw==="string"){pwOne=true;modal(`<div class="sheet-h"><h3 style="margin:0">🔑 New temporary password</h3></div><div class="sheet-b"><p>${esc(p?p.name:"")} · ID <b class="mono">${esc(p?short(p.login):"")}</b></p><div class="big">${esc(pw)}</div><p class="mu">They set their own password at the next login. You can look at it again in the Passwords tab.</p><div class="row"><button onclick="copy('${esc(p?short(p.login):"")} / ${esc(pw)}')">Copy</button><button class="s" onclick="person('${id}')">Back</button></div></div>`,true)}},tr("Yes, reset"))}
// Parol cədvəli
function pwRows(){const q=pwq.trim().toLowerCase();return PW.filter(r=>(!q||r.name.toLowerCase().includes(q)||short(r.login).includes(q))&&(pwFilter==="all"||(pwFilter==="students"&&r.role==="student")||(pwFilter==="teachers"&&r.role==="teacher")||(pwFilter==="reset"&&!r.pw)))}
function passPage(){if(!has("passwords"))return"";const rows=pwRows();
 return head("Passwords","What each person logs in with. Admin passwords are private and never shown.",`<button class="s" onclick="pwAll=!pwAll;pwShown=new Set();draw()">${pwAll?"🙈 Hide all":"👁 Reveal all"}</button><button onclick="dlPw()">⬇ Download CSV</button>`)+
 `<div class="toolbar"><input placeholder="Search by name or ID…" value="${esc(pwq)}" oninput="pwq=this.value;$('#pwtab').innerHTML=pwTable()"><div class="seg">${[["all","All"],["students","Students"],["teachers","Teachers"],["reset","Needs reset"]].map(([k,t])=>`<button class="${pwFilter===k?"on":""}" onclick="pwFilter='${k}';draw()">${t}</button>`).join("")}</div></div>
 <div class="panel" style="padding:0"><div class="scroll" id="pwtab">${pwTable()}</div></div>`}
function pwTable(){const rows=pwRows();
 return`<table class="tbl"><tr><th>Person</th><th>ID</th><th>Password</th><th>Status</th><th></th></tr>${rows.map(r=>{const k=pwKey(r),st=PW_STATUS[k],show=pwAll||pwShown.has(r.user_id);
  return`<tr><td><div class="row">${avatar({name:r.name})}<div><b>${esc(r.name)}</b><br><span class="chip ${r.role}">${r.role==="teacher"?"👩‍🏫 Teacher":"🎓 Student"}</span></div></div></td><td class="mono">${esc(short(r.login))}</td>
   <td class="mono" style="font-weight:700;letter-spacing:1px">${r.pw?(show?esc(r.pw):"••••••••"):'<span class="mu">—</span>'}</td><td><span class="chip ${st[0]}">${st[1]}</span></td>
   <td><div class="row wrap">${r.pw?`<button class="s sm" onclick="togglePw('${r.user_id}')">${show?"🙈":"👁"}</button><button class="s sm" onclick="copy('${esc(short(r.login))} / ${esc(r.pw)}')">Copy</button>`:""}<button class="s sm" onclick="resetPw('${r.user_id}')">🔑 Reset</button></div></td></tr>`}).join("")||`<tr><td colspan="5">${empty("🔍","Nobody found")}</td></tr>`}</table>`}
function togglePw(id){pwShown.has(id)?pwShown.delete(id):pwShown.add(id);$("#pwtab").innerHTML=pwTable()}
// Excel-də düzgün açılan CSV
function dlPw(){const rows=pwRows().map(r=>[r.name,short(r.login),r.pw||"",PW_STATUS[pwKey(r)][1]]),csv="\ufeffName,ID,Password,Status\n"+rows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(",")).join("\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="passwords.csv";a.click()}

/* ---------- 10. GÜN SONU / İDXAL / AYARLAR ---------- */
function day(){return head("Close the day","When the presentations are over, archive every chat and start fresh")+
 `<div class="panel"><p>${tr("All current chats are moved to a <b>read-only archive</b> that only admins see here. Students start with empty chats. Points stay.")}</p>
  <label class="l">Name of this archive</label><input id="d_lbl" value="${esc(dayLabel||tr("Presentation day")+" · "+new Date().toLocaleDateString(LANG==="az"?"az":undefined))}" oninput="dayLabel=this.value">
  <label class="row" style="margin-top:14px;cursor:pointer"><input type="checkbox" id="d_dis" ${dayDis?"checked":""} onchange="dayDis=this.checked" style="width:auto"> Also dissolve all groups (everyone becomes idle)</label>
  <div style="margin-top:16px"><button class="d" onclick="closeDay()">🗂️ Close the day and archive chats</button></div></div>
  <div class="panel"><h3>Archives</h3>${AR.map(a=>`<div class="li pc" style="box-shadow:none;margin-top:8px" onclick="openAr(${a.id})"><div class="grow"><b>${esc(a.label)}</b><br><span class="mu">${new Date(a.created_at).toLocaleString(LANG==="az"?"az":undefined)} · <span>${a.n||0} messages</span></span></div><span>›</span></div>`).join("")||empty("🗂️","No archives yet")}</div>`}
function closeDay(){const l=val("d_lbl"),d=$("#d_dis").checked;confirmBox(d?tr("Archive <b>{n}</b> messages and dissolve all groups? Students will see empty chats afterwards.",{n:M.length}):tr("Archive <b>{n}</b> messages? Students will see empty chats afterwards.",{n:M.length}),async()=>{if(await call("admin_close_day",{lbl:l,dissolve:d},"Day closed. Chats archived."))dayLabel=""},tr("Yes, close the day"))}
async function openAr(id){const a=AR.find(x=>x.id===id),r=await sb.from("archived_messages").select("*").eq("archive_id",id).order("id"),by={};(r.data||[]).forEach(m=>{(by[m.channel_label]=by[m.channel_label]||[]).push(m)});
 modal(`<div class="sheet-h"><h3 style="margin:0">🗂️ ${esc(a.label)}</h3></div><div class="sheet-b">${Object.keys(by).map(k=>`<p style="margin:14px 0 6px"><b>${esc(k)}</b> <span class="chip">${by[k].length}</span></p>${by[k].slice(0,40).map(m=>`<div class="msg"><div><b>${esc(m.sender?nm(m.sender):tr("System"))}</b><br>${m.file_path?"📎 "+esc(m.file_name)+" ":""}${esc(m.body)}</div></div>`).join("")}`).join("")||empty("🗂️","Empty")}<div class="row" style="margin-top:14px"><button class="s" style="flex:1" onclick="closeM()">Close</button></div></div>`)}
const unused=()=>P.filter(p=>isStudent(p)&&/^Student \d+$/.test(p.name)).length;
function imp(){return head("Import names","Paste a class list. IDs and temporary passwords are created automatically.")+
 `<div class="panel"><p>${tr("One full name per line, for example <b>Əli Məmmədov</b>. The ID becomes <b>ali.m</b>. Only accounts nobody has used yet are filled; accounts with a changed password are never touched. To add people beyond those, use <b>➕ Add person</b> in People.")}</p><p class="mu">Unused numbered accounts left: <b>${unused()}</b></p>
  <textarea id="imp" rows="10" placeholder="Əli Məmmədov&#10;Aysel Hüseynova&#10;…" oninput="impText=this.value">${esc(impText)}</textarea><div style="margin-top:12px"><button onclick="doImport()">📥 Create IDs and passwords</button></div></div>`}
async function doImport(){const names=impText.split("\n").map(s=>s.trim()).filter(Boolean);if(!names.length){toast("Paste at least one name",1);return}
 confirmBox(tr("Create accounts for <b>{n}</b> students? New temporary passwords are generated.",{n:names.length}),async()=>{const {data,error}=await sb.rpc("admin_import_students",{names});if(error){toast(error.message,1);return}impText="";await load();showImport(data||[])},tr("Create"))}
const csvOf=rows=>"\ufeffName,ID,Temporary password\n"+rows.map(r=>[r.new_name,r.new_login,r.temp_password].map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(",")).join("\n");
function showImport(rows){window.__rows=rows;modal(`<div class="sheet-h"><h3 style="margin:0">✅ ${rows.length} students ready</h3><p class="mu" style="margin:6px 0 0">You can see these passwords later in the Passwords tab.</p></div><div class="sheet-b"><div class="scroll" style="max-height:46vh"><table class="tbl"><tr><th>Name</th><th>ID</th><th>Password</th></tr>${rows.map(r=>`<tr><td>${esc(r.new_name)}</td><td class="mono"><b>${esc(r.new_login)}</b></td><td class="mono">${esc(r.temp_password)}</td></tr>`).join("")}</table></div><div class="row wrap" style="margin-top:14px"><button onclick="dlCsv()">⬇ Download CSV</button><button class="s" onclick="copy(window.__rows.map(r=>r.new_name+'\\t'+r.new_login+'\\t'+r.temp_password).join('\\n'))">Copy all</button><button class="s" onclick="closeM()">Close</button></div></div>`)}
function dlCsv(){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csvOf(window.__rows)],{type:"text/csv"}));a.download="students.csv";a.click()}
function settings(){return head("Settings","Rules of the site")+
 `<div class="panel"><h3>Group limit</h3><p class="hint">With 30 students in groups of 5, six groups are enough.</p><div class="row" style="max-width:320px"><select id="mg">${[1,2,3,4,5,6,7,8,9,10,11,12].map(n=>`<option ${n===maxG()?"selected":""}>${n}</option>`).join("")}</select><button onclick="saveMax()">Save</button></div></div>
  <div class="panel" style="border-color:var(--bad)"><h3 style="color:var(--bad)">Danger zone</h3><p class="hint">Deletes ALL messages, archives, point history and groups, and sets every score to 0. Accounts and passwords stay. Use it once, to clear test data before launch.</p><button class="d" onclick="resetAll()">Clear all data…</button></div>`}
const saveMax=()=>call("admin_set_setting",{k:"max_groups",v:val("mg")},"Saved");
function resetAll(){modal(`<div class="sheet-h"><h3 style="margin:0;color:var(--bad)">Clear all data?</h3></div><div class="sheet-b"><p>${tr("This cannot be undone. Type <b>RESET</b> to confirm.")}</p><input id="rs" placeholder="RESET"><div class="row" style="margin-top:16px"><button class="s" onclick="closeM()">Cancel</button><button class="d" onclick="if(val('rs')==='RESET'){closeM();call('admin_reset_all',{},'Everything cleared')}else toast('Type RESET exactly',1)">Clear everything</button></div></div>`,true)}

/* ---------- 9b. SİNİFLƏR (admin: hamısı · starosta: yalnız öz sinfi) ---------- */
let SC=[],CS=[],TG=[],UT=[];
const isStar=()=>!!ME&&ME.role==="student"&&!has("admin");
async function loadCls(){try{const a=await sb.rpc("staff_classes");SC=a.data||[];const b=await sb.from("class_staff").select("*");CS=b.data||[];const c=await sb.from("tags").select("*").order("id"),d=await sb.from("user_tags").select("*");TG=c.data||[];UT=d.data||[]}catch(e){SC=[];CS=[];TG=[];UT=[]}}
const canC=(t,p)=>has("admin")||!!((SC.find(c=>c.tag===t)||{}).perms||[]).includes(p);
const CPERMS=[["points","⭐","Give points"],["groups","👥","Manage groups"],["chats","💬","Moderate chats"],["passwords","🔑","Passwords"],["accounts","➕","Add students"]];
function clsPage(){return head("Classes",has("admin")?"Every class group. Open one to manage its students and class reps.":"The classes you manage.",has("admin")?`<button onclick="addClass()">➕ Add class</button>`:"")+
 `<div class="cls-grid">${SC.map(c=>{const r=CS.filter(x=>x.class_tag===c.tag&&x.role==="starosta");return`<div class="cls-card" onclick="openCls('${c.tag}')"><div class="cls-tag">${esc(c.tag)}</div><div class="mu">${esc(c.title||"")}</div><div class="cls-n"><b>${c.students}</b> <span>students</span></div>${r.map(x=>`<span class="chip">⭐ ${esc(nm(x.user_id))}</span>`).join("")}</div>`}).join("")||empty("🏫","No classes yet")}</div>`}
// Sinif əlavə etmə: yazaraq və ya .txt/.md faylı ilə (hər sətir: 636s  və ya  636s | Ad)
function addClass(){modal(`<div class="sheet-h"><h3 style="margin:0">🏫 Add class</h3><p class="mu" style="margin:6px 0 0">Type a class number, or upload a .txt / .md file with one class per line (for example 636s or 636s | Title).</p></div><div class="sheet-b"><label class="l">Class number</label><input id="ct" placeholder="636s" maxlength="12" autocapitalize="none"><label class="l">Title (optional)</label><input id="ctt"><div class="row wrap" style="margin-top:14px"><button onclick="makeClasses([[val('ct').toLowerCase().replace(/\\s+/g,''),val('ctt').trim()]])">Add</button><label class="fbtn">📄 Upload .txt / .md<input type="file" accept=".txt,.md,text/plain,text/markdown" style="display:none" onchange="classFile(this)"></label><button class="s" onclick="closeM()">Cancel</button></div></div>`,true)}
const parseCls=t=>{const out=[],seen=new Set();String(t).split(/\r?\n/).forEach(l=>{if(/^\s*#/.test(l))return;l=l.replace(/^[\s>*+-]+/,"");const m=l.split(/\s*[|,;\t:–—]\s*|\s+-\s+/),tag=(m[0]||"").toLowerCase().replace(/\s+/g,"");if(/^[a-z0-9][a-z0-9_-]{0,11}$/.test(tag)&&!seen.has(tag)){seen.add(tag);out.push([tag,m.slice(1).join(" ").trim()])}});return out};
function classFile(i){const f=i.files[0];if(!f)return;f.text().then(t=>{const L=parseCls(t);if(!L.length){toast("No class numbers found in the file",1);return}confirmBox(tr("Add <b>{n}</b> classes: {l}?",{n:L.length,l:esc(L.map(x=>x[0]).join(", "))}),()=>makeClasses(L),"Add")})}
async function makeClasses(L){let ok=0,bad=[];for(const [t,ttl] of L){const {error}=await sb.rpc("admin_create_class",{t,ttl:ttl||null});if(error)bad.push(t+": "+error.message);else ok++}closeM();await load();toast(ok+" class(es) added"+(bad.length?" · "+bad.length+" skipped ("+bad[0]+")":""),!ok)}
// Sinifin səhifəsi: starosta/müəllimlər + tələbələr
function openCls(tag){const c=SC.find(x=>x.tag===tag);if(!c)return;const S=P.filter(p=>isStudent(p)&&p.class_tag===tag),st=CS.filter(x=>x.class_tag===tag),A=has("admin");
 modal(`<div class="sheet-h"><h3 style="margin:0">🏫 ${esc(tag)} ${c.title?"· "+esc(c.title):""}</h3><p class="mu" style="margin:6px 0 0">${S.length} students</p></div><div class="sheet-b"><div class="row wrap">${canC(tag,"accounts")?`<button onclick="addStu('${tag}')">➕ Add students</button>`:""}${A?`<button class="s" onclick="repForm('${tag}')">⭐ Set class rep</button>`:""}</div>
 <p style="margin:16px 0 6px"><b>Class reps &amp; teachers</b></p>${st.map(x=>`<div class="msg"><div><b>${esc(nm(x.user_id))}</b> <span class="chip">${x.role==="starosta"?"⭐ Class rep":"👩‍🏫 Teacher"}</span> ${(x.perms||[]).map(k=>`<span class="chip">${esc(k)}</span>`).join("")}</div>${A?`<button class="s" onclick="rmStaff('${x.user_id}','${tag}')">Remove</button>`:""}</div>`).join("")||`<p class="mu">None yet</p>`}
 <p style="margin:16px 0 6px"><b>Students</b></p><div class="scroll" style="max-height:34vh"><table class="tbl"><tr><th>Name</th><th>ID</th><th>Group</th><th>Points</th></tr>${S.map(p=>`<tr><td>${esc(p.name)}</td><td class="mono">${esc(short(p.login))}</td><td>${esc(gname(p.group_id))}</td><td>${p.points}</td></tr>`).join("")}</table></div>
 <div class="row" style="margin-top:14px"><button class="s" style="flex:1" onclick="closeM()">Close</button></div></div>`)}
function addStu(tag){modal(`<div class="sheet-h"><h3 style="margin:0">➕ Add students · ${esc(tag)}</h3><p class="mu" style="margin:6px 0 0">One full name per line, or upload a .txt / .md file. IDs and temporary passwords are created automatically.</p></div><div class="sheet-b"><textarea id="sn" rows="8" placeholder="Əli Məmmədov&#10;Aysel Hüseynova"></textarea><div class="row wrap" style="margin-top:12px"><button onclick="doAddStu('${tag}')">Create IDs and passwords</button><label class="fbtn">📄 Upload .txt / .md<input type="file" accept=".txt,.md" style="display:none" onchange="nameFile(this)"></label><button class="s" onclick="openCls('${tag}')">Cancel</button></div></div>`)}
function nameFile(i){const f=i.files[0];if(f)f.text().then(t=>{$("#sn").value=t.split(/\r?\n/).map(l=>l.replace(/^[\s>*#+-]+/,"").trim()).filter(Boolean).join("\n")})}
async function doAddStu(tag){const names=val("sn").split("\n").map(s=>s.trim()).filter(Boolean);if(!names.length){toast("Paste at least one name",1);return}const {data,error}=await sb.rpc("admin_add_students",{cls:tag,names});if(error){toast(error.message,1);return}await load();showImport(data||[])}
// Starosta / müəllim təyini (yalnız admin)
function repForm(tag){const L=[...P.filter(p=>isStudent(p)&&p.class_tag===tag),...P.filter(p=>p.role==="teacher"&&!p.is_admin)];
 modal(`<div class="sheet-h"><h3 style="margin:0">⭐ Set class rep · ${esc(tag)}</h3><p class="mu" style="margin:6px 0 0">The person can only manage this class, with the permissions you tick.</p></div><div class="sheet-b"><label class="l">Person</label><select id="rp">${L.map(p=>`<option value="${p.id}">${esc(p.name)}${p.role==="teacher"?" (teacher)":""}</option>`).join("")}</select>
 <div style="margin-top:12px">${CPERMS.map(x=>`<label class="row" style="cursor:pointer;margin:6px 0"><input type="checkbox" id="pm_${x[0]}" style="width:auto" ${x[0]!=="passwords"?"checked":""}> ${x[1]} ${x[2]}</label>`).join("")}</div>
 <div class="row" style="margin-top:14px"><button class="s" onclick="openCls('${tag}')">Cancel</button><button onclick="saveRep('${tag}')">Save</button></div></div>`,true)}
async function saveRep(tag){const u=val("rp");if(!u){toast("No one to choose",1);return}const p=CPERMS.map(x=>x[0]).filter(k=>$("#pm_"+k).checked),r=(P.find(x=>x.id===u)||{}).role==="teacher"?"teacher":"starosta";if(await call("admin_set_staff",{u,cls:tag,r,p},"Saved"))openCls(tag)}
async function rmStaff(u,cls){if(await call("admin_remove_staff",{u,cls},"Removed"))openCls(cls)}
Object.assign(ADM,{"Classes":"Siniflər","My classes":"Mənim siniflərim","🏫 Classes":"🏫 Siniflər","➕ Add class":"➕ Sinif əlavə et","Every class group. Open one to manage its students and class reps.":"Bütün siniflər. Tələbələri və starostaları idarə etmək üçün birini açın.","The classes you manage.":"İdarə etdiyiniz siniflər.","No classes yet":"Hələ sinif yoxdur","Class number":"Sinif nömrəsi","Title (optional)":"Ad (istəyə bağlı)","Add":"Əlavə et","📄 Upload .txt / .md":"📄 .txt / .md yüklə","Class reps & teachers":"Starostalar və müəllimlər","⭐ Class rep":"⭐ Starosta","None yet":"Hələ yoxdur","➕ Add students":"➕ Tələbə əlavə et","⭐ Set class rep":"⭐ Starosta təyin et","Create IDs and passwords":"ID və parol yarat","Person":"Şəxs","Save":"Yadda saxla"});

/* ---------- 9c. TAGLAR ---------- */
const TRULES=[["manual","Only admins give it"],["points","Automatic: reaches N points"],["team","Automatic: joins a team"],["host","Automatic: becomes a team host"]];
const tagChip=t=>`<span class="tchip" style="--tc:${t.color}">${esc(t.emoji)} ${esc(t.name)}</span>`;
const ruleTxt=t=>t.rule==="points"?tr("Automatic at {n} points",{n:t.rule_n}):(TRULES.find(r=>r[0]===t.rule)||TRULES[0])[1];
function tagPage(){return head("Tags","Badges for students. Describe what it means, what it gives and how it is earned.",`<button onclick="tagForm()">➕ New tag</button>`)+
 `<div class="cls-grid">${TG.map(t=>`<div class="cls-card" onclick="tagView(${t.id})">${tagChip(t)}<p class="mu" style="margin:10px 0 6px">${esc(t.descr||"")}</p><div>${t.reward>0?`🎁 +${t.reward} points`:"📝 Text only"}</div><div class="mu">${esc(ruleTxt(t))}</div><div class="cls-n"><b>${UT.filter(x=>x.tag_id===t.id).length}</b> <span>students</span></div></div>`).join("")||empty("🏷️","No tags yet")}</div>`}
function tagForm(id){const t=TG.find(x=>x.id===id)||{name:"",emoji:"🏷️",color:"#7c3aed",descr:"",reward:0,rule:"manual",rule_n:100};
 modal(`<div class="sheet-h"><h3 style="margin:0">${id?"✏️ Edit tag":"🏷️ New tag"}</h3></div><div class="sheet-b"><label class="l">Name</label><input id="tn" maxlength="24" value="${esc(t.name)}"><div class="row"><div style="flex:1"><label class="l">Emoji</label><input id="te" maxlength="4" value="${esc(t.emoji)}"></div><div><label class="l">Color</label><input id="tc" type="color" value="${t.color}" style="width:64px;padding:2px"></div></div>
 <label class="l">Description (what it means and why it is given)</label><textarea id="td" rows="3" maxlength="300">${esc(t.descr)}</textarea>
 <label class="l">Reward points (0 = just a text badge)</label><input id="tr" type="number" min="0" max="1000" value="${t.reward}">
 <label class="l">How is it earned?</label><select id="tl" onchange="$('#tnw').style.display=this.value==='points'?'':'none'">${TRULES.map(r=>`<option value="${r[0]}" ${r[0]===t.rule?"selected":""}>${r[1]}</option>`).join("")}</select>
 <div id="tnw" style="display:${t.rule==="points"?"":"none"}"><label class="l">Points needed</label><input id="tp" type="number" min="1" value="${t.rule_n||100}"></div>
 <div class="row" style="margin-top:14px"><button class="s" onclick="closeM()">Cancel</button><button onclick="saveTag(${id||"null"})">Save</button></div></div>`,true)}
async function saveTag(i){const a={i,nm:val("tn"),em:val("te"),col:val("tc"),ds:val("td"),rw:+val("tr")||0,rl:val("tl"),rn:val("tl")==="points"?+val("tp")||0:0};if(await call("admin_save_tag",a,"Saved"))closeM()}
function tagView(id){const t=TG.find(x=>x.id===id);if(!t)return;const H=UT.filter(x=>x.tag_id===id),held=new Set(H.map(x=>x.user_id)),C=P.filter(p=>isStudent(p)&&!held.has(p.id));
 modal(`<div class="sheet-h"><h3 style="margin:0">${tagChip(t)}</h3><p class="mu" style="margin:8px 0 0">${esc(t.descr||"")}</p><p style="margin:6px 0 0">${t.reward>0?`🎁 +${t.reward} points`:"📝 Text only"} · ${esc(ruleTxt(t))}</p></div><div class="sheet-b">
 <p style="margin:0 0 6px"><b>Give to a student</b></p><div class="row"><select id="gs">${C.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select><button onclick="giveTag(${id})">Give</button></div>
 <p style="margin:16px 0 6px"><b>Holders</b> (${H.length})</p><div class="scroll" style="max-height:30vh">${H.map(x=>`<div class="msg"><div><b>${esc(nm(x.user_id))}</b> <span class="chip">${x.source==="auto"?"⚡ Automatic":"✋ Manual"}</span></div><button class="s" onclick="takeTag('${x.user_id}',${id})">Take back</button></div>`).join("")||`<p class="mu">None yet</p>`}</div>
 <div class="row" style="margin-top:14px"><button class="s" onclick="confirmBox('Delete this tag?',()=>delTag(${id}),'Delete')">🗑 Delete</button><button class="s" onclick="tagForm(${id})">✏️ Edit</button><button class="s" style="flex:1" onclick="closeM()">Close</button></div></div>`)}
async function giveTag(t){const u=val("gs");if(u&&await call("admin_give_tag",{u,t},"Given"))tagView(t)}
async function takeTag(u,t){if(await call("admin_take_tag",{u,t},"Taken back"))tagView(t)}
async function delTag(i){await call("admin_delete_tag",{i},"Deleted")}
Object.assign(ADM,{"Tags":"Taglar","🏷️ New tag":"🏷️ Yeni tag","✏️ Edit tag":"✏️ Tagı redaktə et","➕ New tag":"➕ Yeni tag","No tags yet":"Hələ tag yoxdur","Badges for students. Describe what it means, what it gives and how it is earned.":"Tələbələr üçün nişanlar. Nə demək olduğunu, nə verdiyini və necə qazanıldığını yazın.","Name":"Ad","Emoji":"Emoji","Color":"Rəng","Description (what it means and why it is given)":"Təsvir (nə deməkdir və nə üçün verilir)","Reward points (0 = just a text badge)":"Mükafat xalı (0 = yalnız yazı nişanı)","How is it earned?":"Necə qazanılır?","Only admins give it":"Yalnız adminlər verir","Automatic: reaches N points":"Avtomatik: müəyyən xal toplayanda","Automatic: joins a team":"Avtomatik: komandaya qoşulanda","Automatic: becomes a team host":"Avtomatik: komanda başçısı olanda","Points needed":"Lazım olan xal","📝 Text only":"📝 Yalnız yazı","Give to a student":"Tələbəyə ver","Give":"Ver","Holders":"Sahibləri","Take back":"Geri al","⚡ Automatic":"⚡ Avtomatik","✋ Manual":"✋ Əl ilə","🗑 Delete":"🗑 Sil","✏️ Edit":"✏️ Redaktə","Delete this tag?":"Bu tag silinsin?"});

/* ---------- 11. BAŞLANĞIC ---------- */
// Düymə basılarkən canlı yenilənmə gözləyir (klik itməsin)
// Yazı sahəsində yazılarkən ekran silinmir; yazı bitəndə yenilənir
const typingNow=()=>{const a=document.activeElement;return !!a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.type!=="checkbox"&&a.type!=="button"&&!!$("#root")&&$("#root").contains(a)};
addEventListener("focusout",()=>{setTimeout(()=>{if(pendingDraw&&!typingNow())draw()},80)});
addEventListener("pointerdown",()=>{pressing=true;pressTs=Date.now()},true);
["pointerup","pointercancel"].forEach(ev=>addEventListener(ev,()=>{setTimeout(()=>{pressing=false;if(pendingDraw)draw()},20)},true));
// Sayt açılanda ilk işləyən funksiya
async function boot(){sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);const {data}=await sb.auth.getSession();if(data.session){uid=data.session.user.id;await enter()}else loginView()}
boot();
