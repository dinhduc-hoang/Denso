import { pool } from "../config/database.js";
import {
  get,
  meetingView,
  reportView,
  incidentView,
  noteView,
} from "../models/store.js";
import { currentKnowledge, versions } from "../models/knowledge.js";
import { parse } from "../utils/errors.js";
import { id } from "../utils/schemas.js";
import { z } from "zod";

export async function workspace(query) {
  const input = parse(
    z.strictObject({
      meetingId: id.optional(),
      incidentId: id.optional(),
      feedbackId: id.optional(),
    }),
    query,
  );
  let meetingId = input.meetingId;
  if (!meetingId) {
    const [rows] = await pool.query(
      "SELECT id FROM meetings ORDER BY created_at DESC,id DESC LIMIT 1",
    );
    meetingId = rows[0]?.id;
  }
  const meeting = meetingId
    ? meetingView(await get(pool, "meetings", meetingId))
    : null;
  const [reports] = meetingId
    ? await pool.execute("SELECT * FROM reports WHERE meeting_id=?", [
        meetingId,
      ])
    : [[]];
  const report = reports[0] ? reportView(reports[0]) : null;
  const [knowledgeRows] = report
    ? await pool.execute("SELECT id FROM knowledge WHERE report_id=?", [
        report.id,
      ])
    : [[]];
  let knowledge = knowledgeRows[0]
    ? await currentKnowledge(knowledgeRows[0].id)
    : null;
  let incident = null;
  if (input.incidentId)
    incident = incidentView(await get(pool, "incidents", input.incidentId));
  else if (knowledge && !input.feedbackId) {
    const [rows] = await pool.execute(
      "SELECT * FROM incidents WHERE knowledge_id=? ORDER BY created_at DESC,id DESC LIMIT 1",
      [knowledge.id],
    );
    if (rows[0]) incident = incidentView(rows[0]);
  }
  const [notes] = incident
    ? await pool.execute(
        "SELECT * FROM notes WHERE incident_id=? ORDER BY created_at DESC,id DESC LIMIT 1",
        [incident.id],
      )
    : [[]];
  if (incident?.knowledgeId && incident.knowledgeId !== knowledge?.id)
    knowledge = await currentKnowledge(incident.knowledgeId);
  const history = knowledge ? await versions(knowledge.id) : [];
  const feedback = input.feedbackId
    ? await get(pool, "feedback", input.feedbackId)
    : null;
  const [files] = await pool.execute(
    "SELECT id,original_name AS name,mime_type AS mimeType,meeting_id AS meetingId,incident_id AS incidentId FROM files WHERE meeting_id=? OR incident_id=? ORDER BY created_at DESC",
    [meetingId ?? null, incident?.id ?? null],
  );
  return {
    meeting,
    report,
    knowledge,
    history,
    incident,
    note: notes[0] ? noteView(notes[0]) : null,
    files,
    feedback: feedback
      ? {
          id: feedback.id,
          result: feedback.result,
          comment: feedback.comment,
          version: feedback.version,
        }
      : null,
  };
}
