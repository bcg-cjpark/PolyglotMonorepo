import { test, expect, Page, Locator } from "@playwright/test";

/**
 * Memo CRUD 플로우 e2e 검증.
 *
 * 전제조건:
 *  - 백엔드(example-api) 가 http://localhost:8080 에 기동 중
 *    `pnpm nx run example-api:serve` (local 프로필, H2 in-memory DB)
 *  - Vite dev 서버는 playwright.config.ts 의 webServer 가 자동 기동
 *
 * 검증 시나리오:
 *  1. /memos 목록 화면 로드 (heading + "+ 새 메모" 버튼)
 *  2. "+ 새 메모" → 생성 모달 → 제목/본문 입력 → 저장 → 리스트 맨 위에 반영
 *  3. 카드 클릭 → 상세 모달 제목/본문 표시 → 닫기
 *  4. 상세 → 편집 → 폼 프리필 → 수정 후 저장 → 목록 반영
 *  5. 상세 → 삭제 → 확인 다이얼로그 → "삭제" 확인 → 목록에서 사라짐
 *  6. 페이지네이션: 총 개수가 20 이하일 때 이전/다음 UI 비노출 확인
 *  7. 한글 IME: `pressSequentially` 로 제목/본문 입력 후 최종 값 손실 없음
 *  8. 유효성: 제목 공백만이면 저장 누르려 해도 서버에 생성되지 않음 (목록 변화 없음)
 *
 * 선택자 전략:
 *  - placeholder / role="button" name 텍스트로 식별 (한국어 그대로).
 *  - 카드는 <button> 래퍼 — <h3> 로 title 찾아 상위 button 접근.
 *  - "+ 새 메모" 를 eq=0 으로 가정하지 않고 role+name regex.
 */

// ---- helpers ----

async function gotoList(page: Page) {
  await page.goto("/memos");
  await expect(page.getByRole("heading", { name: "Memos" })).toBeVisible();
  // 초기 로딩 텍스트가 사라질 때까지 대기
  await expect(page.getByText(/^Loading/)).toHaveCount(0, { timeout: 5_000 });
}

/**
 * 해당 title 텍스트를 가진 MemoCard(button) 로케이터.
 */
function cardByTitle(page: Page, title: string): Locator {
  // MemoCard 는 <button>…<h3>title</h3>…</button> 구조
  return page
    .locator("button")
    .filter({ has: page.locator("h3", { hasText: title }) });
}

/**
 * 현재 열린 모달 DialogPanel 로케이터. (Headless UI Dialog)
 */
function openModal(page: Page): Locator {
  return page.locator(".modal-container");
}

/**
 * 생성 모달을 열어 제목/본문 입력 후 저장.
 * `useKeyboard=true` 이면 pressSequentially 로 실제 키 입력(IME 호환),
 * 아니면 fill 로 빠르게 주입.
 */
async function createMemo(
  page: Page,
  title: string,
  content: string,
  { useKeyboard = false }: { useKeyboard?: boolean } = {},
) {
  await page.getByRole("button", { name: /\+ 새 메모/ }).click();

  const modal = openModal(page);
  await expect(modal.getByRole("heading", { name: "새 메모" })).toBeVisible();

  const titleInput = modal.getByPlaceholder("메모 제목");
  const contentInput = modal.getByPlaceholder("본문을 입력하세요 (선택)");

  if (useKeyboard) {
    await titleInput.click();
    await titleInput.pressSequentially(title, { delay: 50 });
    if (content) {
      await contentInput.click();
      await contentInput.pressSequentially(content, { delay: 50 });
    }
  } else {
    await titleInput.fill(title);
    if (content) await contentInput.fill(content);
  }

  await modal.getByRole("button", { name: /^저장$/ }).click();

  // 모달 닫힘 대기
  await expect(openModal(page)).toHaveCount(0, { timeout: 10_000 });
}

/**
 * 리스트에서 해당 title 카드를 찾아 상세 모달 열기.
 */
async function openDetailFor(page: Page, title: string) {
  await cardByTitle(page, title).click();
  const modal = openModal(page);
  await expect(modal).toBeVisible();
  // 상세 모달 제목이 heading 으로 렌더됨
  await expect(modal.getByRole("heading", { name: title })).toBeVisible();
  return modal;
}

// ---- tests ----

test("1. memo list page loads with heading and new-memo button", async ({
  page,
}) => {
  await gotoList(page);
  await expect(page.getByRole("heading", { name: "Memos" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /\+ 새 메모/ }),
  ).toBeVisible();
});

test("2. create memo: dialog opens, submits, appears at top of list", async ({
  page,
}) => {
  const unique = `E2E memo ${Date.now()}`;
  const body = "first line\nsecond line";

  await gotoList(page);
  await createMemo(page, unique, body);

  // 리스트에 반영됐는지 (신규 = createdAt DESC 최상단)
  const card = cardByTitle(page, unique);
  await expect(card).toBeVisible({ timeout: 10_000 });
  // 본문 미리보기 일부 텍스트 확인 (line-clamp 때문에 전체 매칭은 피함)
  await expect(card).toContainText("first line");

  // "+ 새 메모" 는 리스트 우상단, 첫 카드는 그 아래 → DOM 순서상 card 는
  // 모든 MemoCard 중 첫 번째여야 함.
  const firstCard = page.locator("div.flex-col > button").first();
  await expect(firstCard).toContainText(unique);
});

test("3. detail view: click card → modal shows title + body → close", async ({
  page,
}) => {
  const unique = `Detail target ${Date.now()}`;
  const body = "상세 본문 테스트입니다.";

  await gotoList(page);
  await createMemo(page, unique, body);

  const modal = await openDetailFor(page, unique);
  await expect(modal).toContainText(body);
  await expect(modal).toContainText(/생성:/);

  // 헤더 X (닫기) 버튼 — IconButton 으로 렌더됨. aria-label 이 없다면 위치 기반.
  // Modal 헤더의 close 는 .modal-close-button 클래스.
  await modal.locator(".modal-close-button").click();
  await expect(openModal(page)).toHaveCount(0, { timeout: 5_000 });
});

test("4. edit: detail → 편집 → prefilled form → 수정 후 저장 → 목록 반영", async ({
  page,
}) => {
  const original = `ToEdit ${Date.now()}`;
  const originalBody = "원본 본문";
  const updatedTitleSuffix = " UPDATED";
  const updatedBody = "수정된 본문입니다";

  await gotoList(page);
  await createMemo(page, original, originalBody);

  const detail = await openDetailFor(page, original);
  await detail.getByRole("button", { name: /^편집$/ }).click();

  // 편집 모달로 전환 — 헤더 "메모 편집"
  const form = openModal(page);
  await expect(form.getByRole("heading", { name: "메모 편집" })).toBeVisible();

  // 프리필 확인
  const titleInput = form.getByPlaceholder("메모 제목");
  const contentInput = form.getByPlaceholder("본문을 입력하세요 (선택)");
  await expect(titleInput).toHaveValue(original);
  await expect(contentInput).toHaveValue(originalBody);

  // 제목 뒤에 suffix 추가 — 커서를 끝으로 이동 후 pressSequentially
  await titleInput.click();
  await page.keyboard.press("End");
  await titleInput.pressSequentially(updatedTitleSuffix, { delay: 40 });
  await expect(titleInput).toHaveValue(original + updatedTitleSuffix);

  // 본문은 fill 로 덮어쓰기
  await contentInput.fill(updatedBody);

  await form.getByRole("button", { name: /^저장$/ }).click();
  await expect(openModal(page)).toHaveCount(0, { timeout: 10_000 });

  // 목록에서 수정된 제목 카드가 보이고, 본문 미리보기도 반영
  const updatedCard = cardByTitle(page, original + updatedTitleSuffix);
  await expect(updatedCard).toBeVisible({ timeout: 10_000 });
  await expect(updatedCard).toContainText(updatedBody);
});

test("5. delete: detail → 삭제 → confirm → 목록에서 사라짐", async ({
  page,
}) => {
  const unique = `ToDelete ${Date.now()}`;

  await gotoList(page);
  await createMemo(page, unique, "삭제될 메모");

  await openDetailFor(page, unique);

  // 상세 모달의 삭제 버튼. 같은 "삭제" 레이블의 confirm 버튼은 아직 없음.
  await page.getByRole("button", { name: /^삭제$/ }).click();

  // 확인 모달로 전환 (상세 모달은 닫힘, confirm 모달 1개만 오픈)
  const confirmModal = openModal(page);
  await expect(
    confirmModal.getByRole("heading", { name: "메모 삭제" }),
  ).toBeVisible();
  await expect(
    confirmModal.getByText(/삭제 후 복구할 수 없습니다/),
  ).toBeVisible();

  // 확인 다이얼로그의 "삭제" 버튼 = confirmText
  await confirmModal.getByRole("button", { name: /^삭제$/ }).click();
  await expect(openModal(page)).toHaveCount(0, { timeout: 10_000 });

  // 리스트에서 사라짐
  await expect(cardByTitle(page, unique)).toHaveCount(0, { timeout: 10_000 });
});

test("6. pagination: 총 메모 수가 20 이하면 페이지 UI 비노출", async ({
  page,
}) => {
  await gotoList(page);

  // 현재 DB 상 개수를 확인 — 카드 수 조회
  const cardCount = await page
    .locator("div.flex.flex-col.gap-3 > button")
    .count();

  if (cardCount <= 20) {
    // 페이지네이션 컨테이너가 나타나지 않아야 함
    await expect(page.getByRole("button", { name: "이전" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "다음" })).toHaveCount(0);
  } else {
    // 총이 20 초과일 때만 노출 — 기본 페이지에서 "이전" disabled, "다음" enabled 확인
    await expect(page.getByRole("button", { name: "이전" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "다음" })).toBeEnabled();
  }
});

test("7. Korean IME input via pressSequentially keeps final value intact", async ({
  page,
}) => {
  const hangulTitle = `한글제목 ${Date.now()}`;
  const hangulBody = "한글 본문 테스트입니다";

  await gotoList(page);

  // fill 대신 pressSequentially — 실제 key 이벤트로 IME composition path 검증
  await createMemo(page, hangulTitle, hangulBody, { useKeyboard: true });

  // 리스트에 한글 제목 카드가 그대로 보이는지
  const card = cardByTitle(page, hangulTitle);
  await expect(card).toBeVisible({ timeout: 10_000 });
  await expect(card).toContainText(hangulBody);

  // 상세 모달 열어서 본문까지 완전한지 확인 (조합 중간 음절 손실 없음)
  const detail = await openDetailFor(page, hangulTitle);
  await expect(detail).toContainText(hangulBody);
});

test("8. validation: whitespace-only title does not create a memo", async ({
  page,
}) => {
  await gotoList(page);

  // 현재 카드 개수 스냅샷
  const beforeCount = await page
    .locator("div.flex.flex-col.gap-3 > button")
    .count();

  await page.getByRole("button", { name: /\+ 새 메모/ }).click();
  const form = openModal(page);
  await expect(form.getByRole("heading", { name: "새 메모" })).toBeVisible();

  // 공백만 입력 (Input 의 allowSpaces=true 여서 공백이 DOM 에 반영됨)
  const titleInput = form.getByPlaceholder("메모 제목");
  await titleInput.click();
  await page.keyboard.type("   ", { delay: 20 });

  // 저장 버튼 누름 — MemoFormDialog 는 invalid 상태에서 onConfirm={() => undefined}
  // 를 넘겨 서버 호출을 막는다. Modal.handleConfirm 이 onClose 를 타므로 모달은 닫힌다.
  await form.getByRole("button", { name: /^저장$/ }).click();

  // 모달이 닫혔거나 닫히지 않았거나 — 어느 쪽이든 서버에 생성은 없어야 한다.
  // 리스트 카드 수가 증가하지 않았는지 확인.
  // 다시 한 번 목록을 새로고침해 서버 상태와 동기화.
  await page.goto("/memos");
  await expect(page.getByRole("heading", { name: "Memos" })).toBeVisible();

  const afterCount = await page
    .locator("div.flex.flex-col.gap-3 > button")
    .count();

  expect(afterCount).toBe(beforeCount);
});
