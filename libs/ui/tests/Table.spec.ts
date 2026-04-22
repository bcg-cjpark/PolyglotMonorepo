import { test, expect } from '@playwright/test';

/**
 * Table primitive 런타임 검증.
 *
 * 확정 스펙: `docs/design-notes/data-display.md` §2 / API 는 `Table.tsx` 참조.
 * 컴포넌트 본체 / SCSS 는 이 스펙에서 수정하지 않으며, Storybook stories 경로로
 * 실제 DOM 을 렌더시켜 구조·속성·클래스·style 을 검증한다.
 *
 * 매핑되는 스토리(index.json 기준):
 *   - components-table--default             → 기본 렌더 / `getRowKey` 회귀
 *   - components-table--with-custom-render  → `render` 콜백이 실제 ReactNode 로 치환
 *   - components-table--alignment           → align / width 속성 → className / style 반영
 *   - components-table--empty               → rows=[] + emptyMessage → 한 줄 colspan 렌더
 *
 * 커버 못한 케이스 (별도 스토리 부재로 런타임 실행 불가):
 *   - emptyMessage 기본값 ("데이터가 없습니다") — Empty 스토리는 커스텀 문구를 지정함.
 *   - columns=[] + rows=[] 조합 시 `colSpan={columns.length || 1}` 이 1 로 폴백.
 *   두 케이스는 "후속 정비 권고" 로 리포트에 명시.
 */

// iframe 루트 = Storybook 이 마운트하는 `#storybook-root` 아래의 `.ui-table__wrapper > table`.
// 아래 모든 case 에서 가장 바깥 `<table.ui-table>` 를 앵커로 쓴다.
const TABLE = 'table.ui-table';

test.describe('Table — 기본 렌더 (Default story)', () => {
  test('table / thead / tbody 각 1개 + th 3 + 본문 tr/td 구조가 정확하다', async ({ page }) => {
    await page.goto('/iframe.html?id=components-table--default&viewMode=story');

    const table = page.locator(TABLE);
    await expect(table).toHaveCount(1);
    await expect(table.locator('thead')).toHaveCount(1);
    await expect(table.locator('tbody')).toHaveCount(1);

    // columns = [id, name, email] 3개
    const ths = table.locator('thead > tr > th');
    await expect(ths).toHaveCount(3);
    await expect(ths.nth(0)).toHaveText('ID');
    await expect(ths.nth(1)).toHaveText('이름');
    await expect(ths.nth(2)).toHaveText('이메일');

    // 본문 tr 개수 = sampleUsers.length (6). td 개수 = tr * columns = 6 * 3 = 18
    const bodyRows = table.locator('tbody > tr');
    await expect(bodyRows).toHaveCount(6);
    await expect(table.locator('tbody > tr > td')).toHaveCount(18);

    // 첫 행 셀 값이 row[key] 그대로 (render 미지정 컬럼)
    const firstRowCells = bodyRows.nth(0).locator('td');
    await expect(firstRowCells.nth(0)).toHaveText('1');
    await expect(firstRowCells.nth(1)).toHaveText('김민수');
    await expect(firstRowCells.nth(2)).toHaveText('minsu.kim@example.com');
  });

  test('th 에 scope="col" 과 head 클래스가 붙는다 (semantic 회귀)', async ({ page }) => {
    await page.goto('/iframe.html?id=components-table--default&viewMode=story');
    const firstTh = page.locator(`${TABLE} thead > tr > th`).first();
    await expect(firstTh).toHaveAttribute('scope', 'col');
    await expect(firstTh).toHaveClass(/ui-table__cell--head/);
  });

  test('본문 tr 은 getRowKey 기반 React key 로 렌더되며 행 수가 데이터와 일치한다', async ({
    page,
  }) => {
    // getRowKey 의 실제 key 값은 DOM 에 노출되지 않지만(React key 는 데이터 속성 아님),
    // rerender 시 행 수·순서가 data 와 정확히 동기화되는지로 간접 회귀 방지.
    await page.goto('/iframe.html?id=components-table--default&viewMode=story');
    const bodyRows = page.locator(`${TABLE} tbody > tr`);
    await expect(bodyRows).toHaveCount(6);
    // 순서 보존: 마지막 행 id 셀이 데이터 마지막과 매칭 (id=6, name='강하은')
    await expect(bodyRows.nth(5).locator('td').nth(0)).toHaveText('6');
    await expect(bodyRows.nth(5).locator('td').nth(1)).toHaveText('강하은');
  });
});

test.describe('Table — render 콜백 (WithCustomRender story)', () => {
  test('render 지정 컬럼은 ReactNode 로 치환되고, 미지정 컬럼은 row[key] 그대로', async ({
    page,
  }) => {
    await page.goto('/iframe.html?id=components-table--with-custom-render&viewMode=story');
    const table = page.locator(TABLE);

    // 컬럼 = id, name, email(render), createdAt(render)
    // name 컬럼은 render 미지정 → plain text 로 row.name
    const firstRow = table.locator('tbody > tr').first();
    await expect(firstRow.locator('td').nth(1)).toHaveText('김민수');

    // email 컬럼은 render 에서 <a href="mailto:..."> 를 반환
    const emailCell = firstRow.locator('td').nth(2);
    const anchor = emailCell.locator('a');
    await expect(anchor).toHaveCount(1);
    await expect(anchor).toHaveAttribute('href', 'mailto:minsu.kim@example.com');
    await expect(anchor).toHaveText('minsu.kim@example.com');

    // createdAt 은 render 에서 '2026년 1월 3일' 로 포매팅
    const dateCell = firstRow.locator('td').nth(3);
    await expect(dateCell).toHaveText('2026년 1월 3일');
  });
});

test.describe('Table — align / width 속성 반영 (Alignment story)', () => {
  test('align="right" 컬럼의 th 와 body td 에 ui-table__cell--align-right 클래스가 붙는다', async ({
    page,
  }) => {
    await page.goto('/iframe.html?id=components-table--alignment&viewMode=story');
    const table = page.locator(TABLE);

    // 컬럼 정의:
    //   [0] id     align='left'   width='120px'
    //   [1] name   align='center' width='30%'
    //   [2] email  align='right'  width 없음
    const ths = table.locator('thead > tr > th');
    await expect(ths.nth(0)).toHaveClass(/ui-table__cell--align-left/);
    await expect(ths.nth(1)).toHaveClass(/ui-table__cell--align-center/);
    await expect(ths.nth(2)).toHaveClass(/ui-table__cell--align-right/);

    // 각 body 행의 같은 컬럼에도 동일 align 클래스 전파
    const firstBodyRow = table.locator('tbody > tr').first();
    const tds = firstBodyRow.locator('td');
    await expect(tds.nth(0)).toHaveClass(/ui-table__cell--align-left/);
    await expect(tds.nth(1)).toHaveClass(/ui-table__cell--align-center/);
    await expect(tds.nth(2)).toHaveClass(/ui-table__cell--align-right/);
  });

  test('width 지정 컬럼의 th / td 에 inline style.width 가 그대로 반영된다', async ({
    page,
  }) => {
    await page.goto('/iframe.html?id=components-table--alignment&viewMode=story');
    const table = page.locator(TABLE);

    // th[0] : width '120px' — 인라인 style 속성 값 자체를 비교 (computed px 이 아닌 원본)
    const th0 = table.locator('thead > tr > th').nth(0);
    const th1 = table.locator('thead > tr > th').nth(1);
    const th2 = table.locator('thead > tr > th').nth(2);
    await expect(th0).toHaveAttribute('style', /width:\s*120px/);
    await expect(th1).toHaveAttribute('style', /width:\s*30%/);
    // width 미지정 컬럼은 style 속성이 아예 없어야 함 (undefined 분기 통과 확인)
    await expect(th2).not.toHaveAttribute('style', /width/);

    // body 같은 컬럼의 td 에도 동일 style 이 걸려야 함
    const firstBodyRow = table.locator('tbody > tr').first();
    await expect(firstBodyRow.locator('td').nth(0)).toHaveAttribute('style', /width:\s*120px/);
    await expect(firstBodyRow.locator('td').nth(1)).toHaveAttribute('style', /width:\s*30%/);
    await expect(firstBodyRow.locator('td').nth(2)).not.toHaveAttribute('style', /width/);
  });
});

test.describe('Table — 빈 상태 (Empty story)', () => {
  test('rows=[] 시 tbody 에 <td colspan="3"> 한 줄만 렌더된다', async ({ page }) => {
    await page.goto('/iframe.html?id=components-table--empty&viewMode=story');
    const table = page.locator(TABLE);

    // thead 는 유지 (페이지가 조건부로 숨기지 않도록 하는 설계 규약 — data-display.md §5.1)
    await expect(table.locator('thead > tr > th')).toHaveCount(3);

    // tbody 에 빈 상태 전용 tr 이 정확히 1개
    const bodyRows = table.locator('tbody > tr');
    await expect(bodyRows).toHaveCount(1);
    await expect(bodyRows.first()).toHaveClass(/ui-table__row--empty/);

    // 그 안의 td 1개 + colSpan=3 (columns.length) + 메시지 텍스트
    const emptyCell = bodyRows.first().locator('td');
    await expect(emptyCell).toHaveCount(1);
    await expect(emptyCell).toHaveAttribute('colspan', '3');
    await expect(emptyCell).toHaveClass(/ui-table__cell--empty/);
    await expect(emptyCell).toHaveText('등록된 사용자가 없습니다');
  });
});
