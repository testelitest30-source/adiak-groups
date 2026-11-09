// Supabase-i tam saxtalaşdırır: heç bir sorğu real serverə getmir.
// - REST (/rest/v1/<cədvəl>, /rest/v1/rpc/<funksiya>), auth, storage → fixtures.mjs
// - Realtime websocket → serverə QOŞULMUR, yalnız phx_join-a "ok" cavabı verilir
// - Yerli serverdən (127.0.0.1) başqa hər sorğu bloklanır və "leaks" siyahısına yazılır
// - Oxumadan başqa (POST/PATCH/DELETE) sorğular "writes" siyahısına yazılır (yalnız saxta cavab alır)
import { tables, rpc } from "./fixtures.mjs";

export async function mockSupabase(context, origin, over = {}) {
  const R = { ...rpc, ...(over.rpc || {}) }, T = { ...tables, ...(over.tables || {}) };
  const log = { leaks: [], writes: [], reads: [] };
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });

  await context.route(() => true, async (route) => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === origin) return route.continue();
    if (!/\.supabase\.co$/.test(url.hostname)) { log.leaks.push(req.url()); return route.abort(); }
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    const p = url.pathname;
    if (p.startsWith("/rest/v1/rpc/")) {
      const fn = p.slice("/rest/v1/rpc/".length);
      if (!(fn in R)) log.writes.push(`rpc ${fn}`);
      let body = {}; try { body = JSON.parse(req.postData() || "{}"); } catch {}
      log.calls = log.calls || []; log.calls.push({ fn, body });
      const v = R[fn];
      if (v && typeof v === "object" && v.__error) return json(route, { message: v.__error, code: "P0001" }, 400);
      return json(route, typeof v === "function" ? v(body) : (v ?? null));
    }
    if (p.startsWith("/rest/v1/")) {
      const t = p.slice("/rest/v1/".length);
      if (req.method() !== "GET" && req.method() !== "HEAD") { log.writes.push(`${req.method()} ${t}`); return json(route, [], 201); }
      log.reads.push(t);
      let rows = T[t] ?? [];
      for (const [k, v] of url.searchParams) {           // sadə "col=eq.val" filtri
        const m = /^eq\.(.*)$/.exec(v);
        if (m && k !== "select") rows = rows.filter((r) => String(r[k]) === m[1]);
      }
      if ((req.headers()["accept"] || "").includes("vnd.pgrst.object")) return rows[0] ? json(route, rows[0]) : json(route, { message: "not found" }, 406);
      return json(route, rows);
    }
    if (p.startsWith("/auth/v1/")) {
      if (p.endsWith("/logout")) return route.fulfill({ status: 204 });
      log.writes.push(`auth ${p}`);                          // giriş testləri saxta sessiya ilə işləyir
      return json(route, { error: "mocked" }, 400);
    }
    if (p.startsWith("/storage/v1/")) return json(route, []);
    log.leaks.push(req.url());
    return route.abort();
  });

  await context.routeWebSocket(/supabase\.co/, (ws) => {
    ws.onMessage((raw) => {
      let m; try { m = JSON.parse(String(raw)); } catch { return; }
      if (Array.isArray(m)) { const [jr, ref, topic, ev] = m; if (ev === "phx_join" || ev === "heartbeat") ws.send(JSON.stringify([jr, ref, topic, "phx_reply", { status: "ok", response: {} }])); }
      else if (m && (m.event === "phx_join" || m.event === "heartbeat")) ws.send(JSON.stringify({ topic: m.topic, event: "phx_reply", ref: m.ref, payload: { status: "ok", response: {} } }));
    });
  });
  return log;
}
