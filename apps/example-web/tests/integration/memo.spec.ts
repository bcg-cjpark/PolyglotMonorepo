import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Memo 피처 통합 e2e — UI ↔ DTO ↔ DB 엇갈림 검증.
 *
 * 전제:
 *  - 백엔드(example-api) 가 http://localhost:8080 에 실 MySQL dev 프로필로 기동.
 *  - 프론트 Vite dev 서버는 playwright.config.ts 의 webServer 로 자동 기동 (:3000).
 *  - 화면 단위 e2e (tests/e2e/memo.spec.ts) 는 UI 인터랙션만 검증.
 *    이 스펙은 "UI → 서버 상태 왕복" 정합 + API 계약 (페이징/전체교체 PUT/404/유효성) 을
 *    실 백엔드에 직접 묻는다.
 *
 * 설계 원칙:
 *  - 실 API 호출만 사용 (mock 없음).
 *  - unique prefix (`IT-M-${Date.now()}-${rand}`) + afterAll cleanup 으로 dev DB 오염 최소화.
 *  - API 호출은 백엔드 원본 포트 (:8080) 로 직접 (Vite 프록시 우회 → 프록시 문제도 탐지).
 *  - Memo id 는 UUID 문자열.
 */

const API_BASE = "http://localhost:8080";
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

interface MemoResponse {
  id: string;
  title: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MemoPage {
  content: MemoResponse[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

interface CreatedMemoRef {
  id: string;
  title: string;
}

/** afterAll 에서 hard delete 할 대상. */
const createdMemos: CreatedMemoRef[] = [];

function uniquePrefix(tag: string): string {
  const rand = Math.random().toString(36).slice(2, 7);
  return `IT-M-${tag}-${Date.now()}-${rand}`;
}

// ---------------------------------------------------------------------------
// API helpers — 실 백엔드 직접 호출 (UUID 문자열 id)
// ---------------------------------------------------------------------------

async function apiList(
  request: APIRequestContext,
  page = 0,
  size = 20,
): Promise<MemoPage> {
  const res = await request.get(
    `${API_BASE}/memos?page=${page}&size=${size}`,
  );
  expect(res.status(), `GET /memos?page=${page}&size=${size} status`).toBe(200);
  return (await res.json()) as MemoPage;
}

async function apiListDefault(request: APIRequestContext): Promise<MemoPage> {
  const res = await request.get(`${API_BASE}/memos`);
  expect(res.status(), "GET /memos status").toBe(200);
  return (await res.json()) as MemoPage;
}

async function apiGet(request: APIRequestContext, id: string) {
  return request.get(`${API_BASE}/memos/${id}`);
}

async function apiCreate(
  request: APIRequestContext,
  body: { title: string; content?: string | null },
) {
  return request.post(`${API_BASE}/memos`, { data: body });
}

async function apiUpdate(
  request: APIRequestContext,
  id: string,
  body: Record<string, unknown>,
) {
  return request.put(`${API_BASE}/memos/${id}`, { data: body });
}

async function apiDelete(request: APIRequestContext, id: string) {
  return request.delete(`${API_BASE}/memos/${id}`);
}

/**
 * 특정 prefix 의 메모를 전체 페이지에서 수집.
 * dev DB 가 누적된다는 전제에서 totalPages 만큼 순회.
 */
async function collectMemosByPrefix(
  request: APIRequestContext,
  prefix: string,
  pageSize = 50,
): Promise<MemoResponse[]> {
  const first = await apiList(request, 0, pageSize);
  const collected: MemoResponse[] = first.content.filter((m) =>
    m.title.startsWith(prefix),
  );
  for (let p = 1; p < first.totalPages; p += 1) {
    const pageRes = await apiList(request, p, pageSize);
    for (const m of pageRes.content) {
      if (m.title.startsWith(prefix)) collected.push(m);
    }
  }
  return collected;
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

async function gotoMemoList(page: Page) {
  await page.goto("/memos");
  await expect(
    page.getByRole("heading", { name: "메모", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /\+\s*새 메모/ }),
  ).toBeVisible();
}

async function openCreateModal(page: Page) {
  await page.getByRole("button", { name: /\+\s*새 메모/ }).click();
  await expect(page.locator(".modal-container")).toBeVisible();
  await expect(page.getByRole("heading", { name: "새 메모" })).toBeVisible();
}

function titleField(page: Page) {
  return page.getByPlaceholder("예: 오늘 할 일");
}

function contentField(page: Page) {
  return page.getByPlaceholder(/본문은 비워둘 수 있습니다/);
}

function saveButton(page: Page) {
  return page
    .locator(".modal-container")
    .getByRole("button", { name: /^저장$|^저장 중…$/ });
}

function deleteButton(page: Page) {
  return page
    .locator(".modal-container")
    .getByRole("button", { name: /^삭제$|^삭제 중…$/ });
}

function editButton(page: Page) {
  return page.locator(".modal-container").getByRole("button", { name: "편집" });
}

function memoCard(page: Page, title: string) {
  return page.getByRole("button", { name: `메모 열기: ${title}` });
}

// ---------------------------------------------------------------------------
// Spec
// ---------------------------------------------------------------------------

test.describe("Memo 통합 시나리오", () => {
  test.afterAll(async ({ request }) => {
    // 누적된 createdMemos 를 hard delete. 이미 지워진 id 는 404 무시.
    for (const m of createdMemos.splice(0)) {
      try {
        await apiDelete(request, m.id);
      } catch {
        /* noop */
      }
    }
  });

  // -------------------------------------------------------------------------
  // T1. UI 생성 → API 검증 → UI 편집 → API 반영 → UI 삭제 → API 404
  // -------------------------------------------------------------------------
  test("T1: UI 생성/편집/삭제 플로우가 API 상태와 일치한다", async ({
    page,
    request,
  }) => {
    const createdTitle = `${uniquePrefix("t1")}-생성`;
    const createdContent = "첫 본문\n두 번째 줄";

    // 1) UI 생성.
    await gotoMemoList(page);
    await openCreateModal(page);
    await titleField(page).pressSequentially(createdTitle, { delay: 15 });
    await contentField(page).pressSequentially(createdContent, { delay: 10 });

    const postResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/memos") &&
        resp.request().method() === "POST" &&
        resp.status() === 201,
    );
    await saveButton(page).click();
    await postResponse;

    // 모달 닫힘.
    await expect(page.locator(".modal-container")).toHaveCount(0, {
      timeout: 10_000,
    });

    // 2) API 목록에서 해당 제목 찾기 + id 추출 + timestamp 검증.
    const listRes = await apiList(request, 0, 50);
    const apiRow = listRes.content.find((m) => m.title === createdTitle);
    expect(apiRow, "API /memos 에 UI 생성 메모가 있어야 함").toBeTruthy();
    expect(apiRow!.content).toBe(createdContent);
    expect(apiRow!.createdAt, "createdAt 비어있지 않음").toBeTruthy();
    expect(apiRow!.updatedAt, "updatedAt 비어있지 않음").toBeTruthy();
    const memoId = apiRow!.id;
    const initialUpdatedAt = apiRow!.updatedAt;
    createdMemos.push({ id: memoId, title: createdTitle });

    // UUID 형식 확인 (36자 with 하이픈).
    expect(memoId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // 3) UI 편집 — 카드 → 상세 → 편집 → 제목 수정 → 저장.
    await expect(memoCard(page, createdTitle)).toBeVisible({ timeout: 10_000 });
    await memoCard(page, createdTitle).click();
    await expect(
      page.getByRole("heading", { name: createdTitle }),
    ).toBeVisible();
    await editButton(page).click();
    await expect(
      page.getByRole("heading", { name: "메모 편집" }),
    ).toBeVisible();
    await expect(titleField(page)).toHaveValue(createdTitle);

    const editedTitle = `${createdTitle}-수정`;
    await titleField(page).fill("");
    await titleField(page).pressSequentially(editedTitle, { delay: 10 });

    // PUT /memos/{id} 응답 대기 (프론트는 Vite 프록시 /api/memos 경유 — url include 로 매칭).
    const putResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/memos/${memoId}`) &&
        resp.request().method() === "PUT" &&
        resp.status() === 200,
    );
    await saveButton(page).click();
    await putResponse;

    await expect(page.locator(".modal-container")).toHaveCount(0, {
      timeout: 10_000,
    });

    // 4) API 재조회 → 새 제목 + updatedAt 갱신.
    // MySQL TIMESTAMP(6) 해상도에서 createdAt 과 updatedAt 이 같은 tick 으로
    // 찍히는 극단을 피하기 위해 PUT 전후 간격이 pressSequentially 로 충분.
    const afterEdit = await apiGet(request, memoId);
    expect(afterEdit.status(), "편집 후 GET /memos/{id}").toBe(200);
    const afterEditBody = (await afterEdit.json()) as MemoResponse;
    expect(afterEditBody.title).toBe(editedTitle);
    expect(afterEditBody.content).toBe(createdContent);
    expect(afterEditBody.updatedAt, "updatedAt 이 갱신").not.toBe(
      initialUpdatedAt,
    );
    // createdAt 은 불변.
    expect(afterEditBody.createdAt).toBe(apiRow!.createdAt);

    // cleanup 목록의 title 도 갱신.
    const refIdx = createdMemos.findIndex((m) => m.id === memoId);
    if (refIdx >= 0) createdMemos[refIdx].title = editedTitle;

    // 5) UI 삭제 — 카드 → 상세 → 삭제 → 삭제 확인 → "삭제" 클릭.
    await expect(memoCard(page, editedTitle)).toBeVisible({ timeout: 10_000 });
    await memoCard(page, editedTitle).click();
    await expect(
      page.getByRole("heading", { name: editedTitle }),
    ).toBeVisible();
    await deleteButton(page).click();
    await expect(
      page.getByRole("heading", { name: "메모 삭제" }),
    ).toBeVisible();

    const deleteResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/memos/${memoId}`) &&
        resp.request().method() === "DELETE" &&
        resp.status() === 204,
    );
    await deleteButton(page).click(); // 확인 모달의 Primary "삭제".
    await deleteResponse;

    await expect(page.locator(".modal-container")).toHaveCount(0, {
      timeout: 10_000,
    });

    // 6) API 단건 조회 → 404.
    const afterDelete = await apiGet(request, memoId);
    expect(afterDelete.status(), "삭제 후 GET /memos/{id}").toBe(404);

    // cleanup 제거.
    const rmIdx = createdMemos.findIndex((m) => m.id === memoId);
    if (rmIdx >= 0) createdMemos.splice(rmIdx, 1);
  });

  // -------------------------------------------------------------------------
  // T2. API 3 건 → createdAt DESC → UI 카드 순서 일치
  // -------------------------------------------------------------------------
  test("T2: API 로 3건 생성 시 UI 카드가 createdAt DESC 순으로 렌더된다", async ({
    page,
    request,
  }) => {
    const prefix = uniquePrefix("t2");
    const titleA = `${prefix}-A`;
    const titleB = `${prefix}-B`;
    const titleC = `${prefix}-C`;

    const resA = await apiCreate(request, { title: titleA, content: "a" });
    expect(resA.status()).toBe(201);
    const memoA = (await resA.json()) as MemoResponse;
    createdMemos.push({ id: memoA.id, title: titleA });

    await page.waitForTimeout(15);

    const resB = await apiCreate(request, { title: titleB, content: "b" });
    expect(resB.status()).toBe(201);
    const memoB = (await resB.json()) as MemoResponse;
    createdMemos.push({ id: memoB.id, title: titleB });

    await page.waitForTimeout(15);

    const resC = await apiCreate(request, { title: titleC, content: "c" });
    expect(resC.status()).toBe(201);
    const memoC = (await resC.json()) as MemoResponse;
    createdMemos.push({ id: memoC.id, title: titleC });

    // API — 같은 prefix 로만 필터한 순서가 C, B, A.
    const list = await apiList(request, 0, 50);
    const ours = list.content.filter((m) => m.title.startsWith(prefix));
    expect(ours, "같은 prefix 3건 모두 첫 페이지에서 조회").toHaveLength(3);
    expect(ours.map((m) => m.title)).toEqual([titleC, titleB, titleA]);

    // UI — /memos 진입, 같은 prefix 카드 세 개의 DOM 순서 확인.
    await gotoMemoList(page);
    const cardsLocator = page.locator("button").filter({
      hasText: new RegExp(`^${prefix.replace(/-/g, "\\-")}`),
    });
    // `메모 열기: ` 를 포함하는 button 만 추림.
    const memoCards = page.getByRole("button", {
      name: new RegExp(`^메모 열기: ${prefix.replace(/-/g, "\\-")}`),
    });
    // fallback 로케이터 확인 — 가시 카드 3개.
    await expect(memoCards).toHaveCount(3, { timeout: 10_000 });

    const cardLabels = await memoCards.evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("aria-label") ?? ""),
    );
    // 각 카드 aria-label 은 "메모 열기: <title>" 형식.
    expect(cardLabels).toEqual([
      `메모 열기: ${titleC}`,
      `메모 열기: ${titleB}`,
      `메모 열기: ${titleA}`,
    ]);
    // (Unused variable silence)
    void cardsLocator;
  });

  // -------------------------------------------------------------------------
  // T3. 페이징 경계 (API) — 7건 생성 후 page/size 조합 + 기본값
  // -------------------------------------------------------------------------
  test("T3: page/size 쿼리 경계와 기본값이 계약대로 동작한다", async ({
    request,
  }) => {
    const prefix = uniquePrefix("t3");
    const count = 7;
    for (let i = 0; i < count; i += 1) {
      const title = `${prefix}-${String(i).padStart(2, "0")}`;
      const r = await apiCreate(request, { title, content: null });
      expect(r.status()).toBe(201);
      const body = (await r.json()) as MemoResponse;
      createdMemos.push({ id: body.id, title });
      // createdAt DESC 순서 보장을 위한 작은 간격 (MySQL TIMESTAMP(6)).
      if (i < count - 1) await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // page=0&size=3 — 응답 메타 확인.
    const p0 = await apiList(request, 0, 3);
    expect(p0.page).toBe(0);
    expect(p0.size).toBe(3);
    expect(p0.content.length).toBe(3);

    // page=2&size=3 — 우리 prefix 기준으로는 3번째 묶음 (index 6 하나).
    //   다만 dev DB 에 다른 레코드가 쌓여 있으므로 content.length 자체는 3일 수 있다.
    //   → 여기서는 우리 prefix 항목을 전 페이지에 걸쳐 누적한 뒤 7건을 확인.
    const p2 = await apiList(request, 2, 3);
    expect(p2.page).toBe(2);
    expect(p2.size).toBe(3);

    // 전체 페이지 훑어서 우리 prefix 7개 모두 찾음.
    const allOurs = await collectMemosByPrefix(request, prefix, 50);
    expect(allOurs, "prefix 로 누적한 7건").toHaveLength(count);

    // 모든 우리 prefix 항목을 createdAt 기준으로 DESC 정렬 단조 확인.
    const times = allOurs.map((m) => Date.parse(m.createdAt));
    for (let i = 1; i < times.length; i += 1) {
      expect(
        times[i - 1],
        `${i - 1}번 (${allOurs[i - 1].title}) createdAt 이 ${i}번 (${allOurs[i].title}) 보다 늦거나 같음`,
      ).toBeGreaterThanOrEqual(times[i]);
    }

    // 기본값 — 쿼리 없음 → page=0, size=20.
    const def = await apiListDefault(request);
    expect(def.page, "기본 page").toBe(0);
    expect(def.size, "기본 size").toBe(20);
  });

  // -------------------------------------------------------------------------
  // T4. PUT 전체 교체 (부분 업데이트 아님)
  // -------------------------------------------------------------------------
  test("T4: PUT 은 전체 교체이며 content 누락/title 공백은 400, 유효 상태는 보존된다", async ({
    request,
  }) => {
    const title0 = `${uniquePrefix("t4")}-원본`;
    const createRes = await apiCreate(request, {
      title: title0,
      content: "original",
    });
    expect(createRes.status()).toBe(201);
    const created = (await createRes.json()) as MemoResponse;
    createdMemos.push({ id: created.id, title: title0 });
    const id = created.id;

    // 1) 정상 PUT — 전체 교체 (둘 다 전달).
    const newTitle = `${uniquePrefix("t4")}-교체1`;
    const put1 = await apiUpdate(request, id, {
      title: newTitle,
      content: "replaced",
    });
    expect(put1.status(), "PUT 정상 200").toBe(200);
    const put1Body = (await put1.json()) as MemoResponse;
    expect(put1Body.title).toBe(newTitle);
    expect(put1Body.content).toBe("replaced");

    // cleanup title 갱신.
    {
      const ref = createdMemos.find((m) => m.id === id);
      if (ref) ref.title = newTitle;
    }

    // 2) content="" 교체 — PRD: content 는 빈 문자열 허용.
    const newTitle2 = `${uniquePrefix("t4")}-교체2`;
    const put2 = await apiUpdate(request, id, {
      title: newTitle2,
      content: "",
    });
    expect(put2.status(), "PUT content='' 정상 200").toBe(200);
    const put2Body = (await put2.json()) as MemoResponse;
    expect(put2Body.title).toBe(newTitle2);
    expect(put2Body.content).toBe("");

    {
      const ref = createdMemos.find((m) => m.id === id);
      if (ref) ref.title = newTitle2;
    }

    // 3) content 필드 누락 — 전체 교체 계약 위반 → 400.
    //    @NotBlank 는 null 을 거부하고 Kotlin data class 의 non-null `title`
    //    에 value 가 있어야 함. 반면 content 는 String? 이지만 PRD 계약상
    //    payload 에 항상 포함되어야 함. 현재 서버는 Jackson 역직렬화 시
    //    content 필드 누락을 null 로 처리해 200 이 될 수 있다 (nullable).
    //    → PRD 요구대로 "400" 이어야 한다는 정책 검증. 실패하면 서버 구현 간극.
    const putMissingContent = await apiUpdate(request, id, { title: "only" });
    expect(
      putMissingContent.status(),
      "PUT content 누락 → 400 (전체 교체 계약)",
    ).toBe(400);

    // 4) title 공백만 → 400.
    const putBlankTitle = await apiUpdate(request, id, {
      title: "   ",
      content: "x",
    });
    expect(putBlankTitle.status(), "PUT title 공백만 → 400").toBe(400);

    // 5) 재조회 — 마지막 유효 상태 (title=newTitle2, content="") 보존.
    const reget = await apiGet(request, id);
    expect(reget.status()).toBe(200);
    const regetBody = (await reget.json()) as MemoResponse;
    expect(regetBody.title, "실패한 PUT 이후에도 title 은 유효 마지막 값").toBe(
      newTitle2,
    );
    expect(regetBody.content, "content 도 유효 마지막 값").toBe("");
  });

  // -------------------------------------------------------------------------
  // T5. 없는 UUID — GET/PUT/DELETE 404
  // -------------------------------------------------------------------------
  test("T5: 0-UUID 에 대해 GET/PUT/DELETE 모두 404 + message 본문", async ({
    request,
  }) => {
    const g = await apiGet(request, ZERO_UUID);
    expect(g.status(), "GET 없는 UUID").toBe(404);
    const gBody = (await g.json().catch(() => null)) as {
      message?: string;
    } | null;
    expect(gBody, "404 body 는 JSON").toBeTruthy();
    expect(
      typeof gBody!.message === "string" && gBody!.message.length > 0,
      "404 body.message 가 비어있지 않은 문자열",
    ).toBe(true);

    const p = await apiUpdate(request, ZERO_UUID, {
      title: "없음",
      content: "없음",
    });
    expect(p.status(), "PUT 없는 UUID").toBe(404);

    const d = await apiDelete(request, ZERO_UUID);
    expect(d.status(), "DELETE 없는 UUID").toBe(404);
  });

  // -------------------------------------------------------------------------
  // T6. UUID 형식 오류 — MemoController 는 404 로 매핑 (또는 400 — 실측)
  // -------------------------------------------------------------------------
  test("T6: UUID 형식 오류 경로는 MethodArgumentTypeMismatchException 을 404 로 매핑한다", async ({
    request,
  }) => {
    const badId = "not-a-uuid";

    // MemoController @ExceptionHandler(MethodArgumentTypeMismatchException) → 404 매핑.
    // 실측 상태 코드가 400 으로 관찰되면 "계약 불일치" 로 FAIL 되도록 명시적으로 단정.
    const g = await apiGet(request, badId);
    expect(
      g.status(),
      "GET /memos/not-a-uuid 는 MemoController 의 typeMismatch 핸들러가 404 로 처리",
    ).toBe(404);

    const p = await apiUpdate(request, badId, {
      title: "x",
      content: "x",
    });
    expect(p.status(), "PUT /memos/not-a-uuid").toBe(404);

    const d = await apiDelete(request, badId);
    expect(d.status(), "DELETE /memos/not-a-uuid").toBe(404);
  });

  // -------------------------------------------------------------------------
  // T7. 유효성 경계 (API)
  // -------------------------------------------------------------------------
  test("T7: POST 유효성 경계 — 공백/초과/경계 OK/null content/빈 content", async ({
    request,
  }) => {
    // 1) title 공백만 → 400.
    const blank = await apiCreate(request, { title: "   ", content: null });
    expect(blank.status(), "title 공백만 → 400").toBe(400);

    // 2) title 101자 → 400.
    const long = await apiCreate(request, {
      title: "가".repeat(101),
      content: null,
    });
    expect(long.status(), "title 101자 → 400").toBe(400);

    // 3) title 정확 100자 + content 5000자 → 201.
    const boundaryTitle = `${uniquePrefix("t7a")}-`.padEnd(100, "가").slice(0, 100);
    const boundaryContent = "x".repeat(5000);
    const ok = await apiCreate(request, {
      title: boundaryTitle,
      content: boundaryContent,
    });
    expect(ok.status(), "title 100자 + content 5000자 → 201").toBe(201);
    const okBody = (await ok.json()) as MemoResponse;
    expect(okBody.title.length).toBe(100);
    expect(okBody.content?.length).toBe(5000);
    createdMemos.push({ id: okBody.id, title: boundaryTitle });

    // 4) content null → 201, response.content == null.
    const titleNull = `${uniquePrefix("t7b")}-null`;
    const nullRes = await apiCreate(request, {
      title: titleNull,
      content: null,
    });
    expect(nullRes.status(), "content null → 201").toBe(201);
    const nullBody = (await nullRes.json()) as MemoResponse;
    expect(nullBody.content, "null 이 그대로 보존").toBeNull();
    createdMemos.push({ id: nullBody.id, title: titleNull });

    // 5) content "" → 201, response.content == "".
    const titleEmpty = `${uniquePrefix("t7c")}-empty`;
    const emptyRes = await apiCreate(request, {
      title: titleEmpty,
      content: "",
    });
    expect(emptyRes.status(), "content '' → 201").toBe(201);
    const emptyBody = (await emptyRes.json()) as MemoResponse;
    expect(emptyBody.content, "빈 문자열 그대로 보존").toBe("");
    createdMemos.push({ id: emptyBody.id, title: titleEmpty });
  });

  // -------------------------------------------------------------------------
  // T8. 한글 IME UTF-8 왕복 (UI ↔ API, 두 필드)
  // -------------------------------------------------------------------------
  test("T8: UI 모달에 한글 제목/본문 입력 시 API 응답 문자열이 바이트 수준에서 일치한다", async ({
    page,
    request,
  }) => {
    const rawPrefix = uniquePrefix("t8");
    const title = `${rawPrefix}-한글제목`;
    const content = "본문에도 한글 넣기\n줄바꿈도 유지.";

    await gotoMemoList(page);
    await openCreateModal(page);
    await titleField(page).pressSequentially(title, { delay: 30 });
    await contentField(page).pressSequentially(content, { delay: 15 });

    // controlled 값 단정.
    await expect(titleField(page)).toHaveValue(title);
    await expect(contentField(page)).toHaveValue(content);

    const postResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/memos") &&
        resp.request().method() === "POST" &&
        resp.status() === 201,
    );
    await saveButton(page).click();
    await postResponse;

    await expect(page.locator(".modal-container")).toHaveCount(0, {
      timeout: 10_000,
    });

    // API 목록에서 제목 찾기 + 본문 문자열 일치 확인.
    const list = await apiList(request, 0, 50);
    const row = list.content.find((m) => m.title === title);
    expect(row, "API 목록에 한글 제목 메모").toBeTruthy();
    expect(row!.title, "한글 제목이 바이트 수준에서도 일치").toBe(title);
    expect(row!.content, "한글 본문이 바이트 수준에서도 일치").toBe(content);
    createdMemos.push({ id: row!.id, title });

    // 단건 조회도.
    const one = await apiGet(request, row!.id);
    expect(one.status()).toBe(200);
    const oneBody = (await one.json()) as MemoResponse;
    expect(oneBody.title).toBe(title);
    expect(oneBody.content).toBe(content);
  });

  // -------------------------------------------------------------------------
  // T9. hard delete — 전체 페이지 어디에도 없음
  // -------------------------------------------------------------------------
  test("T9: DELETE 후 어느 페이지에도 해당 id 가 존재하지 않는다", async ({
    request,
  }) => {
    const title = `${uniquePrefix("t9")}-삭제대상`;
    const createRes = await apiCreate(request, { title, content: "bye" });
    expect(createRes.status()).toBe(201);
    const body = (await createRes.json()) as MemoResponse;
    createdMemos.push({ id: body.id, title });

    const delRes = await apiDelete(request, body.id);
    expect([200, 204], "DELETE 성공 상태 (204 기대)").toContain(delRes.status());

    // cleanup 에서 중복 DELETE 시도 방지.
    const rmIdx = createdMemos.findIndex((m) => m.id === body.id);
    if (rmIdx >= 0) createdMemos.splice(rmIdx, 1);

    // 단건 — 404.
    const getAfter = await apiGet(request, body.id);
    expect(getAfter.status(), "삭제 후 단건 조회 404").toBe(404);

    // 전체 페이지 훑기 — totalPages 만큼 순회, id 어디에도 없어야 함.
    const pageSize = 50;
    const first = await apiList(request, 0, pageSize);
    const seen: string[] = first.content.map((m) => m.id);
    for (let p = 1; p < first.totalPages; p += 1) {
      const pageRes = await apiList(request, p, pageSize);
      for (const m of pageRes.content) seen.push(m.id);
    }
    expect(
      seen.includes(body.id),
      "삭제된 id 는 어느 페이지에도 존재하지 않아야 함",
    ).toBe(false);
  });
});
