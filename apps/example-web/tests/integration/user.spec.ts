import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * User 피처 통합 e2e — UI ↔ DTO ↔ DB 엇갈림 검증.
 *
 * 전제:
 *  - 백엔드(example-api) 가 http://localhost:8080 에 실 MySQL dev 프로필로 기동.
 *  - 프론트 Vite dev 서버는 playwright.config.ts 의 webServer 로 자동 기동 (:3000).
 *  - 기존 화면 e2e (tests/e2e/user.spec.ts) 는 "프론트 동작" 만 검증.
 *    이 스펙은 "프론트 요청 → 서버 상태 → 프론트 재조회" 의 왕복 정합을 검증한다.
 *
 * 설계 원칙:
 *  - 실 API 호출만 사용 (mock 없음). 백엔드 응답 스키마 / 상태 코드 / 헤더를 직접 관찰.
 *  - 실 MySQL DB 에 데이터가 쌓이므로 unique prefix + afterAll cleanup 으로 격리.
 *  - UI 상에 렌더 확인 → 직접 `APIRequestContext` (baseURL `http://localhost:8080`) 로 서버 단 확인.
 *  - Vite 프록시 경로(`/api/users`) 가 아닌 백엔드 원본 포트(:8080) 로 찔러서
 *    프록시 설정 자체가 잘못된 경우에도 탐지한다.
 *
 * 셀렉터/도움 함수는 tests/e2e/user.spec.ts 의 패턴을 재사용.
 */

const API_BASE = "http://localhost:8080";

interface CreatedUserRef {
  id: number;
  email: string;
}

/** afterAll 에서 삭제할 대상. 각 테스트가 생성하면 push, 테스트 내에서 삭제 확인되면 pop. */
const createdUsers: CreatedUserRef[] = [];

function uniquePrefix(tag: string): string {
  return `IT-U-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function uniqueEmail(tag: string): string {
  // 서버 `@Email` 검증 통과용 — domain 부분은 ASCII.
  return `${uniquePrefix(tag).toLowerCase()}@itest.local`;
}

// ---------------------------------------------------------------------------
// API helpers — 실 백엔드 직접 호출
// ---------------------------------------------------------------------------

async function apiList(request: APIRequestContext) {
  const res = await request.get(`${API_BASE}/users`);
  expect(res.status(), "GET /users status").toBe(200);
  return (await res.json()) as Array<{
    id: number;
    email: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

async function apiGet(request: APIRequestContext, id: number) {
  return request.get(`${API_BASE}/users/${id}`);
}

async function apiCreate(
  request: APIRequestContext,
  body: { email: string; name: string },
) {
  return request.post(`${API_BASE}/users`, { data: body });
}

async function apiUpdate(
  request: APIRequestContext,
  id: number,
  body: { email?: string; name?: string },
) {
  return request.put(`${API_BASE}/users/${id}`, { data: body });
}

async function apiDelete(request: APIRequestContext, id: number) {
  return request.delete(`${API_BASE}/users/${id}`);
}

// ---------------------------------------------------------------------------
// UI helpers — tests/e2e/user.spec.ts 와 동일 패턴
// ---------------------------------------------------------------------------

async function gotoUserList(page: Page) {
  await page.goto("/users");
  await expect(
    page.getByRole("heading", { name: "사용자", level: 1 }),
  ).toBeVisible();
  await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
}

async function openCreateModal(page: Page) {
  await page.getByRole("button", { name: /\+\s*새 사용자/ }).click();
  await expect(page.locator(".modal-container")).toBeVisible();
  await expect(page.getByRole("heading", { name: "새 사용자" })).toBeVisible();
}

function emailField(page: Page) {
  return page.getByPlaceholder("name@company.com");
}

function nameField(page: Page) {
  return page.getByPlaceholder("예: 박도윤");
}

function confirmButton(page: Page) {
  return page
    .locator(".modal-container")
    .getByRole("button", { name: /^저장$|^저장 중…$/ });
}

// ---------------------------------------------------------------------------
// Spec
// ---------------------------------------------------------------------------

test.describe("User 통합 시나리오", () => {
  test.afterAll(async ({ request }) => {
    // 누락된 cleanup — 실패해도 무시. 테스트 종료 후 DB 에 IT-U- 프리픽스 데이터가 남지 않도록.
    for (const u of createdUsers.splice(0)) {
      try {
        await apiDelete(request, u.id);
      } catch {
        /* noop */
      }
    }
  });

  // -------------------------------------------------------------------------
  // T1. UI 생성 → API 검증 → API 삭제 → UI 소멸
  // -------------------------------------------------------------------------
  test("T1: UI 생성 후 API 에서 동일 레코드 확인, API 삭제 후 UI 에서 사라진다", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("t1");
    const name = "통합유저T1";

    await gotoUserList(page);
    await openCreateModal(page);
    await emailField(page).pressSequentially(email, { delay: 10 });
    await nameField(page).pressSequentially(name, { delay: 10 });

    const postResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/users") &&
        resp.request().method() === "POST" &&
        resp.status() === 201,
    );
    await confirmButton(page).click();
    const resp = await postResponse;
    const created = (await resp.json()) as {
      id: number;
      email: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    };
    createdUsers.push({ id: created.id, email: created.email });

    // 모달 닫힘
    await expect(page.locator(".modal-container")).toHaveCount(0, {
      timeout: 10_000,
    });

    // API 목록 조회 — UI 로 만든 레코드가 서버에 실재하는지 확인.
    const list = await apiList(request);
    const apiRow = list.find((u) => u.email === email);
    expect(apiRow, "API /users 목록에 UI 생성 유저 있어야 함").toBeTruthy();
    expect(apiRow!.id).toBe(created.id);
    expect(apiRow!.name).toBe(name);
    expect(apiRow!.createdAt).toBeTruthy();
    expect(apiRow!.updatedAt).toBeTruthy();

    // 단건 조회 — 200 + 응답 스키마 일치.
    const one = await apiGet(request, created.id);
    expect(one.status(), "GET /users/{id}").toBe(200);
    const oneJson = (await one.json()) as { id: number; email: string; name: string };
    expect(oneJson.id).toBe(created.id);
    expect(oneJson.email).toBe(email);
    expect(oneJson.name).toBe(name);

    // API 로 삭제 → 204.
    const del = await apiDelete(request, created.id);
    expect(del.status(), "DELETE /users/{id} 응답은 204").toBe(204);

    // cleanup 목록에서 제거.
    const idx = createdUsers.findIndex((u) => u.id === created.id);
    if (idx >= 0) createdUsers.splice(idx, 1);

    // UI 재조회 — 사라졌는지.
    await page.reload();
    await expect(page.locator("table")).toBeVisible();
    await expect(page.getByRole("cell", { name: email })).toHaveCount(0);
  });

  // -------------------------------------------------------------------------
  // T2. API 생성 → UI 렌더 확인 → UI 삭제 → API 404
  // -------------------------------------------------------------------------
  test("T2: API 로 생성 후 UI 에서 렌더되며 UI 삭제 후 API 는 404 를 반환한다", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("t2");
    const name = "통합유저T2";

    const postRes = await apiCreate(request, { email, name });
    expect(postRes.status(), "POST /users").toBe(201);
    const created = (await postRes.json()) as { id: number };
    createdUsers.push({ id: created.id, email });

    // UI 진입 → 렌더 확인.
    await gotoUserList(page);
    const row = page.getByRole("row", { name: new RegExp(email) });
    await expect(row).toBeVisible();

    // UI 삭제 — confirm 수락.
    page.once("dialog", (dialog) => {
      expect(dialog.type()).toBe("confirm");
      void dialog.accept();
    });
    const deleteResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/users/${created.id}`) &&
        resp.request().method() === "DELETE" &&
        resp.status() === 204,
    );
    await row.getByRole("button", { name: "삭제" }).click();
    await deleteResponse;

    // 서버 단 확인 — 404 여야 함 (hard delete).
    const getAfter = await apiGet(request, created.id);
    expect(getAfter.status(), "삭제 후 GET /users/{id}").toBe(404);

    // cleanup 제거.
    const idx = createdUsers.findIndex((u) => u.id === created.id);
    if (idx >= 0) createdUsers.splice(idx, 1);
  });

  // -------------------------------------------------------------------------
  // T3. 정렬: createdAt DESC 고정 (UI ↔ API 순서 일치)
  // -------------------------------------------------------------------------
  test("T3: API /users 는 createdAt DESC 순이며 UI 표도 동일 순서로 렌더된다", async ({
    page,
    request,
  }) => {
    const tag = uniquePrefix("t3");
    const namePrefix = `정렬-${tag}`;
    const a = { email: uniqueEmail("t3a"), name: `${namePrefix}-A` };
    const b = { email: uniqueEmail("t3b"), name: `${namePrefix}-B` };
    const c = { email: uniqueEmail("t3c"), name: `${namePrefix}-C` };

    // 순차 생성 — MySQL TIMESTAMP(6) / LocalDateTime 해상도에서 순서 구분되도록 간격 부여.
    const resA = await apiCreate(request, a);
    expect(resA.status()).toBe(201);
    const idA = (await resA.json()).id as number;
    createdUsers.push({ id: idA, email: a.email });

    await page.waitForTimeout(20);

    const resB = await apiCreate(request, b);
    expect(resB.status()).toBe(201);
    const idB = (await resB.json()).id as number;
    createdUsers.push({ id: idB, email: b.email });

    await page.waitForTimeout(20);

    const resC = await apiCreate(request, c);
    expect(resC.status()).toBe(201);
    const idC = (await resC.json()).id as number;
    createdUsers.push({ id: idC, email: c.email });

    // API 순서 — 같은 prefix 3 명 추출.
    const list = await apiList(request);
    const ours = list.filter((u) => u.name.startsWith(namePrefix));
    expect(ours, "같은 prefix 3 명 모두 조회").toHaveLength(3);
    // createdAt DESC → C, B, A 순이어야 함.
    expect(ours.map((u) => u.id)).toEqual([idC, idB, idA]);

    // UI 순서 확인.
    await gotoUserList(page);
    const rowsLocator = page.locator("table tbody tr").filter({
      has: page.getByText(new RegExp(namePrefix)),
    });
    await expect(rowsLocator).toHaveCount(3);
    const rowTexts = await rowsLocator.allInnerTexts();
    // 최신 → 오래된 순이므로 C 행이 제일 위.
    expect(rowTexts[0]).toContain(`${namePrefix}-C`);
    expect(rowTexts[1]).toContain(`${namePrefix}-B`);
    expect(rowTexts[2]).toContain(`${namePrefix}-A`);
  });

  // -------------------------------------------------------------------------
  // T4. 한글 IME 엔드투엔드 — UI 저장 값이 API 응답에 동일 문자열로 돌아온다
  // -------------------------------------------------------------------------
  test("T4: UI 에서 한글 이름 저장 시 API 응답 name 이 정확히 일치한다", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("t4");
    const name = "홍길동";

    await gotoUserList(page);
    await openCreateModal(page);
    await emailField(page).pressSequentially(email, { delay: 20 });
    await nameField(page).pressSequentially(name, { delay: 30 });
    await expect(nameField(page)).toHaveValue(name);

    const postResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/users") &&
        resp.request().method() === "POST" &&
        resp.status() === 201,
    );
    await confirmButton(page).click();
    const resp = await postResponse;
    const body = (await resp.json()) as { id: number };
    createdUsers.push({ id: body.id, email });

    // API 로 재확인 — 한글이 서버 왕복 후에도 동일 문자열인지.
    // (UTF-8 왜곡, charset 설정 누락 시 여기서 실패.)
    const list = await apiList(request);
    const found = list.find((u) => u.email === email);
    expect(found, "API 목록에 한글 이름 유저").toBeTruthy();
    expect(found!.name, "한글 이름이 바이트 수준에서도 일치").toBe(name);

    // 단건 조회도.
    const one = await apiGet(request, body.id);
    expect(one.status()).toBe(200);
    const oneJson = (await one.json()) as { name: string };
    expect(oneJson.name).toBe(name);
  });

  // -------------------------------------------------------------------------
  // T5. 이메일 유니크 — API 생성 후 UI 에서 동일 이메일 저장 시도 → 409 + 모달 유지
  // -------------------------------------------------------------------------
  test("T5: API 선점 이메일로 UI 저장 시 409 와 모달 유지, DB 에 새 레코드 없음", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("t5");

    const seedRes = await apiCreate(request, { email, name: "선점자T5" });
    expect(seedRes.status()).toBe(201);
    const seeded = (await seedRes.json()) as { id: number };
    createdUsers.push({ id: seeded.id, email });

    // 선점 전후 전체 유저 수 중 해당 email 의 개수 파악.
    const before = await apiList(request);
    const beforeMatching = before.filter((u) => u.email === email).length;
    expect(beforeMatching, "선점 후 동일 email 레코드 수").toBe(1);

    // UI 로 같은 이메일 입력 시도.
    await gotoUserList(page);
    await openCreateModal(page);
    await emailField(page).pressSequentially(email, { delay: 10 });
    await nameField(page).pressSequentially("중복시도자", { delay: 10 });

    const postResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/users") && resp.request().method() === "POST",
    );
    await confirmButton(page).click();
    const resp = await postResponse;
    expect(resp.status(), "두 번째 POST 는 409").toBe(409);

    // 모달 유지 + 고정 에러 문구.
    await expect(page.locator(".modal-container")).toBeVisible();
    await expect(
      page.locator(".modal-container").getByText("이미 사용 중인 이메일입니다."),
    ).toBeVisible();

    // DB 상태 확인 — 두 번째 레코드가 생기지 않아야 한다.
    const after = await apiList(request);
    const afterMatching = after.filter((u) => u.email === email).length;
    expect(afterMatching, "409 이후 동일 email 레코드 수는 여전히 1").toBe(1);
  });

  // -------------------------------------------------------------------------
  // T6. PUT 전체 교체 (API 직접) — PRD 규칙. 편집 UI 가 V1 에 없어 화면 e2e 로는 못 커버.
  // -------------------------------------------------------------------------
  test("T6: PUT /users/{id} 전체 교체 계약과 누락·중복 시 오류 코드", async ({
    request,
  }) => {
    // victim — 수정 대상.
    const originalEmail = uniqueEmail("t6-orig");
    const victim = await apiCreate(request, {
      email: originalEmail,
      name: "원본T6",
    });
    expect(victim.status()).toBe(201);
    const victimBody = (await victim.json()) as { id: number };
    createdUsers.push({ id: victimBody.id, email: originalEmail });

    // other — 이메일 중복 유발용.
    const otherEmail = uniqueEmail("t6-other");
    const other = await apiCreate(request, {
      email: otherEmail,
      name: "다른유저T6",
    });
    expect(other.status()).toBe(201);
    const otherBody = (await other.json()) as { id: number };
    createdUsers.push({ id: otherBody.id, email: otherEmail });

    // 1) 정상 PUT — 전체 교체.
    const newEmail = uniqueEmail("t6-new");
    const newName = "수정본T6";
    const putOk = await apiUpdate(request, victimBody.id, {
      email: newEmail,
      name: newName,
    });
    expect(putOk.status(), "PUT 정상 200").toBe(200);
    const putOkBody = (await putOk.json()) as {
      id: number;
      email: string;
      name: string;
    };
    expect(putOkBody.id).toBe(victimBody.id);
    expect(putOkBody.email).toBe(newEmail);
    expect(putOkBody.name).toBe(newName);

    // 재조회 확인.
    const reget = await apiGet(request, victimBody.id);
    expect(reget.status()).toBe(200);
    const regetBody = (await reget.json()) as { email: string; name: string };
    expect(regetBody.email).toBe(newEmail);
    expect(regetBody.name).toBe(newName);

    // cleanup 추적용 이메일 갱신.
    const ref = createdUsers.find((u) => u.id === victimBody.id);
    if (ref) ref.email = newEmail;

    // 2) 필드 누락 — email 만. 전체 교체 계약 위반 → 400.
    const putMissing = await apiUpdate(request, victimBody.id, {
      email: uniqueEmail("t6-missing"),
    });
    expect(
      putMissing.status(),
      "PUT 에 name 누락 시 400 (전체 교체 계약)",
    ).toBe(400);

    // 3) 다른 유저 이메일과 동일 → 409.
    const putDup = await apiUpdate(request, victimBody.id, {
      email: otherEmail,
      name: "중복시도T6",
    });
    expect(putDup.status(), "다른 유저 이메일로 PUT → 409").toBe(409);
  });

  // -------------------------------------------------------------------------
  // T7. 없는 ID — GET / PUT / DELETE 모두 404
  // -------------------------------------------------------------------------
  test("T7: 존재하지 않는 id 에 대해 GET/PUT/DELETE 모두 404", async ({
    request,
  }) => {
    const absurdId = 999_999_999;

    const g = await apiGet(request, absurdId);
    expect(g.status(), "GET /users/999999999").toBe(404);
    // 에러 body 에 message 필드가 존재하는지 (프론트 에러 매핑 계약).
    const gBody = await g.json().catch(() => null);
    expect(gBody, "404 body 는 JSON").toBeTruthy();
    expect(
      typeof gBody.message === "string" && gBody.message.length > 0,
      "404 body.message 가 비어있지 않은 문자열",
    ).toBe(true);

    const p = await apiUpdate(request, absurdId, {
      email: uniqueEmail("t7"),
      name: "없는유저T7",
    });
    expect(p.status(), "PUT /users/999999999").toBe(404);

    const d = await apiDelete(request, absurdId);
    expect(d.status(), "DELETE /users/999999999").toBe(404);
  });

  // -------------------------------------------------------------------------
  // T8. 유효성 경계 — 400 계열과 경계 OK 케이스
  // -------------------------------------------------------------------------
  test("T8: 입력 유효성 경계 — 400 케이스들과 경계 OK(name 100자)", async ({
    request,
  }) => {
    // 1) @Email 실패.
    const badEmail = await apiCreate(request, {
      email: "not-email",
      name: "홍",
    });
    expect(badEmail.status(), "잘못된 이메일 형식 → 400").toBe(400);

    // 2) name 공백만.
    const blankName = await apiCreate(request, {
      email: uniqueEmail("t8-blank"),
      name: "   ",
    });
    expect(blankName.status(), "공백만 이름 → 400").toBe(400);

    // 3) email 길이 255 초과 — local part 256 + @domain → 256+ + "@a.bc" 형태.
    //    PRD 는 "최대 255자". 서버 @Size(max=255) 전제.
    const longLocal = "a".repeat(256);
    const longEmail = await apiCreate(request, {
      email: `${longLocal}@a.bc`,
      name: "길이초과",
    });
    expect(longEmail.status(), "email 256자+ → 400").toBe(400);

    // 4) name 길이 101자 — PRD "최대 100자".
    const longName = await apiCreate(request, {
      email: uniqueEmail("t8-longname"),
      name: "가".repeat(101),
    });
    expect(longName.status(), "name 101자 → 400").toBe(400);

    // 5) 경계 OK — name 정확히 100자는 201.
    const boundaryEmail = uniqueEmail("t8-boundary");
    const okRes = await apiCreate(request, {
      email: boundaryEmail,
      name: "가".repeat(100),
    });
    expect(okRes.status(), "name 100자 경계 → 201").toBe(201);
    const okBody = (await okRes.json()) as { id: number; name: string };
    expect(okBody.name.length).toBe(100);
    createdUsers.push({ id: okBody.id, email: boundaryEmail });
  });
});
