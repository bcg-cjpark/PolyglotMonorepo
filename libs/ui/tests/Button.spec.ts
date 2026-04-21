import { test, expect } from '@playwright/test';

/**
 * Button 회귀 검증 (ui-composer 정리 후).
 *
 * 이번 변경 포인트:
 *  - `Button.scss` : `button:disabled` → `button.btn:disabled` 로 셀렉터 스코프 축소.
 *    의도 = 다른 native <button disabled> 에 leak 되지 않도록.
 *    실제 Button.tsx 는 `btn-disabled` 클래스도 함께 붙이므로 disabled 시각은 동일해야 함.
 *  - 나머지 토큰/유틸 정리는 Button 자체에는 직접 영향 없음.
 */
test.describe('Button — disabled 렌더', () => {
  test('Disabled 스토리: 시각이 static 대비 변해야 한다 (회귀 없음)', async ({ page }) => {
    // primary (enabled) 기준 배경
    await page.goto('/iframe.html?id=components-button--primary&viewMode=story');
    const enabledBg = await page
      .getByRole('button', { name: 'Button' })
      .evaluate((el) => getComputedStyle(el).backgroundColor);

    // disabled 스토리
    await page.goto('/iframe.html?id=components-button--disabled&viewMode=story');
    const disabledBtn = page.getByRole('button', { name: 'Button' });
    const disabledBg = await disabledBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
    const disabledColor = await disabledBtn.evaluate((el) => getComputedStyle(el).color);

    // 1. disabled 시 배경/전경이 계산되어 있어야 함 (토큰 적용 확인)
    expect(disabledBg).not.toBe('');
    expect(disabledColor).not.toBe('');
    // 2. disabled 상태가 시각적으로 다른지 (같은 값이면 .btn-disabled 적용 실패 의심)
    expect(disabledBg).not.toBe(enabledBg);
    // 3. 네이티브 disabled 속성이 실제로 걸렸는지
    await expect(disabledBtn).toBeDisabled();
    // 4. .btn-disabled 클래스가 붙어 있는지 (셀렉터 변경 후에도 사용되는 훅)
    await expect(disabledBtn).toHaveClass(/btn-disabled/);
  });

  test('disabled 버튼은 클릭이 동작하지 않는다', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button--disabled&viewMode=story');
    const btn = page.getByRole('button', { name: 'Button' });
    await btn.click({ force: true }).catch(() => {});
    // disabled 시 onClick 이 호출되면 storybook actions 패널에 'clicked' 가 떠야 하지만
    // iframe 밖이라 접근 불가 → 최소 aria-disabled 와 native disabled 확인.
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveAttribute('aria-disabled', 'true');
  });
});

test.describe('Button — variant 컬러 토큰', () => {
  test('primary 버튼 배경이 토큰 기반으로 렌더된다', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button--primary&viewMode=story');
    const btn = page.getByRole('button', { name: 'Button' });
    const bg = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
    // transparent 면 cascade 깨진 것 (preflight 이 덮어씀)
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(bg).not.toBe('transparent');
    // color 포맷 rgb/rgba 으로 계산되어 있어야 함
    expect(bg).toMatch(/^rgb/);
  });

  test('danger(red) 버튼은 primary 와 배경색이 달라야 한다', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button--primary&viewMode=story');
    const primaryBg = await page
      .getByRole('button', { name: 'Button' })
      .evaluate((el) => getComputedStyle(el).backgroundColor);

    await page.goto('/iframe.html?id=components-button--danger&viewMode=story');
    const dangerBg = await page
      .getByRole('button', { name: 'Delete' })
      .evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(dangerBg).not.toBe(primaryBg);
    expect(dangerBg).toMatch(/^rgb/);
  });
});
