import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/app.js";
import { config } from "../../src/config/env.js";
import { pool } from "../../src/config/database.js";
import { seedDatabase } from "../../src/tools/seed.js";
import { migrateDatabase } from "../../scripts/migrate.js";
import { sampleMeeting } from "../../src/tools/sample.js";
import { seedAsset } from "../../src/tools/seed-assets.js";
import { detectType } from "../../src/utils/file-type.js";

if (!config.DB_NAME.endsWith("_test") || config.FILE_STORAGE !== "mysql")
  throw new Error(
    "Use a separate DB_NAME ending in _test and FILE_STORAGE=mysql for deployment tests.",
  );
const password = "DensoDemo@2026!";
let server, base, token;
async function listen() {
  server = createApp({ serveFrontend: true }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
}
async function stop() {
  if (server) await new Promise((resolve) => server.close(resolve));
}
async function api(path, body) {
  return fetch(`${base}/api${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
    },
    ...(body
      ? { body: body instanceof FormData ? body : JSON.stringify(body) }
      : {}),
  });
}
before(async () => {
  await migrateDatabase();
  await migrateDatabase();
  await seedDatabase(password);
  await listen();
  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@demo.local", password }),
  });
  assert.equal(login.status, 200);
  token = (await login.json()).data.token;
});
after(async () => {
  await stop();
  await pool.end();
});

test("one origin serves the real frontend, protects API and does not expose local files", async () => {
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type"), /text\/html/);
  const html = await page.text();
  const script = html.match(/src="([^\"]+\/assets\/[^\"]+\.js)"/);
  assert(script, "Built frontend references its JavaScript asset");
  const asset = await fetch(new URL(script[1], `${base}/`));
  assert.equal(asset.status, 200);
  const code = await asset.text();
  assert(code.includes("shopfloor-session"));
  const health = await fetch(`${base}/api/health`);
  assert.equal((await health.json()).data.database, "mysql");
  assert.equal((await fetch(`${base}/api/workspace`)).status, 401);
  const missing = await api("/does-not-exist");
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error.code, "NOT_FOUND");
  for (const path of [
    "/BE/.env",
    "/.env",
    "/BE/uploads/file",
    "/BE/.local/mysql-admin.json",
  ])
    assert.equal((await fetch(`${base}${path}`)).status, 404);
});

test("full MySQL seed keeps attachment bytes, passwords and edits on subsequent startups", async () => {
  const [files] = await pool.query(
    "SELECT f.id,f.mime_type,f.size_bytes,c.content FROM files f JOIN file_contents c ON c.file_id=f.id WHERE f.id LIKE 'FILE-DEMO-%'",
  );
  assert.equal(files.length, 7);
  for (const file of files) {
    assert.equal(file.content.length, file.size_bytes);
    assert.equal(detectType(file.content), file.mime_type);
  }
  const [users] = await pool.query(
    "SELECT password_hash FROM users WHERE id='user-admin'",
  );
  await pool.execute("UPDATE notes SET action=? WHERE id='NOTE-DEMO-02'", [
    "Cloud test edit preserved",
  ]);
  const changed = Buffer.concat([files[0].content, Buffer.from("retained")]);
  await pool.execute("UPDATE file_contents SET content=? WHERE file_id=?", [
    changed,
    files[0].id,
  ]);
  await pool.execute("UPDATE files SET size_bytes=? WHERE id=?", [
    changed.length,
    files[0].id,
  ]);
  await seedDatabase("Different-seed-password-2026!");
  const [afterUsers] = await pool.query(
    "SELECT password_hash FROM users WHERE id='user-admin'",
  );
  assert.equal(afterUsers[0].password_hash, users[0].password_hash);
  const [notes] = await pool.query(
    "SELECT action FROM notes WHERE id='NOTE-DEMO-02'",
  );
  assert.equal(notes[0].action, "Cloud test edit preserved");
  const [stored] = await pool.execute(
    "SELECT content FROM file_contents WHERE file_id=?",
    [files[0].id],
  );
  assert.deepEqual(stored[0].content, changed);
});

test("uploaded bytes and login survive an Express restart, with authentication still enforced", async () => {
  const meeting = await api("/meetings", sampleMeeting);
  assert.equal(meeting.status, 201);
  const meetingId = (await meeting.json()).data.id;
  const bytes = seedAsset("image/png");
  const form = new FormData();
  form.set("meetingId", meetingId);
  form.set("file", new Blob([bytes], { type: "image/png" }), "evidence.png");
  const upload = await api("/files", form);
  assert.equal(upload.status, 201);
  const fileId = (await upload.json()).data.id;
  await stop();
  await listen();
  const download = await api(`/files/${fileId}`);
  assert.equal(download.status, 200);
  assert.match(download.headers.get("content-disposition"), /evidence\.png/);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), bytes);
  assert.equal((await fetch(`${base}/api/files/${fileId}`)).status, 401);
  const [rows] = await pool.execute(
    "SELECT content FROM file_contents WHERE file_id=?",
    [fileId],
  );
  assert.deepEqual(rows[0].content, bytes);
});
