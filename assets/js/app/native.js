/* native.js - yalnız Android tətbiqində (Capacitor) işləyir; saytda heç nə etmir.
   Telefonun "Geri" düyməsi: əvvəlcə açıq pəncərəni bağlayır, sonra tətbiq daxilində əvvəlki səhifəyə qayıdır,
   yalnız əsas səhifədə (geri qayıtmaq mümkün olmayanda) tətbiqdən çıxır.
   Capacitor JS faylları (assets/vendor/capacitor/) yalnız APK-ya, scripts/build-www.mjs ilə əlavə olunur. */
(function(){
  var C=window.Capacitor;
  if(!C||typeof C.isNativePlatform!=="function"||!C.isNativePlatform())return;
  function load(src,done){var s=document.createElement("script");s.src=src;s.onload=done;s.onerror=function(){console.error("native.js: "+src+" yüklənmədi")};document.head.appendChild(s)}
  load("assets/vendor/capacitor/capacitor.js",function(){
    load("assets/vendor/capacitor/app.js",function(){
      var App=window.capacitorApp&&window.capacitorApp.App;
      if(!App)return;
      App.addListener("backButton",function(){if(!nativeBack())App.exitApp()});
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
