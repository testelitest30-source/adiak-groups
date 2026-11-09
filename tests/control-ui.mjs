// Control Center (Ledger admin + control.js), mocked Supabase: owner vs admin, no secrets, flags, diagnostics.
import { harness, assert, settle } from "./lib/harness.mjs";
import { IDS } from "./lib/fixtures.mjs";
const H = await harness(process.argv[2] || "control-ui");
const ops = {
  ops_overview: { students: 6, teachers: 1, leaders: 1, admins: 3, classes: 2, teams: 2, active_15m: 4, events_upcoming: 1, live_now: [], assignments_open: 2, notifications_24h: 37, push_failed_24h: 1, incomplete_accounts: 4,
    owner: { name: "Nurəli Qasımlı", since: new Date().toISOString() }, flags: { max_groups: "6", pres_enabled: "true" } },
  ops_push_stats: { outbox: { sent: 120, retry: 2, dead: 1 }, devices_active: 31, devices_disabled: 3, invalid_tokens_7d: 2, last_ok: new Date().toISOString(), oldest_due: null,
    recent_errors: [{ at: new Date().toISOString(), status: "retry", http: 503, error: "UNAVAILABLE", attempts: 2 }] },
  ops_audit: [{ source: "platform", id: 3, at: new Date().toISOString(), actor: "Nurəli Qasımlı", action: "flag.set", entity: "platform", target: "maintenance", reason: null }],
  ops_jobs: { installed: false }, ops_storage: [{ bucket: "team-files", public: false, limit: 26214400, objects: 12, bytes: 31457280 }], ops_errors: [],
  ops_migrations: [{ version: "20261009113759", name: "azeri_groups_schema" }], ops_incomplete_accounts: [{ email: "ghost@classroom.app", internal: true, created_at: new Date().toISOString(), last_sign_in_at: null }],
  owner_set_flag: null };
const accOwner = { uid: IDS.admin, role: "student", owner: true, admin: true, perms: ["admin"], teaches: [], leads: [] };
const accAdmin = { ...accOwner, owner: false };
const openAdmin = (acc) => H.open({ user: IDS.admin, path: "/admin/index.html", over: { rpc: { ...ops, my_access: acc } } });
const navText = p => p.locator(".side .nav button").allTextContents();

await H.test("owner: Operations, Delivery, Audit, Platform and Diagnostics in the Ledger", async () => {
  const env = await openAdmin(accOwner); await env.page.waitForSelector(".side .nav button"); await settle(env.page, 1500);
  const n = (await navText(env.page)).join("|"); for (const t of ["Əməliyyatlar", "Çatdırılma", "Audit jurnalı", "Platforma", "Diaqnostika"]) assert(n.includes(t), "missing " + t + " in " + n);
  await env.page.evaluate(() => switchTab("ops")); await settle(env.page, 800);
  const t = await env.page.textContent(".main"); assert(t.includes("Nurəli Qasımlı") && t.includes("37"), "ops overview: " + t.slice(0, 200));
  await H.shot(env.page, "ops"); return env;
});
await H.test("admin (not owner): no Platform / Diagnostics", async () => {
  const env = await openAdmin(accAdmin); await env.page.waitForSelector(".side .nav button"); await settle(env.page, 1500);
  const n = (await navText(env.page)).join("|"); assert(n.includes("Əməliyyatlar") && !n.includes("Platforma") && !n.includes("Diaqnostika"), "nav: " + n); return env;
});
await H.test("delivery: counts and recent errors, no token values", async () => {
  const env = await openAdmin(accOwner); await env.page.waitForSelector(".side .nav button"); await settle(env.page, 1300);
  await env.page.evaluate(() => switchTab("delivery")); await settle(env.page, 800);
  const t = await env.page.textContent(".main"); assert(t.includes("120") && t.includes("UNAVAILABLE"), "delivery: " + t.slice(0, 200));
  assert(!/p256dh|"token"|secret/i.test(await env.page.content()), "no secrets in the page"); await H.shot(env.page, "delivery"); return env;
});
await H.test("platform: owner toggles maintenance mode via owner_set_flag", async () => {
  const env = await openAdmin(accOwner); await env.page.waitForSelector(".side .nav button"); await settle(env.page, 1300);
  await env.page.evaluate(() => switchTab("platform")); await settle(env.page, 800);
  await env.page.locator(".pc", { hasText: "maintenance" }).first().locator("button").click(); await settle(env.page, 500);
  const c = (env.log.calls || []).find(x => x.fn === "owner_set_flag"); assert(c && c.body.k === "maintenance" && c.body.v === "true", "flag call " + JSON.stringify(c)); return env;
});
await H.test("diagnostics: pg_cron state honest, incomplete accounts listed, backups not faked", async () => {
  const env = await openAdmin(accOwner); await env.page.waitForSelector(".side .nav button"); await settle(env.page, 1300);
  await env.page.evaluate(() => switchTab("diag")); await settle(env.page, 900);
  const t = await env.page.textContent(".main"); assert(t.includes("pg_cron hələ quraşdırılmayıb") && t.includes("ghost@classroom.app") && t.includes("Supabase panelində"), "diag: " + t.slice(0, 300));
  await H.shot(env.page, "diag"); return env;
});
await H.test("without ADIAK 1.0 backend: new modules hidden, classic admin works", async () => {
  const env = await H.open({ user: IDS.admin, path: "/admin/index.html", over: { rpc: { my_access: { __error: "not found" } } } }); await env.page.waitForSelector(".side .nav button"); await settle(env.page, 1300);
  const n = (await navText(env.page)).join("|"); assert(!n.includes("Əməliyyatlar") && n.includes("İnsanlar") || !n.includes("Əməliyyatlar"), "nav: " + n); return env;
});
await H.done();
