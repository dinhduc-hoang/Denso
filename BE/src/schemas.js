import { z } from "zod";

export const id = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);
const text = z.string().trim().min(1).max(20000);
export const scope = z.strictObject({
  machine: text.max(100),
  station: text.max(100),
  product: text.max(100),
});
export const segment = z.strictObject({
  id,
  startSeconds: z.number().int().min(0),
  speaker: text.max(200),
  text,
  kind: z.enum(["root", "dissent", "decision", "action", "context"]),
});
const segments = z
  .array(segment)
  .min(1)
  .max(500)
  .refine(
    (a) => new Set(a.map((s) => s.id)).size === a.length,
    "Segment IDs must be unique",
  );
export const meeting = z.strictObject({
  title: text.max(300),
  scope,
  segments,
});
export const meetingPatch = meeting
  .pick({ title: true, segments: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0);
export const login = z.strictObject({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
});
export const reportCreate = z.strictObject({ mode: z.literal("sample") });
export const reportPatch = z.strictObject({
  decision: text,
  revision: z.number().int().positive(),
});
export const reportApproval = z.strictObject({
  confirmed: z.literal(true),
  ack: z.literal(true),
  revision: z.number().int().positive(),
});
export const revision = z.strictObject({
  reason: text.max(2000),
  revision: z.number().int().positive().optional(),
});
export const retrieval = z.strictObject({ query: text.max(1000), scope });
export const incident = z
  .strictObject({
    query: text.max(1000),
    scope,
    feedback: text.max(5000),
    reason: z.enum(["unknown", "ineffective", "out_of_scope"]),
    knowledgeId: id.optional(),
    version: z.number().int().positive().optional(),
  })
  .refine(
    (v) => Boolean(v.knowledgeId) === Boolean(v.version),
    "knowledgeId and version must be supplied together",
  );
export const incidentPatch = z
  .strictObject({
    feedback: text.max(5000).optional(),
    status: z.enum(["open", "in_progress", "resolved"]).optional(),
    attachmentId: id.optional(),
  })
  .refine((v) => Object.keys(v).length > 0);
export const feedback = z.strictObject({
  knowledgeId: id,
  version: z.number().int().positive(),
  result: z.enum(["effective", "ineffective"]),
  comment: z.string().trim().max(5000).default(""),
  incidentId: id.optional(),
});
export const note = z.strictObject({
  cause: text,
  action: text,
  conditions: text.max(5000),
  evidenceIds: z.array(id).max(20).default([]),
  baseVersion: z.number().int().positive().optional(),
});
export const noteApproval = z.strictObject({ reviewed: z.literal(true) });
export const list = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().max(1000).optional(),
  machine: z.string().max(100).optional(),
  station: z.string().max(100).optional(),
  product: z.string().max(100).optional(),
  status: z.enum(["open", "in_progress", "resolved"]).optional(),
});
