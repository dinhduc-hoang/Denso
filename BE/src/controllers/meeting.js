import * as service from "../services/meeting.js";
import { parse } from "../utils/errors.js";
import * as schemas from "../utils/schemas.js";
export async function listMeetings(req, res) {
  const options = parse(schemas.list, req.query);
  res.json(await service.listMeetings({ options }));
}
export async function createMeeting(req, res) {
  const data = parse(schemas.meeting, req.body);
  res
    .status(201)
    .json({ data: await service.createMeeting({ data, user: req.user }) });
}
export async function getMeeting(req, res) {
  res.json({ data: await service.getMeeting({ resourceId: req.params.id }) });
}
export async function updateMeeting(req, res) {
  const input = parse(schemas.meetingPatch, req.body);
  res.json({
    data: await service.updateMeeting({
      input,
      resourceId: req.params.id,
      user: req.user,
    }),
  });
}
export async function createReport(req, res) {
  parse(schemas.reportCreate, req.body);
  res.status(201).json({
    data: await service.createReport({
      resourceId: req.params.id,
      user: req.user,
    }),
  });
}
export async function getReport(req, res) {
  res.json({ data: await service.getReport({ resourceId: req.params.id }) });
}
export async function updateReport(req, res) {
  const input = parse(schemas.reportPatch, req.body);
  res.json({
    data: await service.updateReport({
      input,
      resourceId: req.params.id,
      user: req.user,
    }),
  });
}
export async function requestReportRevision(req, res) {
  const input = parse(schemas.revision, req.body);
  res.status(201).json({
    data: await service.requestReportRevision({
      input,
      resourceId: req.params.id,
      user: req.user,
    }),
  });
}
export async function approveReport(req, res) {
  const input = parse(schemas.reportApproval, req.body);
  res.status(201).json({
    data: await service.approveReport({
      input,
      resourceId: req.params.id,
      user: req.user,
    }),
  });
}
