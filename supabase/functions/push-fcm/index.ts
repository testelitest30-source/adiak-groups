// Supabase Edge Function push-fcm: delivers queued ADIAK notifications/messages to Android via FCM HTTP v1.
// Woken by pg_net (after commit) and by the pg_cron sweeper. Auth: x-push-secret == push_config.secret (same as push-send).
// Secrets: FCM_SERVICE_ACCOUNT_JSON (Supabase Edge secret). SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
// Deployed to production on 2026-11-09 with the owner's approval (verify_jwt = false: authenticated by x-push-secret).
import { run, accessToken, safeEqual, parseServiceAccount, describeServiceAccount, type Row, type Templates, type Outcome } from "./lib.ts";
const URL_ = Deno.env.get("SUPABASE_URL")!, KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };
const rest = async (path: string, init: RequestInit = {}) => { const r = await fetch(URL_ + "/rest/v1/" + path, { ...init, headers: { ...H, ...(init.headers || {}) } });
  if (!r.ok) throw new Error(path + " " + r.status); const t = await r.text(); return t ? JSON.parse(t) : null; };
let tok: { v: string; exp: number } | null = null;
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method", { status: 405 });
  const cfg = await rest("push_config?select=secret&id=eq.1");
  const given = req.headers.get("x-push-secret") || "";
  if (!cfg?.[0]?.secret || !safeEqual(given, cfg[0].secret)) return new Response("forbidden", { status: 403 });
  const p = parseServiceAccount(Deno.env.get("FCM_SERVICE_ACCOUNT_JSON"));
  if (!p.sa) return new Response(JSON.stringify({ error: "FCM_SERVICE_ACCOUNT_JSON " + p.err }), { status: 503, headers: { "content-type": "application/json" } });
  const sa = p.sa;
  try { if (!tok || tok.exp < Date.now()) tok = { v: await accessToken(sa, fetch), exp: Date.now() + 50 * 60e3 }; }
  catch (e) { return new Response(JSON.stringify({ error: "google oauth failed: " + String((e as Error).message || e).slice(0, 160),
    service_account: describeServiceAccount(sa, Deno.env.get("FCM_SERVICE_ACCOUNT_JSON") || "", p.shape ?? -1) }), { status: 502, headers: { "content-type": "application/json" } }); }
  const body = await req.json().catch(() => ({})) as { selftest?: boolean };
  if (body.selftest) {
    // Integration self-test (same secret as normal runs): real OAuth token + FCM HTTP v1 with validate_only to a
    // deliberately invalid token. Nothing is delivered. 400 INVALID_ARGUMENT = credentials, project and API all work.
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, { method: "POST",
      headers: { Authorization: "Bearer " + tok.v, "content-type": "application/json" },
      body: JSON.stringify({ validate_only: true, message: { token: "adiak-selftest-invalid-token", notification: { title: "ADIAK", body: "selftest" } } }) });
    const t = await r.text(); let st = ""; try { st = JSON.parse(t)?.error?.status || ""; } catch { /* not json */ }
    return new Response(JSON.stringify({ selftest: true, oauth: "ok", service_account: describeServiceAccount(sa, Deno.env.get("FCM_SERVICE_ACCOUNT_JSON") || "", p.shape ?? -1), fcm_http: r.status, fcm_status: st,
      verdict: r.status === 400 && st === "INVALID_ARGUMENT" ? "fcm-ok" : r.status === 401 || r.status === 403 ? "credentials-problem" : "unexpected" }),
      { headers: { "content-type": "application/json" } });
  }
  const res = await run({
    claim: (n) => rest("rpc/push_claim", { method: "POST", body: JSON.stringify({ lim: n }) }) as Promise<Row[]>,
    mark: async (id: number, o: Outcome) => { await rest("rpc/push_mark", { method: "POST", body: JSON.stringify({ oid: id, outcome: o.outcome, http: o.http ?? null, err: o.err ?? null, provider: o.provider ?? null }) }); },
    templates: async () => { const t: Templates = {}; (await rest("notify_kinds?select=kind,lang,title,body") || []).forEach((x: { kind: string; lang: string; title: string; body: string }) => { t[x.kind + ":" + x.lang] = x; }); return t; },
    send: async (msg) => { const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, { method: "POST", headers: { Authorization: "Bearer " + tok!.v, "content-type": "application/json" }, body: JSON.stringify(msg) });
      return { status: r.status, body: await r.text() }; },
  });
  return new Response(JSON.stringify(res), { headers: { "content-type": "application/json" } });
});
