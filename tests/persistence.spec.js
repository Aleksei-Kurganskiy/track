const { test, expect } = require("@playwright/test");
const { signIn } = require("./helpers");

test("tasks persist after reload and stay private to the signed-in user", async ({ page }) => {
  const title = `E2E persistence ${Date.now()}`;
  const dialogs = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });

  await signIn(page, "user1");
  await page.locator("#open-create-button").click();
  await page.locator("#task-title").fill(title);
  await page.locator("#task-deadline").fill("2026-12-31");
  await page.locator("#create-form button[type=submit]").click();
  expect(dialogs).toEqual([]);
  await expect(page.getByText(title)).toBeVisible();

  await page.reload();
  await expect(page.getByText(title)).toBeVisible();

  await page.locator("#logout-button").click();
  await expect(page.locator("#auth-screen")).toBeVisible();
  await signIn(page, "user2");
  await expect(page.getByText(title)).toHaveCount(0);

  await page.locator("#logout-button").click();
  await signIn(page, "user1");
  const taskRow = page.locator(".row").filter({ hasText: title });
  await expect(taskRow).toBeVisible();
  await taskRow.locator('[data-action="delete"]').click();
  await expect(taskRow).toHaveCount(0);
});
