/* ADIAK launch animation (owner-approved sequence). Shared by the website/PWA and the Android app.
   1 logo appears and scales (native app: black -> purple) · 2 ADİAK enters from the right · 3 logo moves left
   4 TEAM rises from below · 5 MAKER slides in from the right on TEAM's line and pushes TEAM toward the logo · 6 hand-over.
   Runs once per cold start, tap to skip, honours prefers-reduced-motion. Vector paths: assets/brand/adiak-lockup-light.svg. */
(function () {
  "use strict";
  var KEY = "adiak-intro";
  try { if (sessionStorage.getItem(KEY)) return; sessionStorage.setItem(KEY, "1"); } catch (e) {}
  var native = false; try { native = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); } catch (e) {}
  var dark = false; try { var t = localStorage.getItem("theme"); dark = t === "dark" || (t !== "light" && matchMedia("(prefers-color-scheme: dark)").matches); } catch (e) {}
  var reduce = false; try { reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  var C = dark ? { bg: "#1C1F38", ink: "#F3F2FA", p: "#B39CF5", p2: "#7959D6", start: "#FFFFFF" }
               : { bg: "#F4F1FD", ink: "#1F2937", p: "#7959D6", p2: "#6846C9", start: "#000000" };
  var VB = "0 0 1399 445".split(" ").map(Number);
  var el = document.createElement("div");
  el.id = "adiak-intro"; el.setAttribute("aria-hidden", "true");
  el.style.cssText = "position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:" + C.bg + ";transition:opacity .38s ease,transform .38s ease;cursor:pointer";
  el.innerHTML = '<svg viewBox="0 0 1399 445" style="width:min(78vw,560px);height:auto;overflow:visible">' +
    '<style>#adiak-intro .m1{fill:var(--m1);transition:fill .55s ease}#adiak-intro .m2{fill:var(--m2);transition:fill .55s ease}#adiak-intro .w{fill:' + C.ink + '}</style>' +
    '<g id="ai-mark" style="transform-box:fill-box;transform-origin:center"><g transform="translate(0 70.9) scale(0.38284)"> <defs><clipPath id="ai-rl"><polygon points="392.5,400 566.6,400 883.5,960 694,960"/></clipPath></defs> <circle cx="455" cy="160" r="96" class="m1"/> <path class="m1" d="M185 295 L730 295 Q748 295 760 309 L795 352 Q808 374 783 378 L132 378 Q104 374 120 352 L160 309 Q171 295 185 295 Z"/> <path class="m1" d="M60 915 L300 452 Q309 432 330 432 L566 432 Q587 432 596 452 L858 915 L670 915 L482 566 Q458 524 434 566 L245 915 Z"/> <path class="m1" d="M290 832 C 380 700 520 660 697 630 L 772 762 C 560 772 380 800 250 915 Z"/> <path class="m2" clip-path="url(#ai-rl)" d="M290 832 C 380 700 520 660 697 630 L 772 762 C 560 772 380 800 250 915 Z"/> </g></g>' +
    '<g id="ai-adiak" class="w"><path transform="translate(422.2 304.7)" d="M3.3 0.0 78.89999999999999 -223.5H140.7L216.29999999999998 0.0H165.6L150.6 -45.6H68.7L53.699999999999996 0.0ZM81.6 -86.1H137.7L103.5 -191.7H116.1Z M243.4 0.0V-223.5H316.3Q352.5061818181818 -223.5 379.25309090909093 -209.1Q406.0 -194.7 420.7 -169.5Q435.4 -144.29999999999998 435.4 -111.75726872246696Q435.4 -79.5 420.7 -54.15Q406.0 -28.799999999999997 379.25309090909093 -14.399999999999999Q352.5061818181818 0.0 316.3 0.0ZM289.9 -40.5H317.5Q339.28396226415094 -40.5 355.24198113207547 -49.349999999999994Q371.2 -58.199999999999996 380.04999999999995 -74.22911392405064Q388.9 -90.25822784810127 388.9 -112.02911392405063Q388.9 -133.79999999999998 380.06071428571425 -149.68252427184464Q371.22142857142853 -165.5650485436893 355.31071428571425 -174.28252427184464Q339.4 -183.0 317.5 -183.0H289.9Z M469.09999999999997 0.0V-223.5H515.5999999999999V0.0ZM469.99999999999994 -251.7V-296.7H515.0V-251.7Z M542.6999999999999 0.0 618.3 -223.5H680.0999999999999L755.6999999999999 0.0H705.0L690.0 -45.6H608.1L593.1 0.0ZM621.0 -86.1H677.0999999999999L642.9 -191.7H655.5Z M782.8 0.0V-223.5H829.3V-111.6L816.4 -116.1L905.8 -223.5H964.0L875.5 -116.69999999999999L878.2 -149.7L965.8 0.0H911.5L856.9 -94.5L829.3 -61.199999999999996V0.0Z"/></g>' +
    '<g id="ai-team" class="w"><path transform="translate(422.2 436.6)" d="M25.02 0.0V-76.8H1.3199999999999998V-89.39999999999999H62.519999999999996V-76.8H39.12V0.0Z M91.08 0.0V-89.39999999999999H149.94V-76.8H105.18V-51.12H147.54000000000002V-38.519999999999996H105.18V-12.6H149.94V0.0Z M173.27999999999997 0.0 204.71999999999997 -89.39999999999999H222.23999999999998L253.67999999999998 0.0H238.49999999999997L231.65999999999997 -20.04H195.29999999999998L188.39999999999998 0.0ZM199.43999999999997 -32.64H227.39999999999998L211.49999999999997 -79.44H215.45999999999998Z M282.24 0.0V-89.39999999999999H295.44L328.98 -42.839999999999996H322.44L355.44 -89.39999999999999H368.64V0.0H354.53999999999996V-72.66L359.82 -71.22L326.15999999999997 -25.2H324.72L291.72 -71.22L296.34 -72.66V0.0Z"/></g>' +
    '<g id="ai-maker" class="w"><path transform="translate(900.3 436.6)" d="M9.24 0.0V-89.39999999999999H22.439999999999998L55.98 -42.839999999999996H49.44L82.44 -89.39999999999999H95.64V0.0H81.53999999999999V-72.66L86.82 -71.22L53.16 -25.2H51.72L18.72 -71.22L23.34 -72.66V0.0Z M124.19999999999999 0.0 155.64 -89.39999999999999H173.16L204.6 0.0H189.42L182.57999999999998 -20.04H146.22L139.32 0.0ZM150.35999999999999 -32.64H178.32L162.42 -79.44H166.38Z M233.16 0.0V-89.39999999999999H247.26V-40.92L243.6 -42.36L283.97999999999996 -89.39999999999999H301.62L265.86 -47.519999999999996L266.64 -57.54L303.06 0.0H286.44L260.28 -40.92L247.26 -25.74V0.0Z M331.68 0.0V-89.39999999999999H390.53999999999996V-76.8H345.78V-51.12H388.14V-38.519999999999996H345.78V-12.6H390.53999999999996V0.0Z M421.8 0.0V-89.39999999999999H454.26Q463.26 -89.39999999999999 470.13 -86.07Q477.0 -82.74 480.87 -76.47Q484.74 -70.2 484.74 -61.44Q484.74 -52.14 480.15 -45.57Q475.56 -39.0 467.76 -36.0L488.4 0.0H472.32L450.36 -39.0L459.6 -33.6H435.9V0.0ZM435.9 -46.199999999999996H454.56Q459.42 -46.199999999999996 463.02 -48.089999999999996Q466.62 -49.98 468.63 -53.42999999999999Q470.64 -56.879999999999995 470.64 -61.5Q470.64 -66.17999999999999 468.63 -69.6Q466.62 -73.02 463.02 -74.91Q459.42 -76.8 454.56 -76.8H435.9Z"/></g></svg>';
  var start = native ? C.start : C.p, start2 = native ? C.start : C.p2;
  el.style.setProperty("--m1", start); el.style.setProperty("--m2", start2);
  (document.body || document.documentElement).appendChild(el);
  var $ = function (id) { return el.querySelector("#" + id); };
  var mark = $("ai-mark"), adiak = $("ai-adiak"), team = $("ai-team"), maker = $("ai-maker");
  var done = false;
  function finish() {
    if (done) return; done = true;
    el.style.opacity = "0"; el.style.transform = "scale(1.03)";
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); document.dispatchEvent(new Event("adiak-intro-done")); }, 400);
  }
  el.addEventListener("click", finish);
  window.ADIAK_INTRO = { skip: finish };
  if (reduce || !el.animate) {
    el.style.setProperty("--m1", C.p); el.style.setProperty("--m2", C.p2);
    setTimeout(finish, 350); return;
  }
  // geometry from the lockup: the mark ends at the left; centre offset = half the distance between the mark and the lockup centre
  var mb = mark.getBBox(), cx = VB[2] / 2, shift = cx - (mb.x + mb.width / 2);
  var tb = team.getBBox(), kb = maker.getBBox(), teamPushed = kb.x - tb.x;   // TEAM first appears in MAKER's final spot
  var E = "cubic-bezier(.22,1,.36,1)", T0 = 0;
  [adiak, team, maker].forEach(function (g) { g.style.opacity = "0"; });
  // 1 logo appears, grows, turns purple
  mark.animate([{ transform: "translateX(" + shift + "px) scale(.55)", opacity: 0 }, { transform: "translateX(" + shift + "px) scale(1.18)", opacity: 1, offset: .7 },
               { transform: "translateX(" + shift + "px) scale(1.1)", opacity: 1 }], { duration: 560, easing: E, fill: "forwards" });
  setTimeout(function () { el.style.setProperty("--m1", C.p); el.style.setProperty("--m2", C.p2); }, native ? 260 : 0);
  // 2 ADİAK enters from the right · 3 logo moves left into place
  adiak.animate([{ transform: "translateX(" + (VB[2] * .45) + "px)", opacity: 0 }, { transform: "translateX(0)", opacity: 1 }],
    { delay: 520, duration: 620, easing: E, fill: "forwards" });
  mark.animate([{ transform: "translateX(" + shift + "px) scale(1.1)" }, { transform: "translateX(0) scale(1)" }],
    { delay: 560, duration: 620, easing: E, fill: "forwards" });
  // 4 TEAM rises from below (to the right, where MAKER will push it from)
  team.animate([{ transform: "translate(" + teamPushed + "px, 60px)", opacity: 0 }, { transform: "translate(" + teamPushed + "px, 0)", opacity: 1 }],
    { delay: 1080, duration: 420, easing: E, fill: "forwards" });
  // 5 MAKER slides in from the right on the same line and pushes TEAM toward the logo
  var push = 1460;
  maker.animate([{ transform: "translateX(" + (VB[2] * .4) + "px)", opacity: 0 }, { transform: "translateX(0)", opacity: 1 }],
    { delay: push, duration: 560, easing: E, fill: "forwards" });
  team.animate([{ transform: "translate(" + teamPushed + "px, 0)" }, { transform: "translate(" + teamPushed + "px, 0)", offset: .35 }, { transform: "translate(0, 0)" }],
    { delay: push, duration: 560, easing: E, fill: "forwards" });
  // 6 hand-over to the application
  setTimeout(finish, push + 560 + 380);
})();
