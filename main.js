/* =====================================================================
   main.js  -  Düymələrin işlətdiyi əməllər, giriş/çıxış, hadisə dinləyiciləri və boot() (ən sonda işləyir)
   ===================================================================== */
/* ================= DÜYMƏLƏRİN İŞLƏTDİYİ ƏMƏLLƏR ================= */
// Qrupdan çıxmaq (təsdiqlə)
function leave(){ask("Are you sure you want to leave this group?",async()=>{conv=null;if(await rpc("leave_group",{}))toast("You left the group")})}
// Bu söhbətdəki bütün mesajları silir (chats yetkisi)
function clearChat(){ask("Delete ALL messages in this chat? This cannot be undone.",async()=>{if(await rpc("admin_clear_channel",{ch:conv}))toast("Chat cleared")})}
// Bütün çatları birdən silir (chats yetkisi)
function clearAllChats(){ask("Delete ALL chats for everyone? This cannot be undone.",async()=>{if(await rpc("admin_clear_all_chats",{}))toast("All chats cleared")})}
// Üzvü qrupdan çıxarır (groups yetkisi lazımdır)
function removeMember(id){ask("Remove "+esc(nameOf(id))+" from the group?",async()=>{if(await rpc("admin_remove_member",{u:id}))toast("Removed from the group")})}
// Tələbəni seçilmiş qrupa keçirir (groups yetkisi lazımdır)
async function moveTo(id){const g=+$("#mvg").value;if(await rpc("admin_move_member",{u:id,g}))toast(nameOf(id)+" → "+gname(g))}
// Parolu dəyişir; adminlər üçün şifrələnmiş surət saxlanır (adminlərin parolu saxlanmır)
async function changePw(){const a=$("#cp1").value;if(a.length<6){toast("At least 6 characters",1);snd.err();return}if(a!==$("#cp2").value){toast("Passwords do not match",1);snd.err();return}
 const {error}=await sb.auth.updateUser({password:a});if(error){toast(error.message,1);snd.err();return}
 try{await sb.rpc("set_my_password_copy",{pw:a})}catch(e){}
 $("#cp1").value="";$("#cp2").value="";snd.ok();toast("Password changed ✓")}
// Çıxışdan əvvəl təsdiq soruşur
function confirmLogout(){ask("Are you sure you want to log out?",()=>logout())}
// Kick səsverməsi başlatır (yalnız qrup hostu)
function kick(t){rpc("start_kick",{t}).then(ok=>{if(ok)toast("Vote opened in the group chat")})}
// Yeni qrup yaratma pəncərəsi (limit yoxlanır)
function newGroupForm(){const u=ME();if(G.length>=maxG()){toast("The group limit ("+maxG()+") is reached",1);snd.err();return}if(u.is_admin||u.role==="teacher"||u.group_id!==null){toast("Only idle students can create a group. Leave your group first.",1);snd.err();return}
 $("#modal").innerHTML=`<div class="ov"><div class="card" style="max-width:340px"><b>New group</b><p class="mu">You become the host.</p><input id="gname" placeholder="Group name" maxlength="30" style="width:100%;margin-bottom:8px"><div class="row"><span>Max members</span><select id="gcap">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<option ${n===5?"selected":""}>${n}</option>`).join("")}</select></div><div class="row" style="margin-top:12px"><button class="s" style="flex:1" onclick="closeM()">Cancel</button><button style="flex:1" onclick="makeGroup()">Create</button></div></div></div>`}
// Yeni qrupu bazada yaradır
function makeGroup(){const nm=$("#gname").value.trim(),cap=+$("#gcap").value;closeM();rpc("create_group",{nm,cap}).then(ok=>{if(ok){snd.ok();party()}})}
// Görünən adı saxlayır
function saveName(){rpc("update_me",{nm:$("#nn").value,av:null}).then(ok=>{if(ok){snd.ok();toast("Name saved")}})}
// Profil şəklini 96x96 kiçildib saxlayır
function pic(inp){const f=inp.files[0];if(!f)return;const im=new Image();
 im.onload=()=>{const c=document.createElement("canvas");c.width=c.height=96;const s=Math.min(im.width,im.height);c.getContext("2d").drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,96,96);URL.revokeObjectURL(im.src);rpc("update_me",{nm:null,av:c.toDataURL("image/jpeg",.7)})};
 im.onerror=()=>toast("Could not read that image",1);im.src=URL.createObjectURL(f)}

/* ================= GİRİŞ, PAROL VƏ EKRANLAR ================= */
const normId=v=>{v=String(v||"").trim().toLowerCase();return v.includes("@")?v:v+"@classroom.app"};
const lastId=()=>{try{return localStorage.getItem("lastId")||""}catch(e){return""}};
// ID və parolla giriş (ID-yə @classroom.app avtomatik əlavə olunur)
async function login(){const raw=$("#idin").value;err="";if(!raw.trim()){err="Type your ID";snd.err();render();return}try{localStorage.setItem("lastId",raw.trim())}catch(e){}
 try{window.Notification&&Notification.permission==="default"&&Notification.requestPermission()}catch(e){}
 const {data,error}=await sb.auth.signInWithPassword({email:normId(raw),password:$("#pw").value});
 if(error){err=/fetch|network|load/i.test(error.message)?"No connection to the server. Check your internet.":"Wrong ID or password";snd.err();render();return}snd.ok();await start(data.user,true)}
// İlk girişdə yeni parol təyin etmə
async function setPw(){const a=$("#p1").value;if(a.length<6){err="At least 6 characters";return render()}if(a!==$("#p2").value){err="Passwords do not match";return render()}
 const {data,error}=await sb.auth.updateUser({password:a,data:{must_change:false}});if(error){err=error.message;return render()}
 try{await sb.rpc("set_my_password_copy",{pw:a})}catch(e){}err="";snd.ok();await start(data.user,true)}
// Giriş uğurlu olandan sonra: cihazı qeyd edir, məlumatı yükləyir, real vaxtı qoşur
async function start(user,fresh){uid=user.id;ready=false;loadSeen();loadNotes();if(user.user_metadata&&user.user_metadata.must_change){screen="setpw";return render()}
 try{MYSID=fresh?null:localStorage.getItem("sid")}catch(e){MYSID=null}
 if(!MYSID){MYSID=Math.random().toString(36).slice(2)+Date.now().toString(36);try{localStorage.setItem("sid",MYSID)}catch(e){}await sb.rpc("claim_session",{s:MYSID})}
 screen="boot";render();await loadMeta();let ok=await refresh(true);for(let i=0;!ok&&screen==="boot"&&i<3;i++){await new Promise(r=>setTimeout(r,1000));ok=await refresh(true)}
 if(screen!=="boot")return;if(!ok){err="Connection problem. Please try again.";screen="login";return render()}screen="app";render();subscribe()}
async function loadLogin(){screen="login";render()}
// Çıxış edir
async function logout(){if(chan){await sb.removeChannel(chan);chan=null}try{await sb.auth.signOut({scope:"local"})}catch(e){}try{localStorage.removeItem("sid")}catch(e){}MYSID=null;uid=null;conv=null;sheet=false;sp=null;openG=null;menuOpen=false;navStack=[];if(rec)stopRec(false);online=new Set();ready=false;NOTES=[];notesOpen=false;PE=[];closeM();await loadLogin()}
// Sayt açılanda ilk işləyən funksiya
async function boot(){if(SUPABASE_URL.includes("PASTE")){screen="setup";return render()}
 sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);const {data}=await sb.auth.getSession();if(data.session)return start(data.session.user);await loadLogin()}

["pause","ended"].forEach(ev=>addEventListener(ev,e=>{if(pendingRender&&e.target&&e.target.tagName==="AUDIO")render()},true));
addEventListener("pointerdown",()=>{pressing=true;pressTs=Date.now()},true);
["pointerup","pointercancel"].forEach(ev=>addEventListener(ev,()=>{setTimeout(()=>{pressing=false;if(pendingRender)render()},20)},true));
addEventListener("popstate",()=>{if(screen!=="app")return;const s=navStack.pop();if(!s)return;restoring=true;tab=s.tab;openG=s.openG;conv=s.conv;sheet=s.sheet;sp=s.sp;menuOpen=s.menuOpen;pm=s.pm&&P[s.pm]?s.pm:null;render();restoring=false});
let tx0=0,ty0=0;
addEventListener("touchstart",e=>{const t=e.touches[0];tx0=t.clientX;ty0=t.clientY},{passive:true});
addEventListener("touchend",e=>{if(!phone()||screen!=="app")return;const t=e.changedTouches[0],dx=t.clientX-tx0,dy=t.clientY-ty0;if(Math.abs(dx)<70||Math.abs(dy)>Math.abs(dx)*.6)return;
 if(dx<0&&!menuOpen&&!sp&&!pm&&tx0>innerWidth*.5){menuOpen=true;render()}else if(dx>0&&menuOpen)goBack()},{passive:true});
// Klaviatura açılanda ekranın hündürlüyü dəyişir; yalnız telefon/masaüstü keçidində yenilə
let lastPhone=phone();addEventListener("resize",()=>{const p=phone();if(p!==lastPhone){lastPhone=p;if(screen==="app")render()}});
// Yazı sahəsindən çıxanda gözləyən yeniləməni icra edir
addEventListener("focusout",()=>{setTimeout(()=>{if(pendingRender&&!isTyping(document.activeElement))render()},80)});
boot();
