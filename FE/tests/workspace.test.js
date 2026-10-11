import { describe, it, expect } from "vitest";
import { projectWorkspace } from "../src/lib/workspace";

describe("server workspace projection", () => {
  it("keeps pending field notes out of approved state while preserving the actual tried version", () => {
    const state = projectWorkspace({
      report: { status: "approved", revision: 3, decision: "SOP" },
      knowledge: { document: { fieldNote: { action: "Published note" } } },
      incident: {
        knowledgeId: "KB-1",
        version: 1,
        query: "error",
        feedback: "Not effective",
      },
      note: { status: "draft", cause: "New cause", action: "Unapproved note" },
    });
    expect(state).toMatchObject({
      approved: true,
      noteDraft: true,
      noteApproved: false,
      found: true,
      note: "Unapproved note",
    });
  });
  it("restores effective feedback and permits new guidance from an unknown incident", () => {
    expect(projectWorkspace({ feedback: { result: "effective" } }).closed).toBe(
      true,
    );
    expect(
      projectWorkspace({
        knowledge: { document: { decision: "New field guidance" } },
      }),
    ).toMatchObject({ approved: true, decision: "New field guidance" });
  });
});
