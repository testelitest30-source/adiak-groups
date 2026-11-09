// Supabase Edge Function push-fcm: delivers queued ADIAK notifications/messages to Android via FCM HTTP v1.
// Woken by pg_net (after commit) and by the pg_cron sweeper. Auth: x-push-secret == push_config.secret (same as push-send).
// Secrets: FCM_SERVICE_ACCOUNT_JSON (Supabase Edge secret). SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
// Deploying this function requires the owner's approval.
import { run, accessToken, safeEqual, type Row, type Templates, type Outcome } from "./lib.ts";
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
  const raw = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON"); if (!raw) return new Response("not configured", { status: 503 });
  const sa = JSON.parse(raw);
  if (!tok || tok.exp < Date.now()) tok = { v: await accessToken(sa, fetch), exp: Date.now() + 50 * 60e3 };
  const res = await run({
    claim: (n) => rest("rpc/push_claim", { method: "POST", body: JSON.stringify({ lim: n }) }) as Promise<Row[]>,
    mark: async (id: number, o: Outcome) => { await rest("rpc/push_mark", { method: "POST", body: JSON.stringify({ oid: id, outcome: o.outcome, http: o.http ?? null, err: o.err ?? null, provider: o.provider ?? null }) }); },
    templates: async () => { const t: Templates = {}; (await rest("notify_kinds?select=kind,lang,title,body") || []).forEach((x: { kind: string; lang: string; title: string; body: string }) => { t[x.kind + ":" + x.lang] = x; }); return t; },
    send: async (msg) => { const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, { method: "POST", headers: { Authorization: "Bearer " + tok!.v, "content-type": "application/json" }, body: JSON.stringify(msg) });
      return { status: r.status, body: await r.text() }; },
  });
  return new Response(JSON.stringify(res), { headers: { "content-type": "application/json" } });
});
