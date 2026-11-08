/* native.js - yalnız Android tətbiqində (Capacitor) işləyir; saytda heç nə etmir.
   Telefonun "Geri" düyməsi: əvvəlcə açıq pəncərəni bağlayır, sonra tətbiq daxilində əvvəlki səhifəyə qayıdır,
   yalnız əsas səhifədə (geri qayıtmaq mümkün olmayanda) tətbiqdən çıxır.
   Capacitor JS faylları (assets/vendor/capacitor/) yalnız APK-ya, scripts/build-www.mjs ilə əlavə olunur.
   DIAQNOSTIKA (MÜVƏQQƏTİ): yuxarıdakı log paneli yalnız real cihaz testi üçündür və sonra silinəcək. */
var NDBG=null;
(function(){
  var C=window.Capacitor;
  if(!C||typeof C.isNativePlatform!=="function"||!C.isNativePlatform())return;

  // ---- MÜVƏQQƏTİ diaqnostik panel ----
  var lines=[],head="";
  function paint(){var el=document.getElementById("ndbg");
    if(!el){el=document.createElement("pre");el.id="ndbg";el.style.cssText="position:fixed;top:0;left:0;right:0;z-index:2147483647;margin:0;padding:4px 6px;max-height:42vh;overflow:hidden;background:rgba(0,0,0,.78);color:#7CFC00;font:10px/1.25 monospace;white-space:pre-wrap;pointer-events:none";document.documentElement.appendChild(el)}
    el.textContent=(head?head+"\n":"")+lines.join("\n")}
  NDBG=function(m){try{lines.push(new Date().toTimeString().slice(3,8)+" "+m);if(lines.length>12)lines.shift();paint()}catch(e){}};
  // Safe-area ölçüləri (həmişə panelin başında): env(), Capacitor-un --safe-area-inset-* dəyişənləri, ekran, WebView versiyası, aktiv viewport
  function insets(){try{
    var p=document.getElementById("ndbgp");
    if(!p){p=document.createElement("div");p.id="ndbgp";p.style.cssText="position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";document.documentElement.appendChild(p)}
    var cs=getComputedStyle(p),rs=getComputedStyle(document.documentElement),v=function(n){return (rs.getPropertyValue("--safe-area-inset-"+n)||"-").trim()};
    var vms=document.querySelectorAll("meta[name=viewport]"),cr=(navigator.userAgent.match(/Chrome\/(\d+)/)||[])[1];
    head="SAFE env(t/r/b/l)="+[cs.paddingTop,cs.paddingRight,cs.paddingBottom,cs.paddingLeft].map(function(x){return parseInt(x)}).join("/")+
      " cap(t/r/b/l)="+["top","right","bottom","left"].map(v).join("/")+
      "\nVIEW inner="+innerWidth+"x"+innerHeight+" screen="+window.screen.width+"x"+window.screen.height+" dpr="+devicePixelRatio+" WebView="+(cr||"?")+
      " viewport="+(vms.length?vms[vms.length-1].content.replace("width=device-width, ","").replace(/\s/g,""):"-")+" ("+vms.length+")";
    paint()}catch(e){}}
  addEventListener("resize",insets);setTimeout(insets,0);setTimeout(insets,1500);setTimeout(insets,4000);
  var hdr=(C.PluginHeaders||[]).map(function(p){return p.name});
  NDBG("platform="+(C.getPlatform&&C.getPlatform())+" PluginHeaders="+(hdr.join(",")||"-")+" App="+(hdr.indexOf("App")>=0?"YES":"NO"));
  var nk=function(){try{return [screen,tab,openG||"",conv||"",sp||"",sheet?1:0,menuOpen?1:0,pm||""].join("|")}catch(e){return "?"}};
  var ns=function(){try{return navStack.length}catch(e){return "?"}};
  ["pushState","replaceState"].forEach(function(f){var o=history[f].bind(history);history[f]=function(s){NDBG(f+" n="+(s&&s.n)+" stack="+ns()+" key="+nk());return o.apply(null,arguments)}});
  var og=history.go.bind(history);history.go=function(d){NDBG("go("+d+") stack="+ns());return og(d)};
  var ob=history.back.bind(history);history.back=function(){NDBG("back() stack="+ns());return ob()};
  addEventListener("popstate",function(e){setTimeout(function(){NDBG("popstate n="+(e.state&&e.state.n)+" -> stack="+ns()+" key="+nk())},0)});
  // ---- /diaqnostika ----

  // Kök ünvan native.js-in öz yerindən hesablanır (assets/js/app/ → ../../../), ki həm /, həm də /admin/ səhifəsində işləsin
  var ROOT="";try{ROOT=new URL("../../../",document.currentScript.src).href}catch(e){}
  function load(src,done){var s=document.createElement("script");s.src=ROOT+src;s.onload=function(){NDBG("loaded "+src.split("/").pop());done()};s.onerror=function(){NDBG("LOAD ERROR "+src)};document.head.appendChild(s)}
  load("assets/vendor/capacitor/build.js",function(){
    var b=window.ADIAK_BUILD||{};NDBG("build sha="+(b.sha||"?")+" run="+(b.run||"?"));
    load("assets/vendor/capacitor/capacitor.js",function(){
      load("assets/vendor/capacitor/app.js",function(){
        var App=window.capacitorApp&&window.capacitorApp.App;
        if(!App){NDBG("capacitorApp.App MISSING");return}
        App.addListener("backButton",function(ev){
          NDBG("BACK canGoBack="+(ev&&ev.canGoBack)+" stack="+ns()+" key="+nk());
          // Admin səhifəsi (admin.js adminBack təyin edir) öz bölmə yığınını istifadə edir; student səhifəsi nativeBack()
          var admin=typeof adminBack==="function";
          var r;try{r=admin?adminBack():nativeBack()}catch(e){NDBG((admin?"adminBack":"nativeBack")+" ERROR "+e.message);return}
          if(!r){if(admin&&ev&&ev.canGoBack){NDBG("-> admin root: back to student");history.back()}else{NDBG("-> exitApp");App.exitApp()}}
        }).then(function(){NDBG("backButton listener registered")},function(e){NDBG("listener ERROR "+(e&&e.message))});
      });
    });
  });
})();

// Geri addımı: bir şey etdisə true, əsas səhifədədirsə false qaytarır (onda tətbiq bağlanır)
function nativeBack(){
  var log=NDBG||function(){};
  if(typeof escClose==="function"&&escClose()){log("-> overlay closed");return true}
  if(screen!=="app"){log("-> screen="+screen+" (exit)");return false}
  if(navStack.length){log("-> history.back");history.back();return true}
  if(sheet||sp||openG||conv||menuOpen||pm||tab!=="home"){log("-> reset to home");tab="home";openG=null;conv=null;sp=null;sheet=false;menuOpen=false;closeM();navSync();render();return true}
  log("-> at root (exit)");
  return false;
}
