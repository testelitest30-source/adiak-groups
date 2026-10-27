/* =====================================================================
   core.js  -  Ümumi köməkçilər, vəziyyət dəyişənləri, səslər, bildirişlər, məlumat yükləmə (real vaxt)
   Yüklənmə sırası: config.js → core.js → pages.js → main.js
   ===================================================================== */

const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let pressing=false,pressTs=0,pmSig="",SET={max_groups:6},menuOpen=false,MYSID=null,navStack=[],restoring=false,lastSnap=null,pmDrawn=null,wasNotes=false,URLS={},needUrls=new Set(),rec=null,pendingRender=false,PE=[],pm=null,sb=null,chan=null,uid=null,screen="boot",err="",roster=[],P={},G=[],RQ=[],JB=[],KK=[],KB=[],IV=[],M=[],online=new Set(),SEEN={};
let lastSig="",NOTES=[],notesOpen=false,tab="groups",openG=null,conv=null,sheet=false,sp=null,tm=null,tt=null,ready=false,quietUntil=0,lastKey="",lastMax=0,muted=false,AC=null;
try{muted=localStorage.getItem("mute")==="1"}catch(e){}
const phone=()=>innerWidth<=800, ME=()=>P[uid], grp=id=>G.find(g=>g.id===id), nameOf=id=>P[id]?P[id].name:"?";
// Bu hesabın verilmiş yetkisi varmı? (admin hər şeyi edə bilər)
const can=p=>{const u=ME(),a=(u&&u.perms)||[];return !!u&&(u.is_admin||a.includes("admin")||a.includes(p))};
const adm=p=>!!p&&(p.is_admin||(p.perms||[]).includes("admin"));
// Adın yanındakı rol nişanı (Admin, Teacher, Scorer)
const tag=p=>!p?"":adm(p)?' <span class="chip tag">🛡 Admin</span>':p.role==="teacher"?' <span class="chip tag3">👩‍🏫 '+tr("Teacher")+'</span>':(p.perms||[]).includes("points")?' <span class="chip tag2">⭐ '+tr("Scorer")+'</span>':"";
const PERM_TEXT={points:"give points",groups:"manage groups (add, move, remove students)",chats:"moderate chats",passwords:"see students' passwords",panel:"open the admin panel",admin:"do everything"};
const permList=p=>["admin","points","groups","chats","passwords","panel"].filter(k=>p&&(p.is_admin||(p.perms||[]).includes("admin")||(p.perms||[]).includes(k)))
// Sağ alt küncdəki 'Created by' kartı
const credits=inl=>`<div class="credits${inl?" inline":""}"><small>${tr("Created by")}</small><div><b>Sübhan Camalzadə</b> <span class="chip tag">🛡 Admin</span></div><div><b>Nurəli Qasımlı</b> <span class="chip tag">🛡 Admin</span></div></div>`;
// Tələbələrin siyahısı (müəllim və Host daxil deyil)
const ppl=()=>Object.values(P).filter(p=>!p.is_admin&&p.role!=="teacher").sort((a,b)=>a.name.localeCompare(b.name));
// Akademik qrup (class_tag): tələbə yalnız öz akademik qrupunun komandalarını və boş tələbələrini görür; müəllim/admin hamısını görür
const viewerTag=()=>{const u=ME();return u&&u.role==="student"&&!u.is_admin?(u.class_tag||null):undefined};   // undefined = məhdudiyyət yoxdur
const sameClass=x=>{const t=viewerTag();return t===undefined||(!!t&&x.class_tag===t)};
const visG=()=>G.filter(sameClass);
const needTag=()=>{const u=ME();return !!u&&u.role==="student"&&!u.is_admin&&!u.class_tag};
const mem=g=>ppl().filter(p=>p.group_id===g), idle=()=>ppl().filter(p=>p.group_id===null&&sameClass(p));
const gname=id=>{const g=grp(id);return g?g.name:"?"}, gcol=id=>`hsl(${(id*67+200)%360} 70% 52%)`;
const gchip=p=>p.is_admin?`<span class="chip">${tr("host")}</span>`:p.role==="teacher"?`<span class="chip">${tr("teacher")}</span>`:p.group_id===null?`<span class="chip on">${tr("idle")}</span>`:`<span class="chip" style="background:${gcol(p.group_id)}22;color:${gcol(p.group_id)}">${esc(gname(p.group_id))}</span>`;
const dots=(k,c,col)=>Array.from({length:c},(_,i)=>`<i class="dot" style="${i<k?"background:"+col:""}"></i>`.replace('class="dot"',i<k?'class="dot f"':'class="dot"')).join("");
const dmKey=(a,b)=>a<b?`d:${a}:${b}`:`d:${b}:${a}`;
const RANKS=[["Newcomer",0],["Speaker",10],["Orator",25],["Maestro",50]];
const rank=p=>{let i=0;RANKS.forEach((r,j)=>{if(p>=r[1])i=j});const nx=RANKS[i+1];return{name:tr(RANKS[i][0]),pct:nx?Math.round((p-RANKS[i][1])/(nx[1]-RANKS[i][1])*100):100}};
const av=(p,c="")=>{let h=0;for(const ch of p.name)h=(h*31+ch.charCodeAt(0))%360;
 return`<div class="av ${c}" onclick="event.stopPropagation();showProfile('${p.id}')" style="background:hsl(${h},55%,48%)">${p.avatar?`<img src="${esc(p.avatar)}" alt="">`:esc(p.name[0].toUpperCase())}${online.has(p.id)?'<i class="on"></i>':""}</div>`};

/* ================= SƏSLƏR (hazır fayl yoxdur, brauzerdə yaradılır) ================= */
// Brauzerdə tək bir səs tonu yaradır
function tone(f,d,t="sine",v=.08,at=0){if(muted)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();const o=AC.createOscillator(),g=AC.createGain(),s=AC.currentTime+at;o.type=t;o.frequency.setValueAtTime(f,s);g.gain.setValueAtTime(v,s);g.gain.exponentialRampToValueAtTime(.0001,s+d);o.connect(g);g.connect(AC.destination);o.start(s);o.stop(s+d)}catch(e){}}
// Hazır səslər: mesaj, klik, xəbərdarlıq, uğur, xəta
const snd={msg:()=>{tone(784,.1,"sine",.09);tone(1047,.22,"sine",.09,.11)},click:()=>tone(520,.04,"triangle",.04),pop:()=>tone(660,.09,"triangle"),ding:()=>{tone(880,.12);tone(1320,.2,"sine",.06,.09)},
 ok:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.2,"triangle",.09,i*.09)),alert:()=>{tone(740,.1,"square",.035);tone(988,.16,"square",.035,.12)},err:()=>{tone(180,.28,"sawtooth",.06)}};
const cb=n=>n?`<span class="ub">${n>99?"99+":n}</span>`:"";
const prev=(m,n=34)=>m.file_path?(/^image\//.test(m.file_type)?"🖼️ "+tr("Photo"):/^audio\//.test(m.file_type)?"🎤 "+tr("Voice message"):"📎 "+m.file_name):(m.sender===null?trSys(m.body):m.body).slice(0,n);
const fsize=n=>n<1024?n+" B":n<1048576?Math.round(n/1024)+" KB":(n/1048576).toFixed(1)+" MB";
const ficon=(t,n)=>/powerpoint|presentation|\.pptx?$/i.test(t+n)?"📊":/pdf/i.test(t+n)?"📕":/word|document|\.docx?$/i.test(t+n)?"📝":/excel|sheet|\.xlsx?$/i.test(t+n)?"📈":/zip|rar|7z/i.test(t+n)?"🗜️":"📎";
function urlFor(p){const c=URLS[p];if(c&&c.exp>Date.now())return c.url;needUrls.add(p);return""}
async function fetchUrls(){if(!needUrls.size||!sb)return;const paths=[...needUrls];needUrls.clear();let d=null;try{d=(await sb.storage.from("chat-files").createSignedUrls(paths,3600)).data}catch(e){}
 paths.forEach((p,i)=>{URLS[p]=d&&d[i]&&d[i].signedUrl?{url:d[i].signedUrl,exp:Date.now()+3300000}:{url:"",exp:Date.now()+20000}});if(paths.some(p=>URLS[p].url))render()}
// Mesajdakı fayl, şəkil və ya səsin HTML-i
function fileHtml(m){if(!m.file_path)return"";const u=urlFor(m.file_path),t=m.file_type||"";
 if(/^image\//.test(t))return u?`<img class="ph" src="${esc(u)}" alt="${esc(m.file_name)}" onclick="window.open(this.src)">`:`<div class="file">🖼️ ${tr("Loading…")}</div>`;
 if(/^audio\//.test(t))return u?`<audio controls preload="metadata" src="${esc(u)}"></audio>`:`<div class="file">🎤 ${tr("Loading…")}</div>`;
 return`<a class="file" ${u?`href="${esc(u)}" target="_blank" rel="noopener"`:""}><span class="ic">${ficon(t,m.file_name)}</span><span style="min-width:0"><b>${esc(m.file_name)}</b><br><small class="mu">${fsize(m.file_size||0)}${u?" · "+tr("tap to open"):""}</small></span></a>`}
function pickFile(inp){const f=inp.files[0];inp.value="";if(f)sendFile(f)}
// Faylı yükləyir və çata göndərir (25 MB-a qədər)
async function sendFile(f){if(!conv)return;if(f.size>26214400){toast(tr("Files must be under 25 MB"),1);snd.err();return}
 toast(tr("Uploading {name}…",{name:f.name}));const ch=conv,safe=f.name.replace(/[^\w.\-]+/g,"_").slice(-60),path=uid+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,7)+"-"+safe;
 const up=await sb.storage.from("chat-files").upload(path,f,{contentType:f.type||"application/octet-stream"});
 if(up.error){toast(trErr(up.error.message),1);snd.err();return}
 if(await rpc("send_file",{ch,path,fname:f.name,ftype:f.type||"",fsize:f.size,caption:""})){snd.pop();toast(tr("Sent ✓"))}}
const recTime=()=>{const s=Math.floor((Date.now()-rec.t0)/1000);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
// Səs yazmağı başladır / göndərir
async function toggleRec(){if(rec){stopRec(true);return}
 if(!navigator.mediaDevices||!window.MediaRecorder){toast(tr("Voice recording is not supported in this browser"),1);return}
 try{const st=await navigator.mediaDevices.getUserMedia({audio:true}),mt=["audio/webm;codecs=opus","audio/webm","audio/mp4"].find(t=>MediaRecorder.isTypeSupported(t))||"",mr=new MediaRecorder(st,mt?{mimeType:mt}:{});
  rec={mr,st,chunks:[],t0:Date.now(),send:true,ch:conv,iv:setInterval(()=>{const b=$("#micbtn");if(b&&rec)b.textContent="⏹ "+recTime()+" · "+tr("send");if(rec&&Date.now()-rec.t0>300000)stopRec(true)},500)};
  mr.ondataavailable=e=>{if(e.data.size)rec.chunks.push(e.data)};
  mr.onstop=()=>{const r=rec;clearInterval(r.iv);r.st.getTracks().forEach(t=>t.stop());rec=null;render();if(!r.send||!r.chunks.length)return;
   const type=(mr.mimeType||"audio/webm").split(";")[0],ext=type.includes("mp4")?"m4a":"webm";conv=r.ch;sendFile(new File(r.chunks,"voice-"+new Date().toISOString().slice(11,19).replace(/:/g,"")+"."+ext,{type}))};
  mr.start();render()}catch(e){toast(tr("Microphone access was denied"),1)}}
function stopRec(send){if(!rec)return;rec.send=send;rec.mr.stop()}
const cancelRec=()=>stopRec(false);
function toggleMute(){muted=!muted;try{localStorage.setItem("mute",muted?"1":"0")}catch(e){}if(!muted)snd.ding();render()}
addEventListener("click",e=>{if(e.target.closest&&e.target.closest("button,.gr,.li"))snd.click()},true);

// Ekranın altında qısa xəbər göstərir (qırmızı = xəta)
function toast(m,bad){const t=$("#toast");t.textContent=m;t.className="show"+(bad?" bad":"");clearTimeout(tt);tt=setTimeout(()=>{t.className=""},3800)}
// Bazadakı funksiyanı çağırır, uğurlu olsa məlumatı yeniləyir
async function rpc(fn,a){quietUntil=Date.now()+3000;const {error}=await sb.rpc(fn,a);if(error){toast(trErr(error.message),1);snd.err();return false}await refresh(true);return true}
function closeM(){pm=null;pmDrawn=null;pmSig="";$("#modal").innerHTML=""}
// Bəli / Ləğv təsdiq pəncərəsi
function ask(t,fn){$("#modal").innerHTML=`<div class="ov"><div class="card" style="max-width:340px"><p>${t}</p><div class="row"><button class="s" style="flex:1" onclick="closeM()">${tr("Cancel")}</button><button class="d" style="flex:1" id="yes">${tr("Yes")}</button></div></div></div>`;$("#yes").onclick=()=>{closeM();fn()}}
// Konfeti animasiyası
function party(){for(let i=0;i<34;i++){const e=document.createElement("span");e.className="pt";e.textContent=["🎉","✨","🎊","⭐","💜"][i%5];e.style.left=Math.random()*100+"vw";e.style.animationDelay=Math.random()*.7+"s";document.body.appendChild(e);setTimeout(()=>e.remove(),3000)}}

/* ================= OXUNMAMIŞ MESAJLAR VƏ MƏNƏ AİD İŞLƏR ================= */
const loadSeen=()=>{try{SEEN=JSON.parse(localStorage.getItem("seen:"+uid))||{}}catch(e){SEEN={}}};
const saveSeen=()=>{try{localStorage.setItem("seen:"+uid,JSON.stringify(SEEN))}catch(e){}};
// Bir çatdakı oxunmamış mesajların sayı
const unread=ch=>M.filter(m=>m.channel===ch&&m.sender!==null&&m.sender!==uid&&m.id>(SEEN[ch]||0)).length;
const totalUnread=()=>{let n=0;new Set(M.map(m=>m.channel)).forEach(c=>{n+=unread(c)});return n};
const visibleConv=()=>conv&&(!phone()||(sheet&&sp==="chat"))?conv:null;
// Açıq çatı oxunmuş kimi qeyd edir
function markSeen(all){const chs=all?[...new Set(M.map(m=>m.channel))]:(visibleConv()?[conv]:[]);let ch=false;
 chs.forEach(c=>{const ids=M.filter(m=>m.channel===c).map(m=>m.id);if(ids.length){const mx=Math.max(...ids);if((SEEN[c]||0)<mx){SEEN[c]=mx;ch=true}}});if(ch)saveSeen()}
// Mənim hərəkət etməli olduğum müraciətlər və kick səsvermələri
function myVotes(){const u=ME();if(!u||u.group_id===null)return{j:[],k:[]};const g=grp(u.group_id),host=!!g&&g.host_id===uid;
 return{j:RQ.filter(r=>r.group_id===u.group_id&&(r.stage==="pending"||(r.stage==="voting"&&!JB.some(b=>b.request_id===r.id&&b.voter_id===uid))||(r.stage==="approved"&&host))),
  k:KK.filter(x=>x.group_id===u.group_id&&x.target_id!==uid&&!KB.some(b=>b.kick_id===x.id&&b.voter_id===uid))}}
// Mənə göndərilən dəvətlər
const myInvites=()=>ME()&&ME().group_id===null?IV.filter(x=>x.user_id===uid):[];
// Gözləyən işlərin ümumi sayı (qırmızı nişan)
const inboxCount=()=>{const v=myVotes();return v.j.length+v.k.length+myInvites().length};

/* ================= BİLDİRİŞLƏR (səs + sağ altda kart + siyahı) ================= */
const loadNotes=()=>{try{NOTES=JSON.parse(localStorage.getItem("notes:"+uid))||[]}catch(e){NOTES=[]}};
const saveNotes=()=>{try{localStorage.setItem("notes:"+uid,JSON.stringify(NOTES))}catch(e){}};
const unreadNotes=()=>NOTES.filter(n=>!n.read).length;
function readNotes(){if(NOTES.some(n=>!n.read)){NOTES.forEach(n=>{n.read=true});saveNotes()}}
function ago(t){const s=Math.max(0,Math.round((Date.now()-t)/1000));return s<60?tr("just now"):s<3600?tr("{n} min ago",{n:Math.floor(s/60)}):s<86400?tr("{n} h ago",{n:Math.floor(s/3600)}):tr("{n} d ago",{n:Math.floor(s/86400)})}
// Bildiriş yaradır: səs + sağ altda kart + bildiriş siyahısına əlavə
function notify(t,b,act,sound){NOTES.unshift({id:Date.now()+Math.random(),t,b:b||"",act:act||null,time:Date.now(),read:false});NOTES=NOTES.slice(0,40);saveNotes();(snd[sound||"ding"])();try{if(document.hidden&&window.Notification&&Notification.permission==="granted")new Notification(t,{body:b||""})}catch(x){}
 try{const box=$("#toasts"),e=document.createElement("div");e.className="nt";e.innerHTML="<b>"+esc(t)+"</b>"+(b?"<small>"+esc(b)+"</small>":"");e.onclick=()=>{e.remove();go(act)};box.appendChild(e);while(box.children.length>3)box.removeChild(box.firstChild);setTimeout(()=>{if(e.remove)e.remove()},6500)}catch(x){}}
// Bildirişə basanda müvafiq səhifəni açır
function go(a){if(notesOpen)readNotes();notesOpen=false;if(!a){render();return}
 if(a.k==="chat"){openChat(a.ch);return}
 if(a.k==="req"){if(phone()){sheet=true;sp="req"}else{tab="req";openG=null}render();return}
 if(a.k==="group"){openG=a.id;if(phone()){sheet=false;sp=null}else tab="groups";render()}}
// Verilmiş çatı açır (telefonda tam səhifə)
function openChat(ch){if(pm)closeM();conv=ch;notesOpen=false;menuOpen=false;if(phone()){sheet=true;sp="chat"}render()}
const openDM=id=>openChat(dmKey(uid,id));
function toggleNotes(){if(notesOpen)readNotes();notesOpen=!notesOpen;render()}
const noteRows=()=>NOTES.length?NOTES.map((n,i)=>`<div class="nrow${n.read?"":" un"}" onclick="go(NOTES[${i}].act)"><b>${esc(n.t)}</b>${n.b?`<br><span class="mu">${esc(n.b)}</span>`:""}<br><small>${ago(n.time)}</small></div>`).join(""):"<p class='mu'>"+tr("No notifications yet")+"</p>";
const noteHead=()=>`<div class="row sp"><b>🔔 ${tr("Notifications")}</b><button class="s" onclick="readNotes();render()">${tr("Mark all read")}</button></div>`;
const notesPanel=()=>`<div id="notes" class="card">${noteHead()}${noteRows()}</div>`;
const notesPage=()=>`<div class="card">${noteHead()}${noteRows()}</div>`;

/* ================= MƏLUMAT YÜKLƏMƏ VƏ REAL VAXT ================= */
// Bütün məlumatı bazadan yükləyir və səhifəni yeniləyir
// Hər cədvəlin sorğusu ayrıdır: real vaxtda yalnız dəyişən cədvəli yeniləmək üçün (10 sorğu əvəzinə 1)
const TBL={profiles:()=>sb.from("profiles").select("id,name,avatar,points,group_id,is_admin,perms,role,class_tag"),groups:()=>sb.from("groups").select("*").order("id"),
 requests:()=>sb.from("requests").select("*"),join_ballots:()=>sb.from("join_ballots").select("*"),kicks:()=>sb.from("kicks").select("*"),kick_ballots:()=>sb.from("kick_ballots").select("*"),invites:()=>sb.from("invites").select("*"),
 point_events:()=>sb.from("point_events").select("*").order("id",{ascending:false}).limit(500),messages:()=>sb.from("messages").select("*").order("id",{ascending:false}).limit(300),sessions:()=>sb.from("sessions").select("sid").eq("user_id",uid)};
const ALLT=Object.keys(TBL);let SIGS={};
// Dəyişiklikdən əvvəlki vəziyyətin şəkli (diff() bildirişləri bununla müqayisə edir)
const snapOld=()=>{const u0=ME();return{pts:u0?u0.points:0,g:u0?u0.group_id:null,rqs:new Map(RQ.map(x=>[x.id,x.stage])),kk:new Set(KK.map(x=>x.id)),iv:new Set(IV.map(x=>x.id)),mx:M.length?M[M.length-1].id:0,
  mem:new Set(u0&&u0.group_id!==null?mem(u0.group_id).map(x=>x.id):[]),my:new Set(RQ.filter(x=>x.user_id===uid).map(x=>x.id))}};
// Məlumatı bazadan yükləyir və səhifəni yeniləyir. tables verilsə yalnız o cədvəllər yüklənir; force=true hamısını yükləyib mütləq yeniləyir
async function refresh(force,tables){
 const want=!ready||force||!tables||!tables.length?ALLT:[...new Set(tables)].filter(t=>TBL[t]);
 if(!want.length)return true;
 const res=await Promise.all(want.map(t=>TBL[t]())),R={};want.forEach((t,i)=>{R[t]=res[i]});
 if((R.profiles&&R.profiles.error)||(R.groups&&R.groups.error)){toast(tr("Connection problem. Retrying…"),1);if(ready){clearTimeout(tm);tm=setTimeout(()=>refresh(),2500)}return false}
 const se=R.sessions;if(se&&se.data&&se.data[0]&&MYSID&&se.data[0].sid!==MYSID){await kickedOut();return false}
 // Hansı cədvəllərin məlumatı həqiqətən dəyişib? Dəyişməyibsə ekranı yeniləmirik (yazan adamın ekranı pozulmasın)
 const ok=t=>!!(R[t]&&!R[t].error&&R[t].data),ch=[];
 want.forEach(t=>{if(t==="sessions"||!ok(t))return;const sg=JSON.stringify(R[t].data);if(sg!==SIGS[t]){SIGS[t]=sg;ch.push(t)}});
 if(ready&&!force&&!ch.length)return true;
 const o=snapOld(),A=t=>(force||ch.includes(t))&&ok(t);
 if(A("profiles")){P={};R.profiles.data.forEach(x=>{P[x.id]=x})}
 if(A("groups"))G=R.groups.data;if(A("requests"))RQ=R.requests.data;if(A("join_ballots"))JB=R.join_ballots.data;if(A("kicks"))KK=R.kicks.data;
 if(A("kick_ballots"))KB=R.kick_ballots.data;if(A("invites"))IV=R.invites.data;if(A("point_events"))PE=R.point_events.data;if(A("messages"))M=[...R.messages.data].reverse();
 const u=ME();if(u&&conv&&conv[0]==="g"&&u.group_id!==+conv.slice(2))conv=null;
 if(!ready){if(!Object.keys(SEEN).length)markSeen(true);ready=true;const n=inboxCount(),tx="📬 "+(n>1?tr("{n} items waiting for you",{n}):tr("1 item waiting for you"));if(n&&!(NOTES[0]&&!NOTES[0].read&&NOTES[0].t===tx))notify(tx,tr("Open Requests"),{k:"req"},"alert")}else diff(o);
 render();return true}
// Real vaxtda gələn yeni mesajı sorğu göndərmədən birbaşa siyahıya əlavə edir (ən sürətli yol)
function onMsg(n){if(!ready||!n||n.id==null)return false;const o=snapOld();
 M=M.filter(m=>!(m._tmp&&n.sender===uid&&m.channel===n.channel&&m.body===n.body));
 if(!M.some(m=>m.id===n.id)){M.push(n);M.sort((a,b)=>a.id-b.id)}if(M.length>600)M=M.slice(-400);
 SIGS.messages=null;diff(o);render();return true}
// Köhnə və yeni məlumatı müqayisə edib lazımi bildirişləri yaradır
function diff(o){const u=ME();if(!u)return;const dp=u.points-o.pts;if(dp>0){sparks();notify("⭐ +"+dp+" "+tr("points!"),tr("Your total is now {n}",{n:u.points}),null,"ok")}const g=u.group_id,isHost=g!==null&&grp(g)&&grp(g).host_id===uid;
 if(o.g===null&&g!==null){party();notify("🎉 "+tr("You joined {g}",{g:gname(g)}),tr("Welcome to the group!"),{k:"group",id:g},"ok")}
 else if(o.g!==null&&g===null&&Date.now()>quietUntil)notify(tr("You are no longer in {g}",{g:gname(o.g)}),"",null,"err");
 if(g!==null){
  RQ.forEach(r=>{if(r.group_id!==g||r.user_id===uid)return;const was=o.rqs.get(r.id),nm=nameOf(r.user_id);
   if(was===undefined)notify("🙋 "+tr("{nm} wants to join",{nm}),tr("Open Requests and put it to a vote"),{k:"req"},"alert");
   else if(was==="pending"&&r.stage==="voting")notify("🗳️ "+tr("Vote opened for {nm}",{nm}),tr("Cast your vote in Requests"),{k:"req"},"alert");
   else if(was!=="approved"&&r.stage==="approved"&&isHost)notify("✅ "+tr("Majority approved {nm}",{nm}),tr("Your final decision is needed"),{k:"req"},"alert")});
  KK.filter(k=>k.group_id===g&&k.target_id!==uid&&!o.kk.has(k.id)).forEach(k=>notify("🗳️ "+tr("Kick vote for {nm}",{nm:nameOf(k.target_id)}),tr("Cast your vote in Requests"),{k:"req"},"alert"));
  if(o.g===g)mem(g).filter(p=>p.id!==uid&&!o.mem.has(p.id)).forEach(p=>notify("👋 "+tr("{nm} joined your group",{nm:p.name}),"",{k:"group",id:g},"ok"))}
 IV.filter(x=>x.user_id===uid&&!o.iv.has(x.id)&&g===null).forEach(x=>notify("💌 "+tr("{g} invited you!",{g:gname(x.group_id)}),tr("Open Requests to accept"),{k:"req"},"alert"));
 RQ.filter(r=>r.user_id===uid).forEach(r=>{const was=o.rqs.get(r.id);
  if(was==="pending"&&r.stage==="voting")notify("🗳️ "+tr("Members are voting on your request"),gname(r.group_id),null,"ding");
  if(was!==undefined&&was!=="approved"&&r.stage==="approved")notify("👍 "+tr("Members approved your request"),tr("Waiting for the host's final decision"),null,"ok")});
 if(g===null&&o.g===null&&Date.now()>quietUntil&&[...o.my].some(id=>!RQ.some(r=>r.id===id)))notify(tr("Your join request was declined")+" 😕","",null,"err");
 const vc=visibleConv();
 M.filter(m=>m.id>o.mx&&m.sender!==uid&&m.sender!==null).slice(-3).forEach(m=>{if(m.channel===vc){snd.pop();return}if(m.channel==="all")return;
  notify(m.channel[0]==="d"?tr("New message from {nm}",{nm:nameOf(m.sender)}):tr("New message in {g} from {nm}",{g:gname(+m.channel.slice(2)),nm:nameOf(m.sender)}),prev(m,60),{k:"chat",ch:m.channel},"msg")})}
// Dəyişən cədvəllərin adını toplayıb 150 ms sonra yalnız onları yeniləyir
let pendT=new Set(),pendAll=false;
const sched=t=>{if(t)pendT.add(t);else pendAll=true;clearTimeout(tm);tm=setTimeout(()=>{const ts=pendAll?null:[...pendT];pendT=new Set();pendAll=false;refresh(false,ts)},150)};
// Real vaxt bağlantısı: bazada dəyişiklik olanda avtomatik yeniləyir
function subscribe(){if(chan)return;
 chan=sb.channel("room",{config:{presence:{key:uid}}})
  .on("postgres_changes",{event:"*",schema:"public"},ev=>{const t=ev.table;
   if(t==="app_settings"){loadMeta().then(render);return}
   if(t==="messages"&&ev.eventType==="INSERT"&&onMsg(ev.new))return;
   sched(t);if(t==="profiles")sched("point_events")})
  .on("presence",{event:"sync"},()=>{const n=new Set(Object.keys(chan.presenceState())),same=n.size===online.size&&[...n].every(x=>online.has(x));online=n;if(!same)render()})
  .subscribe(s=>{if(s==="SUBSCRIBED")chan.track({at:Date.now()})})}

/* ================= AYARLAR VƏ TƏK CİHAZ QAYDASI ================= */
const maxG=()=>+SET.max_groups||6;
// Sayt ayarlarını (qrup limiti) yükləyir
async function loadMeta(){try{const a=await sb.from("app_settings").select("*");(a.data||[]).forEach(x=>{SET[x.key]=x.value})}catch(e){}}
// Hesaba başqa cihazdan girilibsə bu cihazı çıxarır
async function kickedOut(){if(!uid)return;if(chan){try{await sb.removeChannel(chan)}catch(e){}chan=null}try{await sb.auth.signOut({scope:"local"})}catch(e){}
 try{localStorage.removeItem("sid")}catch(e){}MYSID=null;uid=null;conv=null;sheet=false;sp=null;openG=null;menuOpen=false;navStack=[];if(rec)stopRec(false);online=new Set();ready=false;NOTES=[];notesOpen=false;PE=[];closeM();
 err=tr("You were signed out because this account was opened on another device.");screen="login";render()}

