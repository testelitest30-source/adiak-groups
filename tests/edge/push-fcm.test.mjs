// Unit tests for supabase/functions/push-fcm/lib.ts with a mocked FCM (Node 22 strips the TS types).
// Usage: node tests/edge/push-fcm.test.mjs
import { buildMessage, classify, run, signJwt, parseServiceAccount, describeServiceAccount, fill, safeEqual } from "../../supabase/functions/push-fcm/lib.ts";
import { generateKeyPairSync, createVerify } from "node:crypto";
let pass = 0, fail = 0; const ok = (c, n) => { c ? pass++ : fail++; console.log((c ? "  ok   " : "  FAIL ") + n); };
const tpl = { "pres.draw:az": { title: "Püşk nəticəsi: {n} komandadan {pos}-cisiniz", body: "{title}" }, "pres.draw:en": { title: "Draw result: you present #{pos} of {n}", body: "{title}" },
  "pres.live_now:az": { title: "İndi sizin komandanız çıxış edir", body: "{title}" }, "pres.rem24:az": { title: "24 saat qalıb", body: "{title} · {due}" } };
const row = (o) => ({ outbox_id: 1, token: "tok", lang: "az", kind: "pres.draw", params: { n: 3, pos: 2, title: "Ekologiya" }, target: { k: "pres", event: 1, group: 2, sec: "draw" }, msg_channel: null, msg_sender: null, msg_body: null, collapse: "n7", ...o });

let m = buildMessage(row({}), tpl).message;
ok(m.notification.title === "Püşk nəticəsi: 3 komandadan 2-cisiniz" && m.notification.body === "Ekologiya", "AZ template filled");
ok(buildMessage(row({ lang: "en" }), tpl).message.notification.title === "Draw result: you present #2 of 3", "EN template by device language");
ok(JSON.parse(m.data.target).event === 1 && m.data.target.length < 200, "deep-link target in data");
ok(m.android.collapse_key === "n7" && m.android.notification.tag === "n7", "collapse key + tag (retry replaces, never duplicates)");
ok(buildMessage(row({ kind: "pres.live_now" }), tpl).message.android.notification.channel_id === "adiak_live", "live notifications use the high-priority channel");
const chat = buildMessage(row({ kind: null, params: null, target: null, msg_channel: "p:1:2", msg_sender: "Rəşad", msg_body: "Slaydlar hazırdır" }), tpl).message;
ok(chat.notification.title === "Rəşad" && JSON.parse(chat.data.target).ch === "p:1:2", "chat message → opens the chat");
ok(/\d{2}\.\d{2}|\d{2}\/\d{2}/.test(fill("{due}", { due: "2026-11-10T08:00:00Z" }, "az")), "dates formatted in Baku time");
ok(buildMessage(row({ kind: "unknown.kind" }), tpl).message.notification.title === "ADIAK", "unknown kind falls back safely");

ok(classify(200, '{"name":"projects/p/messages/1"}').outcome === "ok", "200 → sent (+ provider id)");
ok(classify(404, '{"error":{"status":"NOT_FOUND","details":[{"@type":"type.googleapis.com/google.firebase.fcm.v1.FcmError","errorCode":"UNREGISTERED"}]}}').outcome === "invalid", "UNREGISTERED → invalid token");
ok(classify(403, '{"error":{"status":"PERMISSION_DENIED","details":[{"errorCode":"SENDER_ID_MISMATCH"}]}}').outcome === "invalid", "SENDER_ID_MISMATCH → invalid token");
ok(classify(400, '{"error":{"status":"INVALID_ARGUMENT","message":"The registration token is not a valid FCM registration token"}}').outcome === "invalid", "bad registration token → invalid");
ok(classify(429, "{}").outcome === "retry" && classify(503, "{}").outcome === "retry", "429 / 503 → retry with backoff");
ok(classify(400, '{"error":{"status":"INVALID_ARGUMENT","message":"Invalid JSON payload"}}').outcome === "fatal", "malformed payload → fatal (no infinite retry)");
ok(!JSON.stringify(classify(404, '{"error":{"details":[{"errorCode":"UNREGISTERED"}]}}')).includes("tok"), "error record contains no token");

// run(): marks every claimed row, network errors become retries, stops when the queue is empty
const queue = [[row({ outbox_id: 1 }), row({ outbox_id: 2, token: "bad" }), row({ outbox_id: 3, token: "net" })], []], marks = [];
const res = await run({ claim: async () => queue.shift() || [], mark: async (id, o) => { marks.push([id, o.outcome]); }, templates: async () => tpl,
  send: async (msg) => { if (msg.message.token === "net") throw new Error("ECONNRESET"); return msg.message.token === "bad" ? { status: 404, body: '{"error":{"details":[{"errorCode":"UNREGISTERED"}]}}' } : { status: 200, body: '{"name":"x"}' }; } });
ok(res.processed === 3 && res.sent === 1, "batch processed: 3 rows, 1 sent");
ok(JSON.stringify(marks) === JSON.stringify([[1, "ok"], [2, "invalid"], [3, "retry"]]), "outcomes recorded per row");
// JWT for the Google OAuth exchange: RS256, verifiable with the public key, FCM scope
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const jwt = await signJwt({ client_email: "svc@p.iam.gserviceaccount.com", private_key: privateKey }, 1700000000);
const [h, c, s] = jwt.split("."), v = createVerify("RSA-SHA256"); v.update(h + "." + c);
ok(v.verify(publicKey, Buffer.from(s, "base64url")), "JWT signature verifies (RS256)");
const claims = JSON.parse(Buffer.from(c, "base64url"));
ok(claims.scope === "https://www.googleapis.com/auth/firebase.messaging" && claims.exp - claims.iat === 3600, "JWT scope + 1 h expiry");
ok(safeEqual("abc", "abc") && !safeEqual("abc", "abd") && !safeEqual("abc", "ab"), "constant-time secret compare");
// FCM_SERVICE_ACCOUNT_JSON stored in any of the common shapes; the diagnosis never echoes the value
const SA = { type: "service_account", project_id: "adiak-x", client_email: "svc@adiak-x.iam.gserviceaccount.com", private_key: privateKey };
const js = JSON.stringify(SA);
ok(parseServiceAccount(js).sa?.project_id === "adiak-x", "service account: raw JSON");
ok(parseServiceAccount(JSON.stringify(js)).sa?.project_id === "adiak-x", "service account: JSON-encoded string");
ok(parseServiceAccount(Buffer.from(js).toString("base64")).sa?.project_id === "adiak-x", "service account: base64");
ok(parseServiceAccount(js.slice(1, -1)).sa?.project_id === "adiak-x", "service account: pasted without outer braces");
ok(parseServiceAccount(js.slice(1)).sa?.project_id === "adiak-x" && parseServiceAccount(js.slice(0, -1)).sa?.project_id === "adiak-x", "service account: missing opening or closing brace");
const nl = js.slice(1).replace(/\\n/g, "\n"); ok(parseServiceAccount(nl).sa?.private_key.includes("\n"), "service account: real line breaks inside the private key + missing brace");
const nlsa = parseServiceAccount(nl).sa; ok(await signJwt(nlsa, 1700000000).then(j => j.split(".").length === 3), "…and that key still signs");
ok(parseServiceAccount("").err === "missing" && /missing-fields:client_email/.test(parseServiceAccount('{"project_id":"x","private_key":"k"}').err), "missing / incomplete → clear error");
const bad = parseServiceAccount("secret-value-that-must-not-leak"); ok(bad.err && !bad.err.includes("secret-value"), "diagnosis never contains the value");
ok(await signJwt({ client_email: SA.client_email, private_key: privateKey.replace(/\n/g, "\\n") }, 1700000000).then(j => j.split(".").length === 3), "private key with escaped \\n line breaks still signs");
const d = describeServiceAccount({ ...SA, private_key_id: "abcdef0123456789" }, js.slice(1), parseServiceAccount(js.slice(1)).shape);
ok(d.stored_as === "missing '{'" && d.account === "svc@…@adiak-x.iam.gserviceaccount.com".replace("svc@…@", "svc…@") && d.key_id === "abcdef01…" && !JSON.stringify(d).includes("PRIVATE"), "support fingerprint: shape, masked account, key-id prefix, no key");
ok(parseServiceAccount(js).shape === 0 && parseServiceAccount(Buffer.from(js).toString("base64")).shape === 2, "shape codes");
console.log(`push-fcm: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
