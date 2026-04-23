import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Todo 피처 통합 e2e — UI ↔ DTO ↔ MySQL 엇갈림 검증.
 *
 * 전제:
 *  - 백엔드(example-api) 가 http://localhost:8080 에 실 MySQL dev 프로필로 기동.
 *  - 프론트 Vite dev 서버는 playwright.config.ts 의 webServer 로 자동 기동 (:3000).
 *  - 화면 단위 e2e (tests/e2e/todo.spec.ts) 는 "프론트 동작" 을 커버.
 *    이 스펙은 "프론트 요청 → 서버 상태 → 프론트 재조회" 의 왕복 정합 + 서버 계약을 검증.
 *
 * 설계 원칙:
 *  - 실 API 호출만 사용 (mock 없음). 백엔드 응답 스키마 / 상태 코드 / 헤더를 직접 관찰.
 *  - 실 MySQL DB 에 데이터가 쌓이므로 unique prefix + afterAll cleanup 으로 격리.
 *  - UI 상에 렌더 확인 → 직접 `APIRequestContext` (baseURL `http://localhost:8080`) 로 서버 단 확인.
 *  - Vite 프록시 경로(`/api/todos`) 가 아닌 백엔드 원본 포트(:8080) 로 직접 요청 —
 *    프록시 설정 자체가 잘못된 경우에도 탐지한다.
 *  - 셀렉터 패턴은 tests/e2e/todo.spec.ts 와 동일 (getByRole + placeholder).
 *  - Todo 는 모달 없음 → 페이지 전환 기반 폼.
 */

const API_BASE = "http://localhost:8080";

interface CreatedTodoRef {
  id: number;
  title: string;
}

/** afterAll 에서 삭제할 대상. 각 테스트가 생성하면 push, 테스트 내에서 삭제 확인되면 pop. */
const createdTodos: CreatedTodoRef[] = [];

function uniquePrefix(tag: string): string {
  return `IT-T-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function uniqueTitle(tag: string): string {
  return uniquePrefix(tag);
}

// ---------------------------------------------------------------------------
// API helpers — 실 백엔드 직접 호출 (:8080)
// ---------------------------------------------------------------------------

interface TodoDto {
  id: number;
  title: string;
  completed: boolean;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

async function apiList(
  request: APIRequestContext,
  status?: "all" | "active" | "completed" | "invalid",
) {
  const url =
    status === undefined
      ? `${API_BASE}/todos`
      : `${API_BASE}/todos?status=${status}`;
  return request.get(url);
}

async function apiGet(request: APIRequestContext, id: number) {
  return request.get(`${API_BASE}/todos/${id}`);
}

async function apiCreate(
  request: APIRequestContext,
  body: { title: string; dueDate?: string | null },
) {
  return request.post(`${API_BASE}/todos`, { data: body });
}

async function apiUpdate(
  request: APIRequestContext,
  id: number,
  body: Record<string, unknown>,
) {
  return request.put(`${API_BASE}/todos/${id}`, { data: body });
}

async function apiToggle(request: APIRequestContext, id: number) {
  return request.patch(`${API_BASE}/todos/${id}/toggle`);
}

async function apiDelete(request: APIRequestContext, id: number) {
  return request.delete(`${API_BASE}/todos/${id}`);
}

// ---------------------------------------------------------------------------
// UI helpers — tests/e2e/todo.spec.ts 와 동일 패턴
// ---------------------------------------------------------------------------

async function gotoTodoList(page: Page) {
  await page.goto("/todos");
  await expect(
    page.getByRole("heading", { name: "할 일", level: 1 }),
  ).toBeVisible();
  await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
}

async function gotoCreateForm(page: Page) {
  await page.getByRole("button", { name: /\+\s*새 할 일/ }).click();
  await expect(page).toHaveURL(/\/todos\/new$/);
  await expect(
    page.getByRole("heading", { name: "새 할 일", level: 1 }),
  ).toBeVisible();
}

function titleField(page: Page) {
  return page.getByPlaceholder("예: 디자인 시안 리뷰 노트 정리");
}

function saveButton(page: Page) {
  return page.getByRole("button", { name: /^저장$|^저장 중…$/ });
}

/** RegExp 메타문자 이스케이프 — title 에 `+`, `(`, `)` 등이 들어가도 안전 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rowOf(page: Page, title: string) {
  return page.getByRole("row", { name: new RegExp(escapeRegExp(title)) });
}

// ---------------------------------------------------------------------------
// Spec
// ---------------------------------------------------------------------------

test.describe("Todo 통합 시나리오", () => {
  test.afterAll(async ({ request }) => {
    // 누락된 cleanup — 실패해도 무시. 테스트 종료 후 DB 에 IT-T- 프리픽스 데이터가 남지 않도록.
    for (const t of createdTodos.splice(0)) {
      try {
        await apiDelete(request, t.id);
      } catch {
        /* noop */
      }
    }
  });

  // -------------------------------------------------------------------------
  // T1. UI 생성 → API 검증 → API 토글 → UI 반영 → UI 삭제 → API 404
  // -------------------------------------------------------------------------
  test("T1: UI 생성 → API 조회 → API 토글 → UI 반영 → UI 삭제 → API 404", async ({
    page,
    request,
  }) => {
    const title = uniqueTitle("t1");

    // 1) UI 에서 생성.
    await gotoTodoList(page);
    await gotoCreateForm(page);
    await titleField(page).pressSequentially(title, { delay: 15 });
    await expect(titleField(page)).toHaveValue(title);

    const postResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/todos") &&
        resp.request().method() === "POST" &&
        resp.status() === 201,
    );
    await saveButton(page).click();
    const resp = await postResponse;
    const created = (await resp.json()) as TodoDto;
    createdTodos.push({ id: created.id, title: created.title });

    // /todos 복귀 확인.
    await expect(page).toHaveURL(/\/todos$/);

    // 2) API /todos 에 실재하는지 (:8080 직접).
    const listRes = await apiList(request);
    expect(listRes.status(), "GET /todos").toBe(200);
    const list = (await listRes.json()) as TodoDto[];
    const found = list.find((t) => t.title === title);
    expect(found, "API 목록에 UI 생성 todo 가 존재").toBeTruthy();
    expect(found!.id).toBe(created.id);
    expect(found!.completed).toBe(false);
    expect(found!.dueDate).toBeNull();
    expect(found!.createdAt).toBeTruthy();
    expect(found!.updatedAt).toBeTruthy();

    // 3) API 로 토글 → 200 + completed=true.
    const toggle = await apiToggle(request, created.id);
    expect(toggle.status(), "PATCH /todos/{id}/toggle").toBe(200);
    const toggled = (await toggle.json()) as TodoDto;
    expect(toggled.completed).toBe(true);

    // 4) UI reload 후 완료 스타일 반영 (제목 셀 span line-through).
    await page.reload();
    await expect(page.locator("table")).toBeVisible();
    const row = rowOf(page, title);
    await expect(row).toBeVisible();
    const checkbox = row.getByRole("checkbox").first();
    await expect(checkbox).toHaveAttribute("aria-checked", "true", {
      timeout: 5_000,
    });
    // 제목 셀 (0=체크, 1=제목) 내부 span 에 line-through 클래스.
    const titleCell = row.locator("td").nth(1);
    await expect(titleCell.locator("span").first()).toHaveClass(/line-through/);

    // 5) UI 에서 삭제 (confirm accept) → DELETE 204 응답 대기.
    page.once("dialog", (dialog) => {
      expect(dialog.type()).toBe("confirm");
      void dialog.accept();
    });
    const deletePromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/todos/${created.id}`) &&
        r.request().method() === "DELETE" &&
        r.status() === 204,
    );
    await row.getByRole("button", { name: "삭제" }).click();
    await deletePromise;
    await expect(rowOf(page, title)).toHaveCount(0, { timeout: 10_000 });

    // 6) API 로 확인 — 404 (hard delete).
    const getAfter = await apiGet(request, created.id);
    expect(getAfter.status(), "삭제 후 GET /todos/{id}").toBe(404);

    // cleanup 목록에서 제거.
    const idx = createdTodos.findIndex((t) => t.id === created.id);
    if (idx >= 0) createdTodos.splice(idx, 1);
  });

  // -------------------------------------------------------------------------
  // T2. API 생성 3건 순차 → createdAt DESC 정렬 (API + UI 동일)
  // -------------------------------------------------------------------------
  test("T2: API 생성 3건 순차 → GET /todos 는 createdAt DESC 순, UI 행 순서도 동일", async ({
    page,
    request,
  }) => {
    const tag = uniquePrefix("t2");
    const a = { title: `${tag}-A` };
    const b = { title: `${tag}-B` };
    const c = { title: `${tag}-C` };

    const resA = await apiCreate(request, a);
    expect(resA.status()).toBe(201);
    const idA = ((await resA.json()) as TodoDto).id;
    createdTodos.push({ id: idA, title: a.title });

    await page.waitForTimeout(15);

    const resB = await apiCreate(request, b);
    expect(resB.status()).toBe(201);
    const idB = ((await resB.json()) as TodoDto).id;
    createdTodos.push({ id: idB, title: b.title });

    await page.waitForTimeout(15);

    const resC = await apiCreate(request, c);
    expect(resC.status()).toBe(201);
    const idC = ((await resC.json()) as TodoDto).id;
    createdTodos.push({ id: idC, title: c.title });

    // API 순서 — 같은 tag prefix 3 건 추출.
    const listRes = await apiList(request);
    expect(listRes.status()).toBe(200);
    const list = (await listRes.json()) as TodoDto[];
    const ours = list.filter((t) => t.title.startsWith(tag));
    expect(ours, "같은 tag prefix 3 건 모두 조회").toHaveLength(3);
    // createdAt DESC → C, B, A.
    expect(ours.map((t) => t.id)).toEqual([idC, idB, idA]);

    // UI 순서 — 같은 tag prefix 3 행의 순서.
    await gotoTodoList(page);
    const rowsLocator = page.locator("table tbody tr").filter({
      has: page.getByText(new RegExp(escapeRegExp(tag))),
    });
    await expect(rowsLocator).toHaveCount(3);
    const rowTexts = await rowsLocator.allInnerTexts();
    expect(rowTexts[0]).toContain(`${tag}-C`);
    expect(rowTexts[1]).toContain(`${tag}-B`);
    expect(rowTexts[2]).toContain(`${tag}-A`);
  });

  // -------------------------------------------------------------------------
  // T3. status 쿼리 서버사이드 필터 (API)
  // -------------------------------------------------------------------------
  test("T3: status 쿼리 파라미터가 서버사이드 필터로 동작하며 invalid 값은 400", async ({
    request,
  }) => {
    const tag = uniquePrefix("t3");
    const a = { title: `${tag}-A` };
    const b = { title: `${tag}-B` };
    const c = { title: `${tag}-C` };

    // 3건 생성.
    const resA = await apiCreate(request, a);
    expect(resA.status()).toBe(201);
    const idA = ((await resA.json()) as TodoDto).id;
    createdTodos.push({ id: idA, title: a.title });

    const resB = await apiCreate(request, b);
    expect(resB.status()).toBe(201);
    const idB = ((await resB.json()) as TodoDto).id;
    createdTodos.push({ id: idB, title: b.title });

    const resC = await apiCreate(request, c);
    expect(resC.status()).toBe(201);
    const idC = ((await resC.json()) as TodoDto).id;
    createdTodos.push({ id: idC, title: c.title });

    // A, B 토글 → completed=true.
    expect((await apiToggle(request, idA)).status()).toBe(200);
    expect((await apiToggle(request, idB)).status()).toBe(200);

    // status=active → C 만.
    const activeRes = await apiList(request, "active");
    expect(activeRes.status()).toBe(200);
    const activeList = (await activeRes.json()) as TodoDto[];
    const activeOurs = activeList.filter((t) => t.title.startsWith(tag));
    expect(activeOurs.map((t) => t.id)).toEqual([idC]);
    // 모두 completed=false 인지 재확인.
    expect(activeOurs.every((t) => t.completed === false)).toBe(true);

    // status=completed → A, B.
    const completedRes = await apiList(request, "completed");
    expect(completedRes.status()).toBe(200);
    const completedList = (await completedRes.json()) as TodoDto[];
    const completedOurs = completedList
      .filter((t) => t.title.startsWith(tag))
      .sort((x, y) => x.id - y.id);
    expect(completedOurs.map((t) => t.id)).toEqual([idA, idB]);
    expect(completedOurs.every((t) => t.completed === true)).toBe(true);

    // status=all → 3건 모두.
    const allRes = await apiList(request, "all");
    expect(allRes.status()).toBe(200);
    const allList = (await allRes.json()) as TodoDto[];
    const allOurs = allList.filter((t) => t.title.startsWith(tag));
    expect(allOurs).toHaveLength(3);

    // status=invalid → 400.
    const invalidRes = await apiList(request, "invalid");
    expect(invalidRes.status(), "잘못된 status 값은 400").toBe(400);
  });

  // -------------------------------------------------------------------------
  // T4. PUT 전체 교체 (API)
  // -------------------------------------------------------------------------
  test("T4: PUT /todos/{id} 전체 교체 시맨틱 — 정상 / 필드 누락(400) / dueDate 갱신", async ({
    request,
  }) => {
    const origTitle = uniqueTitle("t4-orig");
    const create = await apiCreate(request, { title: origTitle });
    expect(create.status()).toBe(201);
    const created = (await create.json()) as TodoDto;
    createdTodos.push({ id: created.id, title: created.title });
    expect(created.completed).toBe(false);
    expect(created.dueDate).toBeNull();

    // 1) 정상 PUT — 전체 필드 교체 (title 변경 + completed=true + dueDate=null 명시).
    const newTitle = uniqueTitle("t4-new");
    const putOk = await apiUpdate(request, created.id, {
      title: newTitle,
      completed: true,
      dueDate: null,
    });
    expect(putOk.status(), "PUT 정상 200").toBe(200);
    const putOkBody = (await putOk.json()) as TodoDto;
    expect(putOkBody.id).toBe(created.id);
    expect(putOkBody.title).toBe(newTitle);
    expect(putOkBody.completed).toBe(true);
    expect(putOkBody.dueDate).toBeNull();

    // 재조회로도 동일.
    const reget = await apiGet(request, created.id);
    expect(reget.status()).toBe(200);
    const regetBody = (await reget.json()) as TodoDto;
    expect(regetBody.title).toBe(newTitle);
    expect(regetBody.completed).toBe(true);
    expect(regetBody.dueDate).toBeNull();

    // cleanup 추적 title 갱신.
    const ref = createdTodos.find((t) => t.id === created.id);
    if (ref) ref.title = newTitle;

    // 2) PUT 에 title 만 보냄 — @NotBlank 타깃 필드 (completed) 누락 시 Kotlin non-null
    //    역직렬화 실패 → 400. (Jackson Kotlin module 이 non-null 필드에 null 주입 거부.)
    const putMissing = await apiUpdate(request, created.id, {
      title: uniqueTitle("t4-missing"),
    });
    expect(
      putMissing.status(),
      "PUT 에 completed 누락 시 400 (전체 교체 계약)",
    ).toBe(400);

    // 3) dueDate 를 미래 날짜로 갱신.
    const newDue = "2030-01-01";
    const putDue = await apiUpdate(request, created.id, {
      title: newTitle,
      completed: true,
      dueDate: newDue,
    });
    expect(putDue.status(), "PUT dueDate 반영 200").toBe(200);
    const putDueBody = (await putDue.json()) as TodoDto;
    expect(putDueBody.dueDate).toBe(newDue);

    // 재조회로 확정.
    const reget2 = await apiGet(request, created.id);
    const reget2Body = (await reget2.json()) as TodoDto;
    expect(reget2Body.dueDate).toBe(newDue);
  });

  // -------------------------------------------------------------------------
  // T5. 없는 id — GET / PUT / PATCH / DELETE 모두 404
  // -------------------------------------------------------------------------
  test("T5: 존재하지 않는 id 에 대해 GET/PUT/PATCH/DELETE 모두 404", async ({
    request,
  }) => {
    const absurdId = 999_999_999;

    const g = await apiGet(request, absurdId);
    expect(g.status(), "GET /todos/999999999").toBe(404);
    const gBody = await g.json().catch(() => null);
    expect(gBody, "404 body 는 JSON").toBeTruthy();
    expect(
      typeof gBody.message === "string" && gBody.message.length > 0,
      "404 body.message 가 비어있지 않은 문자열",
    ).toBe(true);

    const p = await apiUpdate(request, absurdId, {
      title: uniqueTitle("t5"),
      completed: false,
      dueDate: null,
    });
    expect(p.status(), "PUT /todos/999999999").toBe(404);

    const patch = await apiToggle(request, absurdId);
    expect(patch.status(), "PATCH /todos/999999999/toggle").toBe(404);

    const d = await apiDelete(request, absurdId);
    expect(d.status(), "DELETE /todos/999999999").toBe(404);
  });

  // -------------------------------------------------------------------------
  // T6. 유효성 경계 (API) — POST 계약
  // -------------------------------------------------------------------------
  test("T6: 생성 유효성 경계 — 공백/201자 → 400, 200자/dueDate 없음/dueDate 있음 → 201", async ({
    request,
  }) => {
    // 1) title 공백만 → 400 (@NotBlank).
    const blank = await apiCreate(request, { title: "   " });
    expect(blank.status(), "공백만 title → 400").toBe(400);

    // 2) title 201자 → 400 (@Size(max=200)).
    const tooLong = await apiCreate(request, {
      title: "가".repeat(201),
      dueDate: null,
    });
    expect(tooLong.status(), "title 201자 → 400").toBe(400);

    // 3) title 정확 200자 → 201.
    const boundaryTitle = `${uniquePrefix("t6-200")}${"가".repeat(
      200 - uniquePrefix("t6-200").length,
    )}`;
    // 프리픽스 길이 보정 위해 fix 길이로 다시 산출:
    const rawTitle = `IT-T-t6b-${Date.now()}`;
    const padLen = 200 - rawTitle.length;
    const boundary200 = rawTitle + "가".repeat(Math.max(0, padLen));
    expect(boundary200.length, "정확 200자 타이틀").toBe(200);
    const ok200 = await apiCreate(request, { title: boundary200 });
    expect(ok200.status(), "title 정확 200자 → 201").toBe(201);
    const ok200Body = (await ok200.json()) as TodoDto;
    expect(ok200Body.title.length).toBe(200);
    createdTodos.push({ id: ok200Body.id, title: ok200Body.title });

    // 4) dueDate 누락 → 201, response.dueDate == null.
    const noDue = await apiCreate(request, { title: uniqueTitle("t6-nodue") });
    expect(noDue.status(), "dueDate 누락 → 201").toBe(201);
    const noDueBody = (await noDue.json()) as TodoDto;
    expect(noDueBody.dueDate).toBeNull();
    createdTodos.push({ id: noDueBody.id, title: noDueBody.title });

    // 5) dueDate "2030-01-01" → 201 + 반영.
    const withDue = await apiCreate(request, {
      title: uniqueTitle("t6-withdue"),
      dueDate: "2030-01-01",
    });
    expect(withDue.status(), "미래 dueDate → 201").toBe(201);
    const withDueBody = (await withDue.json()) as TodoDto;
    expect(withDueBody.dueDate).toBe("2030-01-01");
    createdTodos.push({ id: withDueBody.id, title: withDueBody.title });

    // silence unused warning.
    void boundaryTitle;
  });

  // -------------------------------------------------------------------------
  // T7. 한글 IME UTF-8 왕복 (UI ↔ API)
  // -------------------------------------------------------------------------
  test("T7: UI 한글 제목 저장 → API 응답/목록이 바이트 수준으로 동일한 문자열 반환", async ({
    page,
    request,
  }) => {
    const tag = uniquePrefix("t7");
    const title = `한글 할일 ${tag}`;

    await gotoTodoList(page);
    await gotoCreateForm(page);
    // pressSequentially 는 각 글자를 insertText 로 삽입 → 한글/공백 보존.
    await titleField(page).pressSequentially(title, { delay: 25 });
    await expect(titleField(page)).toHaveValue(title);

    const postResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/todos") &&
        resp.request().method() === "POST" &&
        resp.status() === 201,
    );
    await saveButton(page).click();
    const resp = await postResponse;
    const body = (await resp.json()) as TodoDto;
    createdTodos.push({ id: body.id, title: body.title });
    // 저장 응답 자체에 한글이 그대로 실려 있어야 함.
    expect(body.title).toBe(title);

    // 서버 단 (:8080 직접) 목록 조회로 UTF-8 왕복 확인.
    const listRes = await apiList(request);
    expect(listRes.status()).toBe(200);
    const list = (await listRes.json()) as TodoDto[];
    const found = list.find((t) => t.id === body.id);
    expect(found, "API 목록에 한글 todo").toBeTruthy();
    expect(
      found!.title,
      "한글 제목이 바이트 수준에서도 일치 (MySQL utf8mb4 + JPA 경로)",
    ).toBe(title);

    // 단건 조회도 확인.
    const one = await apiGet(request, body.id);
    expect(one.status()).toBe(200);
    const oneBody = (await one.json()) as TodoDto;
    expect(oneBody.title).toBe(title);
  });

  // -------------------------------------------------------------------------
  // T8. 토글 낙관적 업데이트 — UI state ↔ 서버 state 최종 일치
  // -------------------------------------------------------------------------
  test("T8: UI 토글 후 서버 state 조회 결과와 UI aria-checked 가 일치한다", async ({
    page,
    request,
  }) => {
    // pre-seed (:8080 직접 — 프록시 아닌 실 API 로).
    const title = uniqueTitle("t8");
    const seedRes = await apiCreate(request, { title });
    expect(seedRes.status()).toBe(201);
    const seeded = (await seedRes.json()) as TodoDto;
    createdTodos.push({ id: seeded.id, title: seeded.title });
    expect(seeded.completed).toBe(false);

    // UI 로드 → 행 + 체크박스 (false).
    await gotoTodoList(page);
    const row = rowOf(page, title);
    await expect(row).toBeVisible();
    const checkbox = row.getByRole("checkbox").first();
    await expect(checkbox).toHaveAttribute("aria-checked", "false");

    // UI 토글 → PATCH /todos/{id}/toggle 200 대기 (낙관적 업데이트 후 서버 응답까지).
    const togglePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/todos/${seeded.id}/toggle`) &&
        resp.request().method() === "PATCH" &&
        resp.status() === 200,
    );
    await checkbox.click();
    await togglePromise;

    // UI 최종 상태 — true.
    await expect(checkbox).toHaveAttribute("aria-checked", "true", {
      timeout: 5_000,
    });

    // 서버 단 단건 조회로 실제 completed 필드 확인 — UI 와 일치해야 함.
    const afterFirst = await apiGet(request, seeded.id);
    expect(afterFirst.status()).toBe(200);
    const afterFirstBody = (await afterFirst.json()) as TodoDto;
    expect(afterFirstBody.completed, "UI=true → 서버도 true").toBe(true);

    // 다시 토글 → false 로 롤백되어야 하고 서버도 false.
    const togglePromise2 = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/todos/${seeded.id}/toggle`) &&
        resp.request().method() === "PATCH" &&
        resp.status() === 200,
    );
    await checkbox.click();
    await togglePromise2;

    await expect(checkbox).toHaveAttribute("aria-checked", "false", {
      timeout: 5_000,
    });

    const afterSecond = await apiGet(request, seeded.id);
    expect(afterSecond.status()).toBe(200);
    const afterSecondBody = (await afterSecond.json()) as TodoDto;
    expect(afterSecondBody.completed, "UI=false → 서버도 false").toBe(false);
  });
});
