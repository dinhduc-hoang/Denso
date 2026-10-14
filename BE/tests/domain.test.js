import test from "node:test";
import assert from "node:assert/strict";
import { generateSampleReport, verifySources } from "../src/services/reports.js";
import { sampleMeeting } from "../src/tools/sample.js";
import { reportApproval, meeting, incident, login } from "../src/utils/schemas.js";
import { hashPassword, verifyPassword } from "../src/utils/crypto.js";

test("sample report preserves dissent, valid sources, unknown values and pending tasks", () => {
  const result = generateSampleReport({ id: "DR-024", ...sampleMeeting });
  verifySources(result, sampleMeeting.segments);
  assert.equal(result.actionItems[1].assignee, null);
  assert.equal(result.actionItems[1].deadline, null);
  assert.equal(result.decisions[0].setpoint, null);
  assert.equal(result.issues[0].confirmed, false);
  assert.equal(result.actionItems[0].status, "pending");
  assert.match(result.risks[0].text, /chưa được tiếp tục/);
  result.decisions[0].source.segmentId = "invented";
  assert.throws(() => verifySources(result, sampleMeeting.segments));
});
test("sample mode cannot silently substitute sample content for arbitrary input", () => {
  assert.throws(() => generateSampleReport({ ...sampleMeeting, segments: [] }));
});
test("boundaries reject forged approver, incomplete scope, duplicate source IDs and half-linked incidents", () => {
  assert.equal(
    reportApproval.safeParse({
      confirmed: true,
      ack: true,
      revision: 1,
      approvedBy: "fake",
    }).success,
    false,
  );
  assert.equal(
    reportApproval.safeParse({ confirmed: false, ack: true, revision: 1 })
      .success,
    false,
  );
  assert.equal(
    meeting.safeParse({
      ...sampleMeeting,
      segments: [sampleMeeting.segments[0], sampleMeeting.segments[0]],
    }).success,
    false,
  );
  assert.equal(
    incident.safeParse({
      query: "error",
      scope: sampleMeeting.scope,
      feedback: "test",
      reason: "unknown",
      knowledgeId: "KB-01",
    }).success,
    false,
  );
  assert.equal(login.safeParse({ email: "bad", password: "x" }).success, false);
});
test("passwords are salted and wrong passwords fail", async () => {
  const hash = await hashPassword("secret12345");
  assert.notEqual(hash, await hashPassword("secret12345"));
  assert.equal(await verifyPassword("secret12345", hash), true);
  assert.equal(await verifyPassword("incorrect", hash), false);
});
