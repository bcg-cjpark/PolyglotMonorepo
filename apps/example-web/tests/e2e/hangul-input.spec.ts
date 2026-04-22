import { test, expect, Page, Locator } from "@playwright/test";

/**
 * libs/ui 의 <Input> 컴포넌트에서 한글(IME) 입력이 제대로 동작하는지 검증.
 *
 * 배경:
 *  - Input.tsx 는 onCompositionStart/End + isComposingRef 로 IME 중간
 *    입력을 억제한 뒤 composition 종료 시점에만 onChange 를 호출.
 *  - Playwright 의 `page.keyboard.type('한글')` 은 실제 composition 이벤트를
 *    쏘지 않으므로, 세 가지 대체 경로로 검증한다.
 *
 * 시나리오:
 *  1) locator.fill()              — React 의 네이티브 setter 로 value 주입, input 이벤트만 발생
 *  2) page.keyboard.insertText()  — CDP 통해 DOM 에 텍스트 삽입, composition 이벤트는 안 탄다
 *  3) 직접 CompositionEvent dispatch — compositionstart/insertCompositionText/compositionend
 *
 * 각 방법에 대해:
 *  - Title 필드 DOM value 확인
 *  - 제출 후 서버가 받아 리스트에 노출되는지 확인
 *  - Description(네이티브 <textarea>) 와 비교
 */

const HANGUL = "한글테스트";

async function openNewForm(page: Page) {
  await page.goto("/todos/new");
  await expect(page.getByRole("heading", { name: "New Todo" })).toBeVisible();
}

/**
 * 리스트 페이지에서 해당 title 의 row 가 보이는지 검증.
 *
 * TodoListPage 는 `@monorepo/ui` 의 Table primitive 를 쓰는 native
 * `<table>` 기반이다. 데이터 행은 `tbody > tr.ui-table__row` (빈 상태 행은
 * `.ui-table__row--empty`, 헤더 행은 `thead` 내부라 제외됨) 이므로
 * 해당 조합에 title hasText 필터를 더해 정확한 데이터 행만 잡는다.
 *
 * Table primitive 는 row virtualization 을 쓰지 않으므로 모든 행이 DOM 에
 * 있으며 단지 viewport 밖에 있을 수 있다. `scrollIntoViewIfNeeded` 로 충분.
 */
function rowByTitle(page: Page, title: string): Locator {
  return page
    .locator("tbody tr.ui-table__row:not(.ui-table__row--empty)")
    .filter({ hasText: title });
}

async function expectRowExists(page: Page, title: string) {
  await expect(page).toHaveURL(/\/todos$/, { timeout: 10_000 });
  // Table 컬럼 헤더(Title) 로 초기 렌더 완료 대기.
  await page
    .locator("th.ui-table__cell--head")
    .filter({ hasText: "Title" })
    .waitFor({ state: "attached", timeout: 10_000 });
  const row = rowByTitle(page, title);
  await expect(row).toHaveCount(1, { timeout: 10_000 });
  await row.scrollIntoViewIfNeeded();
  await expect(row).toBeVisible({ timeout: 5_000 });
}

test.describe("Hangul input on libs/ui <Input>", () => {
  test("method 1: locator.fill() sets value and submits correctly", async ({
    page,
  }) => {
    const unique = `${HANGUL}-fill-${Date.now()}`;
    await openNewForm(page);

    const titleInput = page.getByPlaceholder("What needs to be done?");
    await titleInput.fill(unique);

    // DOM value 검증
    await expect(titleInput).toHaveValue(unique);

    // 대조군: native textarea
    const descInput = page.getByPlaceholder("Optional details");
    await descInput.fill(unique);
    await expect(descInput).toHaveValue(unique);

    // 제출
    await page.getByRole("button", { name: /^Create$/ }).click();

    // 리스트 반영 확인
    await expectRowExists(page, unique);
  });

  test("method 2: page.keyboard.insertText() goes through input events", async ({
    page,
  }) => {
    const unique = `${HANGUL}-insertText-${Date.now()}`;
    await openNewForm(page);

    const titleInput = page.getByPlaceholder("What needs to be done?");
    await titleInput.click();
    await page.keyboard.insertText(unique);

    // 즉시 DOM value 확인 (composition 없이 insertText 는 일반 input 이벤트)
    await expect(titleInput).toHaveValue(unique);

    // 대조군: native textarea
    const descInput = page.getByPlaceholder("Optional details");
    await descInput.click();
    await page.keyboard.insertText(unique);
    await expect(descInput).toHaveValue(unique);

    // 제출
    await page.getByRole("button", { name: /^Create$/ }).click();
    await expectRowExists(page, unique);
  });

  test("method 3: simulated CompositionEvent dispatch", async ({ page }) => {
    const unique = `${HANGUL}-composition-${Date.now()}`;
    await openNewForm(page);

    const titleInput = page.getByPlaceholder("What needs to be done?");
    await titleInput.click();

    // 실제 IME 조합 시퀀스를 흉내. React 의 synthetic event 를 태우려면
    // 네이티브 setter 로 value 를 세팅한 뒤 input 이벤트를 dispatch 해야 한다.
    // 단순 input.value = '...' 만 하면 React 는 변화를 감지하지 못한다.
    await page.evaluate((finalText: string) => {
      const input = document.querySelector<HTMLInputElement>(
        'input[placeholder="What needs to be done?"]'
      );
      if (!input) throw new Error("title input not found");
      input.focus();

      // React 16+ 에서 값 변경을 트리거하기 위해 native setter 사용
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      const setVal = (v: string) => {
        nativeSetter?.call(input, v);
      };

      // compositionstart
      input.dispatchEvent(new CompositionEvent("compositionstart"));

      // 조합 중간 단계들 — "한" 한 글자 조립 과정을 흉내
      const intermediates = ["ㅎ", "하", "한"];
      for (const m of intermediates) {
        setVal(m);
        input.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            data: m,
            inputType: "insertCompositionText",
            isComposing: true,
          })
        );
      }

      // compositionend 에서 최종 확정 문자열 세팅
      setVal(finalText);
      input.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          data: finalText,
          inputType: "insertCompositionText",
          isComposing: false,
        })
      );
      input.dispatchEvent(
        new CompositionEvent("compositionend", { data: finalText })
      );
    }, unique);

    // composition end 후 React 상태가 반영됐는지 value 로 검증
    await expect(titleInput).toHaveValue(unique);

    // 대조군: native textarea 에도 같은 방법으로
    await page.evaluate((text: string) => {
      const ta = document.querySelector<HTMLTextAreaElement>(
        'textarea[placeholder="Optional details"]'
      );
      if (!ta) throw new Error("description textarea not found");
      ta.focus();
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set;
      nativeSetter?.call(ta, text);
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }, unique);

    const descInput = page.getByPlaceholder("Optional details");
    await expect(descInput).toHaveValue(unique);

    // 제출
    await page.getByRole("button", { name: /^Create$/ }).click();
    await expectRowExists(page, unique);
  });

  test("diagnostic: capture Title DOM value right after each method", async ({
    page,
  }) => {
    // 세 방법을 한 페이지에서 순차 시도하며 DOM 값을 기록. 실패하더라도 계속 진행.
    await openNewForm(page);
    const titleInput = page.getByPlaceholder("What needs to be done?");

    // 1) fill
    await titleInput.fill("FILL_한글");
    const v1 = await titleInput.inputValue();

    // 2) insertText
    await titleInput.fill("");
    await titleInput.click();
    await page.keyboard.insertText("INSERT_한글");
    const v2 = await titleInput.inputValue();

    // 3) composition
    await titleInput.fill("");
    await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(
        'input[placeholder="What needs to be done?"]'
      );
      if (!input) return;
      input.focus();
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      input.dispatchEvent(new CompositionEvent("compositionstart"));
      setter?.call(input, "COMPOSE_한글");
      input.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          data: "COMPOSE_한글",
          inputType: "insertCompositionText",
        })
      );
      input.dispatchEvent(
        new CompositionEvent("compositionend", { data: "COMPOSE_한글" })
      );
    });
    const v3 = await titleInput.inputValue();

    // eslint-disable-next-line no-console
    console.log("[hangul diag]", { fill: v1, insertText: v2, composition: v3 });

    // 각 결과가 예상값과 일치하는지 soft 체크 (모두 실패해도 위 로그는 찍힘)
    expect.soft(v1).toBe("FILL_한글");
    expect.soft(v2).toBe("INSERT_한글");
    expect.soft(v3).toBe("COMPOSE_한글");
  });
});
