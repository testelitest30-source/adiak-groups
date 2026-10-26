/* =====================================================================
   pages.js  -  Ekranda görünən hər şeyin HTML-i: kartlar, səhifələr, profil pəncərəsi, view() və render()
   ===================================================================== */
/* ================= KARTLAR (qrupa qəbul və kick səsverməsi) ================= */
// Qrupa qəbul müraciətinin kartı (3 mərhələ: müraciət, oylama, host qərarı)
function joinCard(r){const gid=r.group_id,g=grp(gid),inG=ME().group_id===gid,isHost=!!g&&(g.host_id===uid||can("groups")),n=mem(gid).length,need=Math.floor(n/2)+1,v=JB.filter(b=>b.request_id===r.id&&P[b.voter_id]&&P[b.voter_id].group_id===gid),y=v.filter(b=>b.approve).length,my=v.find(b=>b.voter_id===uid),who=P[r.user_id];
 let act="",body="";
 if(r.stage==="pending"){act=inG?`<button onclick="rpc('open_vote',{r:${r.id}})">🗳️ Put to vote</button>`:`<span class="chip">waiting</span>`;body=`<span class="mu">Step 1 of 3 · waiting for a member to open the vote</span>`}
 else if(r.stage==="voting"){act=inG&&!my?`<span class="row"><button onclick="rpc('vote_join',{r:${r.id},ok:true})">✓ Accept</button><button class="s" onclick="rpc('vote_join',{r:${r.id},ok:false})">✗ Reject</button></span>`:my?`<span class="chip">you voted ${my.approve?"✓":"✗"}</span>`:`<span class="chip">voting</span>`;
  body=`<div class="bar"><i style="width:${Math.min(100,y/need*100)}%"></i></div><span class="mu">Step 2 of 3 · ${y}/${need} approvals needed (majority)</span>`}
 else{act=isHost?`<span class="row"><button class="ok" onclick="rpc('host_decide',{r:${r.id},ok:true})">Accept ✅</button><button class="s" onclick="rpc('host_decide',{r:${r.id},ok:false})">Decline</button></span>`:`<span class="chip">waiting for host</span>`;
  body=`<div class="bar"><i style="width:100%"></i></div><span class="mu">Step 3 of 3 · members approved · the host decides</span>`}
 return`<div class="b vote${r.stage==="approved"&&isHost?" glow":""}"><small>Join request · ${esc(gname(gid))}</small><div class="row sp"><span class="row">${who?av(who):""}<b class="pl" onclick="showProfile('${r.user_id}')">${esc(nameOf(r.user_id))}</b></span>${act}</div>${body}</div>`}
// Kick səsvermə kartı (80% lazımdır)
function kickCard(k){const gid=k.group_id,m=mem(gid).filter(p=>p.id!==k.target_id).length,need=Math.floor((4*m+4)/5),v=KB.filter(b=>b.kick_id===k.id&&b.voter_id!==k.target_id&&P[b.voter_id]&&P[b.voter_id].group_id===gid),y=v.filter(b=>b.approve).length,my=v.find(b=>b.voter_id===uid),inG=ME().group_id===gid;
 return`<div class="b vote"><small>Kick vote · ${esc(gname(gid))}</small>Remove <b>${esc(nameOf(k.target_id))}</b>?<div class="bar"><i style="width:${need?Math.min(100,y/need*100):100}%;background:#dc2626"></i></div><span class="mu">${y}/${need} approvals (80% of ${m})</span>${inG&&uid!==k.target_id&&!my?`<div class="row" style="margin-top:8px"><button onclick="rpc('vote_kick',{k:${k.id},ok:true})">✓ Approve</button><button class="s" onclick="rpc('vote_kick',{k:${k.id},ok:false})">✗ Reject</button></div>`:my?` · you voted ${my.approve?"✓":"✗"}`:""}</div>`}
const cards=()=>conv[0]==="g"?RQ.filter(r=>r.group_id===+conv.slice(2)).map(joinCard).join("")+KK.filter(k=>k.group_id===+conv.slice(2)).map(kickCard).join(""):"";

/* ================= SƏHİFƏLƏR (profil, çat, qruplar, müraciətlər, ayarlar, menyu) ================= */
// Sol üstdəki profil kartı
function profile(){const u=ME(),rk=rank(u.points);return`<div class="card"><div class="row">${av(u,"big")}<div style="flex:1"><b>${esc(u.name)}</b>${tag(u)}<br><span class="mu">${rk.name} · ${u.points} pts</span><div class="bar"><i style="width:${rk.pct}%"></i></div>${gchip(u)}</div></div></div>`}
const convOther=k=>{const x=k.split(":");return x[1]===uid?x[2]:x[1]};
function convTitle(k){if(k==="all")return"Everyone";if(k[0]==="g")return gname(+k.slice(2))+" (my group)";const x=k.split(":");return nameOf(x[1]===uid?x[2]:x[1])}
function openC(k){conv=k;render()}
const ub=n=>n?`<span class="badge">${n}</span>`:"";
// Çat siyahısı (ən son yazışma yuxarıda, oxunmamış sayı dairədə)
function chatList(){const u=ME(),LAST={};M.forEach(m=>{LAST[m.channel]=m});
 const items=[{ch:"all",t:"Everyone",d:"All students",a:`<div class="av" style="background:#4f46e5">🌍</div>`,c:""}];
 if(u.group_id!==null)items.push({ch:"g:"+u.group_id,t:gname(u.group_id),d:"Only my group",a:`<div class="av" style="background:${gcol(u.group_id)}">👥</div>`,c:""});
 Object.values(P).filter(p=>p.id!==uid).sort((a,b)=>a.name.localeCompare(b.name)).forEach(p=>items.push({ch:dmKey(uid,p.id),t:p.name,d:"Say hi 👋",a:av(p),c:gchip(p),g:tag(p)}));
 const li=x=>LAST[x.ch]?LAST[x.ch].id:0;items.forEach((x,i)=>{x.i=i});items.sort((a,b)=>li(b)-li(a)||a.i-b.i);
 return`<div class="card"><div class="row sp"><b>Chat</b>${can("chats")?`<button class="s" onclick="clearAllChats()" title="Delete every chat">🗑 Clear all</button>`:"<span></span>"}</div>${items.map(x=>{const n=unread(x.ch),m=LAST[x.ch];
  return`<div class="li${n?" un":""}" onclick="openC('${x.ch}')">${x.a}<div class="g"><b class="nm">${esc(x.t)}</b>${x.g||""} ${x.c}<br><span class="mu pv">${esc(m?(m.sender===uid?"You: ":"")+prev(m):x.d)}</span></div><span style="text-align:right;white-space:nowrap"><small class="mu">${m?hm(m.created_at):""}</small><br>${cb(n)}</span></div>`}).join("")}</div>`}
const hm=t=>{try{return new Date(t).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}catch(e){return""}};
// Açıq söhbət: mesajlar + yazma, fayl və səs düymələri
function msgsHtml(){const t=M.filter(m=>m.channel===conv);return t.map(m=>{const nw=lastMax>0&&m.id>lastMax?" new":"";return m.sender===null?`<div class="b sys${nw}">${esc(m.body)}</div>`:`<div class="b ${m.sender===uid?"me":""}${nw}">${m.sender===uid?"":`<small class="pl" onclick="showProfile('${m.sender}')">${esc(nameOf(m.sender))}${tag(P[m.sender])}</small>`}${fileHtml(m)}${m.body?esc(m.body):""}<time>${hm(m.created_at)}</time></div>`}).join("")||"<span class='mu'>No messages yet. Say hi! 👋</span>"}
function thread(){
 return`<div class="card"><div class="row sp"><button class="s" onclick="goBack()">←</button><b${conv[0]==="d"?` class="pl" onclick="showProfile('${convOther(conv)}')"`:""}>${esc(convTitle(conv))}</b>${can("chats")?`<button class="s" onclick="clearChat()" title="Delete all messages in this chat">🗑</button>`:"<span></span>"}</div>${cards()}<div id="msgs">${msgsHtml()}</div><div class="row"><input type="file" id="fi" style="display:none" onchange="pickFile(this)"><button class="s" onmousedown="event.preventDefault()" onclick="$('#fi').click()" title="Send a file or photo">📎</button><input id="tx" style="flex:1;min-width:0" maxlength="1000" placeholder="Message…" onkeydown="if(event.key==='Enter')send()"><button id="micbtn" class="s${rec?" rec":""}" onclick="toggleRec()" title="Voice message">${rec?"⏹ "+recTime()+" · send":"🎤"}</button>${rec?`<button class="s" onclick="cancelRec()" title="Cancel">✖</button>`:`<button onmousedown="event.preventDefault()" onclick="send()">Send</button>`}</div></div>`}
// Mesajı dərhal ekranda göstərir (gözləmədən), sonra bazaya göndərir
async function send(){const i=$("#tx"),x=i.value.trim();if(!x||!conv)return;i.value="";i.focus();snd.pop();
 const ch=conv,tmp={id:(M.length?M[M.length-1].id:0)+0.5,channel:ch,sender:uid,body:x,created_at:new Date().toISOString(),_tmp:1};M.push(tmp);render();
 const ok=await rpc("send_message",{ch,body:x});
 if(!ok){M=M.filter(m=>m!==tmp);const n=$("#tx");if(n&&conv===ch&&!n.value)n.value=x;render()}}
const chatPage=()=>conv===null?chatList():thread();
// Ana səhifənin üstündəki qısa vəziyyət kartı
function hero(){const u=ME();if(u.role==="teacher")return`<div class="card hero"><b>👩‍🏫 Teacher account</b><br><span class="mu">You can: ${permList(u).filter(k=>k!=="admin").map(k=>PERM_TEXT[k]).join(", ")||"chat with students"}.</span></div>`;if(u.is_admin)return`<div class="card hero"><b>👑 Host panel</b><br><span class="mu">Give points in Settings. You can start a kick vote in any group.</span></div>`;
 const g=u.group_id!==null?grp(u.group_id):null;
 return g?`<div class="card hero" style="border-left:5px solid ${gcol(g.id)}"><b>You're in ${esc(g.name)}</b><br><span class="mu">${mem(g.id).length}/${g.capacity} members${g.host_id===uid?" · you are the host 👑":""}</span></div>`
  :`<div class="card hero"><span class="wave">👋</span> <b>You're idle</b><br><span class="mu">Open a group and send a join request, create your own, or wait for an invitation.</span></div>`}
function groupsHtml(){return G.map(g=>{const k=mem(g.id).length,mine=ME().group_id===g.id,pend=RQ.some(r=>r.user_id===uid&&r.group_id===g.id);return`<div class="gr" style="border-left:5px solid ${gcol(g.id)}" onclick="openG=${g.id};render()"><div><b>${esc(g.name)}</b> ${mine?'<span class="chip on">my group</span>':pend?'<span class="chip">requested</span>':""}<br>${dots(k,g.capacity,gcol(g.id))}</div><span class="mu">${k}/${g.capacity} · ${g.capacity-k} free</span></div>`}).join("")}
const ranked=()=>ppl().sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name));
// Top 5 xal siyahısı
const board=()=>`<div class="card"><b>🏆 Top points</b>${ranked().filter(p=>p.points>0).slice(0,5).map((p,i)=>`<div class="li" onclick="showProfile('${p.id}')">${["🥇","🥈","🥉","4","5"][i]} ${av(p)}<div class="g">${esc(p.name)}${tag(p)}</div><b>${p.points}</b></div>`).join("")||"<div class='mu'>No points yet</div>"}<div style="text-align:right;margin-top:6px"><button class="s" onclick="showAll()">See all →</button></div></div>`;
function showAll(){$("#modal").innerHTML=`<div class="ov" onclick="if(event.target===this)closeM()"><div class="card pm" style="max-width:380px;width:100%;max-height:86vh;overflow:auto;margin:0"><div class="row sp"><b>🏆 All students</b><button class="s" onclick="closeM()">Close</button></div>${ranked().map((p,i)=>`<div class="li" onclick="showProfile('${p.id}')"><span class="mu" style="width:26px">${i+1}</span>${av(p)}<div class="g">${esc(p.name)}${tag(p)}<br>${gchip(p)}</div><b>${p.points}</b></div>`).join("")}</div></div>`}
function inviteBox(g){const iv=IV.filter(x=>x.group_id===g.id);return`<div class="card" style="margin:12px 0 0"><b>💌 Invite idle students</b>${idle().map(p=>{const i=iv.find(x=>x.user_id===p.id);return`<div class="li">${av(p)}<div class="g">${esc(p.name)}</div>${i?`<button class="s" onclick="rpc('cancel_invite',{i:${i.id}})">Invited ✓ · cancel</button>`:`<button onclick="rpc('send_invite',{g:${g.id},u:'${p.id}'})">Invite</button>`}</div>`}).join("")||"<div class='mu'>No idle students right now</div>"}</div>`}
// Bir qrupun səhifəsi: üzvlər, qoşul/çıx, dəvət
function groupPage(id){const g=grp(id);if(!g){openG=null;return groupsPage()}
 const m=mem(id),u=ME(),pend=RQ.some(r=>r.user_id===uid&&r.group_id===id),full=m.length>=g.capacity,canK=can("admin")||g.host_id===uid,inG=u.group_id===id;let btn;
 if(inG)btn=`<button class="d" style="width:100%" onclick="leave()">Leave group</button>`;
 else if(pend)btn=`<button class="s" style="width:100%" onclick="rpc('cancel_request',{g:${id}})">Request sent · tap to withdraw</button>`;
 else btn=`<button style="width:100%" ${full||u.group_id!==null||u.is_admin||u.role==="teacher"?"disabled":""} onclick="rpc('request_join',{g:${id}})">${u.role==="teacher"?"Teachers do not join groups":full?"Group full":u.group_id!==null?"Leave your group first":"Join request"}</button>`;
 return`<div class="card" style="border-top:5px solid ${gcol(id)}"><button class="s" onclick="goBack()">← Back</button><h3>${esc(g.name)}</h3><p>${dots(m.length,g.capacity,gcol(id))}<br><span class="mu">${m.length} participants · ${g.capacity-m.length} free spots</span></p><p class="mu" style="margin:0 0 4px">Tap a member to see their profile</p>
 ${m.map(p=>`<div class="li" onclick="showProfile('${p.id}')">${av(p)}<div class="g">${esc(p.name)}${p.id===g.host_id?" 👑":""}${tag(p)}</div><span class="mu">${p.points} pts</span>${p.id!==uid&&can("groups")?`<button class="d" style="margin-left:6px" onclick="event.stopPropagation();removeMember('${p.id}')">Remove</button>`:canK&&p.id!==uid?`<button class="d" style="margin-left:6px" onclick="event.stopPropagation();kick('${p.id}')">Kick</button>`:""}</div>`).join("")||"<i class='mu'>No members yet</i>"}
 ${inG?RQ.filter(r=>r.group_id===id).map(joinCard).join("")+KK.filter(k=>k.group_id===id).map(kickCard).join(""):""}<p>${btn}</p></div>${g.host_id===uid&&!full?inviteBox(g):""}`}
// Qruplar siyahısı + canlı sayğac + top ballar
function groupsPage(){return openG!==null?groupPage(openG):`${hero()}<div class="card"><div class="row sp"><b>Groups</b><span class="chip${G.length>=maxG()?"":" on"}" id="gcount">${G.length}/${maxG()} created · ${Math.max(0,maxG()-G.length)} left</span></div>${G.length?groupsHtml():`<p class="mu">No groups yet. Create the first one! 👇</p>`}<div style="text-align:right;margin-top:8px"><button onclick="newGroupForm()" ${G.length>=maxG()?"disabled":""}>+ New group</button></div></div>${board()}`}
// Müraciətlər, dəvətlər və səs gözləyənlər
function reqPage(){const u=ME(),mine=RQ.filter(r=>r.user_id===uid),inv=myInvites(),mv=myVotes(),gid=u.group_id,ord={approved:0,pending:1,voting:2},
 theirs=gid!==null?RQ.filter(r=>r.group_id===gid).sort((a,b)=>ord[a.stage]-ord[b.stage]):[],lab={pending:"Waiting for a member to open the vote",voting:"Members are voting",approved:"Approved by members · waiting for the host"};
 return(inv.length?`<div class="card glow"><b>💌 Invitations for you</b>${inv.map(x=>`<div class="gr" style="cursor:default"><span><b>${esc(gname(x.group_id))}</b><br><span class="mu">from ${esc(nameOf(x.invited_by))}</span></span><span class="row"><button onclick="rpc('respond_invite',{i:${x.id},ok:true})">Accept</button><button class="s" onclick="rpc('respond_invite',{i:${x.id},ok:false})">Decline</button></span></div>`).join("")}</div>`:"")
 +(gid!==null?`<div class="card ${mv.j.length||mv.k.length?"glow":""}"><b>🙋 People who want to join ${esc(gname(gid))}</b>${theirs.map(joinCard).join("")||"<p class='mu'>No join requests right now</p>"}${mv.k.length?"<p><b>🗳️ Kick votes</b></p>"+mv.k.map(kickCard).join(""):""}</div>`:"")
 +`<div class="card"><b>My sent requests</b>${mine.map(r=>`<div class="gr" style="cursor:default"><span>${esc(gname(r.group_id))}<br><span class="mu">${lab[r.stage]}</span></span><button class="s" onclick="rpc('cancel_request',{g:${r.group_id}})">Withdraw</button></div>`).join("")||"<p class='mu'>No pending requests</p>"}</div>`}
const idlePage=()=>`<div class="card"><b>Idle people (${idle().length})</b>${idle().map(p=>`<div class="li" onclick="showProfile('${p.id}')">${av(p)}<div class="g">${esc(p.name)}${tag(p)}</div></div>`).join("")||"<p class='mu'>Nobody 🎉</p>"}</div>`;
// Ayarlar: ad, şəkil, parol, səs, çıxış
function settingsPage(){const u=ME();return`<div class="card"><b>Settings</b><p class="mu">Display name</p><div class="row"><input id="nn" value="${esc(u.name)}" maxlength="30" style="flex:1;min-width:0"><button onclick="saveName()">Save</button></div>
 ${can("panel")?'<p><a class="chip on" href="admin.html" target="_blank" style="text-decoration:none">🛠 Open admin panel</a></p>':""}<p class="mu">Profile picture</p><input type="file" accept="image/*" onchange="pic(this)"><p class="row"><button class="s" onclick="toggleMute()">${muted?"🔇 Sounds off":"🔊 Sounds on"}</button><button class="s" onclick="confirmLogout()">Log out</button></p>
 <hr><b>Change password</b><p class="mu" style="margin:4px 0">${can("admin")?"Admin passwords are private: nobody else can see or reset yours.":"Class admins can see your password so they can help you if you forget it. Do not reuse a password from anywhere else."}</p><input id="cp1" type="password" placeholder="New password (min 6)" autocomplete="new-password"><input id="cp2" type="password" placeholder="Repeat" autocomplete="new-password" style="margin-top:6px"><button style="margin-top:8px" onclick="changePw()">Change password</button>
 ${can("points")?`<hr><b>Give points</b><div class="row" style="margin-top:8px"><select id="ps">${ppl().map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select><input id="pp" type="number" value="1" min="-100" max="100" style="width:80px"><button onclick="rpc('add_points',{u:$('#ps').value,n:+$('#pp').value})">Add</button></div>`:""}</div>`}
const pages={notes:notesPage,chat:chatPage,idle:idlePage,groups:groupsPage,settings:settingsPage,req:()=>reqPage()};
const snap=()=>({tab,openG,conv,sheet,sp,menuOpen,pm});
const mItems=()=>[["notes","🔔","Notifications",ub(unreadNotes())],["chat","💬","Chat",ub(totalUnread())],["idle","🧍","Idle people ("+idle().length+")",""],["groups","👥","Groups",""],["settings","⚙️","Settings",""],["req","📨","Requests & invites",ub(inboxCount())]];
// Telefonda sağdan açılan menyu
const drawer=()=>{const u=ME(),rk=rank(u.points);return`<div id="scrim" onclick="goBack()"></div><div id="drawer"><div class="dh">${av(u,"big")}<div><b>${esc(u.name)}</b><br><span class="mu">${rk.name} · ${u.points} pts</span></div></div>${mItems().map(([k,i,t,b])=>`<div class="gr" onclick="menuOpen=false;sheet=true;sp='${k}';render()"><span>${i} ${t} ${b}</span><span>›</span></div>`).join("")}<div class="gr" onclick="confirmLogout()"><span>🚪 Log out</span></div></div>`};
// Geri: əvvəlki pəncərəyə qayıdır (proqramdan çıxmır)
function goBack(){if(navStack.length)history.back();else{openG=null;conv=null;sp=null;sheet=false;menuOpen=false;pm=null;$("#modal").innerHTML="";render()}}

/* ================= PROFİL PƏNCƏRƏSİ (statistika, xal vermə, qrup idarəsi) ================= */
// Şagirdin bal statistikası (təqdimat sayı, ən yüksək, orta)
const statsOf=id=>{const ev=PE.filter(e=>e.user_id===id),pr=ev.filter(e=>e.kind==="host"&&e.amount>0),sum=pr.reduce((a,e)=>a+e.amount,0);return{ev,n:pr.length,best:pr.reduce((m,e)=>Math.max(m,e.amount),0),avg:pr.length?Math.round(sum/pr.length*10)/10:0}};
// Adamın profil pəncərəsini açır
function showProfile(id){if(!P[id])return;pm=id;render()}
// Profil pəncərəsini bağlayır (geri düyməsi ilə uyğun)
function closeProfile(){if(navStack.length&&!navStack[navStack.length-1].pm)history.back();else{pm=null;closeM();render()}}
let givingPts=false;
// Xal verir; rəqəm artır, +N uçur, parıltı çıxır
async function givePoints(id){if(givingPts)return;const i=$("#gp"),n=parseInt(i&&i.value,10);if(!n||n<-100||n>100){toast("Type a number from -100 to 100",1);snd.err();if(i&&i.focus)i.focus();return}
 givingPts=true;const btn=$("#givebtn");if(btn){btn.disabled=true;btn.textContent="Adding…"}
 const {error}=await sb.rpc("add_points",{u:id,n});givingPts=false;
 if(error){toast(error.message,1);snd.err();if(btn){btn.disabled=false;btn.textContent="Add points"}return}
 const old=P[id].points;P[id].points=Math.max(0,old+n);PE.unshift({id:Date.now(),user_id:id,amount:n,kind:"host",created_at:new Date().toISOString()});
 drawProfile(false);const g=$("#gp");if(g)g.value="";pointsFx(n,old,P[id].points);toast((n>0?"+":"")+n+" points → "+P[id].name)}
// Parıltı animasiyası
function sparks(){for(let i=0;i<12;i++){const e=document.createElement("span");e.className="pt";e.textContent=["✨","⭐","💜"][i%3];e.style.left=(25+Math.random()*50)+"vw";e.style.fontSize="20px";e.style.animationDelay=Math.random()*.4+"s";document.body.appendChild(e);setTimeout(()=>e.remove(),2400)}}
// Xal animasiyası (rəqəm sayır, +N uçur)
function pointsFx(n,from,to){const b=$("#ptsbig"),raf=typeof requestAnimationFrame==="function"?requestAnimationFrame:f=>setTimeout(f,16);
 if(b&&b.classList){b.classList.add("bump");const t0=Date.now(),step=()=>{const k=Math.min(1,(Date.now()-t0)/700);b.textContent=Math.round(from+(to-from)*k);if(k<1)raf(step)};step()}
 if(b&&b.getBoundingClientRect){const r=b.getBoundingClientRect(),e=document.createElement("div");e.className="fx"+(n<0?" neg":"");e.textContent=(n>0?"+":"")+n;e.style.left=(r.left+r.width/2-22)+"px";e.style.top=r.top+"px";document.body.appendChild(e);setTimeout(()=>e.remove(),1300)}
 if(n>0){snd.ok();sparks()}else snd.err()}
// Profil pəncərəsinin HTML-i
function drawProfile(first){const p=P[pm];if(!p){closeM();return}const me=ME(),st=statsOf(p.id),rk=rank(p.points),mine=p.id===uid,gv=$("#gp")?$("#gp").value:"",
 myG=me.group_id!==null?grp(me.group_id):null,canInvite=!p.is_admin&&p.group_id===null&&!!myG&&myG.host_id===uid&&mem(myG.id).length<myG.capacity&&!IV.some(x=>x.user_id===p.id&&x.group_id===myG.id);
 $("#modal").innerHTML=`<div class="ov${first?"":" still"}" onclick="if(event.target===this)closeProfile()"><div class="card pm" style="max-width:360px;width:100%;max-height:88vh;overflow:auto;margin:0">
  <div style="text-align:center">${av(p,"huge")}<h3 style="margin:8px 0 2px">${esc(p.name)}</h3><div style="margin-bottom:4px">${tag(p)}</div><span class="mu">${rk.name}</span> ${gchip(p)}${online.has(p.id)?' <span class="chip on">online</span>':""}</div>
  <div class="bar"><i style="width:${rk.pct}%"></i></div>
  <div class="stat"><div><b id="ptsbig">${p.points}</b><span class="mu">total points</span></div><div><b>${st.n}</b><span class="mu">presentations</span></div><div><b>${st.best}</b><span class="mu">best score</span></div></div>
  ${st.avg?`<p class="mu" style="text-align:center;margin:8px 0 0">Average per presentation: <b>${st.avg}</b></p>`:""}
  <p style="margin:12px 0 4px"><b>Recent scores</b></p>${st.ev.slice(0,5).map(e=>`<div class="row sp mu" style="padding:3px 0"><span>${e.kind==="host"?"🎤 Presentation":"🧪 Test bonus"}</span><span><b style="color:var(--tx)">${e.amount>0?"+":""}${e.amount}</b> · ${new Date(e.created_at).toLocaleDateString()}</span></div>`).join("")||"<span class='mu'>No scores recorded yet</span>"}
  ${can("points")&&!p.is_admin&&p.role!=="teacher"?`<div style="margin-top:12px"><span class="mu">Points to give</span><div class="row" style="margin-top:4px"><input id="gp" type="number" inputmode="numeric" placeholder="e.g. 8" value="${esc(gv)}" min="-100" max="100" style="width:96px" onkeydown="if(event.key==='Enter')givePoints('${p.id}')"><button class="ok" id="givebtn" style="flex:1" onclick="givePoints('${p.id}')">Add points</button></div><div class="row" style="margin-top:6px;flex-wrap:wrap">${[1,2,3,5,8,10].map(n=>`<span class="chip pl" onclick="$('#gp').value=${n}">+${n}</span>`).join("")}</div></div>`:""}
  ${can("groups")&&p.role!=="teacher"&&!p.is_admin&&G.length?`<div style="margin-top:12px"><span class="mu">Group</span><div class="row" style="margin-top:4px"><select id="mvg" style="flex:1">${G.map(x=>`<option value="${x.id}" ${x.id===p.group_id?"selected":""}>${esc(x.name)}</option>`).join("")}</select><button onclick="moveTo('${p.id}')">Move here</button>${p.group_id!==null?`<button class="s" onclick="removeMember('${p.id}')">Remove</button>`:""}</div></div>`:""}
  <div class="row" style="margin-top:12px">${mine?"":`<button style="flex:1" onclick="openDM('${p.id}')">💬 Chat</button>`}${canInvite?`<button class="ok" style="flex:1" onclick="rpc('send_invite',{g:${myG.id},u:'${p.id}'})">💌 Invite</button>`:""}<button class="s" style="flex:1" onclick="closeProfile()">Close</button></div></div></div>`}

// Hazırkı ekranın HTML-ini qurur (giriş, parol təyini, əsas səhifə)
function view(){
 const stage=x=>`<div class="stage"><i class="blob b1"></i><i class="blob b2"></i>${x}</div>`;
 if(screen==="boot")return stage(`<div class="card login" style="text-align:center"><div class="big-logo">👥</div><p class="mu">Loading…</p></div>`);
 if(screen==="setup")return`<div class="card login"><h2>Setup needed</h2><p>Open <b>index.html</b> and paste your Supabase URL and anon key at the top of the script.</p></div>`;
 if(screen==="login")return stage(`<div class="card login"><div style="text-align:center"><div class="big-logo">👥</div><h2 style="margin:4px 0">ADIAK Team Maker</h2><div class="mu">Build your presentation team</div></div><p class="mu">Type your ID and password, then press Enter. Forgot it? Ask an admin to reset it.</p>
  <input id="idin" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="Your ID (for example ali.m)" value="${esc(lastId())}" onkeydown="if(event.key==='Enter')$('#pw').focus()">
  <input id="pw" type="password" autocomplete="current-password" placeholder="Password" onkeydown="if(event.key==='Enter')login()"><div class="err">${esc(err)}</div><button onclick="login()">Log in</button></div>`);
 if(screen==="setpw")return stage(`<div class="card login"><h2>🔐 Set a new password</h2><p class="mu">Your temporary password stops working after this.</p>
  <input id="p1" type="password" placeholder="New password (min 6)"><input id="p2" type="password" placeholder="Repeat"><div class="err">${esc(err)}</div><button onclick="setPw()">Save and continue</button><p class="mu" style="font-size:12px;margin:8px 0 0">ℹ️ Class admins can see your password so they can help if you forget it. Do not use a password from anywhere else.</p></div>`);
 if(!ME()&&!ready)return stage(`<div class="card login" style="text-align:center"><div class="big-logo">👥</div><p class="mu">Loading…</p></div>`);
 if(!ME())return`<div class="card login"><p>Your profile was not found. Ask the host to check your account.</p><button onclick="logout()">Log out</button></div>`;
 const hd=`<div class="hd"><b class="logo">👥 ADIAK Team Maker</b><span class="row">${phone()?"":`<button onclick="toggleNotes()" title="Notifications">🔔${ub(unreadNotes())}</button>`}<button onclick="toggleMute()" title="Sounds">${muted?"🔇":"🔊"}</button><button onclick="confirmLogout()">Log out</button></span></div>${!phone()&&notesOpen?notesPanel():""}`;
 if(phone()){const T={notes:"Notifications",chat:"Chat",idle:"Idle people",groups:"Groups",settings:"Settings",req:"Requests & invites"}[sp]||"Menu",bn=unreadNotes();
  return hd+`<div id="main">${profile()}${groupsPage()}${credits(true)}</div><button id="fab" onclick="menuOpen=true;render()">⋮${ub(bn)}</button>${menuOpen?drawer():""}<div id="sheet" style="display:${sheet&&sp?"block":"none"}"><div class="hd"><b>${T}</b><button onclick="goBack()">← Back</button></div>${sheet&&sp?pages[sp]():""}</div>`}
 return hd+`<div id="app"><div>${profile()}${chatPage()}</div><div id="main"><div class="tabs">${[["settings","Settings",""],["groups","Groups",""],["req","Requests & idle",ub(inboxCount())]].map(([k,t,b])=>`<button class="${tab===k?"on":""}" onclick="tab='${k}';openG=null;render()">${t}${b}</button>`).join("")}</div>${tab==="settings"?settingsPage():tab==="req"?reqPage()+idlePage():groupsPage()}</div></div>${credits(false)}`}
// Yazı sahəsində yazılıb-yazılmadığını yoxlayır (klaviatura açıq ola bilər)
const isTyping=a=>!!a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.type!=="file"&&a.type!=="button"&&!!$("#root")&&$("#root").contains(a);
// Yazı zamanı ekranı silmir: yalnız mesajlar siyahısını yeniləyir, qalanı yazı bitəndə yenilənir
function softRender(){pendingRender=true;const mb=$("#msgs");
 if(mb&&conv){const h=msgsHtml();if(mb.dataset.h!==h){const nb=mb.scrollHeight-mb.scrollTop-mb.clientHeight<80;mb.innerHTML=h;mb.dataset.h=h;if(nb)mb.scrollTop=mb.scrollHeight}}
 if(ME()){markSeen();const n=totalUnread()+inboxCount();document.title=(n?"("+n+") ":"")+"ADIAK Team Maker"}
 lastMax=M.length?M[M.length-1].id:0;if(needUrls.size)fetchUrls()}
// Səhifəni yenidən çəkir. Düymə basılarkən və səs çalarkən gözləyir ki, klik itməsin
function render(){const holding=pressing&&Date.now()-pressTs<2500;if(holding||(document.querySelectorAll&&[...document.querySelectorAll("audio")].some(a=>!a.paused&&!a.ended))){pendingRender=true;return}pendingRender=false;
 const a=document.activeElement,keep=a&&a.id&&["tx","nn","pw","p1","p2","nm","idin","cp1","cp2"].includes(a.id)?{id:a.id,v:a.value}:null,key=[screen,tab,openG,conv,sp,sheet,menuOpen,pm].join("|"),R=$("#root");
 if(screen==="app"&&ME()&&key===lastKey&&isTyping(a)){softRender();return}
 const sv=key===lastKey?[...R.querySelectorAll("input[id],textarea[id],select[id]")].filter(e=>e.type!=="file"&&(e.tagName==="SELECT"?(e.selectedIndex>=0&&!e.options[e.selectedIndex].defaultSelected):e.value!==e.defaultValue)).map(e=>({id:e.id,v:e.value})):[];
 if(!restoring&&screen==="app"&&lastKey.startsWith("app|")&&key!==lastKey&&lastSnap){navStack.push(lastSnap);try{history.pushState({n:navStack.length},"")}catch(e){}}
 const inN=sheet&&sp==="notes"&&phone();if(wasNotes&&!inN)readNotes();wasNotes=inN;
 if(screen==="app"&&ME())markSeen();
 R.className=key!==lastKey?"in":"";lastKey=key;R.innerHTML=view();if(pm&&screen==="app"){const q=P[pm],me=ME(),sig=q?[q.id,q.name,q.points,q.group_id,(q.perms||[]).join(),q.avatar?1:0,online.has(pm)?1:0,PE.length,me.group_id,(me.perms||[]).join(),me.is_admin?1:0,IV.length,G.length].join("|"):"";if(pmDrawn!==pm||sig!==pmSig){drawProfile(pmDrawn!==pm);pmSig=sig}pmDrawn=pm}else{if(pmDrawn)$("#modal").innerHTML="";pmDrawn=null}
 sv.forEach(x=>{const n=$("#"+x.id);if(n&&n.value!==x.v)n.value=x.v});
 if(keep){const n=$("#"+keep.id);if(n){n.value=keep.v;n.focus()}}
 const mb=$("#msgs");if(mb)mb.scrollTop=mb.scrollHeight;
 if(screen==="app"&&ME()){const n=totalUnread()+inboxCount();document.title=(n?"("+n+") ":"")+"ADIAK Team Maker"}
 if(needUrls.size)fetchUrls();lastMax=M.length?M[M.length-1].id:0;lastSnap=snap()}
