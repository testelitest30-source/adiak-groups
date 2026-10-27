/* =====================================================================
   i18n.js  -  Dil keçidi: AZ (Azərbaycan) / EN (English)
   Necə işləyir: sayt ingilis dilində yazılıb. Bu fayl ekrana çıxan hər mətni lüğətdən tapıb
   Azərbaycan dilinə çevirir. EN seçiləndə dəyişiklik edilmir. Seçim brauzerdə yadda qalır.
   Lüğətdə olmayan mətn (ad, mesaj, qrup adı) olduğu kimi qalır: istifadəçi məzmunu heç vaxt tərcümə olunmur.
   Yeni mətn əlavə etmək: aşağıdakı EXACT (tam uyğun) və ya PAT (nümunəli) siyahısına bir sətir yazın.
   Yüklənmə sırası: config.js → i18n.js → core.js → pages.js → main.js
   ===================================================================== */
(function(){
"use strict";
var LANG="az";try{LANG=localStorage.getItem("lang")||"az"}catch(e){}
if(LANG!=="az"&&LANG!=="en")LANG="az";

/* ---------- 1. TAM UYĞUN TƏRCÜMƏLƏR (ingilis → azərbaycan) ---------- */
var EXACT={
/* giriş və parol */
"Build your presentation team":"Təqdimat komandanızı qurun",
"Type your ID and password, then press Enter. Forgot it? Ask an admin to reset it.":"ID və parolunuzu yazıb Enter düyməsini basın. Unutmusunuz? Adminlərdən sıfırlamağı xahiş edin.",
"Your ID (for example ali.m)":"ID-niz (məsələn: ali.m)","Password":"Parol","Log in":"Daxil ol","Type your ID":"ID-nizi yazın",
"Wrong ID or password":"ID və ya parol yanlışdır","No connection to the server. Check your internet.":"Serverlə əlaqə yoxdur. İnternetinizi yoxlayın.",
"Loading…":"Yüklənir…","Loading":"Yüklənir","Setup needed":"Quraşdırma tələb olunur",
"Open index.html and paste your Supabase URL and anon key at the top of the script.":"index.html faylını açın və Supabase URL ilə anon açarını skriptin əvvəlinə yapışdırın.",
"Set a new password":"Yeni parol təyin edin","Your temporary password stops working after this.":"Müvəqqəti parolunuz bundan sonra işləməyəcək.",
"New password (min 6)":"Yeni parol (ən azı 6 simvol)","Repeat":"Təkrar yazın","Save and continue":"Yadda saxla və davam et",
"At least 6 characters":"Ən azı 6 simvol olmalıdır","Passwords do not match":"Parollar eyni deyil",
"ℹ️ Class admins can see your password so they can help if you forget it. Do not use a password from anywhere else.":"ℹ️ Sinif adminləri parolunuzu görə bilər ki, unutsanız kömək edə bilsinlər. Başqa yerdə işlətdiyiniz parolu yazmayın.",
"Your profile was not found. Ask the host to check your account.":"Profiliniz tapılmadı. Hesabınızı yoxlamaq üçün adminə müraciət edin.",
"You were signed out because this account was opened on another device.":"Bu hesaba başqa cihazdan daxil olunduğu üçün hesabdan çıxarıldınız.",
"Log out":"Çıxış","Are you sure you want to log out?":"Hesabdan çıxmaq istədiyinizə əminsiniz?","Cancel":"Ləğv et","Yes":"Bəli","Close":"Bağla","Save":"Yadda saxla","Add":"Əlavə et","Create":"Yarat","Send":"Göndər","Back":"Geri",
/* ana səhifə, profil, rütbələr */
"You're idle":"Hələ qrupunuz yoxdur","Open a group and send a join request, create your own, or wait for an invitation.":"Bir qrupu açıb qoşulma müraciəti göndərin, öz qrupunuzu yaradın və ya dəvət gözləyin.",
"Teacher account":"Müəllim hesabı","Host panel":"Host paneli","Give points in Settings. You can start a kick vote in any group.":"Xalları Ayarlar bölməsindən verin. İstənilən qrupda çıxarma səsverməsi başlada bilərsiniz.",
"Newcomer":"Yeni başlayan","Speaker":"Çıxışçı","Orator":"Natiq","Maestro":"Maestro",
"idle":"qrupsuz","host":"host","teacher":"müəllim","my group":"qrupum","requested":"müraciət göndərilib","online":"onlayn","Admin":"Admin","Teacher":"Müəllim","Scorer":"Xal verən","Host":"Host",
/* xal, top, statistika */
"Top points":"Ən çox xal","No points yet":"Hələ xal yoxdur","See all →":"Hamısına bax →","See all":"Hamısına bax","All students":"Bütün tələbələr",
"total points":"ümumi xal","presentations":"təqdimat","best score":"ən yüksək xal","Average per presentation:":"Təqdimat üzrə orta xal:","Recent scores":"Son xallar",
"No scores recorded yet":"Hələ xal qeydə alınmayıb","Presentation":"Təqdimat","Test bonus":"Test bonusu","Points to give":"Veriləcək xal","Add points":"Xal ver","Adding…":"Əlavə olunur…","e.g. 8":"məs. 8",
"Give points":"Xal ver","Type a number from -100 to 100":"-100 ilə 100 arasında rəqəm yazın","Group":"Qrup","Move here":"Bura köçür","Chat with":"Yaz",
/* qruplar */
"Groups":"Qruplar","No groups yet. Create the first one!":"Hələ qrup yoxdur. İlk qrupu siz yaradın!","+ New group":"+ Yeni qrup","New group":"Yeni qrup","You become the host.":"Siz qrupun hostu olursunuz.",
"Group name":"Qrupun adı","Max members":"Maksimum üzv sayı","Tap a member to see their profile":"Profilinə baxmaq üçün üzvə toxunun","Leave group":"Qrupdan çıx",
"Request sent · tap to withdraw":"Müraciət göndərildi · geri götürmək üçün toxunun","Join request":"Qoşulma müraciəti","Group full":"Qrup doludur","Leave your group first":"Əvvəlcə qrupunuzdan çıxın",
"Teachers do not join groups":"Müəllimlər qruplara qoşulmur","No members yet":"Hələ üzv yoxdur","Remove":"Çıxar","Kick":"Çıxarma səsverməsi",
"Invite idle students":"Qrupsuz tələbələri dəvət et","Invite":"Dəvət et","Invited ✓ · cancel":"Dəvət edildi ✓ · ləğv et","No idle students right now":"Hazırda qrupsuz tələbə yoxdur","Nobody":"Heç kim yoxdur",
"Are you sure you want to leave this group?":"Bu qrupdan çıxmaq istədiyinizə əminsiniz?","You left the group":"Qrupdan çıxdınız","Removed from the group":"Qrupdan çıxarıldı",
"Only idle students can create a group. Leave your group first.":"Yalnız qrupsuz tələbələr qrup yarada bilər. Əvvəlcə qrupunuzdan çıxın.","Vote opened in the group chat":"Səsvermə qrup çatında açıldı",
/* müraciətlər, dəvətlər, səsvermə */
"Requests & idle":"Müraciətlər və qrupsuzlar","Requests & invites":"Müraciətlər və dəvətlər","Invitations for you":"Sizə gələn dəvətlər","Accept":"Qəbul et","Decline":"İmtina et",
"No join requests right now":"Hazırda qoşulma müraciəti yoxdur","Kick votes":"Çıxarma səsverməsi","My sent requests":"Göndərdiyim müraciətlər","No pending requests":"Gözləyən müraciət yoxdur","Withdraw":"Geri götür",
"Waiting for a member to open the vote":"Üzvün səsverməni açması gözlənilir","Members are voting":"Üzvlər səs verir","Approved by members · waiting for the host":"Üzvlər təsdiq edib · host gözlənilir",
"wants to join":"qoşulmaq istəyir","Step 1 of 3 · waiting for a member to open the vote":"1/3-cü mərhələ · üzvün səsverməni açması gözlənilir","Step 3 of 3 · members approved · the host decides":"3/3-cü mərhələ · üzvlər təsdiq edib · qərarı host verir",
"Put to vote":"Səsverməyə çıxar","Accept ✅":"Qəbul et ✅","Approve":"Təsdiq et","Reject":"Rədd et","✓ Accept":"✓ Qəbul et","✓ Approve":"✓ Təsdiq et","✗ Reject":"✗ Rədd et",
"waiting":"gözləyir","voting":"səsvermə gedir","waiting for host":"host gözlənilir","Removing":"Çıxarılır",
/* çat */
"Chat":"Çat","Clear all":"Hamısını sil","Everyone":"Hamı","Only my group":"Yalnız qrupum","Say hi 👋":"Salam yazın 👋","Say hi":"Salam yazın","Voice message":"Səs mesajı","Photo":"Şəkil",
"No messages yet. Say hi! 👋":"Hələ mesaj yoxdur. Salam yazın! 👋","No messages yet. Say hi!":"Hələ mesaj yoxdur. Salam yazın!","Message…":"Mesaj…","Send a file or photo":"Fayl və ya şəkil göndər",
"Delete all messages in this chat":"Bu çatdakı bütün mesajları sil","Delete every chat":"Bütün çatları sil","Sent ✓":"Göndərildi ✓","Files must be under 25 MB":"Fayllar 25 MB-dan kiçik olmalıdır",
"Microphone access was denied":"Mikrofona icazə verilmədi","Voice recording is not supported in this browser":"Bu brauzer səs yazmağı dəstəkləmir","Could not read that image":"Şəkli oxumaq alınmadı",
"Delete ALL messages in this chat? This cannot be undone.":"Bu çatdakı BÜTÜN mesajlar silinsin? Bu əməliyyatı geri qaytarmaq olmaz.","Delete ALL chats for everyone? This cannot be undone.":"Hamı üçün BÜTÜN çatlar silinsin? Bu əməliyyatı geri qaytarmaq olmaz.",
"Chat cleared":"Çat təmizləndi","All chats cleared":"Bütün çatlar silindi","Direct messages":"Şəxsi mesajlar",
/* bildirişlər, menyu */
"Notifications":"Bildirişlər","Mark all read":"Hamısını oxunmuş et","No notifications yet":"Hələ bildiriş yoxdur","just now":"indicə","Menu":"Menyu","Sounds":"Səslər",
"Sounds on":"Səslər açıqdır","Sounds off":"Səslər bağlıdır","Open Requests":"Müraciətlərə keç","Open Requests and put it to a vote":"Müraciətlərə keçib səsverməyə çıxarın","Open Requests to accept":"Qəbul etmək üçün Müraciətlərə keçin",
"Cast your vote in Requests":"Səsinizi Müraciətlər bölməsində verin","Your final decision is needed":"Yekun qərarınız lazımdır","Welcome to the group!":"Qrupa xoş gəlmisiniz!","Waiting for the host's final decision":"Hostun yekun qərarı gözlənilir",
"Members are voting on your request":"Üzvlər müraciətiniz üzərində səs verir","Members approved your request":"Üzvlər müraciətinizi təsdiq etdi","Your join request was declined":"Qoşulma müraciətiniz rədd edildi","Connection problem. Retrying…":"Əlaqə problemi. Yenidən cəhd edilir…",
/* ayarlar */
"Settings":"Ayarlar","Display name":"Görünən ad","Open admin panel":"Admin panelini aç","Profile picture":"Profil şəkli","Change password":"Parolu dəyişdir","Password changed ✓":"Parol dəyişdirildi ✓","Name saved":"Ad yadda saxlanıldı",
"Admin passwords are private: nobody else can see or reset yours.":"Admin parolları gizlidir: sizinkini heç kim görə və sıfırlaya bilməz.",
"Class admins can see your password so they can help you if you forget it. Do not reuse a password from anywhere else.":"Sinif adminləri unutduqda kömək edə bilmək üçün parolunuzu görə bilər. Başqa yerdə işlətdiyiniz parolu təkrar istifadə etməyin.",
"Created by":"Hazırlayanlar",
/* gözləmə və fayl */
"tap to open":"açmaq üçün toxunun","Sent":"Göndərildi",
/* serverdən gələn xətalar (bazadakı qaydalar) */
"Not signed in":"Hesaba daxil olmamısınız","The host account cannot join groups":"Host hesabı qruplara qoşula bilməz","Leave your current group first":"Əvvəlcə hazırkı qrupunuzdan çıxın","Group not found":"Qrup tapılmadı",
"This group is full":"Bu qrup doludur","This request is no longer open":"Bu müraciət artıq açıq deyil","Only members of this group can vote":"Yalnız bu qrupun üzvləri səs verə bilər","Voting is not open for this request":"Bu müraciət üçün səsvermə açıq deyil",
"Only members of this group can open a vote":"Səsvermə açmaq yalnız bu qrupun üzvlərinə aiddir","A vote was already opened for this request":"Bu müraciət üçün səsvermə artıq açılıb","Only the group host makes the final decision":"Yekun qərarı yalnız qrupun hostu verir",
"The members have not approved this request yet":"Üzvlər bu müraciəti hələ təsdiq etməyib","The group is full":"Qrup doludur","Only idle students can create a group":"Yalnız qrupsuz tələbələr qrup yarada bilər","Size must be 1 to 10":"Üzv sayı 1 ilə 10 arasında olmalıdır",
"Group name must be 1 to 30 characters":"Qrup adı 1-30 simvol olmalıdır","That person is not in a group":"Bu şəxs qrupda deyil","Use Leave group instead":"Bunun əvəzinə \"Qrupdan çıx\" düyməsindən istifadə edin",
"Only the group host or admin can start a kick vote":"Çıxarma səsverməsini yalnız qrup hostu və ya admin başlada bilər","A vote is already open for this person":"Bu şəxs üçün səsvermə artıq açıqdır","This vote is closed":"Bu səsvermə bağlanıb",
"Only the other members of this group can vote":"Yalnız qrupun digər üzvləri səs verə bilər","You do not have permission to give points":"Xal vermək icazəniz yoxdur","Points must be between -100 and 100":"Xal -100 ilə 100 arasında olmalıdır",
"That account cannot receive points":"Bu hesab xal ala bilməz","That name is already taken":"Bu ad artıq götürülüb","Name must be 2 to 30 characters":"Ad 2-30 simvol olmalıdır","Message must be 1 to 1000 characters":"Mesaj 1-1000 simvol olmalıdır",
"Invalid chat":"Yanlış çat","File upload not found":"Yüklənmiş fayl tapılmadı","File must be under 25 MB":"Fayl 25 MB-dan kiçik olmalıdır","Person not found":"Şəxs tapılmadı","Only the group host can invite":"Dəvəti yalnız qrup hostu göndərə bilər",
"That person is already in a group":"Bu şəxs artıq qrupdadır","Your group is full":"Qrupunuz doludur","This invitation is no longer open":"Bu dəvət artıq açıq deyil","Leave your group first ":"Əvvəlcə qrupunuzdan çıxın","That group is full":"Bu qrup doludur",
"You do not have permission for this action":"Bu əməliyyat üçün icazəniz yoxdur","Admins only":"Yalnız adminlər üçündür","Only students can be placed in groups":"Qruplara yalnız tələbələr yerləşdirilə bilər","That is not your current password":"Bu, hazırkı parolunuz deyil",
"New password should be different from the old password.":"Yeni parol köhnə paroldan fərqli olmalıdır.","Password should be at least 6 characters.":"Parol ən azı 6 simvol olmalıdır.","Failed to fetch":"Serverlə əlaqə qurulmadı",
"Group":"Qrup"};

/* "Remove " kimi sonunda boşluq olan mətnlər (adın qarşısında dayanan söz) */
var RAW={"Remove ":"Çıxarılsın: "};

/* ---------- 2. NÜMUNƏLİ TƏRCÜMƏLƏR (içində ad, rəqəm olanlar) ---------- */
var PERM={"give points":"xal vermək","manage groups (add, move, remove students)":"qrupları idarə etmək (tələbələri əlavə etmək, köçürmək, çıxarmaq)","moderate chats":"çatlara nəzarət etmək","see students' passwords":"tələbələrin parollarına baxmaq","open the admin panel":"admin panelini açmaq","do everything":"hər şeyi etmək","chat with students":"tələbələrlə yazışmaq"};
var PAT=[
[/^You're in (.+)$/,"Siz $1 qrupundasınız"],
[/^(\d+)\/(\d+) members( · you are the host 👑)?$/,function(m){return m[1]+"/"+m[2]+" üzv"+(m[3]?" · siz hostsunuz 👑":"")}],
[/^(\d+)\/(\d+) created · (\d+) left$/,"$1/$2 qrup yaradılıb · $3 boş yer"],
[/^(\d+)\/(\d+) · (\d+) free$/,"$1/$2 · $3 boş"],
[/^(\d+) participants · (\d+) free spots$/,"$1 iştirakçı · $2 boş yer"],
[/^Idle people \((\d+)\)$/,"Qrupsuz tələbələr ($1)"],[/^Idle people$/,"Qrupsuz tələbələr"],
[/^(Newcomer|Speaker|Orator|Maestro) · (\d+) pts$/,function(m){return EXACT[m[1]]+" · "+m[2]+" xal"}],
[/^(\d+) pts$/,"$1 xal"],
[/^(.+) \(my group\)$/,"$1 (qrupum)"],
[/^You: (.*)$/,function(m){return "Siz: "+(EXACT[m[1]]||m[1])}],
[/^from (.+)$/,"$1 tərəfindən"],
[/^Join request · (.+)$/,"Qoşulma müraciəti · $1"],[/^Kick vote · (.+)$/,"Çıxarma səsverməsi · $1"],
[/^Step 2 of 3 · (\d+)\/(\d+) approvals needed \(majority\)$/,"2/3-cü mərhələ · $1/$2 razılıq lazımdır (səs çoxluğu)"],
[/^you voted (✓|✗)$/,"səs verdiniz $1"],
[/^(\d+)\/(\d+) approvals \(80% of (\d+)\)$/,"$1/$2 razılıq (digər $3 nəfərin 80%-i)"],
[/^Remove (.+) from the group\?$/,"$1 qrupdan çıxarılsın?"],
[/^Uploading (.+)…$/,"$1 yüklənir…"],
[/^⏹ (\d+:\d+) · send$/,"⏹ $1 · göndər"],
[/^(.+) · tap to open$/,"$1 · açmaq üçün toxunun"],
[/^(\d+) min ago$/,"$1 dəq əvvəl"],[/^(\d+) h ago$/,"$1 saat əvvəl"],[/^(\d+) d ago$/,"$1 gün əvvəl"],
[/^(\d+) items? waiting for you$/,"Sizi $1 iş gözləyir"],
[/^You joined (.+)$/,"$1 qrupuna qoşuldunuz"],[/^You are no longer in (.+)$/,"Siz artıq $1 qrupunda deyilsiniz"],
[/^(.+) wants to join$/,"$1 qoşulmaq istəyir"],[/^Vote opened for (.+)$/,"$1 üçün səsvermə açıldı"],[/^Majority approved (.+)$/,"Səs çoxluğu təsdiq etdi: $1"],
[/^Kick vote for (.+)$/,"Çıxarma səsverməsi: $1"],[/^(.+) joined your group$/,"$1 qrupunuza qoşuldu"],[/^(.+) invited you!$/,"$1 sizi dəvət etdi!"],
[/^New message from (.+)$/,"$1 tərəfindən yeni mesaj"],[/^New message in (.+) from (.+)$/,"$1 qrupunda yeni mesaj · $2"],
[/^\+(\d+) points!$/,"+$1 xal!"],[/^Your total is now (\d+)$/,"Ümumi xalınız: $1"],[/^([+-]\d+) points → (.+)$/,"$1 xal → $2"],
[/^The group limit \((\d+)\) is reached$/,"Qrup limitinə ($1) çatılıb"],
[/^You can: (.+)\.$/,function(m){var t=m[1];Object.keys(PERM).sort(function(a,b){return b.length-a.length}).forEach(function(k){t=t.split(k).join(PERM[k])});return "Edə bilərsiniz: "+t+"."}],
/* qrup çatında görünən sistem mesajları */
[/^(.+) joined the group 🎉$/,"$1 qrupa qoşuldu 🎉"],[/^The group is full\.$/,"Qrup doldu."],
[/^(.+) wants to join\. A member can put the request to a vote\.$/,"$1 qoşulmaq istəyir. Üzvlərdən biri müraciəti səsverməyə çıxara bilər."],
[/^(.+) wants to join\. Members: please vote\.$/,"$1 qoşulmaq istəyir. Üzvlər, zəhmət olmasa səs verin."],
[/^Vote opened: should (.+) join\? Members, please vote\.$/,"Səsvermə açıldı: $1 qrupa qoşulsun? Üzvlər, zəhmət olmasa səs verin."],
[/^Majority approved (.+)\. Waiting for the host's final decision\.$/,"Səs çoxluğu təsdiq etdi: $1. Hostun yekun qərarı gözlənilir."],
[/^Request from (.+) was declined by the vote\.$/,"Müraciət səsvermə ilə rədd edildi: $1."],[/^Request from (.+) was declined\.$/,"Müraciət rədd edildi: $1."],
[/^The host declined (.+)\.$/,"Host rədd etdi: $1."],[/^(.+) left the group\.$/,"$1 qrupdan çıxdı."],[/^(.+) created the group\.$/,"$1 qrupu yaratdı."],
[/^Kick vote started for (.+)\. 80% of the other members must approve\.$/,"$1 üçün çıxarma səsverməsi başladı. Digər üzvlərin 80%-i razı olmalıdır."],
[/^(.+) was removed from the group \(vote passed\)\.$/,"$1 qrupdan çıxarıldı (səsvermə keçdi)."],[/^Vote to remove (.+) failed\.$/,"Çıxarma səsverməsi uğursuz oldu: $1."],
[/^(.+) was removed from the group( by an admin)?\.$/,"$1 qrupdan çıxarıldı."],[/^(.+) was (?:added to this group|moved here by an admin)\.$/,"$1 bu qrupa əlavə edildi."],
[/^(.+) invited (.+)\.$/,"$1 dəvət etdi: $2."],[/^(.+) declined the invitation\.$/,"$1 dəvəti rədd etdi."]
];

/* ---------- 3. TƏRCÜMƏ FUNKSİYASI ---------- */
// Əvvəl və sonundakı emoji/oxları ayırır ki, "🔔 Notifications" kimi mətnlər də tapılsın
var SYM="[\\s\\u2190-\\u21FF\\u2022\\u00B7\\u2713\\u2717\\u2716\\u2714\\uFE0F\\u200D\\u23F9\\u2B50\\u2705\\u{1F000}-\\u{1FAFF}\\u{2600}-\\u{27BF}]";
var EDGE=new RegExp("^("+SYM+"*)([\\s\\S]*?)("+SYM+"*)$","u");
var cache=new Map();
function lookup(c){
 if(Object.prototype.hasOwnProperty.call(EXACT,c))return EXACT[c];
 for(var i=0;i<PAT.length;i++){var m=PAT[i][0].exec(c);if(m)return typeof PAT[i][1]==="function"?PAT[i][1](m):c.replace(PAT[i][0],PAT[i][1])}
 return null}
function compute(s){
 var m=/^(\s*)([\s\S]*?)(\s*)$/.exec(s),lead=m[1],core=m[2],trail=m[3];if(!core)return s;
 if(trail&&RAW[s]!==undefined)return RAW[s];
 var out=lookup(core);
 if(out===null){var e=EDGE.exec(core);if(e&&e[2]&&(e[1]||e[3])){var x=lookup(e[2]);if(x!==null)out=e[1]+x+e[3]}}
 return out===null?s:lead+out+trail}
// Bir mətni Azərbaycan dilinə çevirir (tapılmasa olduğu kimi qaytarır)
function trText(s){if(LANG!=="az"||!s)return s;var r=cache.get(s);if(r!==undefined)return r;r=compute(s);if(cache.size>3000)cache.clear();cache.set(s,r);return r}
function trForce(s){var r=compute(s);return r}

/* ---------- 4. EKRANA TƏTBİQ ---------- */
var ATTR=["placeholder","title","aria-label"],SKIPTAG={SCRIPT:1,STYLE:1,TEXTAREA:1,INPUT:1,CODE:1};
var orig=new WeakMap();          // mətn qovşağı → {en, az}: ingilis variantına qayıtmaq üçün
var PV_OK={"All students":1,"Only my group":1,"Say hi 👋":1,"Voice message":1,"🎤 Voice message":1,"🖼️ Photo":1};
// İstifadəçi məzmunu (çat mesajları) tərcümə olunmur. Sistem mesajları və səsvermə kartları olunur.
function userArea(n){var p=n.parentNode;if(!p)return true;if(SKIPTAG[p.tagName])return true;var c=p.classList;
 if(c&&c.contains("b")&&!c.contains("sys")&&!c.contains("vote"))return true;return false}
function nodeTr(n,v){var p=n.parentNode,c=p&&p.classList;
 if(c&&c.contains("pv")){ // çat siyahısındakı son mesaj: yalnız "Siz: " və hazır ifadələr
  var t=v.trim();if(t.indexOf("You: ")===0)return v.replace(t,"Siz: "+(EXACT[t.slice(5)]||(PV_OK[t.slice(5)]?trText(t.slice(5)):t.slice(5))));
  return PV_OK[t]?trText(v):v}
 return trText(v)}
function translateNode(n){if(LANG!=="az"||userArea(n))return;var v=n.nodeValue;if(!v||!/[A-Za-z]/.test(v))return;var o=orig.get(n);if(o&&o.az===v)return;
 var t=nodeTr(n,v);if(t!==v){orig.set(n,{en:v,az:t});n.nodeValue=t}}
function translateAttrs(el){if(LANG!=="az"||!el.getAttribute)return;for(var i=0;i<ATTR.length;i++){var a=ATTR[i],v=el.getAttribute(a);if(!v)continue;var o=el.__i18n&&el.__i18n[a];if(o&&o.az===v)continue;var t=trText(v);if(t!==v){(el.__i18n=el.__i18n||{})[a]={en:v,az:t};el.setAttribute(a,t)}}}
function walk(n,fn){if(!n)return;if(n.nodeType===3){fn.text(n);return}if(n.nodeType!==1||SKIPTAG[n.tagName]&&n.tagName!=="INPUT"&&n.tagName!=="TEXTAREA")return;fn.attr(n);var ch=n.childNodes||[];for(var i=0;i<ch.length;i++)walk(ch[i],fn)}
function translateTree(root){walk(root,{text:translateNode,attr:translateAttrs})}
function restoreTree(root){walk(root,{text:function(n){var o=orig.get(n);if(o&&n.nodeValue===o.az){n.nodeValue=o.en}orig.delete(n)},
 attr:function(el){var o=el.__i18n;if(!o)return;for(var a in o)if(el.getAttribute(a)===o[a].az)el.setAttribute(a,o[a].en);el.__i18n=null}})}

/* ---------- 5. DİL DÜYMƏSİ ---------- */
function isPhone(){try{return window.matchMedia("(max-width:800px)").matches}catch(e){return window.innerWidth<=800}}
function switchHtml(){return '<button class="lbtn'+(LANG==="az"?" on":"")+'" data-l="az" onclick="setLang(\'az\')">AZ</button><button class="lbtn'+(LANG==="en"?" on":"")+'" data-l="en" onclick="setLang(\'en\')">EN</button>'}
function mk(tag,id,cls,html){var e=document.createElement(tag);e.id=id;e.className=cls;e.innerHTML=html;return e}
// Düyməni lazımi yerlərə qoyur: masaüstündə başlığın sağ üstünə, hər yerdə Ayarlar kartına, giriş ekranında sağ üst küncə
function ensureUI(){
 if(!document.body)return;
 var hd=document.querySelector(".hd .row"),floating=document.getElementById("langfloat");
 if(hd&&!isPhone()&&!document.getElementById("langhd"))hd.insertBefore(mk("span","langhd","lang",switchHtml()),hd.firstChild);
 if((!hd||isPhone())&&document.getElementById("langhd")){var x=document.getElementById("langhd");x.parentNode.removeChild(x)}
 var nn=document.getElementById("nn");
 if(nn&&!document.getElementById("langset")){var card=nn.closest?nn.closest(".card"):null,b=card&&card.querySelector("b");
  if(card&&b)card.insertBefore(mk("div","langset","langrow",'<span>Dil / Language</span><span class="lang">'+switchHtml()+'</span>'),b.nextSibling)}
 var loginScreen=document.querySelector(".stage"),showFloat=!!loginScreen&&!document.querySelector(".hd");
 if(showFloat&&!floating)document.body.appendChild(mk("div","langfloat","lang",switchHtml()));
 if(!showFloat&&floating)floating.parentNode.removeChild(floating)}
function syncButtons(){var bs=document.querySelectorAll?document.querySelectorAll(".lbtn"):[];for(var i=0;i<bs.length;i++){var on=bs[i].getAttribute("data-l")===LANG;bs[i].className="lbtn"+(on?" on":"")}}
var css=".lang{display:inline-flex;gap:2px;padding:2px;border-radius:11px;background:var(--bg);border:1px solid var(--bd)}"
 +".lang .lbtn{background:transparent!important;background-image:none!important;box-shadow:none!important;color:var(--mu)!important;padding:5px 10px!important;border-radius:9px!important;font-size:12px!important;font-weight:700!important;border:0!important;transform:none!important}"
 +".lang .lbtn.on{background:var(--ac)!important;color:#fff!important}"
 +".hd .lang{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.25)}.hd .lang .lbtn{color:#fff!important}.hd .lang .lbtn.on{background:#fff!important;color:#4f46e5!important}"
 +".langrow{display:flex;justify-content:space-between;align-items:center;margin:8px 0 4px;color:var(--mu)}"
 +"#langfloat{position:fixed;top:calc(12px + env(safe-area-inset-top,0px));right:12px;z-index:50;box-shadow:0 6px 18px -8px rgba(0,0,0,.4);background:var(--card)}";

/* ---------- 6. DİLİ DƏYİŞMƏK ---------- */
function setLang(l){if(l!=="az"&&l!=="en")return;LANG=l;try{localStorage.setItem("lang",l)}catch(e){}
 if(document.documentElement)document.documentElement.lang=l;
 if(l==="az")translateTree(document.body);else restoreTree(document.body);
 syncButtons();
 if(typeof window.render==="function")window.render()} // tətbiq səhifəni yenidən çəkir; mətnlər yeni dildə çıxır
function init(){
 var st=document.createElement("style");st.id="i18n-style";st.textContent=css;document.head.appendChild(st);
 if(document.documentElement)document.documentElement.lang=LANG;
 if(window.MutationObserver){new MutationObserver(function(list){
   if(LANG==="az")for(var i=0;i<list.length;i++){var m=list[i];
    if(m.type==="childList")for(var j=0;j<m.addedNodes.length;j++)translateTree(m.addedNodes[j]);
    else if(m.type==="characterData")translateNode(m.target);
    else if(m.type==="attributes")translateAttrs(m.target)}
   ensureUI();syncButtons()}).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTR})}
 translateTree(document.body);ensureUI();
 // Brauzer sistem bildirişləri (sağ üst kənarda çıxan) də Azərbaycan dilində olsun
 if(window.Notification){var N=window.Notification;var W=function(t,o){o=o||{};return new N(trText(t),Object.assign({},o,{body:trText(o.body||"")}))};
  W.requestPermission=function(){return N.requestPermission.apply(N,arguments)};Object.defineProperty(W,"permission",{get:function(){return N.permission}});window.Notification=W}}
window.setLang=setLang;window.I18N={trText:trText,trForce:trForce,translateTree:translateTree,restoreTree:restoreTree,ensureUI:ensureUI,EXACT:EXACT,PAT:PAT,get lang(){return LANG},set lang(v){LANG=v}};
if(typeof document!=="undefined"&&document.body&&window.MutationObserver!==undefined)init();
})();
