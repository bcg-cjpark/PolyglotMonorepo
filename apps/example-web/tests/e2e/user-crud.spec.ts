import { test, expect } from "@playwright/test";

/**
 * User CRUD 플로우 e2e 검증.
 *
 * 전제조건:
 *  - 백엔드(example-api) 가 http://localhost:8080 에 기동 중
 *    `pnpm nx run example-api:serve` (local 프로필, H2 in-memory DB)
 *  - Vite dev 서버는 playwright.config.ts 의 webServer 가 자동 기동
 *
 * 목적:
 *  - UI 변경 후 "버튼이 동작하는가, 입력이 되는가" 같은 실제 브라우저 UX를 자동 검증
 *  - 이 플로우가 깨지면 ui-verifier 에이전트가 실패를 보고
 */

test("user list page loads", async ({ page }) => {
  await page.goto("/users");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  await expect(page.getByRole("button", { name: /New/i })).toBeVisible();
});

test("can navigate from list to new-user form", async ({ page }) => {
  await page.goto("/users");
  await page.getByRole("button", { name: /New/i }).click();
  await expect(page).toHaveURL(/\/users\/new$/);
  await expect(page.getByRole("heading", { name: "New User" })).toBeVisible();
});

test("can type into email and name inputs", async ({ page }) => {
  await page.goto("/users/new");

  const emailInput = page.getByLabel("Email");
  const nameInput = page.getByLabel("Name");

  await emailInput.fill("john@example.com");
  await expect(emailInput).toHaveValue("john@example.com");

  await nameInput.fill("John");
  await expect(nameInput).toHaveValue("John");
});

test("can create user and see it in the list", async ({ page }) => {
  const uniqueEmail = `e2e-${Date.now()}@example.com`;
  const uniqueName = `E2EUser${Date.now()}`;

  await page.goto("/users/new");
  await page.getByLabel("Email").fill(uniqueEmail);
  await page.getByLabel("Name").fill(uniqueName);
  await page.getByRole("button", { name: /Create/i }).click();

  await expect(page).toHaveURL(/\/users$/, { timeout: 10_000 });
  await expect(page.getByText(uniqueEmail)).toBeVisible();
  await expect(page.getByText(uniqueName)).toBeVisible();
});

test("cancel button returns to list without creating", async ({ page }) => {
  await page.goto("/users/new");
  await page.getByLabel("Name").fill("ShouldNotPersist");
  await page.getByRole("button", { name: /Cancel/i }).click();

  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByText("ShouldNotPersist")).not.toBeVisible();
});

/**
 * 아래 테스트들은 `page.keyboard.type()` / `pressSequentially()` 로 실제 키보드 이벤트를 시뮬레이션.
 * `fill()` 은 value 프로퍼티를 직접 설정해서 onKeyDown/onInput 같은 이벤트 핸들러를 일부 우회하므로,
 * 키보드 이벤트 기반 입력 제약(스페이스 차단, IME 처리 등)을 탐지하려면 이쪽 테스트가 필요.
 */
test("name field accepts spaces via real keyboard typing", async ({ page }) => {
  await page.goto("/users/new");
  const name = page.getByLabel("Name");
  await name.click();
  await page.keyboard.type("John Doe", { delay: 30 });
  await expect(name).toHaveValue("John Doe");
});

test("name field accepts Korean input", async ({ page }) => {
  await page.goto("/users/new");
  const name = page.getByLabel("Name");
  await name.click();
  // 한글 IME 없이 조합된 완성형 문자열 입력 시뮬레이션
  await name.pressSequentially("홍길동", { delay: 30 });
  await expect(name).toHaveValue("홍길동");
});

test("typed text is visually rendered (not invisible)", async ({ page }) => {
  await page.goto("/users/new");
  const name = page.getByLabel("Name");
  await name.click();
  await page.keyboard.type("Visible");

  const style = await name.evaluate((el) => {
    const s = getComputedStyle(el as HTMLElement);
    return {
      color: s.color,
      backgroundColor: s.backgroundColor,
      opacity: s.opacity,
      visibility: s.visibility,
    };
  });

  // 텍스트가 완전 투명이면 "타이핑은 되는데 안 보이는" 버그
  expect(style.color).not.toBe("rgba(0, 0, 0, 0)");
  // 흰 텍스트 + 흰 배경 조합이면 안 보임
  expect(style.color).not.toBe(style.backgroundColor);
  expect(style.visibility).toBe("visible");
  expect(parseFloat(style.opacity)).toBeGreaterThan(0);
});
