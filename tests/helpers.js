const { expect } = require("@playwright/test");

const password = process.env.TRACK_E2E_PASSWORD;
const siteUrl = process.env.TRACK_URL || "https://aleksei-kurganskiy.github.io/track/";

if (!password) {
  throw new Error("Set TRACK_E2E_PASSWORD before running E2E tests.");
}

async function signIn(page, user) {
  await page.goto(siteUrl);
  await page.locator("#auth-user").fill(user);
  await page.locator("#auth-pass").fill(password);
  await page.locator("#auth-button").click();
  await expect(page.locator("#auth-screen")).toBeHidden();
}

async function createTask(page, title, options) {
  await page.locator("#open-create-button").click();
  await page.locator("#task-title").fill(title);

  if (options && options.type === "background") {
    await page.locator('[data-task-type="background"]').click();
  }

  if (options && options.scheduleMode === "plan") {
    await page.locator('[data-schedule-mode="plan"]').click();
    await page.locator("#task-plan-amount").fill(String(options.amount));
    await page.locator("#task-plan-unit").selectOption(options.unit || "minutes");
  } else if (!options || options.type !== "background") {
    await page.locator("#task-deadline").fill((options && options.deadline) || "2026-12-31");
  }

  if (options && options.description) {
    await page.locator("#task-description").fill(options.description);
  }

  if (options && options.notes) {
    await page.locator("#task-notes").fill(options.notes);
  }

  await page.locator("#create-form button[type=submit]").click();
  await expect(page.getByText(title)).toBeVisible();
}

async function submitReason(page, reason) {
  await expect(page.locator("#reason-overlay")).toHaveClass(/is-open/);
  await page.locator("#reason-input").fill(reason);
  await page.locator("#reason-form button[type=submit]").click();
}

async function clearE2ETasks(page) {
  await page.evaluate(async () => {
    if (!document.body.classList.contains("authenticated")) return;
    state.tasks = state.tasks.filter((task) => !task.title.startsWith("E2E "));
    await saveUserTasks(state.tasks);
    render();
  });
}

module.exports = { clearE2ETasks, createTask, password, signIn, submitReason };
