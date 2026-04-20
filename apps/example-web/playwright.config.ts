import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 설정.
 *
 * 기본 동작:
 *  - Vite dev 서버를 자동으로 기동 (`pnpm dev`), 포트 3000
 *  - Chromium 단일 브라우저로 테스트 (속도 우선)
 *  - 백엔드(8080)는 이미 켜져 있어야 함 — e2e 전에 `pnpm nx run example-api:serve` 기동
 *
 * CI나 다른 브라우저 추가 필요 시 projects 배열 확장.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
