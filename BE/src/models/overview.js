import { pool } from "../config/database.js";
import { activeWhere } from "./knowledge.js";
export async function overview() {
  const [rows] = await pool.query(
    `SELECT (SELECT COUNT(*) FROM meetings) AS meetings,(SELECT COUNT(*) FROM reports WHERE status!='approved') AS draftReports,(SELECT COUNT(*) FROM knowledge k WHERE ${activeWhere}) AS activeKnowledge,(SELECT COUNT(*) FROM incidents WHERE status!='resolved') AS openIncidents`,
  );
  return rows[0];
}
