// Teacher Studio, Class Hub and student Classwork (mocked Supabase): role isolation + main workflows.
import { harness, assert, settle } from "./lib/harness.mjs";
import { IDS } from "./lib/fixtures.mjs";
const H = await harness(process.argv[2] || "studio-ui");
const teacherAcc = { uid: IDS.teacher, role: "teacher", owner: false, admin: false, perms: ["points"], class: null, group: null, teaches: [{ tag: "10A", title: "10-cu sinif A", perms: [] }, { tag: "11B", title: null, perms: [] }], leads: [] };
const teacher = { rpc: { my_access: teacherAcc, staff_classes: [{ tag: "10A", title: "10-cu sinif A", role: "teacher", perms: [], students: 6 }, { tag: "11B", title: null, role: "teacher", perms: [], students: 0 }], pres_draw: 2, pres_rubric_save: 1, class_announce: 2, assignment_review: null, assignment_save: 3 } };
const leaderAcc = { uid: IDS.idle, role: "student", owner: false, admin: false, perms: ["panel"], class: "10A", group: null, teaches: [], leads: [{ tag: "10A", title: null, perms: ["groups", "announce", "report"] }] };
const ready = p => p.waitForFunction(() => window.PX && PX.on && PX.loaded, null, { timeout: 8000 });
const enter = async p => { await ready(p); await settle(p, 700); if (await p.$(".clgrid")) { await p.click(".clcard"); await settle(p, 900); } };

await H.test("teacher lands in Teacher Studio: greeting, classes with pending counts, next item, quick actions", async () => {
  const env = await H.open({ user: IDS.teacher, over: teacher }); await ready(env.page); await settle(env.page, 900);
  if (await env.page.$(".clgrid")) { await env.page.click(".clcard"); await settle(env.page, 900); }
  await env.page.evaluate(() => { ST.sec = "home"; goTab("studio"); }); await settle(env.page, 600);
  const t = await env.page.textContent(".pxwrap"); assert(/(Sabahınız|Günortanız|Axşamınız) xeyir, Müəllim/.test(t), "greeting: " + t.slice(0, 120));
  assert(t.includes("2 yoxlanacaq") && t.includes("10A") && t.includes("11B"), "classes + review counts");
  assert(t.includes("Ekologiya layihəsi"), "next item"); await H.shot(env.page, "studio-welcome"); return env;
});
await H.test("class workspace: switcher, overview table, presentations manage view", async () => {
  const env = await H.open({ user: IDS.teacher, over: teacher }); await enter(env.page);
  await env.page.evaluate(() => { goTab("studio"); stSetClass("10A"); }); await settle(env.page, 900);
  assert(await env.page.$(".stswitch select"), "class switcher"); assert((await env.page.textContent(".pxwrap")).includes("Komandasız tələbələr"), "overview KPIs");
  await env.page.evaluate(() => { ST.sec = "pres"; ST.ev = 1; render(); }); await settle(env.page, 600);
  const t = await env.page.textContent(".pxwrap"); assert(t.includes("Yenidən püşk") && t.includes("Meyarlar") && t.includes("İştirak edən komandalar"), "event management: " + t.slice(0, 200));
  await H.shot(env.page, "studio-event"); return env;
});
await H.test("redraw requires a reason and sends expected_round", async () => {
  const env = await H.open({ user: IDS.teacher, over: teacher }); await enter(env.page);
  await env.page.evaluate(() => { goTab("studio"); stSetClass("10A"); ST.sec = "pres"; ST.ev = 1; render(); }); await settle(env.page, 600);
  env.page.once("dialog", d => d.accept("Beta komandası gəlmədi"));
  await env.page.click(".stqa button:has-text('Yenidən püşk')"); await settle(env.page, 900);
  const c = (env.log.calls || []).find(x => x.fn === "pres_draw"); assert(c && c.body.expected_round === 1 && c.body.reason === "Beta komandası gəlmədi", "pres_draw " + JSON.stringify(c));
  await settle(env.page, 1500); assert(await env.page.$(".streveal"), "reveal animation shown"); await H.shot(env.page, "studio-reveal"); return env;
});
await H.test("rubric editor: add time criterion and save as a new version", async () => {
  const env = await H.open({ user: IDS.teacher, over: teacher }); await enter(env.page);
  await env.page.evaluate(() => { goTab("studio"); stSetClass("10A"); ST.sec = "pres"; ST.ev = 1; render(); }); await settle(env.page, 600);
  await env.page.click("button:has-text('Vaxt meyarı əlavə et')"); await settle(env.page, 300);
  await env.page.click("button:has-text('Meyarları saxla')"); await settle(env.page, 500);
  const c = (env.log.calls || []).find(x => x.fn === "pres_rubric_save"); assert(c && c.body.crit.some(x => x.kind === "duration" && x.target_s === 420), "rubric " + JSON.stringify(c && c.body)); return env;
});
await H.test("assignments: late team submission listed, request changes needs feedback, missing list", async () => {
  const env = await H.open({ user: IDS.teacher, over: teacher }); await enter(env.page);
  await env.page.evaluate(() => { goTab("studio"); stSetClass("10A"); ST.sec = "asg"; ST.asg = 2; render(); }); await settle(env.page, 900);
  const t = await env.page.textContent(".pxwrap"); assert(t.includes("Beta") && t.includes("gecikmiş") && t.includes("Alfa"), "submission + missing: " + t.slice(0, 300));
  env.page.once("dialog", d => d.accept("Mənbələri əlavə edin")); await env.page.click("button:has-text('Düzəliş istə')"); await settle(env.page, 500);
  const c = (env.log.calls || []).find(x => x.fn === "assignment_review"); assert(c && c.body.decision === "changes" && c.body.msg, "review call"); await H.shot(env.page, "studio-assignment"); return env;
});
await H.test("student: no Teacher Studio, no Class Hub; Classwork shows announcement + assignments", async () => {
  const env = await H.open({ user: IDS.student }); await ready(env.page); await settle(env.page, 500);
  const nav = await env.page.locator("aside.side .nav button").allTextContents();
  assert(!nav.some(x => x.includes("Müəllim Studiyası")) && !nav.some(x => x.includes("Sinif Mərkəzi")), "no staff workspaces for students");
  await env.page.evaluate(() => goTab("classwork")); await settle(env.page, 500);
  const t = await env.page.textContent(".pxwrap"); assert(t.includes("Cümə günü otaq 204") && t.includes("Esse: iqlim dəyişikliyi"), "classwork"); await H.shot(env.page, "classwork"); return env;
});
await H.test("student: submit a note-only assignment sends assignment_submit", async () => {
  const env = await H.open({ user: IDS.student }); await ready(env.page);
  await env.page.evaluate(() => goTab("classwork")); await settle(env.page, 500);
  await env.page.fill("#cwn1", "Linki qeyd etdim"); await env.page.locator(".card", { has: env.page.locator("#cwn1") }).locator("button:has-text('İşi göndər')").click(); await settle(env.page, 500);
  const c = (env.log.calls || []).find(x => x.fn === "assignment_submit"); assert(c && c.body.aid === 1 && c.body.nt === "Linki qeyd etdim" && c.body.pth === null, "submit call " + JSON.stringify(c)); return env;
});
await H.test("class leader: Class Hub with teams, deadlines, announcement form, issue report; no Teacher Studio", async () => {
  const env = await H.open({ user: IDS.idle, over: { rpc: { my_access: leaderAcc, staff_classes: [{ tag: "10A", role: "starosta", perms: ["groups", "announce", "report"], students: 6 }], class_issue_report: 2 } } });
  await ready(env.page); await settle(env.page, 900);
  if (await env.page.$(".clgrid")) { await env.page.click(".clcard"); await settle(env.page, 900); }
  await env.page.evaluate(() => goTab("hub")); await settle(env.page, 800);
  const t = await env.page.textContent(".pxwrap"); assert(t.includes("Sinif Mərkəzi") && t.includes("Alfa") && t.includes("Müəllimlərə problem bildir"), "hub: " + t.slice(0, 200));
  assert(!(await env.page.evaluate(() => XPAGES.studio.show())), "no studio for a class leader");
  await env.page.fill("#hit", "Proyektor yoxdur"); await env.page.click("button:has-text('Bildirişi göndər')"); await settle(env.page, 400);
  assert((env.log.calls || []).some(x => x.fn === "class_issue_report" && x.body.ttl === "Proyektor yoxdur"), "report sent"); await H.shot(env.page, "hub"); return env;
});
await H.test("phone 390: studio welcome and classwork without overflow", async () => {
  const env = await H.open({ user: IDS.teacher, width: 390, height: 844, over: teacher }); await ready(env.page); await settle(env.page, 900);
  if (await env.page.$(".clgrid")) { await env.page.click(".clcard"); await settle(env.page, 900); }
  await env.page.evaluate(() => { ST.sec = "home"; goTab("studio"); }); await settle(env.page, 600);
  assert(!(await env.page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), "overflow"); await H.shot(env.page, "studio-phone"); return env;
});
await H.done();
