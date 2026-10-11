import test from "node:test";
import assert from "node:assert/strict";
import { buildSeedData, seedUsers } from "../src/seed-data.js";
import { verifySources } from "../src/reports.js";
import { seedAsset } from "../src/seed-assets.js";
import { detectType } from "../src/files.js";

test("complete seed covers workflow states with valid sources and version links", () => {
  const data = buildSeedData(new Date("2026-10-11T08:00:00Z"));
  assert.equal(seedUsers.length, 8);
  assert.equal(data.meetings.length, 7);
  assert.equal(data.reports.length, 6);
  assert.equal(data.knowledge.length, 5);
  assert.equal(data.knowledge_versions.length, 6);
  assert.equal(data.incidents.length, 6);
  assert.equal(data.notes.length, 4);
  assert.equal(data.files.length, 7);
  assert.equal(data.feedback.length, 4);
  for (const report of data.reports) {
    const meeting = data.meetings.find((row) => row.id === report.meeting_id);
    verifySources(report.document, meeting.segments);
    assert.equal(report.document.decisions[0].setpoint, null);
    assert.equal(report.document.actionItems[1].assignee, null);
  }
  assert.deepEqual(
    new Set(data.reports.map((row) => row.status)),
    new Set(["draft", "approved", "revision_requested"]),
  );
  assert.deepEqual(
    new Set(data.notes.map((row) => row.status)),
    new Set(["draft", "approved", "revision_requested"]),
  );
  for (const knowledge of data.knowledge)
    assert(
      data.knowledge_versions.some(
        (row) =>
          row.knowledge_id === knowledge.id &&
          row.version === knowledge.current_version,
      ),
    );
  for (const note of data.notes)
    for (const fileId of note.evidence_ids)
      assert(
        data.files.some(
          (file) => file.id === fileId && file.incident_id === note.incident_id,
        ),
      );
  for (const feedback of data.feedback) {
    const incident = data.incidents.find(
      (row) => row.id === feedback.incident_id,
    );
    assert.equal(incident.knowledge_id, feedback.knowledge_id);
    assert.equal(incident.knowledge_version, feedback.version);
  }
});

test("seed attachments contain valid downloadable PNG, PDF and WAV bytes", () => {
  for (const type of ["image/png", "application/pdf", "audio/wav"]) {
    const bytes = seedAsset(type);
    assert.equal(detectType(bytes), type);
    assert(bytes.length > 100);
  }
});
