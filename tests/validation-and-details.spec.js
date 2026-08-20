const { test, expect } = require("@playwright/test");
const { clearE2ETasks, createTask, signIn } = require("./helpers");

test.afterEach(async ({ page }) => {
  await clearE2ETasks(page);
});

test("login rejects invalid credentials", async ({ page }) => {
  await page.goto(process.env.TRACK_URL || "https://aleksei-kurganskiy.github.io/track/");
  await page.locator("#auth-user").fill("user4");
  await page.locator("#auth-pass").fill("wrong-password");
  await page.locator("#auth-button").click();
  await expect(page.locator("#auth-error")).toBeVisible();
  await expect(page.locator("#auth-screen")).toBeVisible();
});

test("task form validates deadline and plan amount", async ({ page }) => {
  const dialogs = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });

  await signIn(page, "user3");
  await page.locator("#open-create-button").click();
  await page.locator("#task-title").fill("E2E missing deadline");
  await page.locator("#create-form button[type=submit]").click();
  await expect.poll(() => dialogs.length).toBe(1);
  expect(dialogs[0]).toContain("Выбери дату срока");

  dialogs.length = 0;
  await page.locator('[data-schedule-mode="plan"]').click();
  await page.locator("#task-plan-amount").fill("0");
  await page.locator("#create-form").evaluate((form) => { form.noValidate = true; });
  await page.locator("#create-form button[type=submit]").click();
  await expect.poll(() => dialogs.length).toBe(1);
  expect(dialogs[0]).toContain("Укажи корректное количество");
});

test("details dialog displays a task description and notes", async ({ page }) => {
  const title = `E2E details ${Date.now()}`;

  await signIn(page, "user3");
  await createTask(page, title, {
    description: "E2E description",
    notes: "E2E notes",
  });

  const row = page.locator("#todo-list .row").filter({ hasText: title });
  await row.locator('[data-action="details"]').click();
  await expect(page.locator("#details-overlay")).toHaveClass(/is-open/);
  await expect(page.locator("#details-description")).toHaveText("E2E description");
  await expect(page.locator("#details-notes")).toHaveText("E2E notes");
});
