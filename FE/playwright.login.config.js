import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e-login",
  workers: 1,
  timeout: 30000,
  reporter: "list",
  outputDir: "test-results/login",
  use: {
    baseURL: "http://127.0.0.1:4174",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4174 --strictPort",
    env: { VITE_DEMO_MODE: "false" },
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
    timeout: 15000,
  },
});
