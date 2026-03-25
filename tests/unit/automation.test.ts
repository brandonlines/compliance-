import { buildSeedStore } from "@/data/seed";
import { ingestAutomationPayload } from "@/lib/automation";

describe("automation ingestion", () => {
  test("accepts valid check payloads and records automation runs", () => {
    const result = ingestAutomationPayload(buildSeedStore(), {
      type: "check.report",
      checkId: "gha_branch_protection",
      title: "Branch protection policy check",
      status: "fail",
      summary: "One repository is missing branch protection.",
      severity: "high",
      controlIds: ["control_change"],
      sourceName: "GitHub Actions"
    });

    expect(result.ok).toBe(true);
    expect(result.store.checkRuns[0]?.source).toBe("automation");
    expect(result.store.automation.events[0]?.status).toBe("accepted");
    expect(result.store.tasks.some((task) => task.sourceId === "gha_branch_protection")).toBe(true);
  });

  test("rejects payloads with unknown controls", () => {
    const result = ingestAutomationPayload(buildSeedStore(), {
      type: "evidence.create",
      title: "Broken payload",
      owner: "Security",
      controlId: "control_missing"
    });

    expect(result.ok).toBe(false);
    expect(result.summary).toContain("Unknown controlId");
    expect(result.store.automation.events[0]?.status).toBe("rejected");
  });
});
