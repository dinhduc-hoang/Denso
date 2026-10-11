import { freshState } from "./demo";

export function projectWorkspace(data) {
  const state = freshState();
  const { report, knowledge, incident, note, files = [], feedback } = data;
  return {
    ...state,
    processed: Boolean(report),
    approved: report?.status === "approved" || Boolean(knowledge),
    decision:
      report?.decision || knowledge?.document.decision || state.decision,
    reportRevision: report?.revision || 1,
    revisionRequested: report?.status === "revision_requested",
    incident: Boolean(incident),
    feedback: incident?.feedback || feedback?.comment || "",
    query: incident?.query || state.query,
    closed: !incident && feedback?.result === "effective",
    searched: Boolean(incident?.knowledgeId || feedback),
    found: Boolean(
      (incident?.knowledgeId && incident?.version) || feedback?.version,
    ),
    cause: note?.cause || knowledge?.document.fieldNote?.cause || "",
    note: note?.action || knowledge?.document.fieldNote?.action || "",
    noteDraft: note?.status === "draft" || note?.status === "approved",
    noteApproved: note
      ? note.status === "approved"
      : Boolean(knowledge?.document.fieldNote),
    audio: files.find((file) => file.mimeType.startsWith("audio/"))?.name || "",
    attachment:
      files.find((file) => !file.mimeType.startsWith("audio/"))?.name || "",
  };
}
