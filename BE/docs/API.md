# API contract

Base URL `/api`. Authenticate with `Authorization: Bearer <opaque session token>`.
Responses `{data: ...}`; lists also include `pagination: {page,pageSize,totalItems,totalPages}`.
Errors `{error: {code,message,details?},requestId}`; 401 unauthenticated, 403 wrong role,
404 missing resource, 409 invalid state/stale version, 422 invalid input, 503 database unavailable.
All inputs are validated with strict Zod schemas in `src/schemas.js`.

| API | Input / result | Roles |
| --- | --- | --- |
| POST /auth/login | email, password → token, user | Public |
| GET /auth/me; POST /auth/logout | Current identity; revoke session | All |
| GET /overview | Counts of meetings, drafts, active guidance, incidents | All |
| GET /templates/sample-meeting | Source-backed sample meeting template | coordinator, admin |
| GET/POST /meetings | Paginated list / title, scope, segments | coordinator, admin to create |
| GET/PATCH /meetings/:id | Meeting and sources / title, segments | coordinator, admin to edit |
| POST /meetings/:id/reports | mode: sample → source-backed report draft | coordinator, admin |
| GET/PATCH /reports/:id | Report / decision + revision (optimistic lock) | expert, coordinator, admin to edit |
| POST /reports/:id/revisions | reason + revision → request changes | expert, admin |
| POST /reports/:id/approvals | confirmed:true, ack:true, revision → immutable guidance v1 | expert, admin |
| GET /knowledge | Paginated active approved guidance; q, machine, station, product | All |
| GET /knowledge/:id; GET /knowledge/:id/versions | Current guidance / immutable release history | All |
| GET /knowledge/:id/export | JSON download with source, approver, history | All |
| POST /retrievals | query, scope → matching Action Cards (approved, active, unexpired only) | All |
| GET/POST /incidents | List / query, scope, feedback, reason, knowledgeId?, version? | All |
| GET/PATCH /incidents/:id | Incident / feedback, status, attachmentId | engineer, admin for status |
| POST /feedback | knowledgeId, version, result, comment?, incidentId? | All |
| GET/POST /incidents/:id/notes | Notes / cause, action, conditions, evidenceIds?, baseVersion? | engineer, admin to create |
| POST /notes/:id/revisions | reason → return draft | expert, admin |
| POST /notes/:id/approvals | reviewed:true → next immutable guidance version | expert, admin |
| POST /files | multipart file + meetingId OR incidentId | coordinator/engineer/admin by target |
| GET /files/:id | Authenticated attachment download | All |
| GET /workspace | meetingId?, incidentId?, feedbackId? → aggregate for existing FE | All |

Scope is `{machine,station,product}`. Source segments are `{id,startSeconds,speaker,text,kind}`,
kind is root/dissent/decision/action/context. Missing assignee, deadline and setpoint remain null.
Client never supplies approver identity or approval status. Approved records cannot be edited.
Approval uses a database transaction and locks; stale drafts return 409.
Knowledge list/retrieval hides drafts, superseded versions, revoked and expired guidance.
Feedback records the version actually used, including a superseded version.

POST operations are **unsafe to retry automatically**. Approval retries return 409 when already
published. The FE disables submissions while pending and never automatically retries writes.
There is no automatic PLC control, outbound email, STT or LLM in sample report mode.
Reset in the FE starts a new view and retains server history.
