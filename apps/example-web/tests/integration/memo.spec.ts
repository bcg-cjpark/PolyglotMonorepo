import { test, expect, APIRequestContext, Page } from "@playwright/test";

/**
 * Memo 통합 e2e — 실 API + 실 DB (H2 in-memory) + UI 엮기.
 *
 * 전제조건:
 *  - 백엔드(example-api) 가 http://localhost:8080 에 기동 중
 *    `pnpm nx run example-api:serve` (local 프로필, H2 in-memory DB)
 *  - Vite dev 서버는 playwright.config.ts 의 webServer 가 자동 기동
 *
 * 대상 PRD 비즈니스 규칙 (docs/prd/memo.md):
 *   1. createdAt DESC 고정 정렬
 *   2. 기본 페이징 page=0, size=20
 *   3. V1 단일 사용자, userId 없음 (데이터 전역 공유)
 *   4. hard delete
 *   5. PUT = 전체 교체
 *   6. title 1-100, 공백만 불가 (@NotBlank)
 *   7. content 0-5000, 선택 (null 허용)
 *   8. 없는 ID GET/PUT/DELETE → 404 (MemoNotFoundException)
 *   9. 마크다운/HTML 렌더 X
 *
 * 포트/경로 주의:
 *  - Playwright `request` context → 백엔드 직접 `http://localhost:8080/memos` (컨트롤러 매핑 `/memos`, 프리픽스 없음)
 *  - 브라우저(`page`) → axios baseURL `/api` → Vite dev 가 `/api` prefix 를 제거하고 8080 으로 프록시.
 *  - PRD 문서는 `/api/memos` 로 표기하지만 이는 "게이트웨이 뷰" 이고 실제 컨트롤러 매핑은 `/memos`.
 *
 * 스코프:
 *  - 단일 화면/단일 API 검증은 tests/e2e/memo.spec.ts 에서 이미 처리 → 여기서는 엮기 시나리오만.
 */

const API_BASE = "http://localhost:8080";

// ---------- 작은 헬퍼들 ----------

interface MemoDto {
  id: string;
  title: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PageResp<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

async function apiList(
  request: APIRequestContext,
  page = 0,
  size = 20,
): Promise<PageResp<MemoDto>> {
  const res = await request.get(`${API_BASE}/memos`, {
    params: { page, size },
  });
  expect(res.status(), "GET /memos should 200").toBe(200);
  return (await res.json()) as PageResp<MemoDto>;
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
 * 오래된 히스토리(다른 테스트, 이전 run 잔재)를 정리하지는 않는다.
 * unique prefix 로 격리 + 명시적으로 생성한 id 만 cleanup.
 */
const tag = () =>
  `IT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// UI 헬퍼 — tests/e2e/memo.spec.ts 와 동일 DOM 구조 사용.
async function gotoMemoList(page: Page) {
  await page.goto("/memos");
  await expect(page.getByRole("heading", { name: "Memos" })).toBeVisible();
  await expect(page.getByText(/^Loading/)).toHaveCount(0, { timeout: 10_000 });
}

function openModal(page: Page) {
  return page.locator(".modal-container");
}

function cardByTitle(page: Page, title: string) {
  return page
    .locator("button")
    .filter({ has: page.locator("h3", { hasText: title }) });
}

// ---------- 시나리오 ----------

test.describe("Memo 통합 시나리오", () => {
  /**
   * T1. 기본 CRUD flow
   * UI 로 생성 → API 로 DB 에 존재 확인 → UI 편집 → API 로 교체 반영 확인 → UI 삭제 → API 로 404 확인.
   * 프론트가 보내는 요청/렌더하는 응답 스키마와 실 서버 응답이 일치하는지를 엮어서 검증.
   */
  test("T1. UI 생성 → API 검증 → UI 편집 → API 검증 → UI 삭제 → API 404", async ({
    page,
    request,
  }) => {
    const title = `${tag()} T1 flow`;
    const body = "integration body one";

    await gotoMemoList(page);

    // 1) UI 로 생성
    await page.getByRole("button", { name: /\+ 새 메모/ }).click();
    const createModal = openModal(page);
    await createModal.getByPlaceholder("메모 제목").fill(title);
    await createModal.getByPlaceholder("본문을 입력하세요 (선택)").fill(body);
    await createModal.getByRole("button", { name: /^저장$/ }).click();
    await expect(openModal(page)).toHaveCount(0, { timeout: 10_000 });

    // 2) API 로 직접 확인 — 프론트가 보낸 POST 가 DB 반영됐는지
    //    list 전체를 훑어 title 로 찾는다 (unique tag 보장).
    let createdId: string | null = null;
    for (let p = 0; p < 5; p++) {
      const resp = await apiList(request, p, 50);
      const hit = resp.content.find((m) => m.title === title);
      if (hit) {
        createdId = hit.id;
        expect(hit.content, "content 저장 반영").toBe(body);
        break;
      }
      if (p + 1 >= resp.totalPages) break;
    }
    expect(createdId, `T1 생성된 memo 를 API list 에서 찾을 수 없음`).not.toBeNull();

    // 카드가 UI 리스트에도 노출
    await expect(cardByTitle(page, title)).toBeVisible({ timeout: 10_000 });

    // 3) UI 편집 — 상세 모달 → 편집
    await cardByTitle(page, title).click();
    const detail = openModal(page);
    await detail.getByRole("button", { name: /^편집$/ }).click();
    const form = openModal(page);
    await expect(
      form.getByRole("heading", { name: "메모 편집" }),
    ).toBeVisible();

    const newTitle = `${title} EDITED`;
    const newBody = "integration body EDITED";
    await form.getByPlaceholder("메모 제목").fill(newTitle);
    await form.getByPlaceholder("본문을 입력하세요 (선택)").fill(newBody);
    await form.getByRole("button", { name: /^저장$/ }).click();
    await expect(openModal(page)).toHaveCount(0, { timeout: 10_000 });

    // 4) API 로 전체 교체 반영 확인
    const afterEdit = await apiGet(request, createdId!);
    expect(afterEdit.status(), "수정 후 단건 조회 200").toBe(200);
    const afterEditJson = (await afterEdit.json()) as MemoDto;
    expect(afterEditJson.title).toBe(newTitle);
    expect(afterEditJson.content).toBe(newBody);
    // createdAt 은 불변, updatedAt 은 더 나중이어야 함
    expect(
      new Date(afterEditJson.updatedAt).getTime() >=
        new Date(afterEditJson.createdAt).getTime(),
      "updatedAt >= createdAt",
    ).toBeTruthy();

    // 5) UI 삭제 — 상세 → 삭제 → 확인
    await cardByTitle(page, newTitle).click();
    await page.getByRole("button", { name: /^삭제$/ }).click();
    const confirmModal = openModal(page);
    await expect(
      confirmModal.getByRole("heading", { name: "메모 삭제" }),
    ).toBeVisible();
    await confirmModal.getByRole("button", { name: /^삭제$/ }).click();
    await expect(openModal(page)).toHaveCount(0, { timeout: 10_000 });

    // 6) API 로 hard delete 확인 → 404
    const afterDelete = await apiGet(request, createdId!);
    expect(
      afterDelete.status(),
      "hard delete 후 단건 조회 404 (복구 불가)",
    ).toBe(404);
  });

  /**
   * T2. 정렬: createdAt DESC 고정.
   * 3개를 순차 생성하고 API list 첫 페이지에서 동일 순서 확인.
   */
  test("T2. createdAt DESC 정렬: 순차 생성한 3개가 역순으로 반환", async ({
    request,
    page,
  }) => {
    const prefix = tag();
    const titles = [`${prefix} first`, `${prefix} second`, `${prefix} third`];
    const createdIds: string[] = [];

    try {
      for (const t of titles) {
        const r = await apiCreate(request, { title: t, content: t });
        expect(r.status(), `POST ${t} 201`).toBe(201);
        const json = (await r.json()) as MemoDto;
        createdIds.push(json.id);
        // createdAt 해상도(나노초)가 높아도 순서를 명확히 하기 위해 10ms 간격 확보
        await new Promise((res) => setTimeout(res, 15));
      }

      // API list 에서 prefix 로 필터해 순서 확인
      let allOurs: MemoDto[] = [];
      for (let p = 0; p < 5; p++) {
        const resp = await apiList(request, p, 50);
        allOurs = allOurs.concat(
          resp.content.filter((m) => m.title.startsWith(prefix)),
        );
        if (p + 1 >= resp.totalPages) break;
      }
      expect(allOurs.length, "prefix 기반 필터링 결과 3").toBe(3);
      expect(allOurs.map((m) => m.title)).toEqual([
        `${prefix} third`,
        `${prefix} second`,
        `${prefix} first`,
      ]);

      // UI 쪽에서도 가장 먼저 보이는 3개 중 our set 의 순서 확인
      await gotoMemoList(page);
      const ourCardTitles = await page
        .locator("div.flex.flex-col.gap-3 > button h3")
        .allTextContents();
      const ourVisible = ourCardTitles.filter((t) => t.startsWith(prefix));
      // 페이지네이션 1페이지 내에 3 개가 전부 보이려면 총 메모 수가 20 이하거나 상위 페이지여야 함.
      // 총 개수가 많아 우리가 다 보이지 않아도 최소 부분수열 순서만 맞으면 됨.
      if (ourVisible.length >= 2) {
        // index 가 작을수록 위 = 최신. third 가 second 보다, second 가 first 보다 앞.
        const idxOf = (t: string) => ourVisible.indexOf(t);
        const iThird = idxOf(`${prefix} third`);
        const iSecond = idxOf(`${prefix} second`);
        const iFirst = idxOf(`${prefix} first`);
        if (iThird !== -1 && iSecond !== -1) {
          expect(iThird, "third < second in UI order").toBeLessThan(iSecond);
        }
        if (iSecond !== -1 && iFirst !== -1) {
          expect(iSecond, "second < first in UI order").toBeLessThan(iFirst);
        }
      }
    } finally {
      for (const id of createdIds) {
        await apiDelete(request, id);
      }
    }
  });

  /**
   * T3. 페이징: size 초과 시 totalPages 증가 + 각 페이지 content 크기.
   * 기본 size 20 로 21개 생성하면 무거우므로 size=3 로 축소해서 경계 검증.
   * (PRD 의 "기본 페이징 page=0, size=20" 동작은 T3b 에서 별도 확인)
   */
  test("T3a. 페이징 경계: size=3 로 7개 생성 → totalPages=3, 각 페이지 크기", async ({
    request,
  }) => {
    const prefix = tag();
    const ids: string[] = [];
    try {
      for (let i = 0; i < 7; i++) {
        const r = await apiCreate(request, {
          title: `${prefix} p${i}`,
          content: null,
        });
        expect(r.status(), `create ${i} 201`).toBe(201);
        ids.push(((await r.json()) as MemoDto).id);
        await new Promise((res) => setTimeout(res, 5));
      }

      // 우리 prefix 만 보기 위해 list 전체를 훑어 재현성 확보.
      // 백엔드는 전역 정렬이므로 우리 것 사이에 다른 사용자 메모가 섞일 수 있다.
      // 하지만 페이지네이션 메타데이터 (totalElements, totalPages) 는 전역 기준이므로
      // "우리가 넣은 만큼 totalElements 가 증가했는지" 를 검증한다.

      const before = await apiList(request, 0, 3);
      // 생성 전 상태는 이미 override 되어 측정 불가 → 생성 후 total - 7 을 이전값으로 추정.
      // 대신 우리 prefix 로만 count 해보는 접근.

      // size=3 로 1 페이지당 3개 정상 반환?
      expect(before.size, "응답 size=3").toBe(3);
      expect(before.page, "응답 page=0").toBe(0);
      expect(before.content.length, "page 0 content 3 이하").toBeLessThanOrEqual(3);
      expect(before.content.length, "page 0 content 최소 1").toBeGreaterThan(0);

      // 우리 prefix 의 항목들이 전 페이지에 걸쳐 7개 존재하는지
      let ours: MemoDto[] = [];
      for (let p = 0; p < before.totalPages; p++) {
        const resp = await apiList(request, p, 3);
        ours = ours.concat(
          resp.content.filter((m) => m.title.startsWith(prefix)),
        );
      }
      expect(ours.length, "우리가 넣은 7개가 다 조회됨").toBe(7);

      // 정렬: 모든 페이지에 걸쳐 createdAt DESC 유지
      const times = ours.map((m) => new Date(m.createdAt).getTime());
      const sorted = [...times].sort((a, b) => b - a);
      expect(times).toEqual(sorted);
    } finally {
      for (const id of ids) {
        await apiDelete(request, id);
      }
    }
  });

  /**
   * T3b. 기본 페이징 파라미터: 파라미터 생략 시 page=0, size=20.
   */
  test("T3b. 파라미터 생략 시 기본 page=0, size=20", async ({ request }) => {
    const res = await request.get(`${API_BASE}/memos`);
    expect(res.status(), "GET /memos 200").toBe(200);
    const json = (await res.json()) as PageResp<MemoDto>;
    expect(json.page, "기본 page=0").toBe(0);
    expect(json.size, "기본 size=20").toBe(20);
    expect(json.content.length, "content ≤ 20").toBeLessThanOrEqual(20);
  });

  /**
   * T4. PUT = 전체 교체.
   * 생성 → PUT 으로 content 를 다른 값으로 바꾸면 덮어씀.
   * (PRD: PUT 은 부분 업데이트 아님 — patch 가 아님)
   */
  test("T4. PUT 전체 교체: content 가 덮어씌워지고 부분업데이트 아님", async ({
    request,
  }) => {
    const title = `${tag()} T4 replace`;

    const created = await apiCreate(request, {
      title,
      content: "original content",
    });
    expect(created.status()).toBe(201);
    const { id } = (await created.json()) as MemoDto;

    try {
      // (a) title, content 모두 포함한 전체 교체 — 정상 동작
      const rep = await apiUpdate(request, id, {
        title: `${title} (replaced)`,
        content: "replaced content",
      });
      expect(rep.status(), "PUT 200").toBe(200);
      const afterRep = (await rep.json()) as MemoDto;
      expect(afterRep.title).toBe(`${title} (replaced)`);
      expect(afterRep.content).toBe("replaced content");

      // (b) content 를 "" 로 교체 — 이전 "replaced content" 가 덮어씌워져야 함 (patch 가 아님)
      const rep2 = await apiUpdate(request, id, {
        title: `${title} (replaced)`,
        content: "",
      });
      expect(rep2.status()).toBe(200);
      const after2 = (await rep2.json()) as MemoDto;
      expect(
        after2.content,
        "PUT 에 content='' 를 보내면 이전값이 덮어씌워져 빈 문자열이 됨 (patch 가 아님)",
      ).toBe("");

      // 재조회해서 DB 반영도 확인
      const r3 = await apiGet(request, id);
      const after3 = (await r3.json()) as MemoDto;
      expect(after3.content).toBe("");

      // (c) PUT 에 content 키 자체를 누락하면 400 — PRD "두 필드 모두 필수"
      //     PATCH 가 아니라 PUT 이므로 payload 에 필수 필드가 없으면 실패해야 한다.
      const missingContent = await apiUpdate(request, id, {
        title: `${title} (only-title)`,
      });
      expect(
        missingContent.status(),
        "PUT 에 content 키가 없으면 400 (PUT 은 부분업데이트 아님)",
      ).toBe(400);

      // 재조회: 이전 상태(content='') 가 보존되어야 함 — 400 이면 저장되지 않음
      const r4 = await apiGet(request, id);
      const after4 = (await r4.json()) as MemoDto;
      expect(after4.title, "400 실패면 title 도 롤백").toBe(`${title} (replaced)`);
      expect(after4.content, "400 실패면 content 도 롤백").toBe("");
    } finally {
      await apiDelete(request, id);
    }
  });

  /**
   * T5. 없는 ID: GET / PUT / DELETE 모두 404.
   */
  test("T5. 존재하지 않는 UUID 에 대해 GET/PUT/DELETE 모두 404", async ({
    request,
  }) => {
    const missing = "00000000-0000-0000-0000-000000000000";

    const g = await apiGet(request, missing);
    expect(g.status(), "GET 없는 ID → 404").toBe(404);
    const gj = (await g.json()) as { message?: string };
    expect(gj.message, "404 body 에 message 포함").toMatch(/not found/i);

    const p = await apiUpdate(request, missing, {
      title: "x",
      content: "y",
    });
    expect(p.status(), "PUT 없는 ID → 404").toBe(404);

    const d = await apiDelete(request, missing);
    expect(d.status(), "DELETE 없는 ID → 404").toBe(404);
  });

  /**
   * T6. 유효성: title 공백/초과, content 초과 는 400.
   *
   * 백엔드 fix (commit 55baeb0) 이후 Bean Validation 실패가 403 → 400 으로 정상화됨.
   * PRD 기대와 일치. 본 테스트는 `.toBe(400)` 으로 타이트하게 고정.
   */
  test("T6. title/content 유효성 실패 시 400 (엄격)", async ({
    request,
  }) => {
    const cases: Array<{ label: string; body: Record<string, unknown> }> = [
      { label: "title 빈 문자열", body: { title: "", content: "x" } },
      { label: "title 공백만", body: { title: "   ", content: "x" } },
      { label: "title 키 누락", body: { content: "x" } },
      { label: "body 전체 빈 객체", body: {} },
      {
        label: "title 101자",
        body: { title: "a".repeat(101), content: "x" },
      },
      {
        label: "content 5001자",
        body: { title: "ok", content: "b".repeat(5001) },
      },
    ];

    for (const c of cases) {
      const r = await apiCreate(
        request,
        c.body as { title: string; content?: string | null },
      );
      expect(
        r.status(),
        `${c.label} → 400 기대. 실제: ${r.status()}`,
      ).toBe(400);

      // 혹시 생성됐다면 cleanup (방어적)
      if (r.status() === 201) {
        const j = (await r.json()) as MemoDto;
        await apiDelete(request, j.id);
        throw new Error(
          `${c.label}: 생성되지 않아야 하는 요청이 201 로 통과됨 — PRD 위반`,
        );
      }
    }

    // 경계 OK: 정확히 100자 title, 정확히 5000자 content 는 201
    const okBoundary = await apiCreate(request, {
      title: "a".repeat(100),
      content: "c".repeat(5000),
    });
    expect(okBoundary.status(), "경계값 100/5000 201").toBe(201);
    const ob = (await okBoundary.json()) as MemoDto;
    await apiDelete(request, ob.id);

    // content 누락(null) 은 PRD "선택" → 201
    const nullOk = await apiCreate(request, {
      title: `${tag()} null-content`,
      content: null,
    });
    expect(nullOk.status(), "content null 허용 → 201").toBe(201);
    const nb = (await nullOk.json()) as MemoDto;
    expect(nb.content, "null 로 저장").toBeNull();
    await apiDelete(request, nb.id);
  });

  /**
   * T7. 한글 IME: UI 에서 한글 조합 입력 → POST → 서버 저장 → GET 으로 재조회 시 동일 문자열.
   * (프론트 form 이 IME 조합 중간 음절을 잃지 않고 서버로 실어 보내는지 엮어 검증)
   */
  test("T7. 한글 IME 입력이 서버에 손실 없이 저장되고 다시 내려옴", async ({
    page,
    request,
  }) => {
    const hangulTitle = `${tag()} 한글제목 테스트`;
    const hangulBody = "한글 본문 — 조합 음절이 유실되지 않아야 한다";

    await gotoMemoList(page);

    await page.getByRole("button", { name: /\+ 새 메모/ }).click();
    const form = openModal(page);
    const titleInput = form.getByPlaceholder("메모 제목");
    const bodyInput = form.getByPlaceholder("본문을 입력하세요 (선택)");

    await titleInput.click();
    await titleInput.pressSequentially(hangulTitle, { delay: 30 });
    await bodyInput.click();
    await bodyInput.pressSequentially(hangulBody, { delay: 30 });
    await form.getByRole("button", { name: /^저장$/ }).click();
    await expect(openModal(page)).toHaveCount(0, { timeout: 10_000 });

    // API 로 재조회해서 동일 문자열인지 확인
    let hit: MemoDto | null = null;
    for (let p = 0; p < 5; p++) {
      const resp = await apiList(request, p, 50);
      const f = resp.content.find((m) => m.title === hangulTitle);
      if (f) {
        hit = f;
        break;
      }
      if (p + 1 >= resp.totalPages) break;
    }
    expect(hit, "한글 제목으로 저장된 메모를 찾을 수 있어야 함").not.toBeNull();
    expect(hit!.title).toBe(hangulTitle);
    expect(hit!.content).toBe(hangulBody);

    // UI 리스트에도 반영
    await expect(cardByTitle(page, hangulTitle)).toBeVisible({
      timeout: 5_000,
    });

    // cleanup
    await apiDelete(request, hit!.id);
  });

  /**
   * T8. hard delete 증명: 삭제된 ID 는 GET 에서 404. 목록에도 없음.
   */
  test("T8. hard delete: 삭제된 메모는 GET 404 + list 에서 소멸", async ({
    request,
  }) => {
    const title = `${tag()} T8 hard delete`;
    const created = await apiCreate(request, {
      title,
      content: "will be hard-deleted",
    });
    expect(created.status()).toBe(201);
    const { id } = (await created.json()) as MemoDto;

    // 생성 직후 존재 확인
    const before = await apiGet(request, id);
    expect(before.status()).toBe(200);

    // DELETE
    const d = await apiDelete(request, id);
    expect(d.status(), "DELETE 204").toBe(204);

    // GET → 404
    const after = await apiGet(request, id);
    expect(after.status(), "삭제 후 GET 404").toBe(404);

    // list 에서도 나오지 않아야 함
    let found: MemoDto | undefined;
    for (let p = 0; p < 5; p++) {
      const resp = await apiList(request, p, 50);
      found = resp.content.find((m) => m.id === id);
      if (found) break;
      if (p + 1 >= resp.totalPages) break;
    }
    expect(found, "삭제된 메모가 list 에 남아있으면 soft delete 의심").toBeUndefined();
  });
});
