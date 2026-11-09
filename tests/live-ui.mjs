// Live Presentation System (mocked Supabase): stage, server-synchronised timer across skewed clocks,
// order with recorded durations, PDF viewer with page navigation, operator console, role isolation.
// Usage: node tests/live-ui.mjs [label]
import { harness, assert, settle } from "./lib/harness.mjs";
import { IDS, tables } from "./lib/fixtures.mjs";
const H = await harness(process.argv[2] || "live-ui");
const now = Date.now();
// a running session: Beta (slot 0) finished in 6:40, Alfa (slot 1) presenting for 90 s of 7 min; Alfa's approved final is a PDF
const liveTables = {
  pres_events: [{ ...tables.pres_events[0], status: "live", frozen_at: new Date(now - 6e5).toISOString() }],
  pres_live: [{ event_id: 1, state: "running", slot_index: 1, slot_started_at: new Date(now - 90e3).toISOString(), paused_at: null, elapsed_ms: 0, duration_s: 420, version: 7, speaker_index: 0 }],
  pres_live_slots: [{ event_id: 1, slot_index: 0, group_id: 2, group_name: "Beta", status: "done", duration_ms: 400000, started_at: new Date(now - 6e5).toISOString() },
    { event_id: 1, slot_index: 1, group_id: 1, group_name: "Alfa", status: "presenting", duration_ms: 0, started_at: new Date(now - 90e3).toISOString() }],
  pres_speakers_final: [{ event_id: 1, group_id: 1, position: 1, user_id: IDS.student2, user_name: "Rəşad Əliyev", approved: true, placed: true },
    { event_id: 1, group_id: 1, position: 2, user_id: IDS.student, user_name: "Aysel Məmmədova", approved: true, placed: true }],
  pres_submissions: [{ id: 1, event_id: 1, group_id: 1, file_id: 2, version: 1, state: "approved", submitted_by: IDS.student2, submitted_at: new Date(now - 864e5).toISOString(), reviewed_by: IDS.teacher, reviewed_at: new Date(now - 8e7).toISOString() }],
  pres_rubrics: [{ id: 1, event_id: 1, version: 1, criteria: [{ key: "content", label: "Məzmun", max: 10 }, { key: "time", label: "Vaxt", max: 5, kind: "duration", target_s: 420, tolerance_s: 30 }] }],
};
const teacher = { rpc: { my_access: { uid: IDS.teacher, role: "teacher", owner: false, admin: false, perms: ["points"], class: null, group: null, teaches: [{ tag: "10A", title: null, perms: [] }], leads: [] }, live_next: 8, pres_score: 5, live_note: 3 }, tables: { ...liveTables } };
const student = { tables: { ...liveTables } };
const remain = async page => page.$eval("#lvbig", e => e.textContent);
const toSec = t => { const neg = t.startsWith("−"); const [m, s] = t.replace("−", "").split(":").map(Number); return (neg ? -1 : 1) * (m * 60 + s); };

await H.test("stage: current team, speaker 1/2, up next, recorded durations, timer ~5:30", async () => {
  const env = await H.open({ user: IDS.student, over: student }); await settle(env.page, 1300);
  await env.page.evaluate(() => openLive(1)); await settle(env.page, 900);
  const t = await env.page.textContent(".lvstage"); assert(t.includes("Alfa") && t.includes("Rəşad Əliyev") && t.includes("1/2"), "stage: " + t.slice(0, 200));
  const r = toSec(await remain(env.page)); assert(r >= 325 && r <= 332, "remaining ≈ 330 s, got " + r);
  const o = await env.page.textContent(".lvorder"); assert(o.includes("6:40"), "recorded duration of Beta: " + o);
  assert(!(await env.page.$(".lvops")), "students get no operator console");
  await H.shot(env.page, "stage-student"); return env;
});
await H.test("timer is identical on two devices whose clocks differ by 90 s", async () => {
  const a = await H.open({ user: IDS.student, over: student }), b = await H.open({ user: IDS.student, over: student });
  await b.page.evaluate(() => { const D = Date, sk = 90000; Date.now = () => D.prototype.getTime.call(new D()) + sk; });   // device clock 90 s ahead
  await b.page.evaluate(async () => { PX.on = false; await pxBoot(); });                                           // re-measure offset against the server
  await settle(a.page, 1200); await Promise.all([a.page.evaluate(() => openLive(1)), b.page.evaluate(() => openLive(1))]); await settle(a.page, 800);
  const [ra, rb] = [toSec(await remain(a.page)), toSec(await remain(b.page))];
  await b.context.close();
  assert(Math.abs(ra - rb) <= 1, `devices disagree: ${ra} vs ${rb}`); return a;
});
await H.test("refresh recovers the running timer from the server (no client-only state)", async () => {
  const env = await H.open({ user: IDS.student, over: student }); await settle(env.page, 1200);
  await env.page.evaluate(() => openLive(1)); await settle(env.page, 600); const r1 = toSec(await remain(env.page));
  await env.page.reload(); await env.page.waitForFunction(() => window.PX && PX.on && PX.loaded, null, { timeout: 8000 }); await env.page.evaluate(() => openLive(1)); await settle(env.page, 600);
  const r2 = toSec(await remain(env.page)); assert(Math.abs(r1 - r2) <= 4, `after reload ${r2} vs ${r1}`); return env;
});
await H.test("teacher: operator console, approved PDF opens with page navigation", async () => {
  const env = await H.open({ user: IDS.teacher, over: teacher }); await settle(env.page, 1300);
  await env.page.evaluate(() => openLive(1)); await settle(env.page, 2500);
  assert(await env.page.$(".lvops"), "operator console for staff");
  assert(await env.page.$("#lvcanvas"), "pdf canvas rendered");
  assert((await env.page.textContent("#lvpg")).includes("1 / 2"), "page 1/2");
  await env.page.click(".lvmat button[aria-label='Növbəti']"); await settle(env.page, 600);
  assert((await env.page.textContent("#lvpg")).includes("2 / 2"), "page 2/2 after next");
  const w = await env.page.$eval("#lvcanvas", c => c.width); assert(w > 100, "canvas has content width " + w);
  await H.shot(env.page, "stage-teacher"); return env;
});
await H.test("operator: 'Next team' is disabled on the last team; 'Complete team' confirms and sends the current version", async () => {
  const env = await H.open({ user: IDS.teacher, over: teacher }); await settle(env.page, 1300);
  await env.page.evaluate(() => openLive(1)); await settle(env.page, 900);
  assert(await env.page.$eval(".lvbtns button:has-text('Növbəti komanda')", b => b.disabled), "next disabled on last team");
  await env.page.click(".lvbtns button:has-text('Komandanı bitir')"); await settle(env.page, 300);
  assert(await env.page.$("#modal .ov"), "confirmation dialog");
  await env.page.click("#yes"); await settle(env.page, 500);
  const c = (env.log.calls || []).find(x => x.fn === "live_complete_team"); assert(c && c.body.e === 1 && c.body.ver === 7, "live_complete_team call " + JSON.stringify(c)); return env;
});
await H.test("operator: score requires every criterion; duration is measured", async () => {
  const env = await H.open({ user: IDS.teacher, over: teacher }); await settle(env.page, 1300);
  await env.page.evaluate(() => openLive(1)); await settle(env.page, 900);
  assert((await env.page.textContent(".lvscore")).includes("hələ qeydə alınmayıb"), "duration not yet recorded while presenting");
  await env.page.click(".lvscore button.ok"); await settle(env.page, 300);
  assert(!(env.log.calls || []).some(x => x.fn === "pres_score"), "incomplete score not sent");
  await env.page.fill(".lvscore input[data-k=content]", "8"); await env.page.fill(".lvscore input[data-k=time]", "5");
  await env.page.click(".lvscore button.ok"); await settle(env.page, 400);
  const c = (env.log.calls || []).find(x => x.fn === "pres_score"); assert(c && c.body.sc.content === 8 && c.body.g === 1, "pres_score " + JSON.stringify(c)); return env;
});
await H.test("projector view hides app chrome; phone 390 has no overflow", async () => {
  const env = await H.open({ user: IDS.teacher, over: teacher }); await settle(env.page, 1300);
  await env.page.evaluate(() => { openLive(1); lvProj(true); }); await settle(env.page, 900);
  assert(!(await env.page.isVisible(".side")), "sidebar hidden in projector view"); await H.shot(env.page, "projector");
  await env.context.close();
  const ph = await H.open({ user: IDS.student, width: 390, height: 844, over: student }); await settle(ph.page, 1300);
  await ph.page.evaluate(() => openLive(1)); await settle(ph.page, 800);
  assert(!(await ph.page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), "phone overflow"); await H.shot(ph.page, "stage-phone"); return ph;
});
await H.done();
