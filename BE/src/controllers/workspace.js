import { sampleMeeting } from "../tools/sample.js";
import { workspace } from "../services/workspace.js";
import { overview } from "../models/overview.js";
export function sample(_req, res) {
  res.json({ data: sampleMeeting });
}
export async function getOverview(_req, res) {
  res.json({ data: await overview() });
}
export async function getWorkspace(req, res) {
  res.json({ data: await workspace(req.query) });
}
