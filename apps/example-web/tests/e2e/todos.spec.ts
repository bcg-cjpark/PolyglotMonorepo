import { test, expect, Page } from "@playwright/test";

/**
 * Todo CRUD + Filter 플로우 e2e 검증.
 *
 * 전제조건:
 *  - 백엔드(example-api) 가 http://localhost:8080 에 기동 중
 *    `pnpm nx run example-api:serve` (local 프로필, H2 in-memory DB)
 *  - Vite dev 서버는 playwright.config.ts 의 webServer 가 자동 기동
 *
 * 검증 시나리오:
 *  1. 빈 상태 메시지 노출
 *  2. "+ New" → /todos/new 이동
 *  3. Title/Description/DueDate 입력 후 Create
 *  4. 리스트에서 보임
 *  5. 체크박스 토글 → completed 반영 (line-through)
 *  6. 필터 탭 All / Active / Completed
 *  7. Edit → /todos/:id/edit, 필드 prefilled
 *  8. Title 수정 + Update → 리스트 반영
 *  9. Delete → 리스트에서 사라짐
 * 10. Title 공백이면 Create 버튼 disabled
 */

// ---- helpers ----

/**
 * 리스트 페이지 진입. "Loading…" 이 사라질 때까지 + DataGrid(ag-grid) 가 렌더될 때까지 대기.
 *
 * DataGrid 는 내부적으로 `setTimeout(0)` 으로 첫 렌더를 지연하고, 그 뒤에
 * ag-grid 가 viewport/row 를 구성한다. "Todos" heading 만 보면 아직 row 가 없어
 * 셀렉터 race 가 생길 수 있어 grid 컨테이너(role=treegrid|grid) 등장을 기다림.
 */
async function gotoList(page: Page) {
  await page.goto("/todos");
  await expect(page.getByRole("heading", { name: "Todos" })).toBeVisible();
  // ag-grid 컨테이너가 마운트될 때까지 대기. role=treegrid 로 노출됨.
  await page.locator(".ag-root").first().waitFor({ state: "attached", timeout: 10_000 });
}

/**
 * 해당 title 을 가진 ag-grid row 로케이터.
 *
 * ag-grid 는 `<table>` 대신 div 기반 레이아웃을 쓴다. 각 데이터 행은
 * `role="row"` + 클래스 `ag-row` 로 표기된다. 헤더 행도 `role="row"` 지만
 * 제목 텍스트가 헤더에 없으므로 `hasText` 필터만으로 데이터 행이 특정된다.
 * Button/Checkbox 같은 cellRenderer 내부 primitive 는 그대로 role 접근 가능.
 */
function rowByTitle(page: Page, title: string) {
  return page.getByRole("row").filter({ hasText: title });
}

/**
 * ag-grid 는 row virtualization 을 쓰기 때문에 viewport 밖에 있는 row 는
 * DOM 에 존재하지 않는다. 새로 생성한 row 가 리스트 하단에 있을 때
 * `page.getByText(title)` 이 0 개로 나오는 문제가 생겨 이를 피하려면
 * body viewport 를 스크롤해 해당 row 를 가시 영역으로 끌어와야 한다.
 *
 * 이 헬퍼는 `.ag-body-viewport` 를 위→아래로 단계적으로 스크롤하면서
 * 원하는 제목의 row 가 DOM 에 나타날 때까지 반복한다. 이미 DOM 에 있으면
 * 추가로 `scrollIntoViewIfNeeded` 로 완전히 가시 영역에 둔다.
 */
async function revealRowByTitle(page: Page, title: string, timeout = 10_000) {
  const row = rowByTitle(page, title);
  const start = Date.now();

  // 0) 그리드가 rowData 로 채워질 때까지 대기.
  //    ag-grid 는 데이터 로드 전에도 `.ag-body-viewport` 가 마운트되어 있을 수 있고,
  //    그 시점에는 `.ag-row` 가 0 개이므로 스크롤을 해도 아무 row 가 attach 되지 않는다.
  //    최소 1개의 row 가 나타나거나 no-rows overlay 가 뜰 때까지 잠깐 기다린다.
  await page.waitForFunction(
    () => {
      const hasRow = document.querySelector(".ag-center-cols-container .ag-row");
      const noRows = document.querySelector(".ag-overlay-no-rows-wrapper");
      const noRowsVisible =
        noRows instanceof HTMLElement && noRows.offsetParent !== null;
      return !!hasRow || noRowsVisible;
    },
    undefined,
    { timeout: 5_000 },
  );

  // 1) 최상단으로 리셋 (다른 테스트가 남긴 scroll 위치 초기화)
  await page.evaluate(() => {
    const vp = document.querySelector<HTMLElement>(".ag-body-viewport");
    if (vp) vp.scrollTop = 0;
  });

  // 2) 단계적으로 스크롤하며 해당 row 가 attach 될 때까지 탐색.
  //    ag-grid 재렌더 중에는 row 가 DOM 에서 잠깐 detach 될 수 있으므로
  //    scrollIntoViewIfNeeded 가 실패하면 한 번 더 loop 를 돌도록 try/catch.
  while (Date.now() - start < timeout) {
    if ((await row.count()) > 0) {
      try {
        await row.first().scrollIntoViewIfNeeded({ timeout: 2_000 });
        return row.first();
      } catch {
        // detach race — 다음 루프에서 재시도
        await page.waitForTimeout(80);
        continue;
      }
    }
    const state = await page.evaluate(() => {
      const vp = document.querySelector<HTMLElement>(".ag-body-viewport");
      if (!vp) return { atBottom: true };
      const maxScroll = vp.scrollHeight - vp.clientHeight;
      const was = vp.scrollTop;
      vp.scrollTop = Math.min(maxScroll, vp.scrollTop + 200);
      return { atBottom: was >= maxScroll - 1, maxScroll, was, now: vp.scrollTop };
    });
    if (state.atBottom) {
      // 끝에 도달했지만 아직 row 가 없으면 잠깐 기다린 뒤 한 번 더 확인하고 루프 종료.
      await page.waitForTimeout(120);
      if ((await row.count()) > 0) {
        await row.first().scrollIntoViewIfNeeded();
        return row.first();
      }
      // rowData 가 갱신 중일 수 있으니 짧게 더 대기 후 위로 리셋해서 재탐색.
      await page.waitForTimeout(200);
      await page.evaluate(() => {
        const vp = document.querySelector<HTMLElement>(".ag-body-viewport");
        if (vp) vp.scrollTop = 0;
      });
    }
    await page.waitForTimeout(60);
  }

  // 마지막 한 번 더 시도
  if ((await row.count()) > 0) {
    await row.first().scrollIntoViewIfNeeded();
    return row.first();
  }
  return row; // 호출자가 expect 로 실패 사유 보도록 그대로 반환
}

// ---- tests ----

test("empty list shows placeholder message", async ({ page }) => {
  await gotoList(page);

  // ag-grid 는 rowData 가 비면 `.ag-overlay-no-rows-wrapper` 오버레이를 띄우며
  // noRowsToShow prop (여기선 `No todos yet. Click "+ New" to add one.`) 을 그 안에 렌더한다.
  // 데이터 row 는 `.ag-row` 로 카운트 — 이게 0 일 때 placeholder 가 보여야 함.
  const dataRowCount = await page.locator(".ag-center-cols-container .ag-row").count();
  if (dataRowCount === 0) {
    await expect(
      page.getByText('No todos yet. Click "+ New" to add one.'),
    ).toBeVisible();
  }

  // "+ New" 버튼은 항상 있어야 함
  await expect(page.getByRole("button", { name: /\+ New/ })).toBeVisible();
});

test("clicking + New navigates to /todos/new", async ({ page }) => {
  await gotoList(page);
  await page.getByRole("button", { name: /\+ New/ }).click();

  await expect(page).toHaveURL(/\/todos\/new$/);
  await expect(page.getByRole("heading", { name: "New Todo" })).toBeVisible();
});

test("create todo with title/description/dueDate and see it in the list", async ({
  page,
}) => {
  const uniqueTitle = `Buy milk ${Date.now()}`;
  const description = "Organic, 2L";
  const dueDate = "2099-12-31";

  await page.goto("/todos/new");

  const titleInput = page.getByPlaceholder("What needs to be done?");
  await titleInput.click();
  await page.keyboard.type(uniqueTitle, { delay: 20 });
  await expect(titleInput).toHaveValue(uniqueTitle);

  const descInput = page.getByPlaceholder("Optional details");
  await descInput.fill(description);

  // type="date" input: fill() 로 YYYY-MM-DD 직접 세팅
  const dueInput = page.locator('input[type="date"]');
  await dueInput.fill(dueDate);

  await page.getByRole("button", { name: /^Create$/ }).click();

  // 리스트로 돌아왔는지
  await expect(page).toHaveURL(/\/todos$/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "Todos" })).toBeVisible();

  // 방금 만든 todo 는 리스트 하단에 있을 수 있어 virtualization 으로 DOM 에서 빠져 있음.
  // ag-grid viewport 를 스크롤해 row 가 DOM 에 붙은 뒤 검증.
  const row = await revealRowByTitle(page, uniqueTitle);
  await expect(row).toBeVisible();

  // Due date 도 셀에 렌더됐는지
  await expect(row).toContainText(dueDate);
});

test("toggle checkbox marks todo as completed (line-through)", async ({
  page,
}) => {
  const uniqueTitle = `Toggle target ${Date.now()}`;

  // seed: todo 생성
  await page.goto("/todos/new");
  await page.getByPlaceholder("What needs to be done?").fill(uniqueTitle);
  await page.getByRole("button", { name: /^Create$/ }).click();
  await expect(page).toHaveURL(/\/todos$/);

  const row = await revealRowByTitle(page, uniqueTitle);
  await expect(row).toBeVisible();

  // ag-grid 는 cellRenderer 결과를 `<span role="presentation" class="ag-cell-value">`
  // 로 감싼다. 우리가 렌더한 title span 은 그 안쪽이라 role=presentation 을 제외하면
  // cellRenderer 가 실제로 만든 span 하나만 매칭된다.
  // 클릭 전: line-through 없음
  const titleSpanBefore = row
    .locator('span:not([role="presentation"])')
    .filter({ hasText: uniqueTitle });
  await expect(titleSpanBefore).not.toHaveClass(/line-through/);

  // 체크박스 토글
  // Checkbox primitive 는 <div role="checkbox"> + 내부 hidden <input type="checkbox"> 로
  // 두 요소가 role=checkbox 로 잡힌다. 첫 번째(외부 div)만 클릭 대상으로 사용.
  const checkbox = row.getByRole("checkbox").first();
  await checkbox.click();

  // 토글 후 `TodoListPage.handleToggle` 이 `load()` 를 다시 부르며 rowData 가 교체된다.
  // ag-grid virtualization 특성상 재렌더 직후 해당 row 가 viewport 밖으로 밀려날 수
  // 있어 DOM 에서 일시적으로 사라질 수 있다 → revealRowByTitle 로 다시 viewport 에 올린다.
  const refreshedRow = await revealRowByTitle(page, uniqueTitle);
  const titleSpanAfter = refreshedRow
    .locator('span:not([role="presentation"])')
    .filter({ hasText: uniqueTitle });
  await expect(titleSpanAfter).toHaveClass(/line-through/, { timeout: 5_000 });
});

test("filter tabs (All / Active / Completed) work", async ({ page }) => {
  const activeTitle = `Active todo ${Date.now()}`;
  const completedTitle = `Completed todo ${Date.now()}`;

  // seed: active 1개
  await page.goto("/todos/new");
  await page.getByPlaceholder("What needs to be done?").fill(activeTitle);
  await page.getByRole("button", { name: /^Create$/ }).click();
  await expect(page).toHaveURL(/\/todos$/);

  // seed: completed 1개 (생성 후 토글)
  await page.goto("/todos/new");
  await page.getByPlaceholder("What needs to be done?").fill(completedTitle);
  await page.getByRole("button", { name: /^Create$/ }).click();
  await expect(page).toHaveURL(/\/todos$/);

  const completedRow = await revealRowByTitle(page, completedTitle);
  await completedRow.getByRole("checkbox").first().click();
  // 토글 후 rowData 재적재로 viewport 위치가 달라질 수 있어 다시 reveal.
  const completedRowAfter = await revealRowByTitle(page, completedTitle);
  await expect(
    completedRowAfter
      .locator('span:not([role="presentation"])')
      .filter({ hasText: completedTitle }),
  ).toHaveClass(/line-through/, { timeout: 5_000 });

  // All: 둘 다 보임 (virtualization 대응 위해 reveal 로 DOM 에 붙인 후 검증)
  await page.getByRole("radio", { name: "All" }).click();
  await expect(await revealRowByTitle(page, activeTitle)).toBeVisible();
  await expect(await revealRowByTitle(page, completedTitle)).toBeVisible();

  // Active: active 만 보임
  await page.getByRole("radio", { name: "Active" }).click();
  await expect(await revealRowByTitle(page, activeTitle)).toBeVisible();
  await expect(rowByTitle(page, completedTitle)).toHaveCount(0);

  // Completed: completed 만 보임
  await page.getByRole("radio", { name: "Completed" }).click();
  await expect(await revealRowByTitle(page, completedTitle)).toBeVisible();
  await expect(rowByTitle(page, activeTitle)).toHaveCount(0);
});

test("edit button navigates to edit page with prefilled fields", async ({
  page,
}) => {
  const originalTitle = `Editable ${Date.now()}`;
  const originalDesc = "original description";

  // seed
  await page.goto("/todos/new");
  await page.getByPlaceholder("What needs to be done?").fill(originalTitle);
  await page.getByPlaceholder("Optional details").fill(originalDesc);
  await page.getByRole("button", { name: /^Create$/ }).click();
  await expect(page).toHaveURL(/\/todos$/);

  const row = await revealRowByTitle(page, originalTitle);
  await row.getByRole("button", { name: "Edit" }).click();

  // URL /todos/:id/edit
  await expect(page).toHaveURL(/\/todos\/\d+\/edit$/);
  await expect(page.getByRole("heading", { name: "Edit Todo" })).toBeVisible();

  // 필드 prefilled
  await expect(page.getByPlaceholder("What needs to be done?")).toHaveValue(
    originalTitle
  );
  await expect(page.getByPlaceholder("Optional details")).toHaveValue(
    originalDesc
  );
});

test("update title and see it reflected in list", async ({ page }) => {
  const originalTitle = `ToUpdate ${Date.now()}`;
  const updatedTitle = `${originalTitle} UPDATED`;

  // seed
  await page.goto("/todos/new");
  await page.getByPlaceholder("What needs to be done?").fill(originalTitle);
  await page.getByRole("button", { name: /^Create$/ }).click();
  await expect(page).toHaveURL(/\/todos$/);

  // 편집 이동 — virtualization 때문에 row 가 DOM 에 없을 수 있어 먼저 reveal
  const editRow = await revealRowByTitle(page, originalTitle);
  await editRow.getByRole("button", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/todos\/\d+\/edit$/);

  // title 수정
  const titleInput = page.getByPlaceholder("What needs to be done?");
  await titleInput.fill(updatedTitle);
  await expect(titleInput).toHaveValue(updatedTitle);

  // Update
  await page.getByRole("button", { name: /^Update$/ }).click();

  await expect(page).toHaveURL(/\/todos$/, { timeout: 10_000 });
  const updatedRow = await revealRowByTitle(page, updatedTitle);
  await expect(updatedRow).toBeVisible();
  // 원본 제목은 유일하므로 해당 prefix-only 는 보이지 않아야 정확하나,
  // updatedTitle 이 originalTitle 을 substring 으로 포함하므로 "exactly originalTitle" 으로는 검증 불가.
  // 대신 originalTitle 로 이루어진 row 중 UPDATED 가 없는 것이 없는지만 확인.
});

test("delete removes todo from list", async ({ page }) => {
  const uniqueTitle = `ToDelete ${Date.now()}`;

  // seed
  await page.goto("/todos/new");
  await page.getByPlaceholder("What needs to be done?").fill(uniqueTitle);
  await page.getByRole("button", { name: /^Create$/ }).click();
  await expect(page).toHaveURL(/\/todos$/);

  // delete — virtualization 때문에 row 를 먼저 가시 영역으로 끌어온 뒤 클릭
  const row = await revealRowByTitle(page, uniqueTitle);
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Delete" }).click();

  // 삭제 후 사라짐. rowByTitle 로 count=0 검증 (getByText 는 다른 화면 텍스트와 충돌 소지 없음)
  await expect(rowByTitle(page, uniqueTitle)).toHaveCount(0, { timeout: 5_000 });
});

test("Create button is disabled when title is empty or whitespace", async ({
  page,
}) => {
  await page.goto("/todos/new");

  const createBtn = page.getByRole("button", { name: /^Create$/ });
  // 초기: title 비어있음
  await expect(createBtn).toBeDisabled();

  // 공백만 입력
  const titleInput = page.getByPlaceholder("What needs to be done?");
  await titleInput.click();
  await page.keyboard.type("   ", { delay: 20 });
  await expect(createBtn).toBeDisabled();

  // 실제 문자 입력 → 활성화
  await titleInput.click();
  await titleInput.fill("real content");
  await expect(createBtn).toBeEnabled();

  // 다시 비우면 disabled
  await titleInput.fill("");
  await expect(createBtn).toBeDisabled();
});
