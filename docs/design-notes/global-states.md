# Design Notes: Global States (Loading / Error / Empty 범용 가이드)

**원본 PRD**: 해당 없음 (범용 가이드 — `docs/prd/todo.md`, `docs/prd/user-crud.md`, `docs/prd/memo.md` 공통 적용)
**작성일**: 2026-04-23
**소비자**:
- **프론트 개발팀** (`apps/example-web/src/pages/**` 의 Loading/Error/Empty 분기 구현 기준)
- **UI팀** (필요 시 공용 상태 뷰 primitive 추가 판단 기준)
- **디자인팀** (각 피처 design-notes 에서 상태 분기 규격을 덮어쓸 때 상위 원칙)

---

## 1. 목적

리스트/상세 페이지에서 **데이터 비동기 로딩** 때문에 발생하는 세 가지 전이 상태 — **Loading / Error / Empty** — 의 화면 구성 원칙을 한 군데서 고정한다.
현재 레포(`UserListPage`, `TodoListPage`, `MemoListPage` 등)에서 "데이터 fetch 중에는 `<p>Loading…</p>` 한 줄만 렌더" 하는 패턴이 퍼져 있어 페이지 제목과 주요 액션 버튼(+ New 등)이 사라진다. 그 결과 레이아웃 지터가 발생하고, Error 상태에서는 사용자가 취할 수 있는 복구 액션이 박탈된다.

이 문서는 그 분기 규칙을 "헤더는 유지하고 본문만 치환" 으로 고정한다.

---

## 2. 핵심 원칙 — 헤더 유지

리스트/상세 페이지의 **페이지 제목 + 주요 액션 버튼** (= 이하 "페이지 헤더") 은 Loading / Error / Empty 세 상태 모두에서 **유지**된다.
**본문 영역** (목록·표·카드 리스트) 만 상태별 뷰로 치환한다.

### 이유

1. **Critical action 보호** — "+ New" 같은 1차 액션 버튼을 Error 상태에서 박탈하면 사용자가 복구할 수 있는 경로가 없어진다 (리로드 외에는). Loading 상태에서도 마찬가지로 "새로 생성" 을 막을 이유가 없다.
2. **레이아웃 지터(CLS) 방지** — Loading → 본문 로드 완료 → 헤더 + 데이터 로 두 번 리플로우가 일어나지 않게. 헤더는 첫 페인트부터 제자리.
3. **컨텍스트 유지** — "이 페이지가 어떤 페이지인지" (예: "사용자 목록") 를 텍스트로 계속 보여줘야 Loading/Error 에서 사용자가 방향을 잃지 않는다.

### 예외 (이번 범위 밖)

- **404 Not Found**: 페이지 전체 대체 허용.
- **인증 만료 / 세션 종료**: 라우팅 리다이렉트, 현재 페이지 렌더 자체 스킵.
- **치명적 에러 (앱 크래시, Error Boundary 도달)**: 전역 ErrorBoundary 가 페이지 전체를 대체.

위 세 케이스는 "페이지 전체 치환" 이 의도적 UX 이므로 이 문서가 규정하지 않는다.

---

## 3. 상태별 규격

### 3.1 Loading

- **헤더**: 평소와 동일하게 렌더. 제목 + 주요 액션 버튼 활성 상태 유지.
  - 단, "New" 같은 버튼이 로드 완료 데이터에 의존해야만 동작한다면 (거의 없음) 스펙에 명시된 경우에 한해 disabled.
- **본문**:
  - **우선**: `@monorepo/ui` 의 `Skeleton` / `ListSkeleton` / `CardSkeleton` primitive 사용 (참조: [`data-display.md` §2 관련 primitive](./data-display.md)).
  - **간단 케이스**: 본문 중앙 정렬 텍스트 `"불러오는 중…"` (한국어 기본). 스피너 아이콘은 현재 레포에 공식 primitive 미확정 → 도입 시 UI팀에 별건 요청.
- **금지**:
  - 페이지 전체를 `<p>Loading…</p>` 한 줄로 대체하는 패턴 (= 헤더 박탈).
  - `display: none` 으로 헤더 숨기기.

### 3.2 Error

- **헤더**: 평소와 동일. + New 같은 버튼은 **살려둔다** (에러가 "목록 조회" 실패여도 "새로 만들기" 는 가능해야 복구 경로가 된다).
- **본문**:
  - 에러 메시지 텍스트 — `font-color-danger` 토큰 사용 (또는 `--alert-error-icon-color` 같은 semantic 토큰 — 구체 토큰은 UI팀 재량).
  - (선택) 재시도 버튼 — 라벨 "다시 시도" 기본. `@monorepo/ui` `Button` primitive 사용.
  - (선택) 에러 아이콘 — 현재 레포에 공식 error 아이콘 primitive 미확정. 도입 시 UI팀 요청.
- **금지**:
  - **스택 트레이스 / 내부 에러 메시지 원문 노출 금지** — 사용자에게 보여질 메시지는 번역 가능한 한국어 문구만. 디버그 정보는 `console.error` 로만.
  - 페이지 전체를 에러 화면으로 대체 (ErrorBoundary 도달이 아닌 한).

### 3.3 Empty

- **헤더**: 평소와 동일. + New 버튼은 특히 **두드러지게 유지** — Empty 상태의 1차 해결 경로이므로.
- **본문**:
  - **Table primitive 사용 페이지**: `Table` 의 `emptyMessage` prop 으로 안내 문구 주입 (`data-display.md` §2.1 / §5.1 참조). 페이지가 직접 "rows.length === 0 이면 다른 JSX" 로 분기하지 말 것.
  - **List + 합성 카드 페이지** (예: `MemoListPage`): 페이지가 직접 안내 블록 렌더. 중앙 정렬 텍스트 + (선택) 시작 CTA.
- **시작 CTA 처리**:
  - 페이지 헤더에 이미 "+ New" 버튼이 있으므로, 본문 내 CTA 는 **선택** 사항. 중복되면 헤더 버튼으로 유도하고 본문은 안내 텍스트만.
  - 본문에 CTA 를 두고 싶다면 헤더와 같은 primitive (`Button`) + 같은 variant 로. 별개의 디자인 내지 말 것.

---

## 4. 구현 패턴 (프론트 개발팀 대상)

### 4.1 기본 형태

페이지 컴포넌트가 세 상태를 분기할 때는 **헤더 렌더링을 조건부 바깥** 에 두고, 본문만 조건부 치환한다.

개념 구조 (의사 코드):

```
function ListPage() {
  const { data, isLoading, isError } = useQuery(...)

  return (
    <Page>
      <PageHeader title="..." actions={<Button>+ New</Button>} />

      {isLoading && <BodyLoading />}
      {isError && <BodyError />}
      {!isLoading && !isError && <BodyTable rows={data} />}
    </Page>
  )
}
```

### 4.2 금지 패턴

```
// NG — 헤더가 박탈됨. 레이아웃 지터 발생.
if (isLoading) return <p className="p-6">Loading…</p>
if (isError) return <p className="p-6">에러</p>
return <FullPage />
```

페이지 컴포넌트에서 `if (isLoading) return ...` 처럼 early return 으로 **페이지 전체를 대체하는 패턴 금지**. 헤더는 항상 렌더되고 본문만 조건부 렌더.

### 4.3 Empty 는 Table 에 위임

Table primitive 를 쓰는 페이지는 `rows.length === 0` 을 페이지가 직접 분기하지 않는다. `Table` 이 `emptyMessage` 로 본문 내 행 자리에 안내를 그려준다 — 이때 **헤더 영역은 보이지 않지만 페이지 헤더는 그 위에 유지된다**.

---

## 5. 구현 제약

- **페이지 컴포넌트에서 `if (isLoading/isError) return <...>` 로 전체 페이지를 대체하는 early return 금지.** 헤더는 항상 렌더, 본문만 조건부 렌더.
- **Light/Dark 양쪽 자동 대응** — 상태 뷰의 모든 시각 값은 `libs/tokens` / Tailwind 토큰 유틸 경유. 하드코딩 색/간격 금지.
- **에러 스택 트레이스 / 내부 메시지 원문 사용자 노출 금지** — 번역 가능한 한국어 문구만.
- **본문 상태 뷰에서도 `@monorepo/ui` primitive 우선** — 새 "ad-hoc" 상태 블록을 앱 코드 내부에 범용 primitive 로 만들지 말 것 (CLAUDE.md "UI 라이브러리 우선 규칙"). 합성이 반복되면 UI팀에 신규 primitive 요청 (`ui-composer` 경로).

---

## 6. 레퍼런스 (헤더 유지 패턴이 일반적인 사례)

| # | 이름 | URL | 차용 포인트 |
|---|---|---|---|
| 1 | Linear — Issues 리스트 | https://linear.app | 로딩 중에도 사이드바/헤더/필터 칩이 그대로. 본문 행 자리만 skeleton 으로 치환. |
| 2 | Vercel Dashboard — Projects 리스트 | https://vercel.com/dashboard | 에러 시 상단 프로젝트 네비/팀 스위처 유지. 본문 카드 그리드 자리에만 에러 안내 + 재시도. |
| 3 | GitHub — Repositories 리스트 | https://github.com | 빈 계정에서도 상단 네비 + "New repository" 버튼 유지. 본문만 안내 블록. |

(레퍼런스는 헤더 유지 + 본문 치환 패턴이 "실무에서 기본" 임을 보이기 위함. 구체 시각 디테일 차용은 이 범위 밖.)

---

## 7. Out of Scope

- 구체 아이콘 선정 (로딩 스피너, 에러 아이콘, 빈 상태 일러스트) — 해당 피처 PRD / design-notes 에서 요구할 때 결정.
- Skeleton 의 pixel 규격 (높이·간격·shimmer 속도) — UI팀 `Skeleton` / `ListSkeleton` / `CardSkeleton` primitive 구현 상세 소관.
- 재시도 버튼의 정확한 카피 (`"다시 시도"` / `"재시도"` / `"새로고침"`) — 피처별 문구 일관성은 피처 design-notes 에서.
- 전역 ErrorBoundary / 404 / 인증 만료 화면 — 2절 "예외" 로 이 문서가 규정하지 않음. 별건 노트 필요 시 `global-error-boundary.md` 신설.
- 실제 시각 회귀 검증 — `design-consistency-auditor` / `ui-library-tester` 몫.

---

## 8. UI팀 / 프론트 개발팀 실행 요청

### 프론트 개발팀 (즉시)

1. `apps/example-web/src/pages/UserListPage.tsx` — 현재 `isLoading` / `isError` 분기가 페이지 전체를 `<p>` 로 대체하는 패턴. 헤더(제목 + "+ New") 를 유지하도록 재구성. 본문만 Loading/Error 뷰로 치환.
2. `apps/example-web/src/pages/TodoListPage.tsx` — 동일 재구성. 필터 `RadioGroup` 과 "+ New" 버튼이 있는 상단 영역이 헤더로 유지되어야 함.
3. Empty 상태는 Table 의 `emptyMessage` 에 위임 — 페이지에서 `rows.length === 0` 분기 제거.

### UI팀 (후속 검토)

- `Skeleton` / `ListSkeleton` / `CardSkeleton` 외에 "Error 상태 공용 뷰" primitive 가 반복 패턴으로 필요해지면 `ui-composer` 경로로 신규 요청 — 이 문서 3.2 규격 기반.
- 로딩 스피너 / 에러 아이콘 primitive 가 필요해지면 동일 경로.

---

## 9. 변경 이력

- 2026-04-23: 신규 작성. `design-consistency-auditor` Warning (3a) — "Loading/Error 시 헤더가 박탈되는 패턴" 에 대응하는 상위 원칙 고정.
