// Voice-message error paths (mocked): which getUserMedia failure shows which message, web vs native APK,
// and a successful recording still uploads a voice file. Real microphone behaviour needs a device (docs/1.0/en/android-device-checklist.md).
// Usage: node tests/mic.mjs [label]
import { harness, assert, settle } from "./lib/harness.mjs";
import { IDS } from "./lib/fixtures.mjs";
const H = await harness(process.argv[2] || "mic");
const err = (page, name, native) => page.evaluate(([n, nat]) => {
  if (nat) window.Capacitor = { isNativePlatform: () => true }; else delete window.Capacitor;
  const e = new Error("x"); e.name = n; return micErr(e);
}, [name, native]);
await H.test("permission denied: web keeps the old text, APK points to Android settings", async () => {
  const env = await H.open({ user: IDS.student }); await settle(env.page, 1200);
  const web = await err(env.page, "NotAllowedError", false), nat = await err(env.page, "NotAllowedError", true);
  assert(/Mikrofona giriş icazəsi verilmədi|Microphone access was denied/.test(web), "web: " + web);
  assert(/ADIAK/.test(nat) && /Mikrofon|Microphone/.test(nat), "native: " + nat);
  assert(/mikrofon tapılmadı|No microphone/i.test(await err(env.page, "NotFoundError", false)), "not found");
  assert(/başqa tətbiq|another app/.test(await err(env.page, "NotReadableError", true)), "busy");
  return env;
});
await H.test("toggleRec: a rejected getUserMedia shows the mapped toast, no recording state", async () => {
  const env = await H.open({ user: IDS.student }); await settle(env.page, 1200);
  await env.page.evaluate(async () => {
    window.Capacitor = { isNativePlatform: () => true };
    navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error("denied"), { name: "NotAllowedError" }));
    await toggleRec();
  });
  const t = await env.page.textContent("#toast"); assert(/ADIAK/.test(t), "toast: " + t);
  assert(await env.page.evaluate(() => rec === null), "no recording left open"); return env;
});
await H.test("granted: records with MediaRecorder and sends a voice file", async () => {
  const env = await H.open({ user: IDS.student }); await settle(env.page, 1200);
  const sent = await env.page.evaluate(async () => {
    const ctx = new AudioContext(), dst = ctx.createMediaStreamDestination(), o = ctx.createOscillator(); o.connect(dst); o.start();
    navigator.mediaDevices.getUserMedia = async () => dst.stream;
    let got = null; window.sendFile = f => { got = { name: f.name, type: f.type, size: f.size } };
    await toggleRec(); await new Promise(r => setTimeout(r, 700)); stopRec(true); await new Promise(r => setTimeout(r, 500)); return got;
  });
  assert(sent && /^voice-/.test(sent.name) && /audio\//.test(sent.type) && sent.size > 0, "voice file " + JSON.stringify(sent)); return env;
});
await H.done();
