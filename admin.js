/*
 * ADIAK Team Maker — admin panelinin JavaScript-i.
 * Bu fayl idarəetmə panelindəki əməliyyatları və ekran yenilənməsini idarə edir.
 * Məntiqə müdaxilə edilməyib; oxunaqlılıq üçün sətir bölgüsü və şərhlər əlavə olunub.
 */

const SUPABASE_URL="https://epenklutnevjvgpsjehp.supabase.co", SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwZW5rbHV0bmV2anZncHNqZWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MzkwMDEsImV4cCI6MjEwNzExNTAwMX0.1-p4pyec2_NTpCb3W7FG0q-DI5KxNzpmR16Msn9VLJo";

const $=s=>document.querySelector(s),esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let pressing=false,pressTs=0,pendingDraw=false,lastSig="",sb=null,uid=null,ME=null,P=[],G=[],M=[],AR=[],PE=[],SET={
  max_groups:"6"},tab="dash",chSel="all",online=new Set(),chan=null,tm=null,tt=null,impText="",dayLabel="",dayDis=false,pq="";
const nm=id=>{
  const p=P.find(x=>x.id===id);return p?p.name:"?"},short=l=>String(l||"").replace("@classroom.app",""),isAdm=p=>!!p&&(p.is_admin||(p.perms||[]).includes("admin"));
const val=i=>$("#"+i).value,maxG=()=>+SET.max_groups||6,gname=id=>{
  const g=G.find(x=>x.id===id);return g?g.name:"—"};
const av=p=>{
  let h=0;for(const c of p.name)h=(h*31+c.charCodeAt(0))%360;return`<div class="av" style="background:hsl(${h},55%,48%)">${p.avatar?`<img src="${
  esc(p.avatar)}" alt="">`:esc(p.name[0].toUpperCase())}${online.has(p.id)?"<i></i>":""}</div>`};
function toast(m,bad){
  const t=$("#toast");
  t.textContent=m;
  t.className="show"+(bad?" bad":"");
  clearTimeout(tt);
  tt=setTimeout(()=>{
    t.className=""},3500)}
const modal=h=>{
  $("#modal").innerHTML=`<div class="ov" onclick="if(event.target===this)closeM()"><div class="box">${h}</div></div>`},closeM=()=>{$("#modal").innerHTML=""};
function confirmBox(t,fn,label){modal(`<p>${
  t}</p><div class="row"><button class="s" onclick="closeM()">Cancel</button><button class="d" id="yes">${
  label||"Yes, do it"}</button></div>`);$("#yes").onclick=()=>{closeM();fn()}}
async function call(fn,args,ok){const {data,error}=await sb.rpc(fn,args);if(error){toast(error.message,1);return null}if(ok)toast(ok);await load();return data==null?true:data}

/* ---------- login ---------- */
const normId=v=>{v=String(v||"").trim().toLowerCase();return v.includes("@")?v:v+"@classroom.app"};
function loginView(msg){$("#root").innerHTML=`<div class="card login"><h2>🛠 ADIAK Admin</h2><p class="mu">Sign in with an admin account.</p><input id="li" placeholder="ID" autocapitalize="none" autocomplete="username" style="margin:4px 0"><input id="lp" type="password" placeholder="Password" autocomplete="current-password" style="margin:4px 0" onkeydown="if(event.key==='Enter')doLogin()"><div class="err">${
  esc(msg||"")}</div><button style="width:100%" onclick="doLogin()">Sign in</button></div>`}
async function doLogin(){const {data,error}=await sb.auth.signInWithPassword({email:normId(val("li")),password:val("lp")});if(error){loginView("Wrong ID or password");return}uid=data.user.id;await enter()}
function noAccess(){$("#root").innerHTML=`<div class="card login"><h2>No access</h2><p class="mu">This account has no admin rights.</p><div class="row"><button class="s" onclick="signOut()">Sign out</button><a href="index.html"><button>Student site</button></a></div></div>`}
async function signOut(){if(chan){try{await sb.removeChannel(chan)}catch(e){}chan=null}try{await sb.auth.signOut({scope:"local"})}catch(e){}uid=null;ME=null;loginView()}
async function enter(){const r=await sb.from("profiles").select("*").eq("id",uid).single();ME=r.data;if(!ME||!isAdm(ME)){noAccess();return}await load();subscribe()}
function subscribe(){if(chan)return;chan=sb.channel("room").on("postgres_changes",{event:"*",schema:"public"},()=>{clearTimeout(tm);tm=setTimeout(load,300)}).on("presence",{event:"sync"},()=>{const o=Object.keys(chan.presenceState()).sort().join();if(o!==[...online].sort().join()){online=new Set(Object.keys(chan.presenceState()));draw()}}).subscribe()}
async function load(){const [p,g,m,a,s,pe]=await Promise.all([sb.from("profiles").select("*").order("name"),sb.from("groups").select("*").order("id"),sb.from("messages").select("*").order("id",{ascending:false}).limit(800),sb.from("archives").select("*").order("id",{ascending:false}),sb.from("app_settings").select("*"),sb.from("point_events").select("*").order("id",{ascending:false}).limit(200)]);
 if(p.error){toast(p.error.message,1);return}
 P=p.data||[];G=g.data||[];M=(m.data||[]).reverse();AR=a.data||[];(s.data||[]).forEach(x=>{SET[x.key]=x.value});PE=pe.data||[];ME=P.find(x=>x.id===uid)||ME;
 for(const x of AR){try{const r=await sb.from("archived_messages").select("id",{count:"exact",head:true}).eq("archive_id",x.id);x.n=r.count||0}catch(e){x.n=0}}
 const sig=JSON.stringify([P.map(p=>[p.id,p.name,p.points,p.group_id,p.login,(p.perms||[]).join(),p.is_admin]),G.map(g=>[g.id,g.name,g.capacity,g.host_id]),M.length,M.length?M[M.length-1].id:0,AR.map(a=>[a.id,a.n]),SET.max_groups]);if(sig!==lastSig){lastSig=sig;draw()}}

/* ---------- layout ---------- */
const TABS=[["dash","📊","Dashboard"],["people","👥","People"],["groups","🧩","Groups"],["chats","💬","Chats"],["day","🗂","Close the day"],["import","📥","Import names"],["settings","⚙️","Settings"]];
function draw(){if(!ME)return;if(pressing&&Date.now()-pressTs<2500){pendingDraw=true;return}pendingDraw=false;$("#root").innerHTML=`<div id="shell"><div class="side"><h2>🛠 ADIAK Admin</h2><small>Team Maker control panel</small><div class="nav">${
  TABS.map(([k,i,t])=>`<button class="${tab===k?"on":""}" onclick="tab='${k}';draw()">${i} ${t}</button>`).join("")}</div><div class="me">Signed in as <b>${esc(ME.name)}</b><button onclick="signOut()">Sign out</button><a href="index.html" style="color:#fff;display:block;margin-top:8px">← Student site</a></div></div><main>${({dash,people,groups,chats,day,imp,settings})[{dash:"dash",people:"people",groups:"groups",chats:"chats",day:"day",import:"imp",settings:"settings"}[tab]]()}</main></div>`;
 if(tab==="chats"){
  const m=$("#mlist");if(m)m.scrollTop=m.scrollHeight}}

function dash(){
  const st=P.filter(p=>!p.is_admin),idle=st.filter(p=>p.group_id==null),sc=P.filter(p=>(p.perms||[]).includes("points")),ad=P.filter(isAdm),sys=M.filter(m=>m.sender).slice(-6).reverse();
 return`<h1>Dashboard</h1><p class="sub">What is happening right now</p><div class="card"><div class="grid"><div class="stat"><b>${st.length}</b><span>students</span></div><div class="stat"><b>${
  G.length}/${
  maxG()}</b><span>groups</span></div><div class="stat"><b>${
  idle.length}</b><span>idle</span></div><div class="stat"><b>${
  online.size}</b><span>online now</span></div><div class="stat"><b>${
  M.length}</b><span>messages</span></div><div class="stat"><b>${
  ad.length} / ${
  sc.length}</b><span>admins / scorers</span></div></div></div>
 <div class="card"><b>Quick actions</b><div class="row wrap" style="margin-top:10px"><button onclick="tab='import';draw()">📥 Import names</button><button onclick="tab='day';draw()">🗂 Close the day</button><button class="s" onclick="tab='people';draw()">👥 Manage people</button></div></div>
 <div class="card"><b>Latest messages</b>${
  sys.map(m=>`<div class="msg"><span><b>${esc(nm(m.sender))}</b> <small>${
  esc(title(m.channel))}</small><br>${
  esc(m.body||"📎 "+(m.file_name||"file"))}</small></span></div>`).join("")||"<p class='mu'>No messages yet</p>"}</div>`}

/* ---------- people ---------- */
const plist=()=>{
  const q=pq.trim().toLowerCase();return P.filter(p=>!q||p.name.toLowerCase().includes(q)||short(p.login).includes(q)).map(p=>`<div class="li" onclick="person('${p.id}')">${av(p)}<div class="g"><b>${esc(p.name)}</b> ${isAdm(p)?'<span class="chip p">🛡 admin</span>':""}${(p.perms||[]).includes("points")?' <span class="chip p">⭐ points</span>':""}<br><span class="mu">ID: ${esc(short(p.login))}</span></div>${p.group_id!=null?`<span class="chip">${esc(gname(p.group_id))}</span>`:p.is_admin?"":'<span class="chip g">idle</span>'}<b style="min-width:40px;text-align:right">${p.points}</b></div>`).join("")||"<p class='mu'>Nobody found</p>"};
const people=()=>`<h1>People</h1><p class="sub">Tap a person to edit their name, ID, points, permissions or group</p><div class="card"><div class="row"><input placeholder="Search by name or ID…" value="${esc(pq)}" oninput="pq=this.value;$('#plist').innerHTML=plist()"><button onclick="addPerson()">➕ Add person</button></div><div id="plist" style="margin-top:8px">${plist()}</div></div>`;
function addPerson(){
  modal(`<h3>Add a person</h3><p class="mu">There is no limit of 30. Type the full name. The ID is created automatically (first name, dot, first letter of the surname).</p><label>Full name</label><input id="np_name" placeholder="Əli Məmmədov" maxlength="30" onkeydown="if(event.key==='Enter')doAddPerson()"><div class="row" style="margin-top:14px"><button class="s" onclick="closeM()">Cancel</button><button onclick="doAddPerson()">Create</button></div>`);setTimeout(()=>{
    const i=$("#np_name");if(i&&i.focus)i.focus()},50)}
async function doAddPerson(){
  const raw=val("np_name").trim();if(!raw){
    toast("Type a name",1);return}const {
    data,error}=await sb.rpc("admin_create_user",{
    raw});if(error){
    toast(error.message,1);return}await load();const r=(data||[])[0];
 if(r)modal(`<h3>✅ ${esc(r.new_name)} added</h3><p>ID: <b>${
  esc(r.new_login)}</b></p><div class="big">${
  esc(r.temp_password)}</div><p class="mu">Give them the ID and this temporary password. They choose their own password at the first login. Shown only once.</p><div class="row"><button onclick="copy('${esc(r.new_login)} / ${esc(r.temp_password)}')">Copy</button><button class="s" onclick="closeM()">Close</button></div>`)}
function person(id){const p=P.find(x=>x.id===id);if(!p)return;const g=G.find(x=>x.id===p.group_id),pm=p.perms||[];
 modal(`<div class="mh">${
  av(p)}<div><h3>${
  esc(p.name)}</h3><span class="mu">ID: ${
  esc(short(p.login))}</span></div></div>
 <label>Name</label><div class="row"><input id="e_name" value="${esc(p.name)}" maxlength="30"><button onclick="saveName('${id}')">Save</button></div>
 <label>ID (what they type to log in)</label><div class="row"><input id="e_id" value="${esc(short(p.login))}" autocapitalize="none"><button onclick="saveId('${id}')">Save</button></div>
 <label>Points: <b>${
  p.points}</b></label>${
  p.is_admin?"":`<div class="row"><input id="e_pts" type="number" placeholder="e.g. 8 (or -3)"><button class="ok" onclick="addPts('${id}')">Add points</button></div>`}
 <label>Permissions</label><div class="perm"><label><input type="checkbox" id="pm_points" ${
  pm.includes("points")?"checked":""}> ⭐ Can give points (nothing else)</label><label><input type="checkbox" id="pm_admin" ${
  pm.includes("admin")?"checked":""}> 🛡 Admin (full access to this panel)</label><button class="s" onclick="savePerms('${id}')">Save permissions</button></div>
 <label>Account</label><div class="row wrap"><button class="s" onclick="resetPw('${id}')">🔑 Reset password</button><button class="s" onclick="forceOut('${id}')">🚪 Sign out everywhere</button></div>
 ${
  p.is_admin||!G.length?"":`<label>Group: ${g?esc(g.name):"none"}</label><div class="row wrap">${
  g?`<button class="s" onclick="rmMember('${id}')">Remove from group</button>`:""}<select id="e_move">${G.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select><button class="s" onclick="mvMember('${
  id}')">Move here</button></div>`}
 <div class="row" style="margin-top:16px"><button class="s" style="flex:1" onclick="closeM()">Close</button></div>`)}
async function saveName(id){if(await call("admin_set_name",{u:id,nm:val("e_name")},"Name saved"))person(id)}
async function saveId(id){if(await call("admin_set_login",{u:id,idt:val("e_id")},"ID saved"))person(id)}
async function addPts(id){const n=parseInt(val("e_pts"),10);if(!n){toast("Type a number",1);return}if(await call("add_points",{u:id,n},(n>0?"+":"")+n+" points"))person(id)}
async function savePerms(id){const a=[];if($("#pm_points").checked)a.push("points");if($("#pm_admin").checked)a.push("admin");if(await call("admin_set_perms",{u:id,p:a},"Permissions saved"))person(id)}
async function resetPw(id){const p=P.find(x=>x.id===id)||{name:"this person",login:""},pw=await call("admin_reset_password",{u:id});if(typeof pw==="string")modal(`<h3>New temporary password</h3><p>${
  esc(p.name)} · ID <b>${
  esc(short(p.login))}</b></p><div class="big">${
  esc(pw)}</div><p class="mu">Give it to them. At the next login they set their own password. It is shown only once.</p><div class="row"><button onclick="copy('${pw}')">Copy</button><button class="s" onclick="person('${id}')">Back</button></div>`)}
async function forceOut(id){if(await call("admin_force_logout",{u:id},"Signed out everywhere"))person(id)}
async function rmMember(id){if(await call("admin_remove_member",{u:id},"Removed from the group"))person(id)}
async function mvMember(id){if(await call("admin_move_member",{u:id,g:+val("e_move")},"Moved"))person(id)}
function copy(t){try{navigator.clipboard.writeText(t);toast("Copied")}catch(e){toast("Select and copy it by hand",1)}}

/* ---------- groups ---------- */
const groups=()=>`<h1>Groups</h1><p class="sub">${
  G.length} of ${
  maxG()} groups created</p>${
  G.map(g=>{
    const mem=P.filter(p=>p.group_id===g.id);return`<div class="card"><div class="row sp"><b>${esc(g.name)}</b><span class="chip">${
    mem.length}/${
    g.capacity} members</span></div><p class="mu" style="margin:4px 0">Host: ${
    esc(g.host_id?nm(g.host_id):"—")}</p>${
    mem.map(p=>`<div class="li" onclick="person('${p.id}')">${av(p)}<div class="g">${esc(p.name)}${p.id===g.host_id?" 👑":""}</div><span class="mu">${p.points} pts</span></div>`).join("")||"<p class='mu'>No members</p>"}<div class="row wrap" style="margin-top:8px"><button class="s" onclick="gEdit(${g.id})">✏️ Edit</button><button class="d" onclick="gDel(${g.id})">🗑 Delete group</button></div></div>`}).join("")||"<div class='card'><p class='mu'>No groups yet. Students create them on the main site.</p></div>"}`;
function gEdit(id){
    const g=G.find(x=>x.id===id),mem=P.filter(p=>p.group_id===id);modal(`<h3>Edit group</h3><label>Name</label><input id="g_name" value="${esc(g.name)}" maxlength="30"><label>Max members (1-10, not below current ${mem.length})</label><input id="g_cap" type="number" min="1" max="10" value="${
    g.capacity}"><label>Host</label><select id="g_host">${mem.map(p=>`<option value="${
    p.id}" ${p.id===g.host_id?"selected":""}>${esc(p.name)}</option>`).join("")||"<option value=''>(no members)</option>"}</select><div class="row" style="margin-top:14px"><button class="s" onclick="closeM()">Cancel</button><button onclick="gSave(${
    id})">Save</button></div>`)}
async function gSave(id){
    if(await call("admin_group_update",{
      g:id,nm:val("g_name"),cap:+val("g_cap"),host:val("g_host")||null},"Group saved"))closeM()}
function gDel(id){
    confirmBox("Delete this group? Its members become idle and its chat is removed.",async()=>{
      await call("admin_delete_group",{
        g:id},"Group deleted")})}

/* ---------- chats ---------- */
const title=k=>k==="all"?"Everyone":k[0]==="g"?gname(+k.slice(2))+" (group)":k.split(":").slice(1).map(nm).join(" & ");
function chans(){
    const c={
      };M.forEach(x=>{
      const o=c[x.channel]||(c[x.channel]={
        k:x.channel,n:0,last:0});o.n++;o.last=Math.max(o.last,x.id)});return Object.values(c).sort((a,b)=>b.last-a.last)}
function chats(){
    const cs=chans();if(!cs.find(c=>c.k===chSel)&&cs[0])chSel=cs[0].k;const t=M.filter(m=>m.channel===chSel).slice(-200);
 return`<h1>Chats</h1><p class="sub">Read and moderate every conversation. Deleted messages cannot be restored.</p><div class="card"><div class="row"><select id="chs" onchange="chSel=this.value;draw()">${cs.map(c=>`<option value="${esc(c.k)}" ${c.k===chSel?"selected":""}>${esc(title(c.k))} · ${c.n}</option>`).join("")||"<option>No chats</option>"}</select><button class="d" onclick="clearCh()">Clear this chat</button></div><div class="row" style="margin-top:8px"><button class="d" onclick="clearAll()">🗑 Delete ALL chats at once</button></div>
 <div id="mlist" style="max-height:460px;overflow:auto;margin-top:10px">${
    t.map(m=>`<div class="msg"><span><b>${esc(m.sender?nm(m.sender):"System")}</b> <small>${
    new Date(m.created_at).toLocaleString()}</small><br>${
    m.file_path?`📎 ${esc(m.file_name)} `:""}${esc(m.body)}</span><button class="s" title="Delete" onclick="delMsg(${m.id})">🗑</button></div>`).join("")||"<p class='mu'>No messages</p>"}</div></div>`}
function clearAll(){
  confirmBox("Delete <b>every</b> message in <b>every</b> chat ("+M.length+" messages)? This cannot be undone.",async()=>{
    await call("admin_clear_all_chats",{
      },"All chats cleared")})}
function delMsg(id){
  confirmBox("Delete this message?",async()=>{
    await call("admin_delete_message",{
      i:id},"Message deleted")})}
function clearCh(){
  confirmBox("Delete ALL messages in <b>"+esc(title(chSel))+"</b>?",async()=>{
    await call("admin_clear_channel",{
      ch:chSel},"Chat cleared")})}

/* ---------- close the day ---------- */
const day=()=>`<h1>Close the day</h1><p class="sub">When the presentations are over, archive every chat and start fresh</p>
 <div class="card"><p>All current chats are moved to a <b>read-only archive</b>. Group members and the people in each DM can still read their old chats on the main site (🗂 Archive), but nothing can be added. Points stay.</p>
 <label>Name of this archive</label><input id="d_lbl" value="${esc(dayLabel||"Presentation day · "+new Date().toLocaleDateString())}" oninput="dayLabel=this.value">
 <label style="display:flex;gap:8px;align-items:center;color:var(--tx)"><input type="checkbox" id="d_dis" ${
  dayDis?"checked":""} onchange="dayDis=this.checked" style="width:auto"> Also dissolve all groups (everyone becomes idle)</label>
 <div style="margin-top:14px"><button class="d" onclick="closeDay()">🗂 Close the day and archive chats</button></div></div>
 <div class="card"><b>Archives</b>${
  AR.map(a=>`<div class="li" onclick="openAr(${a.id})"><div class="g"><b>${esc(a.label)}</b><br><span class="mu">${new Date(a.created_at).toLocaleString()} · ${a.n||0} messages</span></div><span>›</span></div>`).join("")||"<p class='mu'>No archives yet</p>"}</div>`;
function closeDay(){
  const l=val("d_lbl"),d=$("#d_dis").checked;confirmBox("Archive <b>"+M.length+"</b> messages"+(d?" and dissolve all groups":"")+"? Students will see an empty chat afterwards.",async()=>{
    if(await call("admin_close_day",{
      lbl:l,dissolve:d},"Day closed. Chats archived."))dayLabel=""},"Yes, close the day")}
async function openAr(id){
  const a=AR.find(x=>x.id===id),r=await sb.from("archived_messages").select("*").eq("archive_id",id).order("id");const by={
    };(r.data||[]).forEach(m=>{
    (by[m.channel_label]=by[m.channel_label]||[]).push(m)});
 modal(`<h3>${esc(a.label)}</h3>${
  Object.keys(by).map(k=>`<p style="margin:12px 0 4px"><b>${esc(k)}</b> <span class="mu">${
  by[k].length}</span></p>${
  by[k].slice(0,40).map(m=>`<div class="msg"><span><b>${esc(m.sender?nm(m.sender):"System")}</b><br>${
  m.file_path?"📎 "+esc(m.file_name)+" ":""}${
  esc(m.body)}</span></div>`).join("")}`).join("")||"<p class='mu'>Empty</p>"}<div class="row" style="margin-top:12px"><button class="s" style="flex:1" onclick="closeM()">Close</button></div>`)}

/* ---------- import names ---------- */
const unused=()=>P.filter(p=>!p.is_admin&&/^Student \d+$/.test(p.name)).length;
const imp=()=>`<h1>Import names</h1><p class="sub">Paste the class list. IDs and temporary passwords are created automatically.</p><div class="card"><p>One full name per line, for example <b>Əli Məmmədov</b>. The ID becomes <b>ali.m</b> (first name, dot, first letter of the surname). Students type that ID and the temporary password, then choose their own password.</p><p class="mu">Free accounts that nobody has used yet: <b>${
  unused()}</b>. Accounts that already have a changed password are never touched.</p>
 <textarea id="imp" rows="10" placeholder="Əli Məmmədov&#10;Aysel Hüseynova&#10;…" oninput="impText=this.value">${
  esc(impText)}</textarea><div style="margin-top:10px"><button onclick="doImport()">📥 Create IDs and passwords</button></div></div>`;
async function doImport(){const names=impText.split("\n").map(s=>s.trim()).filter(Boolean);if(!names.length){toast("Paste at least one name",1);return}
 confirmBox("Create accounts for <b>"+names.length+"</b> students? New temporary passwords are generated.",async()=>{const {data,error}=await sb.rpc("admin_import_students",{names});if(error){toast(error.message,1);return}impText="";await load();showImport(data||[])},"Create")}
const csvOf=rows=>"\ufeffName,ID,Temporary password\n"+rows.map(r=>[r.new_name,r.new_login,r.temp_password].map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(",")).join("\n");
function showImport(rows){window.__rows=rows;modal(`<h3>✅ ${
  rows.length} students ready</h3><p class="mu">Save this now. The passwords are shown only once.</p><div style="max-height:46vh;overflow:auto"><table><tr><th>Name</th><th>ID</th><th>Password</th></tr>${
  rows.map(r=>`<tr><td>${esc(r.new_name)}</td><td><b>${
  esc(r.new_login)}</b></td><td><code>${
  esc(r.temp_password)}</code></td></tr>`).join("")}</table></div><div class="row wrap" style="margin-top:12px"><button onclick="dlCsv()">⬇ Download CSV</button><button class="s" onclick="copy(window.__rows.map(r=>r.new_name+'\\t'+r.new_login+'\\t'+r.temp_password).join('\\n'))">Copy all</button><button class="s" onclick="closeM()">Close</button></div>`)}
function dlCsv(){
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csvOf(window.__rows)],{
    type:"text/csv"}));a.download="students.csv";a.click()}

/* ---------- settings ---------- */
const settings=()=>`<h1>Settings</h1><p class="sub">Rules of the site</p><div class="card"><b>Group limit</b><p class="mu">With 30 students in groups of 5, six groups are enough.</p><div class="row"><select id="mg">${[1,2,3,4,5,6,7,8,9,10,11,12].map(n=>`<option ${n===maxG()?"selected":""}>${
  n}</option>`).join("")}</select><button onclick="saveMax()">Save</button></div></div>
 <div class="card" style="border-color:#dc2626"><b style="color:#dc2626">Danger zone</b><p class="mu">Deletes ALL messages, archives, point history and groups, and sets every score to 0. Accounts and passwords stay. Use it once, to clear test data before launch.</p><button class="d" onclick="resetAll()">Clear all data…</button></div>`;
async function saveMax(){
  await call("admin_set_setting",{
    k:"max_groups",v:val("mg")},"Saved")}
function resetAll(){
  modal(`<h3 style="color:#dc2626">Clear all data?</h3><p>This cannot be undone. Type <b>RESET</b> to confirm.</p><input id="rs" placeholder="RESET"><div class="row" style="margin-top:12px"><button class="s" onclick="closeM()">Cancel</button><button class="d" onclick="if(val('rs')==='RESET'){closeM();call('admin_reset_all',{},'Everything cleared')}else toast('Type RESET exactly',1)">Clear everything</button></div>`)}

async function boot(){
  sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);const {
    data}=await sb.auth.getSession();if(data.session){
    uid=data.session.user.id;await enter()}else loginView()}
addEventListener("pointerdown",()=>{
  pressing=true;pressTs=Date.now()},true);
["pointerup","pointercancel"].forEach(ev=>addEventListener(ev,()=>{
  setTimeout(()=>{
    pressing=false;if(pendingDraw)draw()},20)},true));
boot();
