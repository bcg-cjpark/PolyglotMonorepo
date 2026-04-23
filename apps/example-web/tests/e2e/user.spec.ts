import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * User 피처 화면 단위 e2e — `docs/screens/user-list.md` 인터랙션 1~8 전부 커버.
 *
 * 환경 가정:
 *  - 백엔드 (:8080) 기동 중, MySQL dev 프로필, 빈 DB 로 시작 (테스트 순서 의존 없음).
 *  - Vite dev (:3000) 는 playwright.config 의 webServer 가 자동 기동.
 *  - axios baseURL = `/api` 이며 Vite 가 `/api` 를 rewrite 해 :8080 으로 전달하므로,
 *    Playwright `request` fixture (baseURL :3000) 에서 pre-seed 할 때는 `/api/users` 를 쓴다.
 *
 * 셀렉터 원칙:
 *  - 버튼/제목은 getByRole 우선.
 *  - Input primitive 는 `<label>` 이 내부 <input> 과 implicit association 을 맺지 못하는
 *    구조라 getByLabel 이 안 걸림 → placeholder 텍스트 기반으로 locate.
 *  - 모달 본체는 `.modal-container` (Modal primitive 의 DialogPanel className).
 *  - 오버레이 는 `.modal-overlay`.
 *
 * 격리 전략:
 *  - 모든 테스트는 `e2e-${Date.now()}-${랜덤}@user.local` 로 unique email 사용.
 *  - afterAll 에서 생성된 id 들을 DELETE /users/{id} 로 정리.
 *  - DB 리셋 불가 → 다른 spec/수동 생성 데이터와도 공존 가능해야 함.
 */

interface CreatedUserRef {
  id: number;
  email: string;
}

const createdUsers: CreatedUserRef[] = [];

/** Unique email 생성 — `Date.now() + 랜덤` 으로 같은 워커 내 충돌 방지 */
function uniqueEmail(tag: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `e2e-${tag}-${Date.now()}-${rand}@user.local`;
}

/**
 * API 로 사용자 직접 생성 — 중복 테스트의 pre-seed 용.
 * Playwright request 의 baseURL 은 http://localhost:3000 (webServer) 이므로
 * Vite 프록시 경로 `/api/users` 로 호출한다.
 */
async function seedUserViaApi(
  request: APIRequestContext,
  body: { email: string; name: string },
): Promise<CreatedUserRef> {
  const res = await request.post("/api/users", { data: body });
  expect(res.status(), "pre-seed POST /api/users 가 201 이어야 함").toBe(201);
  const json = (await res.json()) as { id: number; email: string };
  const ref: CreatedUserRef = { id: json.id, email: json.email };
  createdUsers.push(ref);
  return ref;
}

/** "+ 새 사용자" 클릭 → 모달 오픈 확인 */
async function openCreateModal(page: Page) {
  await page.getByRole("button", { name: /\+\s*새 사용자/ }).click();
  await expect(page.locator(".modal-container")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "새 사용자" }),
  ).toBeVisible();
}

/** 모달 내부 이메일 입력 — placeholder 기반 */
function emailField(page: Page) {
  return page.getByPlaceholder("name@company.com");
}

/** 모달 내부 이름 입력 — placeholder 기반 */
function nameField(page: Page) {
  return page.getByPlaceholder("예: 박도윤");
}

/** 모달 하단 저장 버튼 */
function confirmButton(page: Page) {
  return page
    .locator(".modal-container")
    .getByRole("button", { name: /^저장$|^저장 중…$/ });
}

/** 모달 하단 취소 버튼 */
function cancelButton(page: Page) {
  return page.locator(".modal-container").getByRole("button", { name: "취소" });
}

test.describe("User 피처 e2e — UserListPage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/users");
    // 초기 GET /users 응답을 기다리기 위해 헤더가 보일 때까지 대기.
    await expect(
      page.getByRole("heading", { name: "사용자", level: 1 }),
    ).toBeVisible();
    // 로딩 스켈레톤이 사라지거나, Table 의 tbody 가 붙을 때까지 대기.
    // (Table primitive 는 렌더링 즉시 table DOM 을 생성하므로 존재로 끝까지 대기)
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
  });

  test.afterAll(async ({ request }) => {
    // 생성된 사용자 cleanup. 실패해도 무시 (T8 등에서 이미 삭제된 경우).
    for (const u of createdUsers) {
      try {
        await request.delete(`/api/users/${u.id}`);
      } catch {
        /* noop */
      }
    }
  });

  // -------------------------------------------------------------------------
  // T1. 초기 진입 — 헤더 + 주요 액션 + 본문 표 노출
  // -------------------------------------------------------------------------
  test("T1: 초기 진입 시 헤더·주요 액션·표가 보인다", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "사용자", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /\+\s*새 사용자/ }),
    ).toBeVisible();

    // 표 자체는 항상 있음. 빈 DB 로 시작한 경우 emptyMessage 가 tbody 안에 뜸.
    // 다른 테스트가 먼저 돌았으면 행이 있을 수 있어 emptyMessage 존재 단정은 조건부.
    const table = page.locator("table");
    await expect(table).toBeVisible();

    // 컬럼 헤더 검증 — 화면정의서에 명시된 4 컬럼.
    await expect(table.locator("thead")).toContainText("이름");
    await expect(table.locator("thead")).toContainText("이메일");
    await expect(table.locator("thead")).toContainText("생성일");
    await expect(table.locator("thead")).toContainText("액션");
  });

  // -------------------------------------------------------------------------
  // T2. 모달 오픈 + 필드 2개 노출
  // -------------------------------------------------------------------------
  test("T2: '+ 새 사용자' 클릭 시 모달과 두 필드가 보인다", async ({ page }) => {
    await openCreateModal(page);
    await expect(emailField(page)).toBeVisible();
    await expect(nameField(page)).toBeVisible();
    await expect(confirmButton(page)).toBeVisible();
    await expect(cancelButton(page)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // T3. 정상 저장 → 목록 반영
  // -------------------------------------------------------------------------
  test("T3: 정상 입력 → 저장 시 모달 닫히고 목록에 새 사용자가 보인다", async ({
    page,
  }) => {
    const email = uniqueEmail("t3");
    const name = "테스트유저T3";

    await openCreateModal(page);
    await emailField(page).pressSequentially(email, { delay: 20 });
    await nameField(page).pressSequentially(name, { delay: 20 });

    // 서버 POST 응답 대기 (201) 후 모달이 닫히도록 예측 가능한 순서 보장.
    const postResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/users") &&
        resp.request().method() === "POST" &&
        resp.status() === 201,
    );
    await confirmButton(page).click();
    const resp = await postResponse;
    const body = (await resp.json()) as { id: number; email: string };
    createdUsers.push({ id: body.id, email: body.email });

    // 모달 닫힘
    await expect(page.locator(".modal-container")).toHaveCount(0, {
      timeout: 10_000,
    });

    // 목록에 신규 행 반영 — 이메일 셀 텍스트로 찾기 (고유)
    await expect(page.getByRole("cell", { name: email })).toBeVisible();
    await expect(page.getByRole("cell", { name: name })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // T4. 이메일 형식 오류 (로컬 검증)
  // -------------------------------------------------------------------------
  test("T4: 이메일 형식이 틀리면 모달이 유지되고 에러 문구가 보인다", async ({
    page,
  }) => {
    await openCreateModal(page);
    await emailField(page).pressSequentially("not-an-email", { delay: 10 });
    await nameField(page).pressSequentially("이름", { delay: 10 });

    await confirmButton(page).click();

    // 모달 유지
    await expect(page.locator(".modal-container")).toBeVisible();

    // 에러 텍스트 — UserListPage 구현의 고정 문구 "이메일 형식이 올바르지 않습니다."
    await expect(
      page.locator(".modal-container").getByText("이메일 형식이 올바르지 않습니다."),
    ).toBeVisible();

    // 취소로 닫기
    await cancelButton(page).click();
    await expect(page.locator(".modal-container")).toHaveCount(0);
  });

  // -------------------------------------------------------------------------
  // T5. 이름 공백만 (로컬 검증)
  // -------------------------------------------------------------------------
  test("T5: 이름이 공백만이면 에러 문구가 보이고 모달이 유지된다", async ({
    page,
  }) => {
    await openCreateModal(page);

    const email = uniqueEmail("t5");
    await emailField(page).pressSequentially(email, { delay: 10 });

    // 이름에 공백 3개. Input 이 allowSpaces=true 이므로 공백이 실제로 입력됨 →
    // `formName.trim().length === 0` 조건이 발동해 에러 기대.
    await nameField(page).pressSequentially("   ", { delay: 20 });

    await confirmButton(page).click();

    await expect(page.locator(".modal-container")).toBeVisible();
    await expect(
      page.locator(".modal-container").getByText("이름을 입력하세요."),
    ).toBeVisible();

    // ESC 로 닫기
    await page.keyboard.press("Escape");
    await expect(page.locator(".modal-container")).toHaveCount(0);
  });

  // -------------------------------------------------------------------------
  // T6. 이메일 중복 (서버 409)
  // -------------------------------------------------------------------------
  test("T6: 이미 존재하는 이메일로 저장 시 409 에러 문구가 email 필드에 보인다", async ({
    page,
    request,
  }) => {
    // pre-seed — 같은 spec 내 다른 테스트와 독립된 사용자 생성.
    const dupEmail = uniqueEmail("t6-dup");
    await seedUserViaApi(request, { email: dupEmail, name: "중복시드" });

    // 목록 쿼리 재조회 위해 페이지 리로드 — 또는 바로 모달 열어도 POST 단계에서 409 재현 가능.
    // 리스트 반영까지 기다릴 필요 없이 곧장 모달을 열어 같은 이메일 저장 시도.
    await openCreateModal(page);
    await emailField(page).pressSequentially(dupEmail, { delay: 10 });
    await nameField(page).pressSequentially("중복시도", { delay: 10 });

    const postResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/users") && resp.request().method() === "POST",
    );
    await confirmButton(page).click();
    const resp = await postResponse;
    expect(resp.status(), "두 번째 POST 는 409 여야 함").toBe(409);

    // 모달 유지 + 고정 에러 문구.
    await expect(page.locator(".modal-container")).toBeVisible();
    await expect(
      page.locator(".modal-container").getByText("이미 사용 중인 이메일입니다."),
    ).toBeVisible();

    await cancelButton(page).click();
    await expect(page.locator(".modal-container")).toHaveCount(0);
  });

  // -------------------------------------------------------------------------
  // T7. 모달 취소 경로 — 취소 버튼 / ESC / 오버레이 클릭
  // -------------------------------------------------------------------------
  test("T7a: 취소 버튼으로 모달을 닫을 수 있다", async ({ page }) => {
    await openCreateModal(page);
    await emailField(page).pressSequentially("cancel-a@user.local", {
      delay: 10,
    });
    await cancelButton(page).click();
    await expect(page.locator(".modal-container")).toHaveCount(0);
  });

  test("T7b: ESC 키로 모달을 닫을 수 있다", async ({ page }) => {
    await openCreateModal(page);
    await emailField(page).pressSequentially("cancel-b@user.local", {
      delay: 10,
    });
    await page.keyboard.press("Escape");
    await expect(page.locator(".modal-container")).toHaveCount(0);
  });

  test("T7c: 오버레이 클릭으로 모달을 닫을 수 있다", async ({ page }) => {
    await openCreateModal(page);
    await emailField(page).pressSequentially("cancel-c@user.local", {
      delay: 10,
    });

    // Headless UI Dialog 의 overlay 는 closeOnOverlayClick=true 일 때
    // DialogBackdrop 또는 Dialog 자체 클릭으로 닫힘. Modal primitive 는
    // `.modal-dialog` 최상위 Dialog + `.modal-overlay` Backdrop + container-wrapper.
    // Headless UI 는 outside click 을 container-wrapper 레벨에서 감지하므로
    // container-wrapper 를 force 클릭해 모달 바깥 영역을 누른 것처럼 처리.
    // 좌표는 뷰포트 좌상단 (10, 10) — 모달 컨테이너 바깥 영역.
    await page.mouse.click(5, 5);
    await expect(page.locator(".modal-container")).toHaveCount(0, {
      timeout: 5_000,
    });
  });

  // -------------------------------------------------------------------------
  // T8. 삭제 — confirm 수락 → 행 사라짐
  // -------------------------------------------------------------------------
  test("T8: 행 삭제 버튼 클릭 → confirm 수락 시 목록에서 사라진다", async ({
    page,
    request,
  }) => {
    // 삭제 대상 사용자를 API 로 사전 주입 (다른 테스트 의존 제거).
    const email = uniqueEmail("t8");
    const seeded = await seedUserViaApi(request, {
      email,
      name: "삭제대상T8",
    });

    // 리스트 재조회.
    await page.reload();
    await expect(page.locator("table")).toBeVisible();
    const row = page.getByRole("row", { name: new RegExp(email) });
    await expect(row).toBeVisible();

    // 브라우저 confirm 수락 핸들러 등록.
    page.once("dialog", (dialog) => {
      expect(dialog.type()).toBe("confirm");
      void dialog.accept();
    });

    // DELETE 응답 대기 + 삭제 버튼 클릭.
    const deleteResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/users/${seeded.id}`) &&
        resp.request().method() === "DELETE" &&
        resp.status() === 204,
    );
    await row.getByRole("button", { name: "삭제" }).click();
    await deleteResponse;

    // 행이 목록에서 사라짐.
    await expect(
      page.getByRole("row", { name: new RegExp(email) }),
    ).toHaveCount(0, { timeout: 10_000 });

    // cleanup 목록에서 제거 (이미 삭제됨).
    const idx = createdUsers.findIndex((u) => u.id === seeded.id);
    if (idx >= 0) createdUsers.splice(idx, 1);
  });

  // -------------------------------------------------------------------------
  // T9. 한글 IME 입력 (name 필드)
  // -------------------------------------------------------------------------
  test("T9: 이름 필드에 한글을 pressSequentially 로 입력해도 저장된다", async ({
    page,
  }) => {
    const email = uniqueEmail("t9");
    const name = "김민수";

    await openCreateModal(page);
    await emailField(page).pressSequentially(email, { delay: 20 });
    // 한글은 OS IME 없이 키 이벤트만으로는 조합이 되지 않음.
    // Playwright 의 pressSequentially 는 각 글자를 insertText 로 입력 → 한글 직접 삽입 가능.
    // Input 컴포넌트의 processValue 는 공백만 필터링하므로 한글 문자는 그대로 통과.
    await nameField(page).pressSequentially(name, { delay: 30 });

    // 값 확인 — controlled input 이므로 toHaveValue 로 단정.
    await expect(nameField(page)).toHaveValue(name);

    const postResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/users") &&
        resp.request().method() === "POST" &&
        resp.status() === 201,
    );
    await confirmButton(page).click();
    const resp = await postResponse;
    const body = (await resp.json()) as { id: number; email: string };
    createdUsers.push({ id: body.id, email: body.email });

    await expect(page.locator(".modal-container")).toHaveCount(0, {
      timeout: 10_000,
    });
    await expect(page.getByRole("cell", { name: email })).toBeVisible();
    await expect(page.getByRole("cell", { name: name })).toBeVisible();
  });
});
