import { test, expect } from '@playwright/test';

/**
 * Modal async onConfirm 회귀 검증 (ui-composer 변경점).
 *
 * 변경 포인트 (`libs/ui/src/components/Modal/Modal.tsx`):
 *  - `handleConfirm` 이 `await onConfirm?.()` 로 비동기 Promise 를 대기한 뒤
 *    성공 시에만 `handleClose()` 호출. reject/throw 시 catch 에서 early return
 *    → 모달이 닫히지 않아 사용자 재시도 가능.
 *
 * 검증 전략:
 *  - Headless UI `<Dialog>` 기반. Panel className = `.modal-container`.
 *  - 확인 버튼 = footer 기본 렌더의 첫 Button (label='저장' or '확인').
 *  - resolve 케이스: 클릭 직후 짧은 타임아웃으로 모달 잔존 확인 → 충분히 대기 후 close.
 *  - reject 케이스: 충분히 대기 후에도 모달 잔존.
 *
 * DOM 주의사항:
 *  - Headless UI 는 close 시 DOM 에서 완전히 제거 (unmount) 하므로
 *    `toHaveCount(0)` 이 안정적. `toBeHidden` 은 close 트랜지션 중간 상태에서
 *    false positive 가 날 수 있음.
 */

const MODAL = '.modal-container';

test.describe('Modal — async onConfirm resolve', () => {
  test('Promise resolve 전에는 모달이 유지되다가 resolve 후 자동 close 된다', async ({
    page,
  }) => {
    await page.goto(
      '/iframe.html?id=components-modal--async-confirm&viewMode=story'
    );

    // 1. 초기 렌더: 모달이 열려 있어야 함 (스토리 기본 open=true)
    const modal = page.locator(MODAL);
    await expect(modal).toBeVisible();

    // 2. 확인(저장) 버튼 클릭
    //    AsyncConfirm 스토리는 confirmText='저장' 으로 설정됨.
    const confirmBtn = page.getByRole('button', { name: '저장' });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 3. 즉시 체크: onConfirm 이 1.5초 delay 이므로 짧은 타임아웃 내에는 모달이 잔존.
    //    → await 가 제대로 걸렸다면 200ms 이내엔 닫히지 않음. (동기 close 회귀 감지)
    await expect(modal).toBeVisible({ timeout: 200 });

    // 4. 충분한 대기 후 close 검증: 1.5s resolve + 버퍼 = 2.5s 타임아웃으로 detach 대기
    await expect(modal).toHaveCount(0, { timeout: 2_500 });
  });
});

test.describe('Modal — async onConfirm reject', () => {
  test('Promise reject 시 모달이 닫히지 않고 유지된다', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-modal--async-confirm-reject&viewMode=story'
    );

    const modal = page.locator(MODAL);
    await expect(modal).toBeVisible();

    // AsyncConfirmReject 도 confirmText='저장'
    const confirmBtn = page.getByRole('button', { name: '저장' });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // reject 는 0.5초 후 발생. 1.5s 대기하여 reject 처리 + 혹시나 있을
    // 잘못된 close 타이밍까지 여유 확보.
    await page.waitForTimeout(1_500);

    // 핵심 검증: reject 이후에도 모달 panel 이 여전히 DOM 에 남아있다.
    await expect(modal).toHaveCount(1);
    await expect(modal).toBeVisible();
  });

  test('reject 후 스토리 내부 에러 메시지("저장 실패") 가 렌더된다', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-modal--async-confirm-reject&viewMode=story'
    );

    // 초기에는 에러 문구 없음
    await expect(page.getByText('저장 실패')).toHaveCount(0);

    const confirmBtn = page.getByRole('button', { name: '저장' });
    await confirmBtn.click();

    // reject 이후 setErr('저장 실패') 가 state 반영되어 <p> 로 표시됨.
    // 0.5s delay + render → 2s 여유로 대기.
    await expect(page.getByText('저장 실패')).toBeVisible({ timeout: 2_000 });

    // 모달은 여전히 유지 (재확인)
    await expect(page.locator(MODAL)).toBeVisible();
  });
});
