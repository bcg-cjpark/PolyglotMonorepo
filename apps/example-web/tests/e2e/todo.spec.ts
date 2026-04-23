import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Todo 피처 화면 단위 e2e — `docs/screens/todo-list.md` + `docs/screens/todo-form.md`
 * 인터랙션 전부 커버 + PRD `docs/prd/todo.md` 비즈니스 규칙 검증.
 *
 * 환경 가정:
 *  - 백엔드 (:8080) 기동 중, MySQL dev 프로필.
 *  - Vite dev (:3000) 는 playwright.config 의 webServer 가 자동 기동.
 *  - axios baseURL = `/api` 이며 Vite 가 `/api` 를 :8080 으로 rewrite. Playwright
 *    `request` fixture (baseURL :3000) 에서 pre-seed 시 `/api/todos` 사용.
 *
 * 셀렉터 원칙:
 *  - 버튼/제목은 getByRole 우선.
 *  - Input primitive 의 `<label>` 이 implicit association 을 못 맺으므로
 *    placeholder 텍스트 기반으로 locate.
 *  - Checkbox primitive 는 wrapper div (role="checkbox") + 내부 sr-only <input>
 *    (implicit role=checkbox) 가 동시에 노출 → `getByRole("checkbox")` 는
 *    중복 매칭. 행 내부에서 `.first()` 로 wrapper 를 잡는다 (wrapper 가 클릭 핸들러 보유).
 *  - 마감일 입력은 native `<input type="date">` → `page.locator('input[type="date"]')`.
 *  - Todo 는 모달 없음 (route 기반 폼).
 *
 * 격리 전략:
 *  - 모든 테스트는 `e2e-${tag}-${Date.now()}-${랜덤}` 로 unique title 사용.
 *  - createdTodos 에 id 기록, afterAll 에서 DELETE /api/todos/{id} cleanup.
 *  - DB 리셋 불가 → 다른 spec/수동 데이터와 공존 가능해야 함.
 */

interface CreatedTodoRef {
  id: number;
  title: string;
}

const createdTodos: CreatedTodoRef[] = [];

/** Unique title 생성 — `Date.now() + 랜덤` 으로 같은 워커 내 충돌 방지 */
function uniqueTitle(tag: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `e2e-${tag}-${Date.now()}-${rand}`;
}

/**
 * API 로 todo 직접 생성 — overdue / 토글 사전 상태 / 삭제 대상 등 pre-seed 용.
 * Playwright request 의 baseURL 은 http://localhost:3000 (webServer) 이므로
 * Vite 프록시 경로 `/api/todos` 로 호출.
 */
async function seedTodoViaApi(
  request: APIRequestContext,
  body: { title: string; dueDate?: string | null },
): Promise<CreatedTodoRef> {
  const res = await request.post("/api/todos", { data: body });
  expect(res.status(), "pre-seed POST /api/todos 가 201 이어야 함").toBe(201);
  const json = (await res.json()) as { id: number; title: string };
  const ref: CreatedTodoRef = { id: json.id, title: json.title };
  createdTodos.push(ref);
  return ref;
}

/** 폼 제목 Input — placeholder 기반 */
function titleField(page: Page) {
  return page.getByPlaceholder("예: 디자인 시안 리뷰 노트 정리");
}

/** 폼 마감일 native date input */
function dueDateField(page: Page) {
  return page.locator('input[type="date"]');
}

/** 폼 하단 저장 버튼 (생성/편집 공용 — 라벨이 "저장" 또는 "저장 중…") */
function saveButton(page: Page) {
  return page.getByRole("button", { name: /^저장$|^저장 중…$/ });
}

/** 목록의 특정 todo 행 — title 셀의 텍스트로 행을 잡는다 */
function rowOf(page: Page, title: string) {
  return page.getByRole("row", { name: new RegExp(escapeRegExp(title)) });
}

/** RegExp 메타문자 이스케이프 — title 에 `+`, `(`, `)` 등이 들어가도 안전 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** "+ 새 할 일" 클릭 → /todos/new 이동 후 폼 헤더 확인 */
async function gotoCreateForm(page: Page) {
  await page.getByRole("button", { name: /\+\s*새 할 일/ }).click();
  await expect(page).toHaveURL(/\/todos\/new$/);
  await expect(
    page.getByRole("heading", { name: "새 할 일", level: 1 }),
  ).toBeVisible();
}

test.describe("Todo 피처 e2e — TodoListPage / TodoFormPage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/todos");
    await expect(
      page.getByRole("heading", { name: "할 일", level: 1 }),
    ).toBeVisible();
    // 본문 표가 렌더될 때까지 대기 (Loading 스켈레톤이 사라지면 table 등장).
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
  });

  test.afterAll(async ({ request }) => {
    for (const t of createdTodos) {
      try {
        await request.delete(`/api/todos/${t.id}`);
      } catch {
        /* noop — 이미 삭제된 경우 */
      }
    }
  });

  // -------------------------------------------------------------------------
  // T1. 초기 진입 — 헤더 / 필터 / 표 컬럼 노출
  // -------------------------------------------------------------------------
  test("T1: 초기 진입 시 헤더·필터·표 컬럼이 모두 보인다", async ({ page }) => {
    // 헤더 + Primary 액션
    await expect(
      page.getByRole("heading", { name: "할 일", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /\+\s*새 할 일/ }),
    ).toBeVisible();

    // 상태 필터 RadioGroup 3 옵션. Headless UI Radio 가 button[role=radio] 을 렌더.
    // 라벨 텍스트로 단정.
    await expect(page.getByRole("radio", { name: "전체" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "진행 중" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "완료" })).toBeVisible();
    // 기본 선택 "전체" — aria-checked 단정.
    await expect(page.getByRole("radio", { name: "전체" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // 본문 표 + 컬럼 헤더 ("제목 / 마감일 / 상태 / 액션"). 첫 컬럼은 체크박스 (header 빈 문자열).
    const table = page.locator("table");
    await expect(table).toBeVisible();
    await expect(table.locator("thead")).toContainText("제목");
    await expect(table.locator("thead")).toContainText("마감일");
    await expect(table.locator("thead")).toContainText("상태");
    await expect(table.locator("thead")).toContainText("액션");
  });

  // -------------------------------------------------------------------------
  // T2. 생성 — /todos/new 이동 → 정상 입력 → 저장 → 목록 반영
  // -------------------------------------------------------------------------
  test("T2: '+ 새 할 일' → 정상 입력 → 저장 시 /todos 로 복귀하고 목록에 행이 보인다", async ({
    page,
  }) => {
    const title = uniqueTitle("t2");
    // 미래 날짜 (오늘 + 7일) — overdue 색상 회피.
    const dueDate = isoDateOffset(7);

    await gotoCreateForm(page);

    // 한글 IME 안전성 위해 pressSequentially 로 입력 (T2 는 영문/숫자/하이픈이지만 패턴 통일).
    await titleField(page).pressSequentially(title, { delay: 15 });
    await expect(titleField(page)).toHaveValue(title);

    // native date input 은 fill() 가 사실상 유일한 안정 입력 경로 (pressSequentially 로
    // "YYYY-MM-DD" 를 치면 브라우저가 거부). date input 은 IME 무관.
    await dueDateField(page).fill(dueDate);
    await expect(dueDateField(page)).toHaveValue(dueDate);

    // POST /todos 201 응답 대기.
    const postResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/todos") &&
        resp.request().method() === "POST" &&
        resp.status() === 201,
    );
    await saveButton(page).click();
    const resp = await postResponse;
    const body = (await resp.json()) as { id: number; title: string };
    createdTodos.push({ id: body.id, title: body.title });

    // /todos 로 이동 + 행 보임.
    await expect(page).toHaveURL(/\/todos$/);
    await expect(page.locator("table")).toBeVisible();
    await expect(rowOf(page, title)).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // T3. 제목 공백만 → 인라인 에러 + /todos/new 머무름
  // -------------------------------------------------------------------------
  test("T3: 제목이 공백만이면 저장 버튼 비활성으로 제출 자체가 차단된다", async ({
    page,
  }) => {
    await gotoCreateForm(page);

    // Input primitive 는 allowSpaces=true → 공백 자체는 입력됨.
    // trimmedTitle.length === 0 이므로 canSubmit=false → 저장 버튼 disabled.
    await titleField(page).pressSequentially("   ", { delay: 20 });
    await expect(titleField(page)).toHaveValue("   ");

    // 저장 버튼이 disabled 라 클릭 안 됨 → 그대로 머무름.
    await expect(saveButton(page)).toBeDisabled();
    await expect(page).toHaveURL(/\/todos\/new$/);

    // 취소로 이탈.
    await page.getByRole("button", { name: "취소" }).first().click();
    await expect(page).toHaveURL(/\/todos$/);
  });

  // -------------------------------------------------------------------------
  // T4. 제목 200자 초과 → maxLength 로 입력 자체가 200자에서 잘림 + 저장 가능
  //     (구현 분석: Input maxLength=200 이 DOM 단에서 자르므로 201자 입력 불가.
  //      "초과 입력 차단" 자체가 PRD 규칙 충족. 저장 버튼은 활성 상태 유지.)
  // -------------------------------------------------------------------------
  test("T4: 제목 입력이 200자에서 잘리고 그 이상은 추가 입력되지 않는다", async ({
    page,
  }) => {
    await gotoCreateForm(page);

    // 201자 시도 → DOM maxLength 가 200 에서 cut.
    const longTitle = "가".repeat(201);
    await titleField(page).pressSequentially(longTitle, { delay: 2 });

    const value = await titleField(page).inputValue();
    expect(
      value.length,
      "Input primitive 가 maxLength=200 으로 입력을 200자에서 잘라야 함",
    ).toBeLessThanOrEqual(200);

    // 200자까진 입력 OK → 저장 버튼 활성 (canSubmit 조건 만족).
    if (value.length > 0) {
      await expect(saveButton(page)).toBeEnabled();
    }

    // 취소로 이탈 (실제 저장은 안 함 — 200자 데이터 잔존 방지).
    await page.getByRole("button", { name: "취소" }).first().click();
    await expect(page).toHaveURL(/\/todos$/);
  });

  // -------------------------------------------------------------------------
  // T5. 체크 토글 — 낙관적 업데이트로 UI 즉시 반전 + 서버 PATCH 대기
  // -------------------------------------------------------------------------
  test("T5: 행 체크박스 클릭 시 PATCH /todos/{id}/toggle 호출되고 완료 스타일 (취소선) 적용", async ({
    page,
    request,
  }) => {
    // 토글 대상을 API pre-seed (다른 테스트 데이터에 의존하지 않기 위해).
    const title = uniqueTitle("t5");
    const seeded = await seedTodoViaApi(request, {
      title,
      dueDate: isoDateOffset(7),
    });

    await page.reload();
    await expect(page.locator("table")).toBeVisible();
    const row = rowOf(page, title);
    await expect(row).toBeVisible();

    // 행 내부 체크박스 — wrapper div (role=checkbox) + sr-only <input>.
    // `.first()` 로 wrapper 를 잡음 (wrapper 가 onClick 보유).
    const checkbox = row.getByRole("checkbox").first();
    await expect(checkbox).toHaveAttribute("aria-checked", "false");

    // 첫 토글: false → true.
    const togglePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/todos/${seeded.id}/toggle`) &&
        resp.request().method() === "PATCH" &&
        resp.status() === 200,
    );
    await checkbox.click();
    await togglePromise;

    // aria-checked 가 true 로 바뀜 (낙관적 업데이트 + 서버 응답 모두 통과).
    await expect(checkbox).toHaveAttribute("aria-checked", "true", {
      timeout: 5_000,
    });

    // 제목 셀에 line-through 클래스 적용.
    const titleCell = row.locator("td").nth(1); // 0=체크박스, 1=제목.
    await expect(titleCell.locator("span").first()).toHaveClass(/line-through/);

    // 두 번째 토글: true → false (롤백 검증).
    const toggleBackPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/todos/${seeded.id}/toggle`) &&
        resp.request().method() === "PATCH" &&
        resp.status() === 200,
    );
    await checkbox.click();
    await toggleBackPromise;

    await expect(checkbox).toHaveAttribute("aria-checked", "false", {
      timeout: 5_000,
    });
    await expect(titleCell.locator("span").first()).not.toHaveClass(
      /line-through/,
    );
  });

  // -------------------------------------------------------------------------
  // T6. 상태 필터 — 진행 중 / 완료 탭 전환 시 서버 쿼리 + 행 표시 여부
  // -------------------------------------------------------------------------
  test("T6: 필터 탭 전환 시 GET /todos?status=... 호출되고 상태별로 행이 노출/숨김된다", async ({
    page,
    request,
  }) => {
    // active(=진행 중) 상태의 todo pre-seed.
    const title = uniqueTitle("t6");
    const seeded = await seedTodoViaApi(request, {
      title,
      dueDate: isoDateOffset(14),
    });

    await page.reload();
    await expect(page.locator("table")).toBeVisible();
    await expect(rowOf(page, title)).toBeVisible();

    // "완료" 탭 → status=completed 쿼리 + 행 사라짐.
    const completedReq = page.waitForResponse(
      (resp) =>
        resp.url().includes("/todos") &&
        resp.url().includes("status=completed") &&
        resp.request().method() === "GET" &&
        resp.status() === 200,
    );
    await page.getByRole("radio", { name: "완료" }).click();
    await completedReq;
    await expect(rowOf(page, title)).toHaveCount(0);

    // 토글로 완료 처리 → "완료" 탭에서 보임.
    // API 직접 토글 (UI 로 토글하려면 다시 "전체" 탭 이동 필요 → 서버 쿼리 추가 발생).
    const toggleRes = await request.patch(`/api/todos/${seeded.id}/toggle`);
    expect(toggleRes.status()).toBe(200);

    // 캐시 무효화 트리거 위해 라디오 재클릭 (이미 selected 라 RadioGroup onChange 가
    // 동일 값에 대해 호출 안 될 수 있음) → "전체" → "완료" 순으로 이동.
    await page.getByRole("radio", { name: "전체" }).click();
    await expect(page.locator("table")).toBeVisible();
    await page.getByRole("radio", { name: "완료" }).click();
    await expect(rowOf(page, title)).toBeVisible({ timeout: 5_000 });

    // "진행 중" 탭 → 안 보임.
    const activeReq = page.waitForResponse(
      (resp) =>
        resp.url().includes("/todos") &&
        resp.url().includes("status=active") &&
        resp.request().method() === "GET",
    );
    await page.getByRole("radio", { name: "진행 중" }).click();
    await activeReq;
    await expect(rowOf(page, title)).toHaveCount(0);

    // "전체" 복귀 → 다시 보임.
    await page.getByRole("radio", { name: "전체" }).click();
    await expect(rowOf(page, title)).toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // T7. 편집 — /todos/{id}/edit 진입 → 초기값 주입 → 변경 + 완료 토글 → 저장
  // -------------------------------------------------------------------------
  test("T7: 편집 페이지에서 초기값이 주입되고 수정 후 저장 시 목록에 반영된다", async ({
    page,
    request,
  }) => {
    const originalTitle = uniqueTitle("t7-orig");
    const updatedTitle = uniqueTitle("t7-upd");
    const originalDate = isoDateOffset(10);
    const seeded = await seedTodoViaApi(request, {
      title: originalTitle,
      dueDate: originalDate,
    });

    await page.reload();
    const row = rowOf(page, originalTitle);
    await expect(row).toBeVisible();

    // "편집" 버튼 클릭 → /todos/{id}/edit.
    await row.getByRole("button", { name: "편집" }).click();
    await expect(page).toHaveURL(new RegExp(`/todos/${seeded.id}/edit$`));
    await expect(
      page.getByRole("heading", { name: "할 일 편집", level: 1 }),
    ).toBeVisible();

    // 초기값 주입 검증 (GET /todos/{id} 응답 후 useEffect 가 setTitle).
    await expect(titleField(page)).toHaveValue(originalTitle, {
      timeout: 5_000,
    });
    await expect(dueDateField(page)).toHaveValue(originalDate);

    // 편집 모드에서만 노출되는 "완료 처리" 체크박스. 현재 false.
    const completedCheckbox = page
      .getByRole("checkbox", { name: /완료 처리/ })
      .first();
    await expect(completedCheckbox).toBeVisible();
    await expect(completedCheckbox).toHaveAttribute("aria-checked", "false");

    // 제목 변경 — 기존 값 클리어 후 새 값 입력 (controlled input 이라 fill→pressSequentially).
    // Input.processValue 가 공백을 제거하지 않으므로 (allowSpaces=true) clear 가능.
    await titleField(page).fill("");
    await titleField(page).pressSequentially(updatedTitle, { delay: 15 });

    // 완료 체크박스 토글.
    await completedCheckbox.click();
    await expect(completedCheckbox).toHaveAttribute("aria-checked", "true");

    // PUT /todos/{id} 200 대기.
    const putPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/todos/${seeded.id}`) &&
        resp.request().method() === "PUT" &&
        resp.status() === 200,
    );
    await saveButton(page).click();
    await putPromise;

    // /todos 복귀 + 변경 반영 확인.
    await expect(page).toHaveURL(/\/todos$/);
    await expect(rowOf(page, updatedTitle)).toBeVisible({ timeout: 10_000 });
    await expect(rowOf(page, originalTitle)).toHaveCount(0);

    // cleanup 레코드 갱신 (title 변경 됐으므로).
    const idx = createdTodos.findIndex((t) => t.id === seeded.id);
    if (idx >= 0) createdTodos[idx] = { id: seeded.id, title: updatedTitle };
  });

  // -------------------------------------------------------------------------
  // T8. 삭제 — window.confirm 수락 → DELETE 204 → 행 사라짐
  // -------------------------------------------------------------------------
  test("T8: 행 '삭제' 클릭 → confirm 수락 시 DELETE 호출되고 행이 사라진다", async ({
    page,
    request,
  }) => {
    const title = uniqueTitle("t8");
    const seeded = await seedTodoViaApi(request, {
      title,
      dueDate: isoDateOffset(5),
    });

    await page.reload();
    const row = rowOf(page, title);
    await expect(row).toBeVisible();

    // confirm 수락 핸들러.
    page.once("dialog", (dialog) => {
      expect(dialog.type()).toBe("confirm");
      expect(dialog.message()).toContain("할 일을 삭제");
      void dialog.accept();
    });

    const deletePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/todos/${seeded.id}`) &&
        resp.request().method() === "DELETE" &&
        resp.status() === 204,
    );
    await row.getByRole("button", { name: "삭제" }).click();
    await deletePromise;

    await expect(rowOf(page, title)).toHaveCount(0, { timeout: 10_000 });

    // cleanup 목록에서 제거.
    const idx = createdTodos.findIndex((t) => t.id === seeded.id);
    if (idx >= 0) createdTodos.splice(idx, 1);
  });

  // -------------------------------------------------------------------------
  // T9. overdue 마감일 색상 — 과거 날짜 + completed=false 시 위험 색 클래스 적용
  // -------------------------------------------------------------------------
  test("T9: 과거 마감일 + 미완료 todo 는 마감일 셀에 위험 색 클래스가 적용된다", async ({
    page,
    request,
  }) => {
    const title = uniqueTitle("t9-overdue");
    const pastDate = "2020-01-01";
    const seeded = await seedTodoViaApi(request, {
      title,
      dueDate: pastDate,
    });

    await page.reload();
    const row = rowOf(page, title);
    await expect(row).toBeVisible();

    // 마감일 셀 — TableColumn 순서: 0=체크, 1=제목, 2=마감일, 3=상태, 4=액션.
    const dueCell = row.locator("td").nth(2);
    await expect(dueCell).toContainText(pastDate);

    // overdue 분기에서 className 에 `text-red-red900` 가 들어감.
    const dueSpan = dueCell.locator("span").first();
    await expect(dueSpan).toHaveClass(/text-red-red900/);

    // 상태 배지는 "기한 지남" Chip.
    const statusCell = row.locator("td").nth(3);
    await expect(statusCell).toContainText("기한 지남");

    // cleanup 은 afterAll 에서 처리. 단, 현재 화면에서 제거해야 다음 테스트 영향 없음.
    // → afterAll 의 DELETE 가 처리하므로 명시 cleanup 생략.
    void seeded;
  });

  // -------------------------------------------------------------------------
  // T10. 한글 IME 안전성 — 제목 필드에 pressSequentially 로 한글 입력
  // -------------------------------------------------------------------------
  test("T10: 제목에 한글을 pressSequentially 로 입력해도 그대로 저장된다", async ({
    page,
  }) => {
    const koreanTitle = `한글-${uniqueTitle("t10")}`;

    await gotoCreateForm(page);

    // 한글은 OS IME 없이 키이벤트만으로 조합되지 않음.
    // pressSequentially 는 각 글자를 insertText 로 직접 삽입 → 한글 통과.
    // Input.processValue 는 allowSpaces=true 라 한글 + 공백 + 하이픈 모두 보존.
    await titleField(page).pressSequentially(koreanTitle, { delay: 30 });
    await expect(titleField(page)).toHaveValue(koreanTitle);

    const postResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/todos") &&
        resp.request().method() === "POST" &&
        resp.status() === 201,
    );
    await saveButton(page).click();
    const resp = await postResponse;
    const body = (await resp.json()) as { id: number; title: string };
    createdTodos.push({ id: body.id, title: body.title });

    // 응답 title 이 입력값과 동일.
    expect(body.title).toBe(koreanTitle);

    // 목록에 한글 그대로 표기.
    await expect(page).toHaveURL(/\/todos$/);
    await expect(rowOf(page, koreanTitle)).toBeVisible({ timeout: 10_000 });
  });
});

/**
 * 오늘 기준 N일 후의 ISO 날짜 (YYYY-MM-DD) 반환. 음수도 허용 (과거).
 * 테스트 안정성: Date 인스턴스가 로컬 타임존 기준이므로 toISOString().slice(0,10)
 * 대신 로컬 Y/M/D 를 직접 포매팅한다 (UTC 변환 시 하루 어긋날 수 있음).
 */
function isoDateOffset(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
