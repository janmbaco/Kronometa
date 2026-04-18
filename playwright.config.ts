import { defineConfig, devices } from "@playwright/test";

const devServerURL = "http://127.0.0.1:5173";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? devServerURL;
const skipWebServer = process.env.SKIP_WEBSERVER === "1";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  timeout: 20_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: skipWebServer
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort",
        url: devServerURL,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
  projects: [
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
