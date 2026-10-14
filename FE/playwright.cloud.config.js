import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e-backend",
  workers: 1,
  timeout: 45000,
  reporter: "list",
  outputDir: "test-results/cloud",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:3001",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
});
