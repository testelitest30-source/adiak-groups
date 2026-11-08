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
