// push-fcm core (runtime-agnostic: Deno in Supabase, Node 22 in tests). No secrets are logged or stored.
export type Row = { outbox_id: number; token: string; lang: string; kind: string | null; params: Record<string, unknown> | null;
  target: Record<string, unknown> | null; msg_channel: string | null; msg_sender: string | null; msg_body: string | null; collapse: string };
export type Templates = Record<string, { title: string; body: string }>;   // key: kind + ":" + lang
export type Outcome = { outcome: "ok" | "retry" | "invalid" | "fatal"; http?: number; err?: string; provider?: string };

const fmtDate = (v: unknown, lang: string) => { const d = new Date(String(v)); if (isNaN(d.getTime())) return String(v ?? "");
  return d.toLocaleString(lang === "en" ? "en-GB" : "az-Latn-AZ", { timeZone: "Asia/Baku", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); };
export function fill(t: string, p: Record<string, unknown>, lang: string): string {
  return t.replace(/\{(\w+)\}/g, (_, k) => k === "due" ? fmtDate(p[k], lang) : String(p[k] ?? "")).replace(/\s+/g, " ").trim();
}
export function buildMessage(r: Row, tpl: Templates) {
  const lang = r.lang === "en" ? "en" : "az";
  let title = "ADIAK", body = "", target: Record<string, unknown> = {}, channel = "adiak_default";
  if (r.kind) {
    const t = tpl[r.kind + ":" + lang] || tpl[r.kind + ":az"];
    title = t ? fill(t.title, r.params || {}, lang) : "ADIAK"; body = t ? fill(t.body, r.params || {}, lang) : "";
    target = r.target || {}; if (r.kind === "pres.live_now" || r.kind === "pres.next_up") channel = "adiak_live";
  } else {
    title = r.msg_sender || "ADIAK"; body = r.msg_body || ""; target = { k: "chat", ch: r.msg_channel };
  }
  title = title.slice(0, 120) || "ADIAK"; body = body.slice(0, 240);
  return { message: { token: r.token,
    notification: { title, body },
    data: { target: JSON.stringify(target), ch: String(r.msg_channel ?? ""), kind: String(r.kind ?? "chat") },
    android: { collapse_key: r.collapse, priority: channel === "adiak_live" ? "HIGH" : "NORMAL",
      notification: { tag: r.collapse, channel_id: channel, icon: "ic_stat_adiak", color: "#7959D6" } } } };
}
// FCM HTTP v1 error mapping. UNREGISTERED / INVALID_ARGUMENT (bad token) / SENDER_ID_MISMATCH -> token invalid.
export function classify(status: number, body: string): Outcome {
  if (status >= 200 && status < 300) { let name = ""; try { name = JSON.parse(body).name || ""; } catch (_) { /* */ } return { outcome: "ok", http: status, provider: name }; }
  let code = ""; try { const j = JSON.parse(body); code = (j.error?.details || []).map((d: { errorCode?: string }) => d.errorCode).filter(Boolean)[0] || j.error?.status || ""; } catch (_) { /* */ }
  const err = (code || "HTTP " + status).slice(0, 120);
  if (code === "UNREGISTERED" || code === "SENDER_ID_MISMATCH" || (status === 400 && /registration token|INVALID_ARGUMENT/i.test(body) && /token/i.test(body))) return { outcome: "invalid", http: status, err };
  if (status === 429 || status >= 500 || code === "UNAVAILABLE" || code === "INTERNAL" || code === "QUOTA_EXCEEDED") return { outcome: "retry", http: status, err };
  return { outcome: "fatal", http: status, err };
}
// OAuth2 access token for FCM from a Google service account (RS256 JWT signed with WebCrypto)
const b64u = (b: ArrayBuffer | Uint8Array | string) => { const bytes = typeof b === "string" ? new TextEncoder().encode(b) : new Uint8Array(b as ArrayBuffer);
  let s = ""; bytes.forEach(x => s += String.fromCharCode(x)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
export async function signJwt(sa: { client_email: string; private_key: string }, now = Math.floor(Date.now() / 1000)) {
  const pem = sa.private_key.replace(/\\n/g, "\n").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const h = b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const c = b64u(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(h + "." + c));
  return h + "." + c + "." + b64u(sig);
}
export async function accessToken(sa: { client_email: string; private_key: string }, fetchFn: typeof fetch) {
  const jwt = await signJwt(sa);
  const r = await fetchFn("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + jwt });
  if (!r.ok) { let why = ""; try { const j = await r.json(); why = [j.error, j.error_description].filter(Boolean).join(": "); } catch { /* */ }
    throw new Error(("oauth " + r.status + " " + why).trim().slice(0, 160)); }   // Google's error code/description only, never the key
  return (await r.json()).access_token as string;
}
// one run: claim batches and deliver until the queue is empty or the time budget is used
export async function run(deps: { claim: (n: number) => Promise<Row[]>; mark: (id: number, o: Outcome) => Promise<void>; templates: () => Promise<Templates>;
  send: (msg: unknown) => Promise<{ status: number; body: string }>; budgetMs?: number; }) {
  const t0 = Date.now(), budget = deps.budgetMs ?? 20000, tpl = await deps.templates(); let n = 0, ok = 0;
  while (Date.now() - t0 < budget) {
    const rows = await deps.claim(50); if (!rows.length) break;
    for (const r of rows) {
      let o: Outcome;
      try { const res = await deps.send(buildMessage(r, tpl)); o = classify(res.status, res.body); }
      catch (e) { o = { outcome: "retry", err: ("network: " + String((e as Error).message || e)).slice(0, 120) }; }
      await deps.mark(r.outbox_id, o); n++; if (o.outcome === "ok") ok++;
    }
  }
  return { processed: n, sent: ok };
}
export function safeEqual(a: string, b: string) { if (a.length !== b.length) return false; let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0; }
// FCM_SERVICE_ACCOUNT_JSON as stored by the owner: raw JSON, a JSON-encoded string, base64 of the JSON, or the JSON body
// pasted without its outer braces. Returns the account or a NON-sensitive diagnosis (never any part of the value).
// real line breaks inside JSON string literals (a private key whose \\n escapes were turned into newlines) -> \\n
function escNl(j: string) { let o = "", q = false, e = false;
  for (const c of j) { if (q && !e && (c === "\n" || c === "\r")) { if (c === "\n") o += "\\n"; continue; }
    o += c; if (e) e = false; else if (c === "\\") e = q; else if (c === '"') q = !q; }
  return o; }
export type ServiceAccount = { client_email: string; private_key: string; project_id: string };
export function parseServiceAccount(raw: string | undefined | null): { sa?: ServiceAccount; err?: string } {
  if (!raw || !raw.trim()) return { err: "missing" };
  const t = raw.trim(), shapes = [t, "{" + t, t + "}", "{" + t.replace(/^,|,$/g, "") + "}"];
  const tries: Array<() => unknown> = [() => JSON.parse(atob(t.replace(/\s+/g, "")))];
  for (const x of shapes) tries.unshift(() => JSON.parse(x)), tries.push(() => JSON.parse(escNl(x)));
  for (const f of tries) {
    let v: unknown; try { v = f(); } catch { continue; }
    if (typeof v === "string") { try { v = JSON.parse(v); } catch { continue; } }
    const o = v as Partial<ServiceAccount> | null;
    if (o && typeof o === "object" && o.client_email && o.private_key && o.project_id) return { sa: o as ServiceAccount };
    if (o && typeof o === "object") return { err: "json-missing-fields:" + ["client_email", "private_key", "project_id"].filter(k => !(o as Record<string, unknown>)[k]).join(",") };
  }
  const cls = (c: string) => /[{}\[\]"]/.test(c) ? "'" + c + "'" : /[A-Za-z0-9+/=]/.test(c) ? "letter/digit" : /\s/.test(c) ? "whitespace" : "other";
  let pos = ""; try { JSON.parse("{" + t); } catch (e) { const m = /position (\d+)/.exec(String((e as Error).message)); pos = m ? ", '{'+value fails at " + m[1] : ""; }
  return { err: "not-json (length " + t.length + ", starts with " + cls(t[0]) + ", ends with " + cls(t[t.length - 1]) + pos + ")" };
}
