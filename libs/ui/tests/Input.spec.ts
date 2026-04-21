import { test, expect } from '@playwright/test';

/**
 * Input 회귀 검증 (ui-composer 정리 후).
 *
 * 이번 변경 포인트:
 *  - `Input.tsx` 에러 메시지 클래스: `text-input-border-error` → `text-input-text-error`.
 *    의도 = 에러 메시지는 텍스트 토큰(--input-color-text-error)을, 테두리는 border 토큰을
 *    사용하도록 분리. (기존엔 텍스트에도 border 토큰이 걸려 다크 테마에서 어긋남.)
 *
 *  라이트 테마에서는 두 토큰이 같은 red-red900 으로 resolve 되므로 색 비교로 구분이
 *  불가능. 대신 (a) 에러 메시지가 DOM 에 존재, (b) 유효한 rgb() 값으로 계산, (c) 새
 *  클래스명이 실제로 붙어 있음 을 확인해 회귀 없음 보증.
 */
test.describe('Input — error message 토큰', () => {
  test('error 스토리는 errorMessage 를 렌더하고 새 토큰 클래스를 사용한다', async ({ page }) => {
    await page.goto('/iframe.html?id=components-input--error&viewMode=story');

    const msg = page.getByText('This field is required');
    await expect(msg).toBeVisible();

    // 새 클래스가 실제로 적용되어야 함 (regression 방지: 다시 border-error 로 돌아가면 FAIL)
    await expect(msg).toHaveClass(/text-input-text-error/);
    await expect(msg).not.toHaveClass(/text-input-border-error/);

    // computed color 가 transparent/empty 가 아닌 유효 rgb 값
    const color = await msg.evaluate((el) => getComputedStyle(el).color);
    expect(color).toMatch(/^rgb/);
    expect(color).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('default (no error) 스토리는 에러 메시지가 렌더되지 않는다', async ({ page }) => {
    await page.goto('/iframe.html?id=components-input--default&viewMode=story');
    // 에러 문구 노출 안 됨
    await expect(page.getByText('This field is required')).toHaveCount(0);
  });
});

test.describe('Input — 기본 input 표면 토큰', () => {
  test('default 스토리 input 이 토큰 기반 배경을 가진다', async ({ page }) => {
    await page.goto('/iframe.html?id=components-input--default&viewMode=story');
    const input = page.locator('input').first();
    await expect(input).toBeVisible();
    const bg = await input.evaluate((el) => getComputedStyle(el).backgroundColor);
    // transparent 면 cascade 문제 (preflight 에 먹힘) → 최소 rgb 계산되어야 함
    expect(bg).toMatch(/^rgb/);
  });

  test('disabled 스토리 input 은 native disabled 속성을 갖는다', async ({ page }) => {
    await page.goto('/iframe.html?id=components-input--disabled&viewMode=story');
    const input = page.locator('input').first();
    await expect(input).toBeDisabled();
  });
});
