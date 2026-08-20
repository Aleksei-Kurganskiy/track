const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: process.env.TRACK_URL || "https://aleksei-kurganskiy.github.io/track/",
    browserName: "chromium",
    headless: true,
  },
});
