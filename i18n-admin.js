/* =====================================================================
   i18n-admin.js  -  Admin panelinin tərcüməsi (AZ | EN). Yalnız admin.html yükləyir.
   Yüklənmə sırası: config.js → i18n.js → i18n-admin.js → admin.js
   Necə işləyir: admin.js-də esc() istifadəçi məlumatını (ad, mesaj) gizli işarələrlə (\u0001 … \u0002) əhatə edir.
   Hər innerHTML yazılışı admHtml() ilə keçir: mətn düyünləri və placeholder/title lüğətdən tərcümə olunur,
   işarələnmiş məlumata isə toxunulmur. Rəqəmlər {0}, {1} … ilə əvəz olunub lüğətdə axtarılır.
   Yeni mətn əlavə etmək: aşağıdakı ADM-ə  "English mətn": "Azərbaycanca"  əlavə et ({0} = rəqəm və ya ad).
   ===================================================================== */
const ADM={
/* giriş, giriş icazəsi, yan menyu */
"Sign in with an account that has panel access.":"Panelə giriş icazəsi olan hesabla daxil olun.","for example ali.m":"məsələn, ali.m","Password":"Parol","Sign in":"Daxil ol","No access":"Giriş yoxdur",
"This account is not allowed to open the admin panel. An admin can allow it in People → Permissions.":"Bu hesabın admin panelini açmağa icazəsi yoxdur. Admin bunu «İnsanlar → İcazələr» bölməsində verə bilər.",
"Sign out":"Çıxış","Student site":"Tələbə saytı","Team Maker control panel":"Team Maker idarə paneli",
"Dashboard":"Panel","People":"İnsanlar","Groups":"Qruplar","Chats":"Çatlar","Passwords":"Parollar","Close the day":"Günü bağla","Import names":"Adları idxal et","Settings":"Ayarlar",
/* təsdiq pəncərəsi, xəbərlər */
"Are you sure?":"Əminsiniz?","Cancel":"Ləğv et","Yes, do it":"Bəli, et","Copied":"Kopyalandı","Select and copy it by hand":"Əl ilə seçib kopyalayın",
"Name saved":"Ad yadda saxlanıldı","ID saved":"ID yadda saxlanıldı","Role changed":"Rol dəyişdirildi","Type a number":"Rəqəm yazın","+{0} points":"+{0} xal","-{0} points":"-{0} xal",
"Permissions saved":"İcazələr yadda saxlanıldı","Signed out everywhere":"Hər yerdən çıxış edildi","Removed from the group":"Qrupdan çıxarıldı","Moved":"Köçürüldü","Type a name":"Ad yazın",
"Group saved":"Qrup yadda saxlanıldı","Group deleted":"Qrup silindi","Message deleted":"Mesaj silindi","Chat cleared":"Çat təmizləndi","All chats cleared":"Bütün çatlar təmizləndi",
"Day closed. Chats archived.":"Gün bağlandı. Çatlar arxivləşdirildi.","Paste at least one name":"Ən azı bir ad yapışdırın","Saved":"Yadda saxlanıldı","Everything cleared":"Hər şey təmizləndi","Type RESET exactly":"RESET sözünü düz yazın",
/* panel */
"Welcome, {0}. Here is what is happening right now.":"Xoş gəldiniz, {0}. Hazırda baş verənlər bunlardır.",
"students":"tələbə","teachers":"müəllim","groups":"qrup","idle students":"qrupsuz tələbə","online now":"indi onlayn","messages":"mesaj","admins":"admin",
"Team & permissions":"Komanda və icazələr","Who can do what. Open a person to change it with the switches.":"Kim nə edə bilər. Dəyişmək üçün adamı açıb açarlardan istifadə edin.","No staff yet":"Hələ heyət yoxdur",
"Quick actions":"Sürətli əməliyyatlar","Shortcuts to the things you do most.":"Ən çox etdiyiniz işlərə qısayollar.","Add person":"Adam əlavə et","Latest messages":"Son mesajlar","No messages yet":"Hələ mesaj yoxdur",
"Full access":"Tam giriş","Teacher":"Müəllim","Student":"Tələbə",
"no class group":"akademik qrup yoxdur","Class group number":"Akademik qrup nömrəsi","e.g. {0}s":"məs. {0}s","Class group saved":"Akademik qrup yadda saxlanıldı",
"Students are asked for it at first login. Teams only contain students of the same class group. Leave empty to ask the student again.":"Tələbədən bu ilk girişdə soruşulur. Komandalar yalnız eyni akademik qrupdan olan tələbələrdən ibarət olur. Boş buraxsanız, tələbədən yenidən soruşulacaq.",
"Remove the person from their team before changing the number.":"Nömrəni dəyişməzdən əvvəl şəxsi komandasından çıxarın.",
/* insanlar */
"All":"Hamısı","Students":"Tələbələr","Teachers":"Müəllimlər","Admins":"Adminlər","Idle":"Qrupsuz","idle":"qrupsuz","{0} accounts. Tap a person to manage them.":"{0} hesab. İdarə etmək üçün adama toxunun.",
"Search by name or ID…":"Ad və ya ID ilə axtar…","Nobody found":"Heç kim tapılmadı",
"The Host account always has every right.":"Host hesabı həmişə bütün hüquqlara malikdir.","Tick or untick to give or take a permission. It is saved at once.":"İcazə vermək və ya almaq üçün işarələyin və ya işarəni götürün. Dərhal yadda saxlanılır.",
"Teacher preset":"Müəllim şablonu","Remove all":"Hamısını götür","No special permissions.":"Xüsusi icazə yoxdur.","Only admins can change permissions.":"İcazələri yalnız adminlər dəyişə bilər.",
"Profile":"Profil","Name":"Ad","Save":"Yadda saxla","ID (what they type to log in)":"ID (girişdə yazdıqları)","Role":"Rol","Points":"Xallar","points now":"hazırkı xal","e.g. {0} (or -{1})":"məs. {0} (və ya -{1})","Add points":"Xal əlavə et",
"Permissions (Yetkilər)":"İcazələr","Admin passwords are private. Only the admin can change their own (Settings → Change password).":"Adminlərin parolları məxfidir. Yalnız admin öz parolunu dəyişə bilər (Ayarlar → Parolu dəyiş).",
"Loading…":"Yüklənir…","Group":"Qrup","Now:":"Hazırda:","no group":"qrup yoxdur","Move here":"Bura köçür","Remove":"Çıxar","Session":"Sessiya","Sign out everywhere":"Hər yerdən çıxış et",
"Add a person":"Adam əlavə et","No limit of {0}. The ID is made automatically: first name, dot, first letter of the surname.":"{0} nəfər limiti yoxdur. ID avtomatik yaradılır: ad, nöqtə, soyadın ilk hərfi.",
"Full name":"Tam ad","Create":"Yarat","{0} added":"{0} əlavə edildi","Give them the ID and this temporary password. They choose their own password at the first login. You can see it later in the Passwords tab.":"Onlara ID və bu müvəqqəti parolu verin. İlk girişdə öz parollarını seçəcəklər. Sonra «Parollar» bölməsində görə bilərsiniz.","Copy":"Kopyala","Close":"Bağla",
/* qruplar */
"{0} of {1} groups created":"{0}/{1} qrup yaradılıb","Host: {0}":"Rəhbər: {0}","{0} pts":"{0} xal","Edit":"Redaktə et","Delete":"Sil","No groups yet. Students create them on the main site.":"Hələ qrup yoxdur. Tələbələr onları əsas saytda yaradır.",
"No members yet":"Hələ üzv yoxdur","Edit group":"Qrupu redaktə et","Max members ({0}-{1}, not below {2})":"Maksimum üzv sayı ({0}–{1}, {2}-dən az olmaz)","Host":"Rəhbər","(no members)":"(üzv yoxdur)",
"Delete this group? Its members become idle and its chat is removed.":"Bu qrup silinsin? Üzvləri qrupsuz qalacaq, çatı silinəcək.",
/* çatlar */
"Read and moderate every conversation. Deleted messages cannot be restored.":"Hər söhbəti oxuyun və nəzarət edin. Silinmiş mesajları bərpa etmək olmaz.","Delete ALL chats":"BÜTÜN çatları sil","Clear this chat":"Bu çatı təmizlə",
"No chats":"Çat yoxdur","No messages":"Mesaj yoxdur","Delete this message?":"Bu mesaj silinsin?",
/* parollar */
"What each person logs in with. Admin passwords are private and never shown.":"Hər kəsin girişdə istifadə etdiyi məlumat. Adminlərin parolları məxfidir və heç vaxt göstərilmir.","Hide all":"Hamısını gizlət","Reveal all":"Hamısını göstər","Download CSV":"CSV yüklə",
"Needs reset":"Sıfırlama lazımdır","Person":"Şəxs","Status":"Vəziyyət","Reset":"Sıfırla","Temporary":"Müvəqqəti","Set by student":"Tələbə təyin edib","Changed, reset to see":"Dəyişdirilib, görmək üçün sıfırlayın","No copy":"Surət yoxdur",
"Hide":"Gizlət","Show":"Göstər","No copy saved yet. Reset the password to create a new one you can see.":"Hələ saxlanılmış surət yoxdur. Görə biləcəyiniz yeni parol yaratmaq üçün parolu sıfırlayın.",
"The student changed it before copies were turned on, so it cannot be shown. Reset to create a visible one.":"Tələbə bunu surət saxlanılmazdan əvvəl dəyişib, ona görə göstərmək olmur. Görünən parol yaratmaq üçün sıfırlayın.",
"New temporary password":"Yeni müvəqqəti parol","They set their own password at the next login. You can look at it again in the Passwords tab.":"Növbəti girişdə öz parollarını təyin edəcəklər. Yenidən «Parollar» bölməsində baxa bilərsiniz.","Back":"Geri",
/* günü bağla, idxal, ayarlar */
"When the presentations are over, archive every chat and start fresh":"Təqdimatlar bitəndə bütün çatları arxivləyin və təzədən başlayın","Name of this archive":"Bu arxivin adı",
"Also dissolve all groups (everyone becomes idle)":"Bütün qrupları da ləğv et (hamı qrupsuz olur)","Close the day and archive chats":"Günü bağla və çatları arxivlə","Archives":"Arxivlər","{0} messages":"{0} mesaj","No archives yet":"Hələ arxiv yoxdur","Empty":"Boşdur",
"Paste a class list. IDs and temporary passwords are created automatically.":"Sinif siyahısını yapışdırın. ID-lər və müvəqqəti parollar avtomatik yaradılır.","Unused numbered accounts left:":"Qalan istifadə olunmamış nömrəli hesablar:",
"Create IDs and passwords":"ID və parolları yarat","{0} students ready":"{0} tələbə hazırdır","You can see these passwords later in the Passwords tab.":"Bu parolları sonra «Parollar» bölməsində görə bilərsiniz.","Copy all":"Hamısını kopyala",
"Rules of the site":"Saytın qaydaları","Group limit":"Qrup limiti","With {0} students in groups of {1}, six groups are enough.":"{0} tələbə {1} nəfərlik qruplarda olanda altı qrup kifayətdir.",
"Danger zone":"Təhlükəli zona","Deletes ALL messages, archives, point history and groups, and sets every score to {0}. Accounts and passwords stay. Use it once, to clear test data before launch.":"BÜTÜN mesajları, arxivləri, xal tarixçəsini və qrupları silir, hər xalı {0}-a qaytarır. Hesablar və parollar qalır. Sınaq məlumatlarını başlamazdan əvvəl təmizləmək üçün bir dəfə istifadə edin.",
"Clear all data…":"Bütün məlumatı təmizlə…","Clear all data?":"Bütün məlumat təmizlənsin?","Clear everything":"Hər şeyi təmizlə",
"Mesaj":"Mesaj"
};
/* Tərcümə tələb etməyən mətnlər (brend adı, nümunə adlar) */
const _IDENT=new Set(["ADIAK Admin","Əli Məmmədov&#{0};Aysel Hüseynova&#{1};…"]);
/* tr() ilə işləyən mürəkkəb cümlələr (içində <b> var) və paylaşılan açarlar */
Object.assign(AZ,{
"Give points":"Xal vermək","Add or remove points for students.":"Tələbələrə xal əlavə etmək və ya almaq.",
"Manage groups":"Qrupları idarə etmək","Put students into groups, move or remove them, edit groups.":"Tələbələri qruplara yerləşdirmək, köçürmək, çıxarmaq, qrupları redaktə etmək.",
"Moderate chats":"Çatlara nəzarət","Read every chat and delete messages or whole chats.":"Bütün çatları oxumaq, mesajları və ya çatları tamamilə silmək.",
"See & reset passwords":"Parolları görmək və sıfırlamaq","See students' passwords and make new temporary ones. Never admins'.":"Tələbələrin parollarını görmək və yeni müvəqqəti parol yaratmaq. Adminlərinkini heç vaxt.",
"Open this admin panel":"Admin panelini açmaq","Enter the panel. Each tab still needs its own permission.":"Panelə daxil olmaq. Hər bölmə üçün ayrıca icazə lazımdır.",
"Full admin":"Tam admin","Everything, including permissions, import, closing the day and settings.":"Hər şey: icazələr, idxal, günün bağlanması və ayarlar daxil.",
"System":"Sistem","this person":"bu şəxs","group":"qrup","Presentation day":"Təqdimat günü",
"Give <b>full admin</b> rights to <b>{name}</b>? They can then do everything in this panel.":"<b>{name}</b> adlı şəxsə <b>tam admin</b> hüququ verilsin? O, bu paneldə hər şeyi edə biləcək.","Yes, make admin":"Bəli, admin et",
"Create a new temporary password for <b>{name}</b>? The old one stops working and they are signed out.":"<b>{name}</b> üçün yeni müvəqqəti parol yaradılsın? Köhnə parol işləməyəcək və o, hesabdan çıxarılacaq.","Yes, reset":"Bəli, sıfırla",
"Delete ALL messages in <b>{name}</b>?":"<b>{name}</b> çatındakı BÜTÜN mesajlar silinsin?",
"Delete <b>every</b> message in <b>every</b> chat ({n} messages)? This cannot be undone.":"Bütün çatlardakı <b>bütün</b> mesajlar ({n} mesaj) silinsin? Bunu geri qaytarmaq olmaz.",
"Archive <b>{n}</b> messages? Students will see empty chats afterwards.":"<b>{n}</b> mesaj arxivə köçürülsün? Bundan sonra tələbələr boş çatlar görəcək.",
"Archive <b>{n}</b> messages and dissolve all groups? Students will see empty chats afterwards.":"<b>{n}</b> mesaj arxivə köçürülsün və bütün qruplar ləğv edilsin? Bundan sonra tələbələr boş çatlar görəcək.","Yes, close the day":"Bəli, günü bağla",
"Create accounts for <b>{n}</b> students? New temporary passwords are generated.":"<b>{n}</b> tələbə üçün hesab yaradılsın? Yeni müvəqqəti parollar yaradılacaq.",
"All current chats are moved to a <b>read-only archive</b> that only admins see here. Students start with empty chats. Points stay.":"Bütün cari çatlar yalnız adminlərin burada görə biləcəyi <b>yalnız oxunan arxivə</b> köçürülür. Tələbələr boş çatlarla başlayır. Xallar qalır.",
"One full name per line, for example <b>Əli Məmmədov</b>. The ID becomes <b>ali.m</b>. Only accounts nobody has used yet are filled; accounts with a changed password are never touched. To add people beyond those, use <b>➕ Add person</b> in People.":"Hər sətirdə bir tam ad yazın, məsələn, <b>Əli Məmmədov</b>. ID <b>ali.m</b> olacaq. Yalnız hələ heç kimin istifadə etmədiyi hesablar doldurulur; parolu dəyişdirilmiş hesablara heç vaxt toxunulmur. Bunlardan artıq adam əlavə etmək üçün «İnsanlar» bölməsindəki <b>➕ Adam əlavə et</b> düyməsindən istifadə edin.",
"This cannot be undone. Type <b>RESET</b> to confirm.":"Bunu geri qaytarmaq olmaz. Təsdiq üçün <b>RESET</b> yazın."
});
AZ_ERR_RE.push([/^Only (\d+) unused accounts are left, but (\d+) names were given$/,"Yalnız {1} istifadə olunmamış hesab qalıb, amma {2} ad verilib"]);

/* ---------- tərcümə mühərriki ---------- */
/* Artıq tərcümə olunmuş cümlələrin parçaları (tr() ilə gələn mətn ikinci dəfə "tərcümə olunmamış" sayılmasın) */
const _FR=new Set();
(function(){const add=v=>String(v).split(/<[^>]*>/).forEach(f=>{f=f.replace(/&amp;/g,"&").replace(/\{\w+\}/g,"{}").trim();if(f)_FR.add(f)});Object.values(ADM).forEach(add);Object.values(AZ).forEach(add)})();
const _SYM="\\s\\u2190-\\u21FF\\u2300-\\u23FF\\u2600-\\u27BF\\u2B00-\\u2BFF\\u00B7\\u2022\\u200D\\uFE0F\\u{1F000}-\\u{1FAFF}";
const _LEAD=new RegExp("^["+_SYM+"]+","u"),_TRAIL=new RegExp("["+_SYM+"]+$","u"),_STRIP=/[\u0001\u0002]/g;
window.__admMiss=window.__admMiss||new Set();
/* Bir mətn parçasını tərcümə edir. html=true olanda nəticə HTML-ə yazılır (& → &amp;) */
function admX(s,html){
 if(LANG!=="az")return s.replace(_STRIP,"");
 let lead="",trail="",core=s,m=_LEAD.exec(core);
 if(m){lead=m[0];core=core.slice(lead.length)}
 m=_TRAIL.exec(core);if(m){trail=m[0];core=core.slice(0,core.length-trail.length)}
 if(!core)return s.replace(_STRIP,"");
 const vals=[],key=core.replace(/\u0001([\s\S]*?)\u0002|\d+/g,(x,p)=>{vals.push(p!==undefined?p:x);return"{"+(vals.length-1)+"}"}).replace(/&amp;/g,"&");
 if(!/[A-Za-zƏəİıÖöÜüÇçŞşĞğ]{3,}/.test(key.replace(/\{\d+\}/g,"")))return s.replace(_STRIP,"");
 if(_IDENT.has(key))return s.replace(_STRIP,"");
 if(!Object.prototype.hasOwnProperty.call(ADM,key)){if(!_FR.has(key.replace(/\{\d+\}/g,"{}")))window.__admMiss.add(key);return s.replace(_STRIP,"")}
 const tpl=html?ADM[key].replace(/&(?!#\d+;|amp;)/g,"&amp;"):ADM[key];
 return lead+tpl.replace(/\{(\d+)\}/g,(x,i)=>vals[+i]!==undefined?vals[+i]:x)+trail}
/* HTML sətirini tərcümə edir: mətn düyünləri və placeholder/title/alt/aria-label */
function admHtml(h){
 if(typeof h!=="string")return h;
 if(LANG!=="az")return h.replace(_STRIP,"");
 return h.replace(/(<(?:[^>"']|"[^"]*"|'[^']*')*>)|([^<]+)/g,(x,tag,txt)=>{
  if(tag)return tag.replace(/(\b(?:placeholder|title|alt|aria-label)=)(?:"([^"]*)"|'([^']*)')/g,(mm,a,v1,v2)=>{const q=v1!==undefined?'"':"'";return a+q+admX(v1!==undefined?v1:v2,true)+q});
  return admX(txt,true)}).replace(_STRIP,"")}
/* Bütün innerHTML yazılışlarını (inline əməliyyatlar daxil) avtomatik tərcümədən keçirir */
(function(){const d=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML");if(!d||!d.set)return;
 Object.defineProperty(Element.prototype,"innerHTML",{get:d.get,set(v){d.set.call(this,admHtml(v))},configurable:true,enumerable:d.enumerable})})();
/* Xəbər (toast) mətni: əvvəl server xətası, sonra lüğət */
const admToast=m=>{const s=String(m==null?"":m),e=trErr(s);return e!==s?e:admX(s,false)};
/* AZ | EN düyməsi (yan menyuda və giriş səhifəsində) */
const admLang=()=>`<div class="lang-a"><button class="s${LANG==="az"?" on":""}" onclick="setLang('az')">AZ</button><button class="s${LANG==="en"?" on":""}" onclick="setLang('en')">EN</button></div>`;
