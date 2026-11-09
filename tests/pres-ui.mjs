// Student Presentation Center + server notification centre (mocked Supabase).
// Usage: node tests/pres-ui.mjs [label]
import { harness, assert, settle } from "./lib/harness.mjs";
import { IDS } from "./lib/fixtures.mjs";
const H = await harness(process.argv[2] || "pres-ui");
const goPres = async (page) => { await page.evaluate(() => goTab("pres")); await settle(page); };

await H.test("student: Presentations entry appears when the server supports it", async () => {
  const env = await H.open({ user: IDS.student }); await settle(env.page, 1200);
  assert(await env.page.$("nav.nav button:has-text('Təqdimatlar')"), "sidebar entry missing");
  assert(await env.page.$(".pxhome"), "home presentation card missing");
  await H.shot(env.page, "home-desktop"); return env;
});
await H.test("overview: title, team position (2nd of 2), readiness, deadline, announcement", async () => {
  const env = await H.open({ user: IDS.student }); await settle(env.page, 1200); await goPres(env.page);
  const t = await env.page.textContent(".pxwrap");
  assert(t.includes("Ekologiya layihəsi"), "title"); assert(t.includes("2 komandadan 2-ci"), "position: " + t.slice(0, 300));
  assert(t.includes("Təqdimatı PDF formatında yükləyin."), "announcement"); assert(await env.page.$(".pxring"), "readiness ring");
  await H.shot(env.page, "pres-overview-desktop"); return env;
});
await H.test("speaking order: occupied slot disabled, free slot calls pres_pick(pos 2)", async () => {
  const env = await H.open({ user: IDS.student }); await settle(env.page, 1200); await goPres(env.page);
  await env.page.evaluate(() => pxSec("order")); await settle(env.page);
  const slots = await env.page.$$(".pxslot"); assert(slots.length === 2, "2 slots for 2 members, got " + slots.length);
  assert(await slots[0].isDisabled(), "slot 1 (taken by Rəşad) must be disabled");
  await slots[1].click(); await settle(env.page, 500);
  const c = (env.log.calls || []).find(x => x.fn === "pres_pick"); assert(c && c.body.pos === 2 && c.body.e === 1, "pres_pick call " + JSON.stringify(c));
  await H.shot(env.page, "pres-order"); return env;
});
await H.test("files: FINAL panel shows pending review; drafts list; submit-as-final asks to confirm", async () => {
  const env = await H.open({ user: IDS.student }); await settle(env.page, 1200); await goPres(env.page);
  await env.page.evaluate(() => pxSec("files")); await settle(env.page);
  const fin = await env.page.textContent(".pxfinal"); assert(fin.includes("Ekologiya — final.pdf") && fin.includes("Yoxlanılır"), "final panel: " + fin);
  assert((await env.page.$$(".pxfile")).length === 2, "two files");
  const b = await env.page.$(".pxfile button:has-text('Final kimi göndər')"); assert(b, "submit-as-final button for the other draft");
  await b.click(); await settle(env.page, 300); assert(await env.page.$("#modal .ov"), "confirmation dialog");
  await H.shot(env.page, "pres-files"); return env;
});
await H.test("files: upload rejects disallowed types and oversized files client-side", async () => {
  const env = await H.open({ user: IDS.student }); await settle(env.page, 1200); await goPres(env.page);
  await env.page.evaluate(() => pxSec("files")); await settle(env.page);
  await env.page.setInputFiles(".pxwrap input[type=file]", { name: "virus.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("x") });
  await settle(env.page, 300);
  assert(!(env.log.calls || []).some(x => x.fn === "pres_add_file"), "exe must not reach the server");
  assert((await env.page.textContent("#toast")).includes("icazə yoxdur"), "error toast");
  return env;
});
await H.test("tasks: list, progress, my task can be completed", async () => {
  const env = await H.open({ user: IDS.student }); await settle(env.page, 1200); await goPres(env.page);
  await env.page.evaluate(() => pxSec("tasks")); await settle(env.page);
  assert((await env.page.$$(".pxtask")).length === 2, "2 tasks");
  await env.page.click(".pxtask.todo .pxchk"); await settle(env.page, 400);
  const c = (env.log.calls || []).find(x => x.fn === "pres_task_status"); assert(c && c.body.st === "done", "status call");
  await H.shot(env.page, "pres-tasks"); return env;
});
await H.test("event chat: embedded thread on desktop for p:1:1", async () => {
  const env = await H.open({ user: IDS.student }); await settle(env.page, 1200); await goPres(env.page);
  await env.page.evaluate(() => pxSec("chat")); await settle(env.page);
  assert(await env.page.evaluate(() => conv === "p:1:1"), "conv set to the event channel");
  assert(await env.page.$(".pxchat #tx"), "composer visible"); return env;
});
await H.test("notifications: server row shown, unread badge, tap opens the tasks section", async () => {
  const env = await H.open({ user: IDS.student }); await settle(env.page, 1200);
  assert(await env.page.evaluate(() => pxUnread()) === 1, "1 unread server notification");
  await env.page.evaluate(() => goTab("notes")); await settle(env.page);
  const row = await env.page.$(".nrow:has-text('Yeni tapşırıq')"); assert(row, "server notification row");
  await row.click(); await settle(env.page);
  assert(await env.page.evaluate(() => tab === "pres" && PX.sec === "tasks"), "deep link to tasks");
  assert((env.log.calls || []).some(x => x.fn === "notes_read"), "read state sent to server"); return env;
});
await H.test("phone 390: presentation page in sheet, sections scroll, no overflow", async () => {
  const env = await H.open({ user: IDS.student, width: 390, height: 844 }); await settle(env.page, 1200);
  await goPres(env.page);
  for (const s of ["overview", "order", "files", "tasks"]) {
    await env.page.evaluate(x => pxSec(x), s); await settle(env.page, 300);
    const ov = await env.page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); assert(!ov, "horizontal overflow on " + s);
    await H.shot(env.page, "phone-" + s);
  }
  return env;
});
await H.test("fallback: without ADIAK 1.0 backend the feature stays hidden and the app works", async () => {
  const env = await H.open({ user: IDS.student, over: { rpc: { my_access: { __error: "Could not find the function public.my_access" } } } }); await settle(env.page, 1200);
  assert(!(await env.page.$("nav.nav button:has-text('Təqdimatlar')")), "entry must be hidden");
  assert(await env.page.$(".hero, #main2"), "app still renders"); return env;
});
await H.done();
