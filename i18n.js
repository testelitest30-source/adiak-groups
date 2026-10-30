/* =====================================================================
   i18n.js  -  Dil dəyişdirici (AZ / EN). Yüklənmə sırası: config.js → i18n.js → core.js → pages.js → main.js
   tr("English mətn", {dəyişən:dəyər})  → seçilmiş dildə mətni qaytarır.
   Yeni mətn əlavə etmək: ingiliscəsini kodda tr("...") ilə yaz, azərbaycancasını aşağıdakı AZ lüğətinə əlavə et.
   ===================================================================== */
let LANG="az";
try{const s=localStorage.getItem("lang");if(s==="en"||s==="az")LANG=s}catch(e){}
try{document.documentElement.lang=LANG}catch(e){}

const AZ={
/* --- Qrupa qəbul və kick kartları --- */
"Put to vote":"Səsverməyə qoy","waiting":"gözləyir","Step 1 of 3 · waiting for a member to open the vote":"1-ci addım / 3 · üzvlərdən biri səsvermə açmalıdır",
"Accept":"Qəbul et","Reject":"Rədd et","Decline":"Rədd et","you voted":"səs verdiniz","voting":"səsvermə gedir",
"Step 2 of 3 · {y}/{need} approvals needed (majority)":"2-ci addım / 3 · {y}/{need} təsdiq lazımdır (əksəriyyət)",
"waiting for host":"qrup rəhbəri gözlənilir","Step 3 of 3 · members approved · the host decides":"3-cü addım / 3 · üzvlər təsdiqlədi · qərarı qrup rəhbəri verir",
"Join request":"Qoşulma müraciəti","Kick vote":"Çıxarma səsverməsi","Remove <b>{name}</b>?":"<b>{name}</b> qrupdan çıxarılsın?",
"{y}/{need} approvals (80% of {m})":"{y}/{need} təsdiq ({m} nəfərin 80%-i)","Approve":"Təsdiq et",
/* --- Profil, çat --- */
"pts":"xal","points":"xal","Everyone":"Hamı","my group":"mənim qrupum","All students":"Bütün tələbələr","Only my group":"Yalnız mənim qrupum","Say hi":"Salam yaz",
"Chat":"Çat","Delete every chat":"Bütün çatları sil","Clear all":"Hamısını təmizlə","You":"Siz","No messages yet. Say hi!":"Hələ mesaj yoxdur. Salam yazın!",
"Delete all messages in this chat":"Bu çatdakı bütün mesajları sil","Send a file or photo":"Fayl və ya şəkil göndər","Message…":"Mesaj…","Voice message":"Səsli mesaj",
"send":"göndər","Cancel":"Ləğv et","Send":"Göndər","Photo":"Şəkil","tap to open":"açmaq üçün toxunun","Loading…":"Yüklənir…",
/* --- Ana səhifə --- */
"Teacher account":"Müəllim hesabı","You can: {list}.":"Edə bilərsiniz: {list}.","chat with students":"tələbələrlə yazışmaq",
"give points":"xal vermək","manage groups (add, move, remove students)":"qrupları idarə etmək (tələbə əlavə etmək, köçürmək, çıxarmaq)","moderate chats":"çatlara nəzarət etmək",
"see students' passwords":"tələbələrin parollarını görmək","open the admin panel":"admin panelini açmaq","do everything":"hər şeyi etmək",
"Host panel":"Host paneli","Give points in Settings. You can start a kick vote in any group.":"Xalları Ayarlar bölməsində verin. İstənilən qrupda çıxarma səsverməsi başlada bilərsiniz.",
"You're in {g}":"Siz {g} qrupundasınız","{a}/{b} members":"{a}/{b} üzv","you are the host":"qrup rəhbəri sizsiniz","You're idle":"Qrupsuzsunuz",
"Open a group and send a join request, create your own, or wait for an invitation.":"Bir qrupu açıb qoşulma müraciəti göndərin, öz qrupunuzu yaradın və ya dəvət gözləyin.",
"requested":"müraciət göndərilib","{n} free":"{n} boş yer","Top points":"Ən çox xal","No points yet":"Hələ xal yoxdur","See all":"Hamısına bax","Close":"Bağla",
"Invite idle students":"Qrupsuz tələbələri dəvət et","Invited":"Dəvət göndərildi","cancel":"ləğv et","Invite":"Dəvət et","No idle students right now":"Hazırda qrupsuz tələbə yoxdur",
/* --- Qrup səhifəsi --- */
"Leave group":"Qrupdan çıx","Request sent · tap to withdraw":"Müraciət göndərildi · geri götürmək üçün toxunun","Teachers do not join groups":"Müəllimlər qruplara qoşulmur",
"Group full":"Qrup doludur","Leave your group first":"Əvvəlcə qrupunuzdan çıxın","Back":"Geri","{n} participants · {f} free spots":"{n} iştirakçı · {f} boş yer",
"Tap a member to see their profile":"Profilə baxmaq üçün üzvə toxunun","Remove":"Çıxar","Kick":"Çıxarmağı təklif et","No members yet":"Hələ üzv yoxdur",
"Groups":"Qruplar","{a}/{b} created · {n} left":"{a}/{b} yaradılıb · {n} qalıb","No groups yet. Create the first one!":"Hələ qrup yoxdur. İlk qrupu siz yaradın!","New group":"Yeni qrup",
/* --- Müraciətlər --- */
"Waiting for a member to open the vote":"Üzvlərdən birinin səsvermə açması gözlənilir","Members are voting":"Üzvlər səs verir",
"Approved by members · waiting for the host":"Üzvlər təsdiqlədi · qrup rəhbəri gözlənilir","Invitations for you":"Sizə dəvətlər","from {nm}":"göndərən: {nm}",
"People who want to join {g}":"{g} qrupuna qoşulmaq istəyənlər","No join requests right now":"Hazırda qoşulma müraciəti yoxdur","Kick votes":"Çıxarma səsvermələri",
"My sent requests":"Göndərdiyim müraciətlər","Withdraw":"Geri götür","No pending requests":"Gözləyən müraciət yoxdur","Idle people ({n})":"Qrupsuz insanlar ({n})","Nobody":"Heç kim",
/* --- Ayarlar --- */
"Settings":"Ayarlar","Display name":"Görünən ad","Save":"Yadda saxla","Open admin panel":"Admin panelini aç","Profile picture":"Profil şəkli",
"Sounds off":"Səs söndürülüb","Sounds on":"Səs açıqdır","Log out":"Çıxış","Language":"Dil","Change password":"Parolu dəyiş",
"Admin passwords are private: nobody else can see or reset yours.":"Adminlərin parolları məxfidir: heç kim sizin parolunuzu görə və ya sıfırlaya bilməz.",
"Class admins can see your password so they can help you if you forget it. Do not reuse a password from anywhere else.":"Sinif adminləri parolunuzu görə bilir ki, unutsanız kömək edə bilsinlər. Başqa yerdə istifadə etdiyiniz parolu burada işlətməyin.",
"New password (min 6)":"Yeni parol (ən azı 6 simvol)","Repeat":"Təkrar","Give points":"Xal ver","Add":"Əlavə et",
/* --- Menyu və başlıqlar --- */
"Notifications":"Bildirişlər","Requests & invites":"Müraciətlər və dəvətlər","Menu":"Menyu","Requests & idle":"Müraciətlər və qrupsuzlar","Idle people":"Qrupsuz insanlar","Sounds":"Səs",
/* --- Xal vermə və profil pəncərəsi --- */
"Type a number from -100 to 100":"-100 ilə 100 arasında rəqəm yazın","Adding…":"Əlavə edilir…","Add points":"Xal əlavə et","online":"onlayn","total points":"ümumi xal",
"presentations":"təqdimat","best score":"ən yüksək xal","Average per presentation: {n}":"Təqdimat başına orta: {n}","Recent scores":"Son xallar","Presentation":"Təqdimat",
"Test bonus":"Test üzrə bonus","No scores recorded yet":"Hələ xal qeydə alınmayıb","Points to give":"Veriləcək xal","e.g. 8":"məs. 8","Group":"Qrup","Move here":"Bura köçür",
/* --- Giriş --- */
"Build your presentation team":"Təqdimat komandanı qur","Type your ID and password, then press Enter. Forgot it? Ask an admin to reset it.":"ID və parolunuzu yazıb Enter basın. Unutmusunuz? Adminə müraciət edin, parolunuzu sıfırlasın.",
"Your ID (for example ali.m)":"ID-niz (məsələn, ali.m)","Password":"Parol","Log in":"Daxil ol","Set a new password":"Yeni parol təyin edin",
"Your temporary password stops working after this.":"Müvəqqəti parolunuz bundan sonra işləməyəcək.","Save and continue":"Yadda saxla və davam et",
"Class admins can see your password so they can help if you forget it. Do not use a password from anywhere else.":"Sinif adminləri parolunuzu görə bilir ki, unutsanız kömək edə bilsinlər. Başqa yerdə istifadə etdiyiniz parolu işlətməyin.",
"Your profile was not found. Ask the host to check your account.":"Profiliniz tapılmadı. Hesabınızı yoxlamaq üçün hostdan xahiş edin.",
"Type your ID":"ID-nizi yazın","No connection to the server. Check your internet.":"Serverlə əlaqə yoxdur. İnternetinizi yoxlayın.","Wrong ID or password":"ID və ya parol yanlışdır",
"Connection problem. Please try again.":"Bağlantı problemi. Yenidən cəhd edin.","Connection problem. Retrying…":"Bağlantı problemi. Yenidən cəhd edilir…",
"You were signed out because this account was opened on another device.":"Bu hesaba başqa cihazdan daxil olunduğu üçün sessiyanız bağlandı.",
/* --- Rollar və rütbələr --- */
"Created by":"Yaradanlar","host":"host","teacher":"müəllim","idle":"qrupsuz","Teacher":"Müəllim","Scorer":"Xal verən",
"Newcomer":"Yeni gələn","Speaker":"Çıxışçı","Orator":"Natiq","Maestro":"Ustad",
/* --- Fayl, səs, təsdiq --- */
"Files must be under 25 MB":"Fayllar 25 MB-dan kiçik olmalıdır","Uploading {name}…":"{name} yüklənir…","Sent ✓":"Göndərildi ✓",
"Voice recording is not supported in this browser":"Bu brauzer səs yazmağı dəstəkləmir","Microphone access was denied":"Mikrofona giriş icazəsi verilmədi","Yes":"Bəli",
/* --- Bildirişlər --- */
"{n} items waiting for you":"Sizi {n} iş gözləyir","1 item waiting for you":"Sizi 1 iş gözləyir","Open Requests":"Müraciətləri açın","points!":"xal!",
"Your total is now {n}":"Ümumi xalınız indi {n}","You joined {g}":"Qrupa qoşuldunuz: {g}","Welcome to the group!":"Qrupa xoş gəldiniz!",
"You are no longer in {g}":"Siz artıq bu qrupda deyilsiniz: {g}","{nm} wants to join":"{nm} qrupa qoşulmaq istəyir","Open Requests and put it to a vote":"Müraciətləri açıb səsverməyə qoyun",
"Vote opened for {nm}":"Səsvermə açıldı: {nm}","Cast your vote in Requests":"Səsinizi Müraciətlər bölməsində verin","Majority approved {nm}":"Əksəriyyət təsdiqlədi: {nm}",
"Your final decision is needed":"Sizin yekun qərarınız lazımdır","Kick vote for {nm}":"Çıxarma səsverməsi: {nm}","{nm} joined your group":"{nm} qrupunuza qoşuldu",
"{g} invited you!":"{g} sizi dəvət etdi!","Open Requests to accept":"Qəbul etmək üçün Müraciətləri açın","Members are voting on your request":"Üzvlər müraciətiniz üçün səs verir",
"Members approved your request":"Üzvlər müraciətinizi təsdiqlədi","Waiting for the host's final decision":"Qrup rəhbərinin yekun qərarı gözlənilir",
"Your join request was declined":"Qoşulma müraciətiniz rədd edildi","New message from {nm}":"{nm} sizə yeni mesaj göndərdi","New message in {g} from {nm}":"{g} qrupunda yeni mesaj: {nm}",
"just now":"indicə","{n} min ago":"{n} dəq əvvəl","{n} h ago":"{n} saat əvvəl","{n} d ago":"{n} gün əvvəl","No notifications yet":"Hələ bildiriş yoxdur","Mark all read":"Hamısını oxunmuş et",
/* --- Düymə əməlləri --- */
"Are you sure you want to leave this group?":"Bu qrupdan çıxmaq istədiyinizə əminsiniz?","You left the group":"Qrupdan çıxdınız",
"Delete ALL messages in this chat? This cannot be undone.":"Bu çatdakı BÜTÜN mesajlar silinsin? Bunu geri qaytarmaq olmaz.","Chat cleared":"Çat təmizləndi",
"Delete ALL chats for everyone? This cannot be undone.":"Hamı üçün BÜTÜN çatlar silinsin? Bunu geri qaytarmaq olmaz.","All chats cleared":"Bütün çatlar təmizləndi",
"Remove {name} from the group?":"{name} qrupdan çıxarılsın?","Removed from the group":"Qrupdan çıxarıldı","At least 6 characters":"Ən azı 6 simvol",
"Passwords do not match":"Parollar uyğun gəlmir","Password changed ✓":"Parol dəyişdirildi ✓","Are you sure you want to log out?":"Çıxış etmək istədiyinizə əminsiniz?",
"Vote opened in the group chat":"Səsvermə qrup çatında açıldı","The group limit ({n}) is reached":"Qrup limitinə ({n}) çatılıb",
"Only idle students can create a group. Leave your group first.":"Yalnız qrupsuz tələbələr qrup yarada bilər. Əvvəlcə qrupunuzdan çıxın.",
"You become the host.":"Qrupun rəhbəri siz olacaqsınız.","Group name":"Qrup adı","Max members":"Maksimum üzv sayı","Create":"Yarat",
"Name saved":"Ad yadda saxlanıldı","Home":"Ana səhifə","Welcome, {name}":"Xoş gəlmisiniz, {name}","Class ranking":"Sinif reytinqi","Students":"Tələbələr","Teams":"Qruplar","No data yet":"Hələ məlumat yoxdur","Points":"Xal","Class rank":"Sinifdə yer","Team":"Qrup","Idle":"Qrupsuz","Avg points":"Orta xal","Class":"Sinif","You are viewing this class. Everything you see belongs to it.":"Bu sinfə baxırsınız. Gördüyünüz hər şey bu sinfə aiddir.","Switch class":"Sinfi dəyiş","Open team":"Qrupu aç","Quick links":"Sürətli keçidlər","Admin panel":"Admin paneli","Staff":"Heyət","Select a chat":"Çat seçin","Choose a class":"Sinif seçin","Choose the class you want to open.":"Açmaq istədiyiniz sinfi seçin.","{n} students":"{n} tələbə","No classes yet. An admin must create one.":"Hələ sinif yoxdur. Admin yaratmalıdır.","Class rep":"Starosta","Choose your class":"Sinfinizi seçin","Pick the class you study in. You can set it only once; an admin can change it later.":"Oxuduğunuz sinfi seçin. Bunu yalnız bir dəfə seçə bilərsiniz; sonra yalnız admin dəyişə bilər.","No classes have been created yet. Ask your class representative or an admin.":"Hələ sinif yaradılmayıb. Starostanızdan və ya adminə müraciət edin.","Choose a class first":"Əvvəlcə sinif seçin","That class group does not exist":"Belə sinif yoxdur","That class group already exists":"Bu sinif artıq var","Your class group number":"Akademik qrup nömrəniz","Teams are made only from students of the same class group. You can set it only once; an admin can change it later.":"Komandalar yalnız eyni akademik qrupdan olan tələbələrdən yaradılır. Bunu yalnız bir dəfə seçə bilərsiniz; sonra yalnız admin dəyişə bilər.","e.g. 636s":"məsələn, 636s","Continue":"Davam et","Class group number: 1 to 12 letters or digits, for example 636s":"Akademik qrup nömrəsi: 1–12 hərf və ya rəqəm, məsələn, 636s","Your class group number will be <b>{tag}</b>. You cannot change it yourself later. Continue?":"Akademik qrup nömrəniz <b>{tag}</b> olacaq. Sonra bunu özünüz dəyişə bilməyəcəksiniz. Davam edilsin?","Class group":"Akademik qrup","Install as app":"Tətbiq kimi yüklə","Opens full screen from your home screen, like a normal app.":"Ana ekrandan tam ekranda, adi tətbiq kimi açılır.","Install":"Yüklə","On iPhone: tap Share, then Add to Home Screen.":"iPhone-da: «Paylaş» düyməsinə, sonra «Ana ekrana əlavə et»-ə toxunun.","App installed ✓":"Tətbiq yükləndi ✓","Could not read that image":"Şəkli oxumaq mümkün olmadı"
};

/* Serverdən (bazadan) gələn xəta mətnləri */
const AZ_ERR={
"A vote is already open for this person":"Bu şəxs üçün səsvermə artıq açıqdır","A vote was already opened for this request":"Bu müraciət üçün səsvermə artıq açılıb",
"Admin passwords are private. Only the admin can change their own password.":"Adminlərin parolları məxfidir. Yalnız admin öz parolunu dəyişə bilər.","Admins only":"Yalnız adminlər üçün",
"Choose 1 to 12":"1-dən 12-yə qədər seçin","File must be under 25 MB":"Fayl 25 MB-dan kiçik olmalıdır","File upload not found":"Yüklənmiş fayl tapılmadı",
"Group name must be 1 to 30 characters":"Qrup adı 1–30 simvol olmalıdır","Group not found":"Qrup tapılmadı","ID: 2-40 characters, letters, digits, dot, dash, underscore":"ID: 2–40 simvol; hərflər, rəqəmlər, nöqtə, defis və alt xətt",
"Invalid chat":"Yanlış söhbət","Enter your class group number first":"Əvvəlcə akademik qrup nömrənizi daxil edin","This team belongs to another class group":"Bu komanda başqa akademik qrupa aiddir","That person is in another class group":"Bu şəxs başqa akademik qrupdandır","Only students have a class group number":"Yalnız tələbələrin akademik qrup nömrəsi olur","Your class group number is already set. Ask an admin to change it":"Akademik qrup nömrəniz artıq təyin olunub. Dəyişmək üçün adminə müraciət edin","Class group number: 1 to 12 letters or digits, for example 636s":"Akademik qrup nömrəsi: 1–12 hərf və ya rəqəm, məsələn, 636s","Remove the person from their team first":"Əvvəlcə şəxsi komandasından çıxarın","Leave your current group first":"Əvvəlcə hazırkı qrupdan çıxın","Leave your group first":"Əvvəlcə qrupunuzdan çıxın",
"Message must be 1 to 1000 characters":"Mesaj 1–1000 simvol olmalıdır","Name must be 2 to 30 characters":"Ad 2–30 simvol olmalıdır","No names given":"Heç bir ad verilməyib",
"Not signed in":"Hesaba daxil olmamısınız","Only idle students can create a group":"Yalnız qrupsuz tələbələr qrup yarada bilər","Only members of this group can open a vote":"Yalnız bu qrupun üzvləri səsvermə aça bilər",
"Only members of this group can vote":"Yalnız bu qrupun üzvləri səs verə bilər","Only students can be placed in groups":"Yalnız tələbələr qruplara yerləşdirilə bilər",
"Only the group host can invite":"Yalnız qrup rəhbəri dəvət edə bilər","Only the group host makes the final decision":"Yekun qərarı yalnız qrup rəhbəri verir",
"Only the group host or admin can start a kick vote":"Çıxarma səsverməsini yalnız qrup rəhbəri və ya admin başlada bilər","Only the other members of this group can vote":"Yalnız bu qrupun digər üzvləri səs verə bilər",
"Person not found":"Şəxs tapılmadı","Points must be between -100 and 100":"Xal -100 ilə 100 arasında olmalıdır","Role must be student or teacher":"Rol tələbə və ya müəllim olmalıdır",
"Size must be 1 to 10":"Say 1-dən 10-a qədər olmalıdır","That ID is already used":"Bu ID artıq istifadə olunur","That account cannot receive points":"Bu hesaba xal vermək olmaz",
"That group is full":"Bu qrup doludur","That is not your current password":"Bu sizin hazırkı parolunuz deyil","That name is already taken":"Bu ad artıq götürülüb",
"That person is already in a group":"Bu şəxs artıq qrupdadır","That person is not in a group":"Bu şəxs heç bir qrupda deyil","The Host account has no role":"Host hesabının rolu yoxdur",
"The group already has more members than that":"Qrupda artıq bundan çox üzv var","The group is full":"Qrup doludur","The host account cannot join groups":"Host hesabı qruplara qoşula bilməz",
"The host must be a member of the group":"Qrup rəhbəri qrupun üzvü olmalıdır","The members have not approved this request yet":"Üzvlər bu müraciəti hələ təsdiqləməyib",
"There are already more groups than that":"Artıq bundan çox qrup var","This group is full":"Bu qrup doludur","This invitation is no longer open":"Bu dəvət artıq etibarlı deyil",
"This request is no longer open":"Bu müraciət artıq etibarlı deyil","This vote is closed":"Bu səsvermə bağlanıb","Type a name":"Ad yazın","Unknown permission":"Naməlum icazə",
"Unknown setting":"Naməlum ayar","Use Leave group instead":"Əvəzinə «Qrupdan çıx» düyməsindən istifadə edin","Voting is not open for this request":"Bu müraciət üçün səsvermə açıq deyil",
"You cannot remove your own admin right":"Öz admin hüququnuzu ala bilməzsiniz","You do not have permission for this action":"Bu əməliyyat üçün icazəniz yoxdur",
"You do not have permission to give points":"Xal vermək üçün icazəniz yoxdur","Your group is full":"Qrupunuz doludur",
"New password should be different from the old password.":"Yeni parol köhnə paroldan fərqli olmalıdır.","Password should be at least 6 characters.":"Parol ən azı 6 simvol olmalıdır.",
"Password should be at least 6 characters":"Parol ən azı 6 simvol olmalıdır","Failed to fetch":"Serverlə əlaqə yoxdur. İnternetinizi yoxlayın.","Invalid login credentials":"ID və ya parol yanlışdır"
};
const AZ_ERR_RE=[[/^The group limit \((\d+)\) is reached$/,"Qrup limitinə ({1}) çatılıb"]];

/* Qrup çatındakı sistem mesajları (bazada ingiliscə saxlanılır, burada göstərilərkən tərcümə olunur) */
const AZ_SYS=[
[/^(.+) joined the group 🎉$/,"{1} qrupa qoşuldu 🎉"],
[/^The group is full\.$/,"Qrup doludur."],
[/^Majority approved (.+)\. Waiting for the host's final decision\.$/,"Əksəriyyət {1} üçün razılaşdı. Qrup rəhbərinin yekun qərarı gözlənilir."],
[/^Request from (.+) was declined by the vote\.$/,"{1} üçün müraciət səsvermə ilə rədd edildi."],
[/^(.+) was removed from the group \(vote passed\)\.$/,"{1} səsvermə nəticəsində qrupdan çıxarıldı."],
[/^Vote to remove (.+) failed\.$/,"{1} üçün çıxarma səsverməsi keçmədi."],
[/^(.+) was added to this group\.$/,"{1} bu qrupa əlavə edildi."],
[/^(.+) was removed from the group\.$/,"{1} qrupdan çıxarıldı."],
[/^(.+) created the group\.$/,"{1} qrupu yaratdı."],
[/^The host declined (.+)\.$/,"Qrup rəhbəri {1} üçün müraciəti rədd etdi."],
[/^(.+) left the group\.$/,"{1} qrupdan çıxdı."],
[/^Vote opened: should (.+) join\? Members, please vote\.$/,"Səsvermə açıldı: {1} qrupa qoşulsun? Üzvlər, zəhmət olmasa səs verin."],
[/^(.+) wants to join\. A member can put the request to a vote\.$/,"{1} qrupa qoşulmaq istəyir. Üzvlərdən biri müraciəti səsverməyə qoya bilər."],
[/^(.+) declined the invitation\.$/,"{1} dəvəti rədd etdi."],
[/^Kick vote started for (.+)\. 80% of the other members must approve\.$/,"{1} üçün çıxarma səsverməsi başladı. Digər üzvlərin 80%-i təsdiq etməlidir."],
[/^(.+) invited (.+)\.$/,"{1} dəvət göndərdi: {2}."]
];

const _fill=(s,v)=>v?s.replace(/\{(\w+)\}/g,(m,n)=>n in v?v[n]:m):s;
/* Əsas tərcümə funksiyası */
const tr=(k,v)=>_fill(LANG==="az"&&Object.prototype.hasOwnProperty.call(AZ,k)?AZ[k]:k,v);
/* Serverdən gələn xəta mətni */
const trErr=m=>{m=String(m==null?"":m);if(LANG!=="az")return m;if(Object.prototype.hasOwnProperty.call(AZ_ERR,m))return AZ_ERR[m];
 for(const [re,s] of AZ_ERR_RE){const x=re.exec(m);if(x)return s.replace(/\{(\d)\}/g,(q,i)=>x[i])}return m};
/* Qrup çatındakı sistem mesajı */
const trSys=m=>{m=String(m==null?"":m);if(LANG!=="az")return m;
 for(const [re,s] of AZ_SYS){const x=re.exec(m);if(x)return s.replace(/\{(\d)\}/g,(q,i)=>x[i])}return m};

/* AZ | EN düyməsi (masaüstündə yuxarı sağda, telefonda Ayarlarda, giriş səhifəsində yuxarı sağda) */
const langSw=()=>`<span class="lang"><button class="s${LANG==="az"?" on":""}" onclick="setLang('az')" title="Azərbaycanca">AZ</button><button class="s${LANG==="en"?" on":""}" onclick="setLang('en')" title="English">EN</button></span>`;
function setLang(l){if((l!=="az"&&l!=="en")||l===LANG)return;LANG=l;try{localStorage.setItem("lang",l)}catch(e){}try{document.documentElement.lang=l}catch(e){}
 try{const a=document.activeElement;if(a&&a.blur)a.blur()}catch(e){}if(typeof pmSig!=="undefined")pmSig="";closeStatic();if(typeof render==="function")render();else if(typeof adminRerender==="function")adminRerender()}
/* Açıq statik pəncərələri (təsdiq, yeni qrup) bağlayır, çünki onların mətni dəyişmir */
function closeStatic(){try{const m=document.querySelector("#modal");if(m&&(typeof pm==="undefined"||!pm))m.innerHTML=""}catch(e){}}
