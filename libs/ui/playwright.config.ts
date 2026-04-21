import { defineConfig, devices } from '@playwright/test';

/**
 * libs/ui 전용 Playwright 설정.
 *
 * 동작:
 *  - Storybook dev 서버 (6006) 를 기동한 채로 iframe.html?id=... URL 에 접근해
 *    각 스토리를 격리 렌더로 띄우고, 실제 DOM/computed style 을 검증.
 *  - `reuseExistingServer: true` → 개발자가 이미 Storybook 을 띄워둔 상태면 재사용.
 *
 * 앱 레벨 e2e (`apps/example-web/tests/e2e`) 와는 완전 분리.
 *
 * 실행:
 *   pnpm exec playwright test --config=libs/ui/playwright.config.ts
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:6006',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm --filter @monorepo/ui storybook --ci',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
