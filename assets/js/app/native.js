/* native.js - yalnız Android tətbiqində (Capacitor) işləyir; saytda heç nə etmir.
   Telefonun "Geri" düyməsi: əvvəlcə açıq pəncərəni bağlayır, sonra tətbiq daxilində əvvəlki səhifəyə qayıdır,
   yalnız əsas səhifədə (geri qayıtmaq mümkün olmayanda) tətbiqdən çıxır.
   Capacitor JS faylları (assets/vendor/capacitor/) yalnız APK-ya, scripts/build-www.mjs ilə əlavə olunur.
   build.js build nişanını verir: window.ADIAK_BUILD = {sha, run}. */
(function(){
  var C=window.Capacitor;
  if(!C||typeof C.isNativePlatform!=="function"||!C.isNativePlatform())return;

  // Kök ünvan native.js-in öz yerindən hesablanır (assets/js/app/ → ../../../), ki həm /, həm də /admin/ səhifəsində işləsin
  var ROOT="";try{ROOT=new URL("../../../",document.currentScript.src).href}catch(e){}
  function load(src,done){var s=document.createElement("script");s.src=ROOT+src;s.onload=done;s.onerror=function(){console.error("native.js: "+src+" yüklənmədi")};document.head.appendChild(s)}
  load("assets/vendor/capacitor/build.js",function(){
    load("assets/vendor/capacitor/capacitor.js",function(){
      load("assets/vendor/capacitor/push.js",function(){ if(typeof adiakPushInit==="function")adiakPushInit(); });
      load("assets/vendor/capacitor/app.js",function(){
        var App=window.capacitorApp&&window.capacitorApp.App;
        if(!App)return;
        App.addListener("backButton",function(ev){
          // Admin səhifəsi (admin.js adminBack təyin edir) öz bölmə yığınını istifadə edir; student səhifəsi nativeBack()
          var admin=typeof adminBack==="function";
          var r;try{r=admin?adminBack():nativeBack()}catch(e){console.error(e);return}
          if(!r){if(admin&&ev&&ev.canGoBack)history.back();else App.exitApp()}
        });
      });
    });
  });
})();

// Geri addımı: bir şey etdisə true, əsas səhifədədirsə false qaytarır (onda tətbiq bağlanır)
function nativeBack(){
  if(typeof escClose==="function"&&escClose())return true;
  if(screen!=="app")return false;
  if(navStack.length){history.back();return true}
  if(sheet||sp||openG||conv||menuOpen||pm||tab!=="home"){tab="home";openG=null;conv=null;sp=null;sheet=false;menuOpen=false;closeM();navSync();render();return true}
  return false;
}

/* ---------- ADIAK 1.0: Android push (FCM) — APK only ----------
   Permission (Android 13+) is asked once, after login, with a short explanation first.
   The device token is saved on every registration (covers token refresh) and disabled on logout/kick-out.
   Tapping a notification opens its target (presentation, task, file, approval, chat). Rendering of the
   message itself is done by Android (FCM notification payload) when the app is closed or in background. */
var PUSH={P:null,token:null,asked:false,pending:null};
function adiakPushInit(){
  var P=window.capacitorPushNotifications&&window.capacitorPushNotifications.PushNotifications; if(!P)return; PUSH.P=P;
  try{PUSH.token=localStorage.getItem("fcm-token")}catch(e){}
  try{P.createChannel({id:"adiak_default",name:"ADIAK",description:"ADIAK",importance:4,visibility:1});P.createChannel({id:"adiak_live",name:"ADIAK live",description:"Live presentations",importance:5,visibility:1,vibration:true})}catch(e){}
  P.addListener("registration",function(t){PUSH.token=t.value;try{localStorage.setItem("fcm-token",t.value)}catch(e){}pushSave()});
  P.addListener("registrationError",function(e){console.error("push registration",e&&e.error)});
  P.addListener("pushNotificationReceived",function(){ if(window.PX&&PX.on&&typeof pxNotesLoad==="function")pxNotesLoad().then(function(){if(typeof render==="function")render()}); });
  P.addListener("pushNotificationActionPerformed",function(a){var d=(a&&a.notification&&a.notification.data)||{},t=null;
    try{t=d.target?(typeof d.target==="string"?JSON.parse(d.target):d.target):null}catch(e){}
    if(!t&&d.ch)t={k:"chat",ch:d.ch}; PUSH.pending=t; pushOpenPending()});
  setInterval(pushTick,1500);
}
function pushOpenPending(){var t=PUSH.pending;if(!t||typeof uid==="undefined"||!uid||typeof ME!=="function"||!ME())return;
  if((t.k==="pres"||t.k==="class"||t.k==="live")&&!(window.PX&&PX.on&&PX.loaded))return;   // wait until data is loaded
  PUSH.pending=null; try{ if(t.k==="chat"&&typeof openChat==="function")openChat(t.ch); else if(typeof go==="function")go(t); }catch(e){} }
function pushTick(){ pushOpenPending(); if(!PUSH.P||PUSH.asked||typeof uid==="undefined"||!uid||!(window.PX&&PX.on))return;
  if(typeof SET==="object"&&SET.push_enabled==="false")return;
  PUSH.asked=true; PUSH.P.checkPermissions().then(function(p){
    if(p.receive==="granted"){PUSH.P.register();return}
    if(p.receive==="denied")return;
    var asked=false;try{asked=localStorage.getItem("push-asked")==="1"}catch(e){}
    if(asked){return}
    try{localStorage.setItem("push-asked","1")}catch(e){}
    var go2=function(){PUSH.P.requestPermissions().then(function(r){if(r.receive==="granted")PUSH.P.register()})};
    if(typeof ask==="function")ask(tr("Allow notifications so ADIAK can tell you about deadlines, approvals, your turn to present and new messages — even when the app is closed."),go2);else go2();
  });
}
function pushSave(){ if(!PUSH.token||typeof uid==="undefined"||!uid||!(window.PX&&PX.on)||typeof sb==="undefined"||!sb){setTimeout(pushSave,2000);return}
  sb.rpc("save_fcm",{tok:PUSH.token,lng:(typeof LANG!=="undefined"&&LANG==="en")?"en":"az"}).then(function(r){if(r.error)console.error("save_fcm",r.error.message)}); }
async function pushOff(){ if(!PUSH.token||typeof sb==="undefined"||!sb)return; try{await sb.rpc("drop_fcm",{tok:PUSH.token})}catch(e){} PUSH.asked=false; }
if(typeof AZ==="object")AZ["Allow notifications so ADIAK can tell you about deadlines, approvals, your turn to present and new messages — even when the app is closed."]="Bildirişlərə icazə verin ki, ADIAK son tarixlər, təsdiqlər, çıxış növbəniz və yeni mesajlar barədə xəbər versin — tətbiq bağlı olanda belə.";
