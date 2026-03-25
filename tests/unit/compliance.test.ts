import { buildSeedStore } from "@/data/seed";
import { CHECK_LIBRARY, getDashboardMetrics, runAllChecks } from "@/lib/compliance";

describe("compliance engine", () => {
  test("runAllChecks records one fresh result per check and updates integration sync times", () => {
    const seeded = buildSeedStore();
    const result = runAllChecks(seeded);

    expect(result.checkRuns).toHaveLength(CHECK_LIBRARY.length);
    expect(result.checkRuns.every((run) => run.source === "internal")).toBe(true);
    expect(result.integrations.every((integration) => !integration.connected || integration.lastSync)).toBe(true);
  });

  test("failing checks create remediation tasks that show up in dashboard metrics", () => {
    const result = runAllChecks(buildSeedStore());
    const metrics = getDashboardMetrics(result);

    expect(result.tasks.some((task) => task.sourceType === "check")).toBe(true);
    expect(metrics.openTasks).toBeGreaterThanOrEqual(1);
    expect(metrics.passRate).toBeLessThan(100);
  });
});
