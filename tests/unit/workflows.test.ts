import { buildSeedStore } from "@/data/seed";
import { runWorkflowTemplate } from "@/lib/workflows";

describe("workflow templates", () => {
  test("quarterly access review workflow creates a single open workflow task and records a run", () => {
    const first = runWorkflowTemplate(buildSeedStore(), "quarterly_access_review", "Alex Admin");
    const second = runWorkflowTemplate(first.store, "quarterly_access_review", "Alex Admin");

    expect(first.ok).toBe(true);
    expect(first.store.tasks.some((task) => task.sourceId === "workflow_quarterly_access_review")).toBe(true);
    expect(first.store.workflowRuns[0]?.templateId).toBe("quarterly_access_review");
    expect(second.store.tasks.filter((task) => task.sourceId === "workflow_quarterly_access_review")).toHaveLength(1);
  });

  test("policy sweep and monitoring cycle both persist workflow history", () => {
    const policySweep = runWorkflowTemplate(buildSeedStore(), "policy_review_sweep", "Alex Admin");
    const monitoring = runWorkflowTemplate(policySweep.store, "control_monitoring_cycle", "Alex Admin");

    expect(policySweep.store.workflowRuns[0]?.templateId).toBe("policy_review_sweep");
    expect(monitoring.store.workflowRuns[0]?.templateId).toBe("control_monitoring_cycle");
    expect(monitoring.store.checkRuns.length).toBeGreaterThan(0);
  });
});
