const { test, expect } = require("@playwright/test");
const { clearE2ETasks, createTask, signIn, submitReason } = require("./helpers");

test.afterEach(async ({ page }) => {
  await clearE2ETasks(page);
});

test("timed task completes the full lifecycle and persists", async ({ page }) => {
  const title = `E2E timed lifecycle ${Date.now()}`;

  await signIn(page, "user3");
  await createTask(page, title);

  let row = page.locator("#todo-list .row").filter({ hasText: title });
  await row.locator('[data-action="start"]').click();
  row = page.locator("#timed-list .row").filter({ hasText: title });
  await expect(row).toContainText("В работе");

  await row.locator('[data-action="pause"]').click();
  await submitReason(page, "E2E pause reason");
  await expect(row).toContainText("На паузе");

  await row.locator('[data-action="resume"]').click();
  await expect(row).toContainText("В работе");

  await row.locator('[data-action="complete"]').click();
  await submitReason(page, "E2E completion reason");
  row = page.locator("#done-list .row").filter({ hasText: title });
  await expect(row).toContainText("Завершена");

  await page.reload();
  await expect(page.locator("#done-list .row").filter({ hasText: title })).toBeVisible();
});

test("planned and background tasks appear in their correct sections", async ({ page }) => {
  const plannedTitle = `E2E planned ${Date.now()}`;
  const backgroundTitle = `E2E background ${Date.now()}`;

  await signIn(page, "user3");
  await createTask(page, plannedTitle, { scheduleMode: "plan", amount: 25, unit: "minutes" });
  await expect(page.locator("#todo-list .row").filter({ hasText: plannedTitle })).toContainText("План 25м");

  await createTask(page, backgroundTitle, { type: "background" });
  let backgroundRow = page.locator("#todo-list .row").filter({ hasText: backgroundTitle });
  await backgroundRow.locator('[data-action="start"]').click();
  backgroundRow = page.locator("#background-list .row").filter({ hasText: backgroundTitle });
  await expect(backgroundRow).toContainText("В работе");

  await page.reload();
  await expect(page.locator("#todo-list .row").filter({ hasText: plannedTitle })).toBeVisible();
  await expect(page.locator("#background-list .row").filter({ hasText: backgroundTitle })).toBeVisible();
});
