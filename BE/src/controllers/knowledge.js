import { parse } from "../utils/errors.js";
import * as schemas from "../utils/schemas.js";
import {
  listKnowledge,
  currentKnowledge,
  versions,
} from "../models/knowledge.js";
import { retrieve } from "../services/knowledge.js";
export async function list(req, res) {
  res.json(await listKnowledge(parse(schemas.list, req.query)));
}
export async function history(req, res) {
  res.json({ data: await versions(req.params.id) });
}
export async function exportKnowledge(req, res) {
  const data = await currentKnowledge(req.params.id);
  res
    .attachment(`knowledge-${data.id}.json`)
    .json({ ...data, history: await versions(req.params.id) });
}
export async function get(req, res) {
  res.json({ data: await currentKnowledge(req.params.id) });
}
export async function retrieval(req, res) {
  const input = parse(schemas.retrieval, req.body);
  const cards = await retrieve(input.query, input.scope);
  res.json({ data: { cards, requiresEngineer: cards.length === 0 } });
}
