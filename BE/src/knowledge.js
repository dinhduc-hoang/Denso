import { pool } from "./db.js";
import { assert } from "./errors.js";
import { get, json, scoped } from "./store.js";

export const activeWhere =
  "k.is_active=TRUE AND (k.valid_until IS NULL OR k.valid_until>UTC_TIMESTAMP(3))";
export const knowledgeSelect = `SELECT k.*,v.document,v.approved_by,v.approved_at,u.name AS approver_name FROM knowledge k JOIN knowledge_versions v ON v.knowledge_id=k.id AND v.version=k.current_version JOIN users u ON u.id=v.approved_by`;
export const knowledgeView = (row) => ({
  id: row.id,
  title: row.title,
  errorCode: row.error_code,
  scope: scoped(row),
  version: row.current_version,
  isActive: Boolean(row.is_active),
  validUntil: row.valid_until,
  document: json(row.document),
  approvedBy: { id: row.approved_by, name: row.approver_name },
  approvedAt: row.approved_at,
});
export async function currentKnowledge(id, db = pool) {
  const [rows] = await db.execute(`${knowledgeSelect} WHERE k.id=?`, [id]);
  assert(rows.length, "Không tìm thấy hướng dẫn.", 404, "NOT_FOUND");
  return knowledgeView(rows[0]);
}
export async function versions(id) {
  await get(pool, "knowledge", id);
  const [rows] = await pool.execute(
    "SELECT v.*,u.name AS approver_name,k.current_version FROM knowledge_versions v JOIN knowledge k ON k.id=v.knowledge_id JOIN users u ON u.id=v.approved_by WHERE v.knowledge_id=? ORDER BY v.version",
    [id],
  );
  return rows.map((row) => ({
    version: row.version,
    status: row.version === row.current_version ? "active" : "superseded",
    document: json(row.document),
    approvedBy: { id: row.approved_by, name: row.approver_name },
    approvedAt: row.approved_at,
    sourceNoteId: row.source_note_id,
  }));
}
export async function checkVersion(db, knowledgeId, version, scope) {
  const knowledge = await get(db, "knowledge", knowledgeId);
  const [rows] = await db.execute(
    "SELECT version FROM knowledge_versions WHERE knowledge_id=? AND version=?",
    [knowledgeId, version],
  );
  assert(
    rows.length,
    "Phiên bản hướng dẫn không tồn tại.",
    422,
    "INVALID_VERSION",
  );
  if (scope)
    assert(
      ["machine", "station", "product"].every((k) => knowledge[k] === scope[k]),
      "Hướng dẫn không thuộc phạm vi sự cố.",
      422,
      "SCOPE_MISMATCH",
    );
  return knowledge;
}
export async function retrieve(query, scope) {
  const [rows] = await pool.execute(
    `${knowledgeSelect} WHERE ${activeWhere} AND k.machine=? AND k.station=? AND k.product=? ORDER BY k.created_at DESC`,
    [scope.machine, scope.station, scope.product],
  );
  const normalized = query
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  // Exact error codes take precedence over symptom matching: unknown codes cannot match by incidental words.
  const code = query.match(/\bE-[A-Z0-9]+-[A-Z0-9]+\b/i)?.[0];
  return rows
    .filter((row) =>
      code
        ? row.error_code.toLowerCase() === code.toLowerCase()
        : row.title
            .toLocaleLowerCase("vi")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(normalized) ||
          (/anh.*mo|camera.*mo/.test(normalized) &&
            row.error_code === "E-VIS-07"),
    )
    .map(knowledgeView);
}
