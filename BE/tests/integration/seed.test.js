import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import { pool } from "../../src/config/database.js";
import { config } from "../../src/config/env.js";
import { seedDatabase } from "../../src/tools/seed.js";
import { retrieve } from "../../src/services/knowledge.js";
import { workspace } from "../../src/services/workspace.js";
import { verifyPassword } from "../../src/utils/crypto.js";
import { detectType } from "../../src/utils/file-type.js";
import { sampleMeeting } from "../../src/tools/sample.js";

if (!config.DB_NAME.endsWith("_test"))
  throw new Error(
    "Seed integration tests require a separate database ending in _test.",
  );
after(() => pool.end());

test("full seed is coherent, repeatable, preserves edits/passwords and restores missing fixture files", async () => {
  const first = await seedDatabase("Seed-test-only-2026!");
  assert.equal(first.mode, "full");
  const [users] = await pool.execute(
    "SELECT password_hash FROM users WHERE id='user-admin'",
  );
  const originalHash = users[0].password_hash;
  assert.equal(
    await verifyPassword("Seed-test-only-2026!", originalHash),
    true,
  );
  const loaded = await workspace({ meetingId: "DR-DEMO-024" });
  assert.equal(loaded.report.status, "approved");
  assert.equal(loaded.knowledge.version, 2);
  assert.deepEqual(
    loaded.history.map((row) => row.version),
    [1, 2],
  );
  assert.equal(loaded.incident.id, "INC-DEMO-01");
  assert.equal(loaded.note.status, "approved");
  const cards = await retrieve("E-VIS-07", sampleMeeting.scope);
  assert(cards.some((card) => card.id === "KB-VIS-024" && card.version === 2));
  assert(
    !cards.some((card) =>
      ["KB-VIS-021", "KB-VIS-022", "KB-VIS-023"].includes(card.id),
    ),
  );
  assert.equal(
    (await retrieve("E-NEW-99", sampleMeeting.scope)).filter((card) =>
      card.id.startsWith("KB-VIS-"),
    ).length,
    0,
  );
  const [files] = await pool.query(
    "SELECT * FROM files WHERE id LIKE 'FILE-DEMO-%'",
  );
  assert.equal(files.length, 7);
  for (const file of files) {
    const bytes = await readFile(
      new URL(`../../uploads/${file.storage_name}`, import.meta.url),
    );
    assert.equal(bytes.length, file.size_bytes);
    assert.equal(detectType(bytes), file.mime_type);
  }
  await pool.execute("UPDATE notes SET action=? WHERE id='NOTE-DEMO-02'", [
    "Engineer edited this pending note.",
  ]);
  const missingFile = new URL(
    "../../uploads/FILE-DEMO-FIELD-01",
    import.meta.url,
  );
  await unlink(missingFile);
  const second = await seedDatabase("A-different-password-2026!");
  assert.equal(
    Object.values(second.inserted).reduce((sum, count) => sum + count, 0),
    0,
  );
  assert.deepEqual(second.totals, first.totals);
  const [afterUsers] = await pool.execute(
    "SELECT password_hash FROM users WHERE id='user-admin'",
  );
  assert.equal(afterUsers[0].password_hash, originalHash);
  const [notes] = await pool.execute(
    "SELECT action FROM notes WHERE id='NOTE-DEMO-02'",
  );
  assert.equal(notes[0].action, "Engineer edited this pending note.");
  assert.equal(detectType(await readFile(missingFile)), "image/png");
});
