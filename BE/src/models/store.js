import { json, scoped } from "../utils/data.js";
import { pool } from "../config/database.js";
import { ApiError } from "../utils/errors.js";

// Table names are constants at call sites, never request data.
export async function get(db, table, id, lock = false) {
  const [rows] = await db.execute(
    `SELECT * FROM ${table} WHERE id=?${lock ? " FOR UPDATE" : ""}`,
    [id],
  );
  if (!rows.length)
    throw new ApiError(404, "NOT_FOUND", "Không tìm thấy bản ghi.");
  return rows[0];
}
export async function audit(db, user, action, resourceId) {
  await db.execute(
    "INSERT INTO audit_events (actor_id,action,resource_id) VALUES (?,?,?)",
    [user.id, action, resourceId],
  );
}
export async function paginate(sql, args, options, map = (row) => row) {
  const [count] = await pool.query(
    `SELECT COUNT(*) AS total FROM (${sql}) AS items`,
    args,
  );
  const [rows] = await pool.query(
    `${sql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [...args, options.pageSize, (options.page - 1) * options.pageSize],
  );
  return {
    data: rows.map(map),
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      totalItems: count[0].total,
      totalPages: Math.ceil(count[0].total / options.pageSize),
    },
  };
}
export const meetingView = (row) => ({
  id: row.id,
  title: row.title,
  scope: scoped(row),
  segments: json(row.segments),
  createdAt: row.created_at,
});
export const reportView = (row) => ({
  id: row.id,
  meetingId: row.meeting_id,
  status: row.status,
  revision: row.revision,
  document: json(row.document),
  decision: row.decision,
  approvedBy: row.approved_by,
  approvedAt: row.approved_at,
  revisionReason: row.revision_reason,
});
export const incidentView = (row) => ({
  id: row.id,
  query: row.query,
  scope: scoped(row),
  feedback: row.feedback,
  reason: row.reason,
  knowledgeId: row.knowledge_id,
  version: row.knowledge_version,
  status: row.status,
  assignedTo: row.assigned_to,
  createdAt: row.created_at,
});
export const noteView = (row) => ({
  id: row.id,
  incidentId: row.incident_id,
  cause: row.cause,
  action: row.action,
  conditions: row.conditions,
  evidenceIds: json(row.evidence_ids),
  baseVersion: row.base_version,
  status: row.status,
  createdBy: row.created_by,
  approvedBy: row.approved_by,
});
