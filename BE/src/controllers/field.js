import * as service from "../services/field.js";
import { parse } from "../utils/errors.js";
import * as schemas from "../utils/schemas.js";
export async function listIncidents(req, res) {
  const options = parse(schemas.list, req.query);
  res.json(await service.listIncidents({ options }));
}
export async function createIncident(req, res) {
  const input = parse(schemas.incident, req.body);
  res
    .status(201)
    .json({ data: await service.createIncident({ input, user: req.user }) });
}
export async function getIncident(req, res) {
  res.json({ data: await service.getIncident({ resourceId: req.params.id }) });
}
export async function updateIncident(req, res) {
  const input = parse(schemas.incidentPatch, req.body);
  res.json({
    data: await service.updateIncident({
      input,
      resourceId: req.params.id,
      user: req.user,
    }),
  });
}
export async function createFeedback(req, res) {
  const input = parse(schemas.feedback, req.body);
  res
    .status(201)
    .json({ data: await service.createFeedback({ input, user: req.user }) });
}
export async function listNotes(req, res) {
  res.json(
    await service.listNotes({ query: req.query, resourceId: req.params.id }),
  );
}
export async function createNote(req, res) {
  const input = parse(schemas.note, req.body);
  res.status(201).json({
    data: await service.createNote({
      input,
      resourceId: req.params.id,
      user: req.user,
    }),
  });
}
export async function requestNoteRevision(req, res) {
  const input = parse(schemas.revision, req.body);
  res.status(201).json({
    data: await service.requestNoteRevision({
      input,
      resourceId: req.params.id,
      user: req.user,
    }),
  });
}
export async function approveNote(req, res) {
  parse(schemas.noteApproval, req.body);
  res.status(201).json({
    data: await service.approveNote({
      resourceId: req.params.id,
      user: req.user,
    }),
  });
}
