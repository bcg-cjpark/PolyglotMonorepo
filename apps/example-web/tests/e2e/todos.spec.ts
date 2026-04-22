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
 * 리스트 페이지 진입. "Loading…" 이 사라진 뒤 Table primitive 가 렌더될 때까지 대기.
 *
 * Table primitive 는 native `<table>` 기반이며 row virtualization 이 없다.
 * `thead` 에 컬럼 헤더가 렌더되면 그 시점에 초기 렌더는 끝났다고 간주한다.
 */
async function gotoList(page: Page) {
  await page.goto("/todos");
  await expect(page.getByRole("heading", { name: "Todos" })).toBeVisible();
  // Table 컬럼 헤더(Title) 가 마운트될 때까지 대기 — rows 는 비어있을 수도 있음.
  await page
    .locator("th.ui-table__cell--head")
    .filter({ hasText: "Title" })
    .waitFor({ state: "attached", timeout: 10_000 });
}

/**
 * 해당 title 을 가진 Table 데이터 행 로케이터.
 *
 * Table primitive 는 `<tbody>` 안에 `<tr class="ui-table__row">` 를 렌더한다.
 * 헤더 행은 `<thead>` 안의 `tr.ui-table__row--head` 이므로 `:not(--head)` 로
 * 배제할 필요 없이 `tbody tr.ui-table__row` 만 보면 데이터 행만 잡힌다.
 * 빈 상태 행은 `tr.ui-table__row--empty` 로 구분되므로 필요하면 추가 필터.
 */
function rowByTitle(page: Page, title: string) {
  return page
    .locator("tbody tr.ui-table__row:not(.ui-table__row--empty)")
    .filter({ hasText: title });
}

/**
 * 데이터 행 전체 (빈 상태 행 제외) 로케이터. 카운트용.
 */
function dataRows(page: Page) {
  return page.locator(
    "tbody tr.ui-table__row:not(.ui-table__row--empty)",
  );
}

// ---- tests ----

test("empty list shows placeholder message", async ({ page }) => {
  await gotoList(page);

  // Table primitive 는 rows 가 비면 `<tr class="ui-table__row--empty">` 한 줄을
  // 렌더하며 그 안의 `<td>` 에 `emptyMessage` 를 그대로 넣는다.
  const dataRowCount = await dataRows(page).count();
  if (dataRowCount === 0) {
    await expect(
      page.getByText('No todos yet. Click "+ New" to add one.'),
    ).toBeVisible();
    // 빈 상태 tr 이 정확히 하나 존재해야 함
    await expect(
      page.locator("tbody tr.ui-table__row--empty"),
    ).toHaveCount(1);
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

  // Table primitive 는 virtualization 이 없으므로 모든 row 가 DOM 에 있다.
  // 단, 데이터가 많아 viewport 밖에 있을 수 있어 scrollIntoViewIfNeeded 로
  // 가시 영역에 올린 뒤 toBeVisible 단언.
  const row = rowByTitle(page, uniqueTitle);
  await expect(row).toHaveCount(1, { timeout: 5_000 });
  await row.scrollIntoViewIfNeeded();
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

  const row = rowByTitle(page, uniqueTitle);
  await expect(row).toHaveCount(1, { timeout: 5_000 });
  await row.scrollIntoViewIfNeeded();
  await expect(row).toBeVisible();

  // Title 셀 안의 text span 을 title 문자열로 좁혀 잡는다. Table primitive 는
  // cellRenderer 래퍼가 없으므로 `row.getByText(uniqueTitle)` 로 충분.
  const titleSpanBefore = row.getByText(uniqueTitle, { exact: true });
  await expect(titleSpanBefore).not.toHaveClass(/line-through/);

  // 체크박스 토글.
  // Checkbox primitive 는 외부 `<div role="checkbox">` + 내부 hidden
  // `<input type="checkbox">` 두 요소가 role=checkbox 로 잡혀서 strict mode 에
  // 걸린다. 첫 번째(외부 div, 클릭 가능) 만 선택.
  const checkbox = row.getByRole("checkbox").first();
  await checkbox.click();

  // 토글 후 `useToggleTodoMutation` 이 todos 쿼리를 invalidate → 재렌더.
  // Table primitive 는 DOM 재렌더해도 같은 tr 이 유지되지만 React key(id)
  // 기반이므로 row locator 는 재실행 시 최신 DOM 을 다시 잡는다.
  const titleSpanAfter = row.getByText(uniqueTitle, { exact: true });
  await expect(titleSpanAfter).toHaveClass(/line-through/, { timeout: 5_000 });

  // 접근성 상태까지 확인 — aria-checked 가 "true" 여야 함
  await expect(row.getByRole("checkbox").first()).toHaveAttribute(
    "aria-checked",
    "true",
  );
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

  const completedRow = rowByTitle(page, completedTitle);
  await expect(completedRow).toHaveCount(1, { timeout: 5_000 });
  await completedRow.scrollIntoViewIfNeeded();
  await completedRow.getByRole("checkbox").first().click();

  // completed 토글 이후 line-through 반영 대기
  await expect(
    completedRow.getByText(completedTitle, { exact: true }),
  ).toHaveClass(/line-through/, { timeout: 5_000 });

  // All: 둘 다 보임
  await page.getByRole("radio", { name: "All" }).click();
  await expect(rowByTitle(page, activeTitle)).toHaveCount(1, {
    timeout: 5_000,
  });
  await expect(rowByTitle(page, completedTitle)).toHaveCount(1, {
    timeout: 5_000,
  });

  // Active: active 만 보임
  await page.getByRole("radio", { name: "Active" }).click();
  await expect(rowByTitle(page, activeTitle)).toHaveCount(1, {
    timeout: 5_000,
  });
  await expect(rowByTitle(page, completedTitle)).toHaveCount(0);

  // Completed: completed 만 보임
  await page.getByRole("radio", { name: "Completed" }).click();
  await expect(rowByTitle(page, completedTitle)).toHaveCount(1, {
    timeout: 5_000,
  });
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

  const row = rowByTitle(page, originalTitle);
  await expect(row).toHaveCount(1, { timeout: 5_000 });
  await row.scrollIntoViewIfNeeded();
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

  // 편집 이동
  const editRow = rowByTitle(page, originalTitle);
  await expect(editRow).toHaveCount(1, { timeout: 5_000 });
  await editRow.scrollIntoViewIfNeeded();
  await editRow.getByRole("button", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/todos\/\d+\/edit$/);

  // title 수정
  const titleInput = page.getByPlaceholder("What needs to be done?");
  await titleInput.fill(updatedTitle);
  await expect(titleInput).toHaveValue(updatedTitle);

  // Update
  await page.getByRole("button", { name: /^Update$/ }).click();

  await expect(page).toHaveURL(/\/todos$/, { timeout: 10_000 });
  const updatedRow = rowByTitle(page, updatedTitle);
  await expect(updatedRow).toHaveCount(1, { timeout: 5_000 });
  await updatedRow.scrollIntoViewIfNeeded();
  await expect(updatedRow).toBeVisible();
});

test("delete removes todo from list", async ({ page }) => {
  const uniqueTitle = `ToDelete ${Date.now()}`;

  // seed
  await page.goto("/todos/new");
  await page.getByPlaceholder("What needs to be done?").fill(uniqueTitle);
  await page.getByRole("button", { name: /^Create$/ }).click();
  await expect(page).toHaveURL(/\/todos$/);

  const row = rowByTitle(page, uniqueTitle);
  await expect(row).toHaveCount(1, { timeout: 5_000 });
  await row.scrollIntoViewIfNeeded();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Delete" }).click();

  // 삭제 후 데이터 행에서 사라짐
  await expect(rowByTitle(page, uniqueTitle)).toHaveCount(0, {
    timeout: 5_000,
  });
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
