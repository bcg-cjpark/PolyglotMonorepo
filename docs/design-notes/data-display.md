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
`UserListPage` / `TodoListPage` 가 초기 구현에서 native `<table>` 로 짜였다가 `DataGrid` 로 교체된 적이 있음 —
"표" / "목록" / "카드 리스트" 라는 의도가 스펙에 쓰여 있어도 구현 시 primitive 선택 기준이 명시돼 있지 않아 생긴 혼란이었다.
이 문서는 그 기준을 고정한다.

---

## 2. 사용 가능한 primitive 개요

`libs/ui/src/index.ts` 에 실제 export 된 것만 나열. **Table primitive 는 존재하지 않음** (ag-grid 기반 `DataGrid` 가 그 역할).

### `DataGrid` (ag-grid-community 래퍼)

- **책임**: 정형 데이터(고정 컬럼 스키마)를 행/열 격자로 표시.
- **강점**:
  - 내부 가상화 (`suppressRowVirtualisation: false`) → 수백~수천 행도 성능 유지.
  - `sortable` / `filterable` / `pagination` / `rowSelection` props 로 기능 토글.
  - `cellRenderer` 로 행 내 버튼/체크박스/뱃지 등 React 컴포넌트 삽입.
  - `isDark` 로 테마 연동 (`themeAlpine` / `colorSchemeDark`).
  - 한국어 로케일(`AG_GRID_LOCALE_KR`) 및 `noRowsToShow` 빈 상태 문구 주입.
- **피할 케이스**:
  - 행마다 레이아웃이 다른 콘텐츠(카드형, 제목+본문+메타 혼합) — 고정 컬럼 모델이 맞지 않음.
  - 10행 내외의 단순 목록 — 오버킬.
  - 모바일 전용 좁은 뷰포트 — 가로 스크롤이 필연적.

### `List` + `ListItem` (+ `ListItemText`, `ListItemAvatar`)

- **책임**: 세로 방향 콘텐츠 나열. `<ul>` + 커스텀 `<li>` 구조.
- **강점**:
  - 행마다 자유로운 children 주입 가능 → 합성 카드/요약 블록과 잘 어울림.
  - `clickable` / `selected` / `divider` / `secondaryAction` 같은 UI 상태 내장.
  - 키보드 접근성 (`role="button"`, Enter/Space 처리) 기본 제공.
  - `ListItemText` 가 primary/secondary/rightPrimary/rightSecondary 4축 텍스트 레이아웃 제공.
- **피할 케이스**:
  - 여러 컬럼을 "정렬 가능한 표" 로 봐야 할 때 — `DataGrid` 로.
  - 대량 행(수백+) — 가상화 없음, 한 번에 DOM 에 다 렌더됨.

### `MobileList` + `MobileListItem`

- **책임**: 모바일 뷰포트 전용 세로 목록. 스와이프 삭제 액션 내장.
- **강점**:
  - `swipeAction` + `swipeThreshold` — 좌로 밀면 삭제 트리거 (터치 제스처 처리 포함).
  - 기본 삭제 아이콘 배드롭 (`trash`) 자동 표시.
- **피할 케이스**:
  - 데스크톱 전용 화면 — 스와이프 UX 가 마우스에서 어색.
  - 데이터 그리드성 요구 — 컬럼 개념이 없음.

### 그 외 관련 primitive (행 표시 자체는 아니지만 같이 자주 쓰임)

- `Skeleton` / `ListSkeleton` / `CardSkeleton` — 목록/카드 로딩 플레이스홀더.
- `Chip` / `Badge` — 행 내 상태·태그 표현.
- `Button` / `IconButton` / `Checkbox` — 행 내 액션. `DataGrid` 의 `cellRenderer` 또는 `ListItem` 의 children/`secondaryAction` 자리에 주입.

---

## 3. 선택 매트릭스 (핵심)

| 상황 | 권장 primitive | 이유 |
|---|---|---|
| 정형 스키마, 컬럼 정렬/필터, 대량 행, CRUD 관리자 화면 | **`DataGrid`** | 가상화 + 정렬/필터/페이지네이션 내장. ag-grid 의 `themeAlpine` 이 토큰과 정합. |
| 소~중량(수십 행), 행마다 제목+본문+메타 혼합, 컨텐츠 중심 | **`List` + 페이지 전용 합성 카드** (예: `apps/example-web/src/components/MemoCard.tsx`) | 행 레이아웃 자유도. `ListItemText` 의 primary/secondary 로 2줄 요약, 합성 카드로 서브 블록 표현. |
| 간단한 설정 메뉴/내비 항목 (아이콘+라벨+우측 액션) | **`List` + `ListItem` + `ListItemAvatar` + `ListItemText`** | 추가 합성 카드 없이도 MUI-풍 세로 목록이 곧장 완성. |
| 모바일 전용 화면, 좌스와이프 삭제가 UX 요구 | **`MobileList` + `MobileListItem`** | 제스처/삭제 배드롭 내장. |
| 트리 / 타임라인 / 캘린더뷰 / 간트 | 해당 primitive 없음 | 6절 "엣지 / 예외" 참조. |

### 현재 레포 내 레퍼런스 페이지

- `apps/example-web/src/pages/UserListPage.tsx` — `DataGrid`, `disableRowSelection`, `height="calc(100vh - 200px)"`, `cellRenderer` 로 Delete 버튼.
- `apps/example-web/src/pages/TodoListPage.tsx` — `DataGrid`, 체크박스 토글·상태 배지·Edit/Delete 를 모두 `cellRenderer` 에 합성. `RadioGroup` 필터와 상단 분리.
- `apps/example-web/src/pages/MemoListPage.tsx` — 행 단위 콘텐츠 중심 카드 리스트. 현재는 `flex flex-col gap-3` + `MemoCard` 조합이지만, 의도상 "List + 합성 카드" 범주에 속한다. 향후 정돈 시 `<List gap="12px">` 래핑으로 정렬 가능 (기능 변화 없음).

---

## 4. 스펙 작성 시 규칙 (기획팀 대상)

`docs/prd/**` 와 `docs/screens/**` 에는 **UI 카테고리만** 명시한다. 구현 라이브러리/엘리먼트 이름을 박지 않는다.

- OK: "데이터 그리드", "목록", "카드 리스트", "모바일 스와이프 목록"
- NG: "`DataGrid`", "`<table>`", "AG Grid", "`ul` + `li`", "`Button`", "`native textarea`"

"왜 이렇게까지 엄격한가" — 라이브러리/엘리먼트는 구현 단계에서 결정되는 것이고, 스펙에 박으면 나중에 교체할 때 스펙까지 수정해야 한다. 스펙은 의도만 쓰고 구현은 프론트 개발팀이 이 문서의 매트릭스로 선택한다.

이 문서의 3절 매트릭스 좌측 열("상황") 에 쓰인 용어가 곧 **기획팀의 UI 카테고리 용어 사전** 이다. 스펙에서는 이 표현을 그대로 인용하면 된다.

---

## 5. 구현 단계 기본값 (프론트 개발팀 대상)

### 5.1 "데이터 그리드" 스펙 → `DataGrid` 가 기본

- 스펙이 정렬·페이지네이션을 요구하지 않으면 `sortable` / `pagination` 은 **기본값 false** 유지 (명시적으로 true 로 올리지 말 것).
- 선택 UX 가 필요 없으면 `disableRowSelection` 을 주어 "아무 의도 없는 회색 하이라이트" 를 끈다 (현재 `UserListPage` / `TodoListPage` 가 이 패턴).
- **height 전략**:
  - 페이지 전체를 그리드가 차지하는 관리자 화면 → `height="calc(100vh - Npx)"` (N = 상단 헤더·필터 영역 실측 합). 현재 UserList 는 `200px`, TodoList 는 필터 RadioGroup 이 있어 `260px`.
  - 페이지 안의 한 섹션으로 그리드가 들어가는 경우 → 명시 픽셀 (`height={400}`) 또는 wrapper 에 높이 고정. `domLayout: 'autoHeight'` 는 가상화와 충돌하므로 대량 행에는 피할 것.
- 행 내 액션(버튼/체크박스/배지) 은 **`cellRenderer`** 로 `@monorepo/ui` primitive 를 직접 주입. 셀 안에서 native `<button>` / `<input>` 을 새로 만들지 말 것.

### 5.2 "목록" 스펙 + 행 레이아웃이 카드형 → `List` + 합성 카드

- 페이지 전용 합성 카드는 `apps/example-web/src/components/<Entity>Card.tsx` 에 둔다 (예: `MemoCard.tsx`). **`libs/ui` 에 두지 않음** — 페이지 전용 합성이므로.
- 합성 카드 내부는 반드시 `@monorepo/ui` primitive (`Button`, `Badge`, `Chip`, `Icon`, `IconButton`) 로만 구성. 하드코딩 `<div class="...">` 로 버튼 흉내 금지.

### 5.3 "목록" 스펙 + 단일 라인 텍스트 → `List` + `ListItem` + `ListItemText`

- 합성 카드가 과할 때 (설정 화면의 항목, 심플한 링크 리스트 등). `ListItemText` 의 primary/secondary/rightPrimary/rightSecondary 축만으로 대부분 해결.

### 5.4 native `<table>` 금지

- 어떤 경우에도 페이지 코드 안에서 `<table>` / `<thead>` / `<tbody>` / `<tr>` / `<td>` 직접 사용 금지.
- 예외적 요구 (인쇄 레이아웃 / 스크린리더 표 의미론 강제 / 이메일 HTML 등) 가 있으면 **UI팀에 `Table` primitive 신설 요청** 으로 에스컬레이션 (6절 경로).

### 5.5 모바일 전용 화면 → `MobileList` 먼저 고려

- 앱이 현재 데스크톱 중심이라 `MobileList` 사용처는 드물다. 모바일 뷰포트 전용 페이지가 신설될 때 기본값으로 둔다.

---

## 6. 엣지 / 예외

위 3종(`DataGrid`, `List`, `MobileList`) 으로 해결되지 않는 케이스:

- **트리 뷰** (폴더 구조, 조직도) — primitive 부재.
- **타임라인** (시계열 이벤트 스트림) — primitive 부재.
- **캘린더 / 스케줄 뷰** — primitive 부재.
- **간트 / 칸반** — primitive 부재.
- **접근성/인쇄 의미론 목적의 진짜 `<table>`** — primitive 부재.

위 경우 ad-hoc 구현 금지. **UI팀 신규 primitive 요청 경로** 로 에스컬레이션:

```
ui-composer → ui-storybook-curator → ui-library-tester → ui-lead
```

(CLAUDE.md "UI 라이브러리 우선 규칙" 에 정의된 표준 파이프라인.) 요청 시 이 문서 3절 매트릭스에 새 행을 추가하는 것도 같이 제안할 것.

---

## 7. 구현 제약 (요약)

- **native `<table>` 금지** — `DataGrid` 사용 또는 UI팀 에스컬레이션.
- **앱 코드 내부에 범용 primitive 생성 금지** — `apps/example-web/src/components/` 는 페이지 전용 합성 카드만 (`MemoCard`, `UserListRow` 같은 것). 범용 이름(`Card`, `Table`, `ListRow`) 금지.
- **행 내 액션은 `@monorepo/ui` primitive 로** — `cellRenderer` / `ListItem` children 에 native 버튼·인풋 삽입 금지.
- **Light/Dark 양쪽 대응** — `DataGrid` 는 `isDark` prop 을 테마 훅과 연결 (현재 예시 페이지는 기본값 false 사용). 신규 페이지에서 다크 모드가 요구되면 반드시 연결.
- **하드코딩 색/간격 금지** — 합성 카드 내부도 `libs/tokens` / Tailwind 토큰 유틸만 사용.

---

## 8. Out of Scope

- `DataGrid` 내부 ag-grid 커스텀 테마 (cell/header 색상 조정) — UI팀 소관. 필요 시 별도 노트.
- 합성 카드의 구체 레이아웃 디테일 (메모/투두/유저 각 카드의 시각 규격) — 해당 피처 design-notes 에서 다룸.
- 페이지 레벨 로딩/에러/빈 상태 시각 규격 — `global-empty-error-loading.md` (미작성, 별건).
- 실제 시각 회귀 검증 — `design-consistency-auditor` / `ui-library-tester` 몫.
