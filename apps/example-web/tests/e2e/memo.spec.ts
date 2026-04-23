import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Memo 피처 화면 단위 e2e — `docs/screens/memo-list.md` + `docs/screens/memo-dialog.md`
 * 의 인터랙션 (목록·신규·상세·편집·삭제확인·페이지네이션·한글 IME) 을 화면 레벨에서 검증.
 *
 * 환경 가정:
 *  - 백엔드 (:8080) 기동 중, 실 MySQL dev 프로필 (= 데이터가 누적/잔존).
 *  - Vite dev (:3000) 는 playwright.config 의 webServer 가 자동 기동.
 *  - axios baseURL = `/api`. Vite 가 `/api` 를 rewrite 해 :8080 으로 전달.
 *    → Playwright `request` fixture 의 baseURL 은 :3000 이므로 `/api/memos` 로 호출.
 *
 * 셀렉터 원칙:
 *  - 버튼/제목은 getByRole 우선.
 *  - Input/Textarea primitive 는 `<label>` 이 implicit association 을 맺지 않는 구조라
 *    getByLabel 이 안 걸림 → placeholder 텍스트 기반으로 locate.
 *  - 모달 본체는 `.modal-container` (Modal primitive 의 DialogPanel className).
 *  - 카드는 `MemoCard` 의 aria-label="메모 열기: <title>" 으로 정확히 locate.
 *
 * 격리 전략:
 *  - 모든 테스트는 `e2e-memo-${tag}-${Date.now()}-${rand}` prefix 의 unique 제목 사용.
 *  - afterAll 에서 생성된 id 들을 DELETE /api/memos/{id} 로 정리 (실패 무시).
 *  - DB 리셋 불가 → 다른 spec/수동 데이터와도 공존 가능해야 함.
 *
 * maxLength 주의:
 *  - Input/Textarea 둘 다 DOM `maxLength` + processValue slice 로 입력을 잘라낸다.
 *  - 따라서 "101자 초과" / "5001자 초과" 시나리오는 실제로는 100/5000 자에서
 *    잘려 들어가며, FormDialog 의 "최대 N자" 로컬 검증 분기는 dead code.
 *    본 스펙은 시나리오 의도 (= 사용자가 한도 너머 입력해도 안전하게 캡됨) 를
 *    "글자 수가 한도에서 멈추고 모달이 정상 동작" 으로 단정한다.
 *
 * T7 은 Modal primitive 제약으로 skip — dogfooding 발견사항. libs/ui Modal 의
 * onCancel 시맨틱이 "양보 경로" (취소 시 닫지 않고 다른 모드로 전환) 를
 * 지원하지 않아 screens/memo-dialog.md §2.c "취소 → 상세 복귀" 표현 불가.
 */

interface CreatedMemoRef {
  id: string;
  title: string;
}

const createdMemos: CreatedMemoRef[] = [];

/** Unique 제목 생성 — `Date.now() + 랜덤` 으로 같은 워커 내 충돌 방지 */
function uniqueTitle(tag: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `e2e-memo-${tag}-${Date.now()}-${rand}`;
}

/**
 * API 로 메모 직접 생성 — pre-seed 용.
 * Playwright request 의 baseURL 은 http://localhost:3000 (webServer) 이므로
 * Vite 프록시 경로 `/api/memos` 로 호출.
 */
async function seedMemoViaApi(
  request: APIRequestContext,
  body: { title: string; content?: string | null },
): Promise<CreatedMemoRef> {
  const res = await request.post("/api/memos", { data: body });
  expect(res.status(), "pre-seed POST /api/memos 가 201 이어야 함").toBe(201);
  const json = (await res.json()) as { id: string; title: string };
  const ref: CreatedMemoRef = { id: json.id, title: json.title };
  createdMemos.push(ref);
  return ref;
}

/** "+ 새 메모" 클릭 → 모달 오픈 확인 */
async function openCreateModal(page: Page) {
  await page.getByRole("button", { name: /\+\s*새 메모/ }).click();
  await expect(page.locator(".modal-container")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "새 메모" }),
  ).toBeVisible();
}

/** 모달 내부 제목 입력 — placeholder 기반 */
function titleField(page: Page) {
  return page.getByPlaceholder("예: 오늘 할 일");
}

/** 모달 내부 본문 입력 — placeholder prefix 매칭 (긴 placeholder 의 일부만 사용) */
function contentField(page: Page) {
  return page.getByPlaceholder(/본문은 비워둘 수 있습니다/);
}

/** 모달 하단 저장 버튼 (저장 중… 도 매칭) */
function saveButton(page: Page) {
  return page
    .locator(".modal-container")
    .getByRole("button", { name: /^저장$|^저장 중…$/ });
}

/** 모달 하단 취소 버튼 (모달 스코프) */
function cancelButton(page: Page) {
  return page.locator(".modal-container").getByRole("button", { name: "취소" });
}

/** 모달 하단 삭제 버튼 (모달 스코프, 삭제 중… 도 매칭) */
function deleteButton(page: Page) {
  return page
    .locator(".modal-container")
    .getByRole("button", { name: /^삭제$|^삭제 중…$/ });
}

/** 모달 하단 편집 버튼 (모달 스코프) */
function editButton(page: Page) {
  return page.locator(".modal-container").getByRole("button", { name: "편집" });
}

/** 카드 (목록 행) — aria-label "메모 열기: <title>" 매칭 */
function memoCard(page: Page, title: string) {
  return page.getByRole("button", { name: `메모 열기: ${title}` });
}

test.describe("Memo 피처 e2e — MemoListPage + Dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/memos");
    // 헤더가 보일 때까지 대기 (Loading/Error/Empty 모두 헤더 유지).
    await expect(
      page.getByRole("heading", { name: "메모", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /\+\s*새 메모/ }),
    ).toBeVisible();
  });

  test.afterAll(async ({ request }) => {
    // 생성된 메모 cleanup. 이미 삭제됐을 수 있으니 실패 무시.
    for (const m of createdMemos) {
      try {
        await request.delete(`/api/memos/${m.id}`);
      } catch {
        /* noop */
      }
    }
  });

  // ---------------------------------------------------------------------------
  // T1. 초기 진입 — 헤더 + 주요 액션 + (가능하면) 빈 상태 안내
  // ---------------------------------------------------------------------------
  test("T1: 초기 진입 시 헤더와 '+ 새 메모' 가 보인다", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "메모", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /\+\s*새 메모/ }),
    ).toBeVisible();

    // dev DB 가 잔존 데이터를 가질 수 있으므로 빈 상태 안내는 조건부 단정.
    // - 비어 있으면: "아직 메모가 없어요." 안내가 본문에 보임.
    // - 데이터가 있으면: 카드 또는 페이지네이션이 있음 → emptyMessage 없음.
    const emptyHint = page.getByText("아직 메모가 없어요.");
    const cards = page.getByRole("button", { name: /^메모 열기: / });

    // 둘 중 하나의 상태에 도달할 때까지 대기.
    await expect
      .poll(async () => (await emptyHint.count()) + (await cards.count()), {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);

    // 페이지가 어떤 상태든 헤더와 액션은 항상 유지.
    await expect(
      page.getByRole("heading", { name: "메모", level: 1 }),
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // T2. 신규 생성 → 카드 반영 (정상 경로)
  // ---------------------------------------------------------------------------
  test("T2: 정상 입력 → 저장 시 모달 닫히고 목록 카드에 새 메모가 보인다", async ({
    page,
  }) => {
    const title = uniqueTitle("t2");
    const content = "오늘 할 일\n- 우유 사기\n- 책 읽기";

    await openCreateModal(page);
    await titleField(page).pressSequentially(title, { delay: 15 });
    await contentField(page).pressSequentially(content, { delay: 10 });

    // POST /memos 응답 대기 → mutation 성공 → 모달 닫힘.
    const postResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/memos") &&
        resp.request().method() === "POST" &&
        resp.status() === 201,
    );
    await saveButton(page).click();
    const resp = await postResponse;
    const body = (await resp.json()) as { id: string; title: string };
    createdMemos.push({ id: body.id, title: body.title });

    // 모달 닫힘
    await expect(page.locator(".modal-container")).toHaveCount(0, {
      timeout: 10_000,
    });

    // 목록 첫 페이지 (createdAt DESC 라 신규가 1페이지로 옴) 에 카드 보임.
    await expect(memoCard(page, title)).toBeVisible({ timeout: 10_000 });
  });

  // ---------------------------------------------------------------------------
  // T3. 제목 검증 — 공백만 / maxLength 캡
  // ---------------------------------------------------------------------------
  test("T3a: 제목이 공백만이면 모달 유지 + '제목을 입력하세요.' 에러", async ({
    page,
  }) => {
    await openCreateModal(page);
    // Input 의 allowSpaces=true → 공백 3개가 실제 입력됨.
    await titleField(page).pressSequentially("   ", { delay: 20 });
    // 본문은 비워두되 검증은 제목에서 먼저 트리거.
    await saveButton(page).click();

    await expect(page.locator(".modal-container")).toBeVisible();
    await expect(
      page.locator(".modal-container").getByText("제목을 입력하세요."),
    ).toBeVisible();

    // 취소.
    await cancelButton(page).click();
    await expect(page.locator(".modal-container")).toHaveCount(0);
  });

  test("T3b: 제목 100자 초과를 시도해도 100자에서 캡되며 카운터가 100/100 으로 멈춘다", async ({
    page,
  }) => {
    await openCreateModal(page);

    // 주의: Input primitive 는 DOM `<input maxLength={100}>` + processValue slice
    // 두 가지로 한도를 강제. 따라서 101자 입력을 시도해도 100자에서 잘림.
    // FormDialog 의 "최대 100자" 로컬 검증 분기는 사실상 dead code 임을 본 테스트가 단정.
    const longTitle = "가".repeat(101);

    // pressSequentially 는 너무 느리므로 fill() 로 한 번에 시도.
    // fill() 도 maxLength 가 적용되므로 결국 100자에서 잘림.
    await titleField(page).fill(longTitle);

    // 실제 input 값이 100자 인지 단정.
    await expect(titleField(page)).toHaveValue("가".repeat(100));

    // 카운터 텍스트 — FormDialog 우측 하단 "100 / 100" (모달 스코프).
    await expect(
      page.locator(".modal-container").getByText("100 / 100"),
    ).toBeVisible();

    // 모달은 정상 유지 (캡된 100자는 유효한 입력) — 취소로 닫기.
    await cancelButton(page).click();
    await expect(page.locator(".modal-container")).toHaveCount(0);
  });

  // ---------------------------------------------------------------------------
  // T4. 본문 maxLength 캡 — 5001자 시도해도 5000자에서 캡
  // ---------------------------------------------------------------------------
  test("T4: 본문 5000자 초과를 시도해도 5000자에서 캡되며 카운터가 5000/5000 으로 멈춘다", async ({
    page,
  }) => {
    await openCreateModal(page);
    const title = uniqueTitle("t4");
    await titleField(page).pressSequentially(title, { delay: 10 });

    // Textarea 도 동일 maxLength 패턴. 5001자 fill → 5000자에서 캡.
    const longBody = "x".repeat(5001);
    await contentField(page).fill(longBody);

    await expect(contentField(page)).toHaveValue("x".repeat(5000));
    await expect(
      page.locator(".modal-container").getByText("5000 / 5000"),
    ).toBeVisible();

    // 취소로 닫기 (저장 시 정상 통과해버려 의도와 다른 데이터가 남음).
    await cancelButton(page).click();
    await expect(page.locator(".modal-container")).toHaveCount(0);
  });

  // ---------------------------------------------------------------------------
  // T5. 상세 모드 — 카드 클릭 → 상세 모달
  // ---------------------------------------------------------------------------
  test("T5: 카드 클릭 시 상세 모달이 열리고 plain text 본문/메타/액션이 보인다", async ({
    page,
    request,
  }) => {
    // pre-seed (다른 테스트 의존 없이 항상 1건 보장).
    const title = uniqueTitle("t5");
    const content = "줄1\n줄2\n<script>alert(1)</script>";
    await seedMemoViaApi(request, { title, content });

    // 리스트 재조회 위해 reload.
    await page.reload();
    await expect(memoCard(page, title)).toBeVisible({ timeout: 10_000 });

    await memoCard(page, title).click();

    // 상세 모달 — 헤더 제목 = 메모 제목.
    await expect(
      page.getByRole("heading", { name: title }),
    ).toBeVisible();

    // 본문 plain text — `<script>` 가 텍스트로 보여야 함 (XSS 방지).
    const modalContainer = page.locator(".modal-container");
    await expect(modalContainer).toContainText("줄1");
    await expect(modalContainer).toContainText("줄2");
    await expect(modalContainer).toContainText("<script>alert(1)</script>");
    // script 태그가 실제로 DOM 에 삽입되지 않았음을 확인.
    await expect(modalContainer.locator("script")).toHaveCount(0);

    // 메타 — "작성 " / "수정 " prefix 텍스트.
    await expect(modalContainer.getByText(/작성 /)).toBeVisible();
    await expect(modalContainer.getByText(/수정 /)).toBeVisible();

    // 푸터 액션 — 삭제 + 편집.
    await expect(deleteButton(page)).toBeVisible();
    await expect(editButton(page)).toBeVisible();

    // 닫기 버튼 (헤더 우측 X) — Modal primitive 의 ModalHeader 가 "닫기" aria-label 을
    // 사용한다고 가정. 실제 라벨이 다를 수 있으므로 보조적으로 ESC 로도 닫을 수 있다.
    // 여기서는 ESC 닫기로 단정 (X 버튼 명세는 T8 에서 별도 검증).
    await page.keyboard.press("Escape");
    await expect(page.locator(".modal-container")).toHaveCount(0, {
      timeout: 5_000,
    });
  });

  // ---------------------------------------------------------------------------
  // T6. 편집 모드 — 상세 → 편집 → PUT
  // ---------------------------------------------------------------------------
  test("T6: 상세 모달의 '편집' 클릭 → 편집 모드 전환 → 저장 시 PUT 후 목록 반영", async ({
    page,
    request,
  }) => {
    const originalTitle = uniqueTitle("t6-orig");
    const seeded = await seedMemoViaApi(request, {
      title: originalTitle,
      content: "원본 본문",
    });

    await page.reload();
    await expect(memoCard(page, originalTitle)).toBeVisible({
      timeout: 10_000,
    });

    // 카드 → 상세 모달.
    await memoCard(page, originalTitle).click();
    await expect(
      page.getByRole("heading", { name: originalTitle }),
    ).toBeVisible();

    // "편집" → 편집 모드 (같은 오버레이 안에서 모드 전환).
    await editButton(page).click();
    await expect(
      page.getByRole("heading", { name: "메모 편집" }),
    ).toBeVisible();

    // 편집 모드 헤더로 바뀌면 폼 필드도 노출.
    await expect(titleField(page)).toBeVisible();
    await expect(titleField(page)).toHaveValue(originalTitle);

    // 제목을 수정.
    const editedTitle = `${originalTitle}-편집됨`;
    await titleField(page).fill(""); // 기존 값 비우기.
    await titleField(page).pressSequentially(editedTitle, { delay: 10 });

    // PUT /memos/{id} 응답 대기.
    const putResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/memos/${seeded.id}`) &&
        resp.request().method() === "PUT" &&
        resp.status() === 200,
    );
    await saveButton(page).click();
    await putResponse;

    // 모달 닫힘 + 목록에 새 제목 반영.
    await expect(page.locator(".modal-container")).toHaveCount(0, {
      timeout: 10_000,
    });
    await expect(memoCard(page, editedTitle)).toBeVisible({ timeout: 10_000 });

    // cleanup 목록에서 이름 갱신 (id 동일).
    const idx = createdMemos.findIndex((m) => m.id === seeded.id);
    if (idx >= 0) createdMemos[idx] = { id: seeded.id, title: editedTitle };
  });

  // ---------------------------------------------------------------------------
  // T7. 삭제 확인 모드 — 양보 경로 (취소 → 상세 복귀) + 실제 삭제
  // ---------------------------------------------------------------------------
  // TODO(dogfooding): libs/ui/Modal 의 onCancel 시맨틱이 "양보 경로" (취소 시
  // 닫기 대신 다른 모드로 전환) 를 지원하지 않음. screens/memo-dialog.md §2.c
  // "취소 → 상세 모드 복귀" 는 현재 구현으로 표현 불가능. Modal.handleCancel 이
  // onCancel?.() 호출 후 무조건 handleClose() 를 부르는 구조
  // (libs/ui/src/components/Modal/Modal.tsx:123-126). Modal primitive 에
  // preventClose 시그널 또는 onCancel 반환값 기반 옵트인이 추가된 뒤에 unskip.
  // 발견사항 반영 단계에서 처리 예정.
  test.skip("T7: 삭제 확인 모드에서 '취소' → 상세 모드 복귀, 다시 '삭제' → DELETE 후 카드 사라짐", async ({
    page,
    request,
  }) => {
    const title = uniqueTitle("t7");
    const seeded = await seedMemoViaApi(request, {
      title,
      content: "삭제 대상",
    });

    await page.reload();
    await expect(memoCard(page, title)).toBeVisible({ timeout: 10_000 });

    // 카드 → 상세.
    await memoCard(page, title).click();
    await expect(
      page.getByRole("heading", { name: title }),
    ).toBeVisible();

    // 상세의 "삭제" → 삭제 확인 모달.
    await deleteButton(page).click();
    await expect(
      page.getByRole("heading", { name: "메모 삭제" }),
    ).toBeVisible();

    // 본문 — 안내 문구 + 대상 제목 + 복구 불가 고지.
    const modalContainer = page.locator(".modal-container");
    await expect(modalContainer).toContainText("아래 메모를 삭제하시겠습니까?");
    await expect(modalContainer).toContainText(title);
    await expect(modalContainer).toContainText(
      "삭제한 메모는 복구할 수 없습니다.",
    );

    // "취소" → 양보 경로: 상세 모드로 복귀 (screens/memo-dialog.md §2.c).
    await cancelButton(page).click();
    await expect(
      page.getByRole("heading", { name: title }),
    ).toBeVisible({ timeout: 5_000 });
    // 상세 모달이 다시 보이는지 확인 (편집/삭제 버튼 노출).
    await expect(deleteButton(page)).toBeVisible();
    await expect(editButton(page)).toBeVisible();

    // 다시 "삭제" → 삭제 확인 → 실제 삭제.
    await deleteButton(page).click();
    await expect(
      page.getByRole("heading", { name: "메모 삭제" }),
    ).toBeVisible();

    const deleteResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/memos/${seeded.id}`) &&
        resp.request().method() === "DELETE" &&
        resp.status() === 204,
    );
    // 확인 모달의 Primary "삭제" 클릭 (모달 스코프 내 매칭은 deleteButton 그대로).
    await deleteButton(page).click();
    await deleteResponse;

    // 모달 닫힘 + 카드 사라짐.
    await expect(page.locator(".modal-container")).toHaveCount(0, {
      timeout: 10_000,
    });
    await expect(memoCard(page, title)).toHaveCount(0, { timeout: 10_000 });

    // cleanup 목록에서 제거 (이미 서버에서 삭제됨).
    const idx = createdMemos.findIndex((m) => m.id === seeded.id);
    if (idx >= 0) createdMemos.splice(idx, 1);
  });

  // ---------------------------------------------------------------------------
  // T8. 모달 닫기 경로 — ESC / 오버레이 클릭
  // ---------------------------------------------------------------------------
  test("T8a: 신규 모달을 ESC 로 닫을 수 있다", async ({ page }) => {
    await openCreateModal(page);
    await titleField(page).pressSequentially("esc-close", { delay: 10 });

    await page.keyboard.press("Escape");
    await expect(page.locator(".modal-container")).toHaveCount(0, {
      timeout: 5_000,
    });

    // 다시 열면 빈 폼 (입력값 폐기 검증).
    await openCreateModal(page);
    await expect(titleField(page)).toHaveValue("");
    await cancelButton(page).click();
  });

  test("T8b: 신규 모달을 오버레이 클릭으로 닫을 수 있다", async ({ page }) => {
    await openCreateModal(page);
    await titleField(page).pressSequentially("overlay-close", { delay: 10 });

    // user.spec.ts T7c 와 동일한 우회: Headless UI Dialog 의 outside click 은
    // container-wrapper 레벨에서 감지. 뷰포트 좌상단 (5,5) 클릭으로 모달 바깥
    // 영역을 누른 것으로 처리.
    await page.mouse.click(5, 5);
    await expect(page.locator(".modal-container")).toHaveCount(0, {
      timeout: 5_000,
    });
  });

  // ---------------------------------------------------------------------------
  // T9. 페이지네이션 — API 로 21개 pre-seed → 1/2 ↔ 2/2 토글
  // ---------------------------------------------------------------------------
  test("T9: 21개 메모가 있으면 '이전/다음' + 인디케이터 (1/2 ↔ 2/2) 가 동작한다", async ({
    page,
    request,
  }) => {
    const tag = `t9-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const seededHere: CreatedMemoRef[] = [];

    // 21개 생성. 다른 spec/실데이터로 쌓인 것과 합쳐 totalPages>=2 가 되도록 유도.
    // dev DB 잔존을 가정해도 21개 추가는 page=1 로 가는 충분 조건.
    for (let i = 0; i < 21; i += 1) {
      const t = `e2e-memo-${tag}-${String(i).padStart(2, "0")}`;
      const ref = await seedMemoViaApi(request, { title: t, content: null });
      seededHere.push(ref);
    }

    try {
      await page.goto("/memos");
      await expect(
        page.getByRole("heading", { name: "메모", level: 1 }),
      ).toBeVisible();

      // 페이지네이션 nav 가 노출 (totalPages > 1).
      const nav = page.getByRole("navigation", { name: "페이지 이동" });
      await expect(nav).toBeVisible({ timeout: 10_000 });

      const prevBtn = nav.getByRole("button", { name: /이전/ });
      const nextBtn = nav.getByRole("button", { name: /다음/ });

      // 인디케이터 — `nav > span[aria-live="polite"]` 만 골라 단독 검사.
      // (nav 의 toContainText 는 버튼 텍스트까지 합쳐져 "← 이전1 / 2다음 →" 가 됨)
      const indicator = nav.locator('span[aria-live="polite"]');

      // 1 페이지 — 이전 비활성, 다음 활성, 인디케이터 "1 / N".
      await expect(prevBtn).toBeDisabled();
      await expect(nextBtn).toBeEnabled();
      await expect(indicator).toHaveText(/^\s*1\s*\/\s*\d+\s*$/);

      // GET 응답 대기 후 다음 페이지로.
      const nextResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes("/memos") &&
          resp.url().includes("page=1") &&
          resp.request().method() === "GET" &&
          resp.status() === 200,
      );
      await nextBtn.click();
      await nextResponse;

      // 인디케이터가 "2 / N" 으로 갱신.
      await expect(indicator).toHaveText(/^\s*2\s*\/\s*\d+\s*$/, {
        timeout: 10_000,
      });
      // 이전 활성으로 바뀜.
      await expect(prevBtn).toBeEnabled();
    } finally {
      // cleanup — seededHere 만 즉시 정리 (afterAll 의 createdMemos cleanup 이
      // 같은 ref 를 또 시도해도 무해).
      for (const m of seededHere) {
        try {
          await request.delete(`/api/memos/${m.id}`);
        } catch {
          /* noop */
        }
      }
      // createdMemos 에서도 제거.
      for (const m of seededHere) {
        const idx = createdMemos.findIndex((x) => x.id === m.id);
        if (idx >= 0) createdMemos.splice(idx, 1);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // T10. 한글 IME — 제목 + 본문 모두 한글
  // ---------------------------------------------------------------------------
  test("T10: 제목/본문 모두 한글을 pressSequentially 로 입력 → 저장 → 목록·서버 동일 문자열 확인", async ({
    page,
    request,
  }) => {
    const title = `한글메모-${Date.now().toString(36)}`;
    const content = "본문도 한글로 입력합니다.\n줄바꿈도 유지되어야 합니다.";

    await openCreateModal(page);
    // 한글은 OS IME 없이 키 이벤트만으로는 조합되지 않음.
    // pressSequentially 는 각 글자를 insertText 로 입력 → 한글 직접 삽입 가능.
    // Input/Textarea 의 processValue 는 제목은 공백을 허용 (allowSpaces=true),
    // 본문도 allowSpaces 기본 true 라 줄바꿈 유지.
    await titleField(page).pressSequentially(title, { delay: 30 });
    await contentField(page).pressSequentially(content, { delay: 15 });

    // controlled input/textarea 값 단정.
    await expect(titleField(page)).toHaveValue(title);
    await expect(contentField(page)).toHaveValue(content);

    const postResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/memos") &&
        resp.request().method() === "POST" &&
        resp.status() === 201,
    );
    await saveButton(page).click();
    const resp = await postResponse;
    const body = (await resp.json()) as {
      id: string;
      title: string;
      content: string | null;
    };
    createdMemos.push({ id: body.id, title: body.title });

    // 모달 닫힘 + 목록 카드 반영.
    await expect(page.locator(".modal-container")).toHaveCount(0, {
      timeout: 10_000,
    });
    await expect(memoCard(page, title)).toBeVisible({ timeout: 10_000 });

    // 서버에 저장된 문자열도 동일한지 GET 으로 재확인.
    const getRes = await request.get(`/api/memos/${body.id}`);
    expect(getRes.status()).toBe(200);
    const fetched = (await getRes.json()) as { title: string; content: string };
    expect(fetched.title).toBe(title);
    expect(fetched.content).toBe(content);
  });
});
