import { expect, test } from "@playwright/test";

test("seeded dev auth lets an admin create a task and upload evidence", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Alex Admin" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Alex Admin")).toBeVisible();

  await page.getByRole("link", { name: "Tasks" }).click();
  await page.getByLabel("Title").fill("Collect signed bridge letter");
  await page.getByLabel("Owner").fill("Security");
  await page.getByLabel("Description").fill("Needed for customer diligence follow-up.");
  await page.getByLabel("Due date").fill("2026-04-02");
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText("Collect signed bridge letter")).toBeVisible();

  await page.getByRole("link", { name: "Evidence" }).click();
  await page.getByLabel("Title").fill("Bridge letter PDF");
  await page.getByLabel("Owner").fill("Security");
  await page.getByLabel("Mapped control").selectOption("control_vendor");
  await page.getByLabel("Description").fill("Uploaded through Playwright as a smoke test.");
  await page.getByLabel("File upload").setInputFiles({
    name: "bridge-letter.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("bridge-letter")
  });
  await page.getByRole("button", { name: "Save evidence" }).click();
  await expect(page.getByText("Bridge letter PDF")).toBeVisible();
});
