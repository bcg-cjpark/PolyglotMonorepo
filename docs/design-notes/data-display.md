# Design Notes: Data Display (여러 행 표시 primitive 선택 가이드)

**원본 PRD**: 해당 없음 (범용 가이드 — `docs/prd/todo.md`, `docs/prd/user-crud.md`, `docs/prd/memo.md` 공통 적용)
**작성일**: 2026-04-22
**소비자**:
- **기획팀** (`docs/prd/**`, `docs/screens/**` 작성 시 UI 카테고리 용어 사전)
- **프론트 개발팀** (`apps/example-web/src/pages/**` 구현 시 primitive 선택 기준)
- **UI팀** (새 primitive 요청 수신 시 판단 기준)

---

## 1. 목적

"여러 행을 보여줘야 하는 화면" 에서 `@monorepo/ui` 의 어떤 primitive 를 고를지 한 군데서 결정한다.
"표" / "목록" / "카드 리스트" 라는 의도가 스펙에 쓰여 있을 때 구현 단계에서 primitive 선택 기준이 명시돼 있지 않으면 혼란이 생기므로, 이 문서가 그 기준을 고정한다.

---

## 2. 사용 가능한 primitive 개요

`@monorepo/ui` 가 제공하는 "여러 행 표시" 용 primitive 는 **`Table`**, **`List`**, **`MobileList`** 세 가지다.

### `Table`

- **책임**: 정형 스키마(고정 컬럼) 를 행/열 격자로 표시. 중·소량 데이터용.
- **API (선언적)**:
  - `columns`: `Array<{ key: string; header: ReactNode; render?: (row) => ReactNode; align?: 'left' | 'center' | 'right'; width?: string }>`
  - `rows`: 데이터 배열. 각 행은 `columns[i].key` 로 셀 값을 찾거나 `render(row)` 로 커스텀 렌더.
  - `emptyMessage`: 행이 0 개일 때 본문에 표시할 문구 (ReactNode).
- **제공하는 것**:
  - 헤더 / 본문 / 행 / 셀 구조.
  - 행 hover 상태.
  - 빈 상태 (`emptyMessage`).
  - 액션 셀 자유 주입 — `render` 콜백 안에 `@monorepo/ui` primitive (`Button`, `IconButton`, `Checkbox`, `Badge`, `Chip` 등) 를 그대로 넣는 패턴.
  - Light/Dark 자동 대응 (`libs/tokens` + Tailwind 토큰 유틸 기반, `isDark` prop 불필요).
- **의도적으로 제공하지 않는 것** (필요해지면 6절 경로로 에스컬레이션):
  - 컬럼 정렬.
  - 컬럼 필터.
  - 페이지네이션.
  - 행 선택 / 체크박스 컬럼 자동 생성.
  - 가상화.
- **피할 케이스**:
  - 행마다 레이아웃이 다른 콘텐츠(카드형, 제목+본문+메타 혼합) — 고정 컬럼 모델이 맞지 않음. `List` 로.
  - 대량 행(수천+) / 서버사이드 정렬·필터·페이지네이션이 UX 요구 — 6절 엣지 케이스.
  - 모바일 전용 좁은 뷰포트 — 가로 스크롤이 필연적. `MobileList` 로.

### `List` + `ListItem` (+ `ListItemText`, `ListItemAvatar`)

- **책임**: 세로 방향 콘텐츠 나열. `<ul>` + 커스텀 `<li>` 구조.
- **강점**:
  - 행마다 자유로운 children 주입 가능 → 합성 카드/요약 블록과 잘 어울림.
  - `clickable` / `selected` / `divider` / `secondaryAction` 같은 UI 상태 내장.
  - 키보드 접근성 (`role="button"`, Enter/Space 처리) 기본 제공.
  - `ListItemText` 가 primary/secondary/rightPrimary/rightSecondary 4축 텍스트 레이아웃 제공.
- **피할 케이스**:
  - 여러 컬럼을 격자로 봐야 할 때 — `Table` 로.
  - 대량 행(수백+) — 가상화 없음, 한 번에 DOM 에 다 렌더됨.

### `MobileList` + `MobileListItem`

- **책임**: 모바일 뷰포트 전용 세로 목록. 스와이프 삭제 액션 내장.
- **강점**:
  - `swipeAction` + `swipeThreshold` — 좌로 밀면 삭제 트리거 (터치 제스처 처리 포함).
  - 기본 삭제 아이콘 배드롭 (`trash`) 자동 표시.
- **피할 케이스**:
  - 데스크톱 전용 화면 — 스와이프 UX 가 마우스에서 어색.
  - 컬럼 개념이 있는 표 — `Table` 로.

### 그 외 관련 primitive (행 표시 자체는 아니지만 같이 자주 쓰임)

- `Skeleton` / `ListSkeleton` / `CardSkeleton` — 목록/카드 로딩 플레이스홀더.
- `Chip` / `Badge` — 행 내 상태·태그 표현.
- `Button` / `IconButton` / `Checkbox` — 행 내 액션. `Table` 의 `render` 콜백, `ListItem` 의 children / `secondaryAction` 자리에 주입.

### 2.1 Table row hover 의도 (2026-04-23 추가)

#### 의도

`Table` 의 **본문 행 hover** 는 "사용자가 어떤 행 위에 있는지 알려주는 강조" 이다.
따라서 hover 배경은 **헤더 배경과 명확히 구분**되어야 하고, 동시에 본문 기본 배경과도 구분되어야 한다.

#### 현상 (배경)

`design-consistency-auditor` Warning (3b) 실측:

- `libs/ui/src/components/Table/Table.scss` 기준, 헤더 `.ui-table__head` 배경과 본문 행 hover `.ui-table__body .ui-table__row:hover` 배경이 **동일하게 `var(--background-bg-surface)` 를 사용**.
- 결과: 본문 행 위에 마우스를 올리면 그 행이 **"헤더가 한 줄 복제돼 내려온 듯"** 보여 시각 혼동 유발.

#### 결정

hover 전용 토큰을 새로 만들기보다, **기존 토큰 재사용 또는 반투명 오버레이** 로 의도만 고정한다. 우선순위:

1. **기존 semantic 토큰 재사용 우선** — UI팀이 `libs/tokens/styles/__tokens-light.css` / `__tokens-dark.css` 를 먼저 스캔해 "헤더와 다른, 본문 위의 미묘한 강조" 에 해당하는 토큰이 있는지 확인. 후보:
   - `--background-divider` — 본문 행 경계에 이미 쓰이므로 의도 일치.
   - `primary050` / `neutral050` / `neutral100` 등 scale 저단계 — `global-palette.md` 11단계 Scale 가이드의 "subtle hover bg, 선택된 행 bg" 용도에 해당.
2. **위 후보로 해결 안 되거나, hover 의 "주변 색 기반 약한 오버레이" 의도를 더 충실히 담고 싶다면** `color-mix()` 사용:
   ```
   background-color: color-mix(in srgb, var(--font-color-default) 4%, transparent);
   ```
   - 장점: Light/Dark 어느 쪽에서도 "현재 전경색의 4% 오버레이" 가 자동으로 조정되어 헤더 배경과 반드시 달라진다. 토큰 신설 불필요.
   - 비율(4%) 은 시작점 제안 — UI팀이 실측 후 3~6% 사이에서 튜닝 재량.
3. **UI팀이 hover 전용 semantic 토큰을 신설** 하는 선택지도 열려 있음. 예: `--background-bg-hover` / `--table-row-hover-bg`. 이 경우:
   - `libs/tokens/styles/__tokens-light.css` / `__tokens-dark.css` 양쪽 동시 추가.
   - **반드시 `scripts/apply-theme-colors.mjs` 경유** (CLAUDE.md 규칙: 토큰 파일 직접 편집 금지).
   - Tailwind 로 노출하려면 `libs/tailwind-config/globals.css` 의 `@theme inline` alias 도 함께 추가.

#### 비금기 조건

- **헤더 배경(`--background-bg-surface`) 과 동일값 금지** — 3b 의 직접 원인.
- **Light/Dark 양쪽에서 자동 대응** — 단일 테마에서만 확인 후 확정 금지.
- **hover 강조 세기** — 너무 진하면 "선택됨" 상태와 혼동, 너무 옅으면 인지 불가. `800+` 같은 brand 색 fill 금지, `050`~`100` 레벨 또는 4~6% 오버레이 범위.

#### UI팀 실행 요청

- `libs/ui/src/components/Table/Table.scss` 의 `.ui-table__body .ui-table__row:hover` 배경을 **헤더 배경과 다른 미묘한 색** 으로 교체. 구현 방법(기존 토큰 재사용 / `color-mix` / 신규 토큰 신설)은 위 3가지 원칙 내에서 UI팀 재량.
- 교체 확정 후 본 문서의 **2.1 절을 다시 업데이트** — 어떤 토큰/식을 선택했는지 한 줄로 기록 (후속 감사 추적용).
- 토큰을 신설한 경우 `apply-theme-colors.mjs` 경유 필수, 양 테마 동시 정의, Tailwind alias 도 함께.

---

## 3. 선택 매트릭스 (핵심)

| 상황 | 권장 primitive | 이유 |
|---|---|---|
| 정형 스키마, 중·소량(수십~수백 행), 관리자 CRUD 화면 | **`Table`** | 컬럼 선언형 API + 토큰 기반 스타일. 정렬/필터가 기본 요구가 아닌 현 단계에 딱 맞는 비용. |
| 소~중량(수십 행), 행마다 제목+본문+메타 혼합, 컨텐츠 중심 | **`List` + 페이지 전용 합성 카드** (예: `apps/example-web/src/components/MemoCard.tsx`) | 행 레이아웃 자유도. `ListItemText` 의 primary/secondary 로 2줄 요약, 합성 카드로 서브 블록 표현. |
| 간단한 설정 메뉴/내비 항목 (아이콘+라벨+우측 액션) | **`List` + `ListItem` + `ListItemAvatar` + `ListItemText`** | 추가 합성 카드 없이도 MUI-풍 세로 목록이 곧장 완성. |
| 모바일 전용 화면, 좌스와이프 삭제가 UX 요구 | **`MobileList` + `MobileListItem`** | 제스처/삭제 배드롭 내장. |
| 대량 행(수천+), 서버사이드 정렬·필터·페이지네이션 | 현재 primitive 없음 | 6절 "엣지 / 예외" 참조. |
| 트리 / 타임라인 / 캘린더뷰 / 간트 | 현재 primitive 없음 | 6절 "엣지 / 예외" 참조. |

### 현재 레포 내 레퍼런스 페이지

- `apps/example-web/src/pages/UserListPage.tsx` — **`Table` 사용**. 이름/이메일/생성일 컬럼 + 삭제 액션 컬럼 (`render` 콜백에 `Button` 주입).
- `apps/example-web/src/pages/TodoListPage.tsx` — **`Table` 사용**. 체크박스 토글·상태 배지·Edit/Delete 를 모두 `render` 콜백에 합성. 상단 `RadioGroup` 필터는 테이블 밖에서 별도.
- `apps/example-web/src/pages/MemoListPage.tsx` — **"List + 합성 카드"** 범주. 현재는 `flex flex-col gap-3` + `MemoCard` 조합이지만 의도상 이 범주에 속한다. 향후 정돈 시 `<List gap="12px">` 래핑으로 정렬 가능 (기능 변화 없음).

---

## 4. 스펙 작성 시 규칙 (기획팀 대상)

`docs/prd/**` 와 `docs/screens/**` 에는 **UI 카테고리만** 명시한다. 구현 라이브러리/엘리먼트 이름을 박지 않는다.

- OK: "표", "목록", "카드 리스트", "모바일 스와이프 목록"
- NG: "`Table`", "`<table>`", "`ul` + `li`", "`Button`", "`native textarea`"

"왜 이렇게까지 엄격한가" — 라이브러리/엘리먼트는 구현 단계에서 결정되는 것이고, 스펙에 박으면 나중에 교체할 때 스펙까지 수정해야 한다. 스펙은 의도만 쓰고 구현은 프론트 개발팀이 이 문서의 매트릭스로 선택한다.

이 문서의 3절 매트릭스 좌측 열("상황") 에 쓰인 용어가 곧 **기획팀의 UI 카테고리 용어 사전** 이다. 스펙에서는 이 표현을 그대로 인용하면 된다.

> 주의: 기본 "표" 는 정렬·필터·페이지네이션을 포함하지 않는다. 그 기능이 실제로 필요한 화면이라면 스펙에서 "정렬 가능한 표 (대량 관리자용)" 처럼 명시적으로 주석을 달아둘 것. 그 주석이 있으면 구현 단계에서 6절 에스컬레이션 경로로 들어간다.

---

## 5. 구현 단계 기본값 (프론트 개발팀 대상)

### 5.1 "표" 스펙 → `Table` 이 기본

- `columns` 배열을 한 번 선언하고 `rows` 에 데이터를 넘기는 형태로 구성.
- 행 내 액션(버튼/체크박스/배지) 은 **`render` 콜백** 안에서 `@monorepo/ui` primitive 를 직접 주입. 셀 안에서 native `<button>` / `<input>` 을 새로 만들지 말 것.
- 빈 상태 문구는 `emptyMessage` 로 넘긴다 (페이지가 직접 조건부 렌더링 하지 않음 — 헤더는 유지되어야 하므로).
- 정렬·필터·페이지네이션이 필요해 보이면 **먼저 스펙을 다시 읽는다**. 스펙에 명시가 없다면 추가하지 말 것. 명시가 있으면 6절 경로.

### 5.2 "목록" 스펙 + 행 레이아웃이 카드형 → `List` + 합성 카드

- 페이지 전용 합성 카드는 `apps/example-web/src/components/<Entity>Card.tsx` 에 둔다 (예: `MemoCard.tsx`). **`libs/ui` 에 두지 않음** — 페이지 전용 합성이므로.
- 합성 카드 내부는 반드시 `@monorepo/ui` primitive (`Button`, `Badge`, `Chip`, `Icon`, `IconButton`) 로만 구성. 하드코딩 `<div class="...">` 로 버튼 흉내 금지.

### 5.3 "목록" 스펙 + 단일 라인 텍스트 → `List` + `ListItem` + `ListItemText`

- 합성 카드가 과할 때 (설정 화면의 항목, 심플한 링크 리스트 등). `ListItemText` 의 primary/secondary/rightPrimary/rightSecondary 축만으로 대부분 해결.

### 5.4 native `<table>` 금지

- 어떤 경우에도 페이지 코드 안에서 `<table>` / `<thead>` / `<tbody>` / `<tr>` / `<td>` 직접 사용 금지. 토큰 정합과 Light/Dark 대응이 깨진다.
- 표 형태가 필요하면 **`Table` primitive 사용이 유일한 경로**.
- `Table` 로도 커버되지 않는 요구 (예: 대량 행 가상화, 서버사이드 정렬, 인쇄 레이아웃의 진짜 `<table>` 의미론) 가 있으면 **UI팀 에스컬레이션** (6절).

### 5.5 모바일 전용 화면 → `MobileList` 먼저 고려

- 앱이 현재 데스크톱 중심이라 `MobileList` 사용처는 드물다. 모바일 뷰포트 전용 페이지가 신설될 때 기본값으로 둔다.

---

## 6. 엣지 / 예외

`Table`, `List`, `MobileList` 로 해결되지 않는 케이스:

- **대량 행 (수천+) 의 관리자 화면** — 가상화 필요.
- **서버사이드 정렬 / 필터 / 페이지네이션** — `Table` 은 비기능으로 제외함.
- **트리 뷰** (폴더 구조, 조직도) — primitive 부재.
- **타임라인** (시계열 이벤트 스트림) — primitive 부재.
- **캘린더 / 스케줄 뷰** — primitive 부재.
- **간트 / 칸반** — primitive 부재.
- **접근성/인쇄 의미론 목적의 `<table>`** — primitive 부재.

위 경우 ad-hoc 구현 금지. **UI팀 신규 primitive 요청 경로** 로 에스컬레이션:

```
ui-composer → ui-storybook-curator → ui-library-tester → ui-lead
```

(CLAUDE.md "UI 라이브러리 우선 규칙" 에 정의된 표준 파이프라인.)

특히 대량·정렬·필터·페이지네이션 요구가 누적돼 `Table` 의 비기능 경계를 넘게 되면, 그 시점에 **전용 grid primitive 재도입 검토** (예: `DataGrid` 같은 별도 primitive 신설 또는 외부 라이브러리 래핑) 를 UI팀에 요청한다. 요청 시 이 문서 3절 매트릭스에 새 행을 추가하는 것도 같이 제안할 것.

---

## 7. 구현 제약 (요약)

- **native `<table>` 금지** — `Table` primitive 사용 또는 UI팀 에스컬레이션.
- **앱 코드 내부에 범용 primitive 생성 금지** — `apps/example-web/src/components/` 는 페이지 전용 합성 카드만 (`MemoCard`, `UserListRow` 같은 것). 범용 이름(`Card`, `Table`, `ListRow`) 금지.
- **행 내 액션은 `@monorepo/ui` primitive 로** — `Table` 의 `render` 콜백 / `ListItem` children 에 native 버튼·인풋 삽입 금지.
- **Light/Dark 양쪽 대응** — `Table` 은 토큰 기반 자동 대응이므로 페이지에서 별도 prop 전달 불필요. 합성 카드는 `libs/tokens` / Tailwind 토큰 유틸만 사용.
- **하드코딩 색/간격 금지** — 모든 시각 값은 `libs/tokens` + Tailwind 토큰 유틸 경유.

---

## 8. Out of Scope

- `Table` primitive 의 구현 상세 (내부 DOM 구조, CSS 변수 매핑, 테마 훅 방식) — UI팀 소관. 이 문서는 스펙과 경계만 규정.
- 합성 카드의 구체 레이아웃 디테일 (메모/투두/유저 각 카드의 시각 규격) — 해당 피처 design-notes 에서 다룸.
- 페이지 레벨 로딩/에러/빈 상태 시각 규격 — [`global-states.md`](./global-states.md) 별건 노트 참조.
- 실제 시각 회귀 검증 — `design-consistency-auditor` / `ui-library-tester` 몫.

---

## 9. 변경 이력

- 2026-04-22: DataGrid (ag-grid-community 래퍼) 제거, Table primitive 로 대체. 대량/정렬/필터 요구가 생기면 재도입 검토.
- 2026-04-23: §2.1 "Table row hover 의도" 소섹션 추가. `design-consistency-auditor` Warning (3b) — "본문 행 hover 배경이 헤더 배경과 동일" 대응. §8 Out of Scope 의 "페이지 레벨 로딩/에러/빈 상태" 링크를 신규 `global-states.md` 로 갱신.
