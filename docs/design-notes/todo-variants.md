# 화면 시안 카탈로그: todo

**원본 PRD**: [../prd/todo.md](../prd/todo.md)
**원본 Brief**: [../stitch-brief/todo.md](../stitch-brief/todo.md)
**작성일**: 2026-04-23
**상태**: 선택 대기

**한 눈 비교**: [index.html](./todo-variants/index.html) — 모든 variant 를 한 페이지에서 Light/Dark 토글하며 비교.

---

## 공통 제약

- 모든 시안은 `@monorepo/ui` primitive + `libs/tokens` CSS 변수로만 구성.
- 디자인 노트 준수:
  - [`global-palette.md`](./global-palette.md) — Indigo Primary + Amber Secondary, 11단계 scale 사용 규칙, Primary CTA 1개 원칙.
  - [`global-states.md`](./global-states.md) — Loading / Error / Empty 에서 페이지 헤더(제목 + 주요 액션) + 상태 필터 유지. 본문만 상태별 뷰로 치환.
  - [`data-display.md`](./data-display.md) — 정형 스키마 CRUD 는 `Table` primitive. native `<table>` 금지. 행 hover 배경은 `--background-bg-innerframe`.
- Todo 특유 시각 규격 (Brief 재확인):
  - **completed=true** 행: 제목 취소선 + `--font-color-default-muted` 계열 (semantic 토큰만, scale 직접 참조 금지).
  - **overdue** (`dueDate < today && completed === false`): 마감일 텍스트만 `--font-color-red` (위험 색 semantic). 행 전체를 빨갛게 칠하지 말 것.
  - **상태 필터**: 세그먼트 컨트롤 또는 언더라인 라디오 그룹. 드롭다운 금지 (옵션 3개).
  - **title 필드**: 한글 IME 전제 — `composition*` 이벤트 처리 필드.
- HTML 시안은 **시각 근사** — 실제 렌더는 구현 단계에서 `@monorepo/ui` primitive 로. 매핑 표가 진실 소스.
- Light/Dark 자동 대응. HTML 시안은 한 파일에 양쪽 토큰을 인라인해 우상단 🌓 토글로 즉시 스위칭.

---

## TodoListPage

Route: `/todos`
역할: 할 일 목록을 상태별(전체/진행 중/완료) 로 좁혀 보고, 한 번의 상호작용으로 완료 토글·삭제·생성 진입을 할 수 있다.

### Variant A — "표 + 세그먼트 필터" (권장)

**시안 HTML**: [todo-list-a.html](./todo-variants/todo-list-a.html)

**의도**: Brief 가 명시한 "정형 스키마 표 + 세그먼트 상태 필터 + 체크박스 토글" 을 있는 그대로 실현. `data-display.md` §3 매트릭스의 "정형 스키마 · 중·소량 · 관리자 CRUD" 결정과 정렬. 컬럼은 체크/제목/마감일/상태/액션 5개 — 체크박스 토글·상태 배지·편집·삭제를 `Table.render` 콜백 안에 합성. 현재 레포 `TodoListPage` 구현 방향과 일치.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 페이지 컨테이너·헤더 레이아웃 | Tailwind utility (page-container / page-header) | 기존 | primitive 불필요 — 공용 레이아웃 토큰만 사용 |
| 제목 옆 주요 액션 | `Button` (variant=primary) | 기존 | 라벨: `+ 새 할 일`. 클릭 시 `/todos/new` 라우팅 |
| 상태 필터 (세그먼트) | `RadioGroup` (segmented / underline 스타일) | 기존 | 옵션 3개: 전체/진행 중/완료. 현재 선택은 Primary anchor. 서버 쿼리 `status=all\|active\|completed` 재요청 |
| 표 본체 | `Table` | 기존 | columns 5개 (체크 / 제목 / 마감일 / 상태 / 액션). 빈 상태는 `emptyMessage` 위임 |
| 행 내 체크 토글 | `Checkbox` | 기존 | `Table.render` 콜백에 주입. 클릭 시 PATCH `/todos/{id}/toggle` (낙관적 업데이트) |
| 행 내 상태 배지 | `Badge` (pending/done/overdue 3종) | 기존 | `--chips-status-*` 토큰 + 위험 색 variant 는 `--base-colors-red-red050/900` 조합. `overdue` 전용 chip semantic 은 "기존 조합" 범위에서 해결 가능 (신규 토큰 불필요) |
| 행 내 편집 · 삭제 | `Button` (ghost sm) + `Button` (destructive sm) | 기존 | `Table.render` 콜백에 주입 |
| 로딩 플레이스홀더 | `ListSkeleton` (또는 `Skeleton` n행) | 기존 | 본문 치환 전용. 헤더·필터는 유지 |

**상태 대응**:

- **Loading**: 페이지 헤더 + 세그먼트 필터 유지. `Table` 본문 자리에 `ListSkeleton` 렌더.
- **Error**: 페이지 헤더 + 세그먼트 필터 유지. 본문에 한국어 에러 문구 + `Button`("다시 시도"). 스택 트레이스 노출 금지.
- **Empty**: 페이지 헤더 + 세그먼트 필터 유지. `Table.emptyMessage` 로 본문 빈 행 자리에 문구 (필터별: "전체" → "등록된 할 일이 없습니다.", "진행 중" → "진행 중인 할 일이 없습니다.", "완료" → "완료된 할 일이 없습니다." — 구현 단계 재량).

**위험/전제 / 신규 요청**:

- PRD / Brief 범위 내. 위험 없음.
- 신규 primitive 없음 (RadioGroup 의 segmented variant 가 실제 스타일로 존재하는지 UI팀 확인 필요 — 없으면 기존 RadioGroup + 커스텀 class 합성으로 해결 가능).
- 신규 토큰 없음.

---

### Variant B — "칸반 2-column" (대안 A)

**시안 HTML**: [todo-list-b.html](./todo-variants/todo-list-b.html)

**의도**: "진행 중" / "완료" 2개 컬럼으로 상태를 시각 분리. 각 컬럼 = 해당 상태의 카드 스택. 세그먼트 필터 "전체" 선택 시 2-column, 단일 상태 선택 시 1-column 으로 수렴.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 페이지 헤더 | Tailwind utility + `Button` (primary) | 기존 | — |
| 위험/전제 배너 | `Alert` (variant=warning) | 기존 | 칸반 채택 시 PRD/Brief 개정 경고 |
| 상태 필터 (세그먼트) | `RadioGroup` (segmented) | 기존 | A 와 동일 |
| 칸반 컬럼 컨테이너 | `List` 또는 Tailwind utility (2-column grid) | 기존 | 컬럼당 `List` + 합성 카드 스택 |
| 컬럼 카드 (TodoCard) | `apps/example-web/src/components/TodoCard.tsx` (신규 페이지 전용 합성) | 신규 (**앱 코드 내부**, 프론트 개발팀 소관) | primitive 아님. `libs/ui` 로 승격 금지 |
| 카드 내 체크 토글 | `Checkbox` | 기존 | 합성 카드 내부 |
| 카드 내 편집 · 삭제 | `Button` (ghost sm) + `Button` (destructive sm) | 기존 | — |
| 로딩 플레이스홀더 | `CardSkeleton` n개 (컬럼 내부 치환) | 기존 | — |

**상태 대응**:

- **Loading**: 페이지 헤더 + 세그먼트 유지. 각 컬럼 내부를 `CardSkeleton` n개로 치환.
- **Error**: 페이지 헤더 + 세그먼트 유지. 본문(두 컬럼 공통 영역) 에 에러 텍스트 + `Button`("다시 시도").
- **Empty**: 컬럼별 안내 ("진행 중인 할 일이 없습니다" / "완료된 항목이 없습니다"). 헤더의 `+ 새 할 일` 로 유도.

**위험/전제 / 신규 요청**:

- **위험**: `data-display.md` §3 매트릭스는 "정형 스키마 CRUD → 표" 로 결정. 칸반은 §6 "엣지 케이스(칸반 primitive 부재)" 에 해당 — 전용 primitive 가 없어 앱 코드 합성으로 해결.
- **위험**: PRD V1 Out-of-scope "드래그앤드롭 정렬 핸들" 의 시각적 기대를 유도 (카드 위치 이동 가능하다는 오해).
- **위험**: 컬럼 분할 자체가 "카테고리/분류" UI 범주에 근접 — Brief Out-of-scope "카테고리/태그 분류 UI" 와 충돌 우려.
- **전제**: 채택 시 PRD "관련 화면"·Brief "필요 UI 카테고리" 개정 필요.
- 신규 primitive 없음 (합성 `TodoCard` 는 앱 코드).
- 신규 토큰 없음.

---

### Variant C — "컴팩트 List" (대안 B)

**시안 HTML**: [todo-list-c.html](./todo-variants/todo-list-c.html)

**의도**: 행 높이를 표(56px 급) 보다 촘촘히(40px 급) 설정한 List + 합성 row. 한 줄에 체크박스 + 제목 + 우측 마감일을 압축 배치, 편집/삭제는 hover 시 노출(progressive disclosure). 많은 할 일을 빠르게 훑는 "스캔성 극대화" 구성.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 페이지 헤더 | Tailwind utility + `Button` (primary) | 기존 | — |
| 위험/전제 배너 | `Alert` (variant=warning) | 기존 | 밀도·접근성 리스크 고지 |
| 상태 필터 (세그먼트) | `RadioGroup` (segmented) | 기존 | A 와 동일 |
| 목록 컨테이너 | `List` | 기존 | 행 경계에 divider, 최소 높이 40px |
| 행 합성 (TodoRowItem) | `apps/example-web/src/components/TodoRowItem.tsx` (신규 페이지 전용 합성) | 신규 (**앱 코드 내부**, 프론트 개발팀 소관) | primitive 아님 |
| 행 내 체크 토글 | `Checkbox` | 기존 | — |
| 행 내 편집 · 삭제 | `Button` (ghost sm) + `Button` (destructive sm) | 기존 | hover 시 노출 |
| 로딩 플레이스홀더 | `ListSkeleton` | 기존 | — |

**상태 대응**:

- **Loading**: 페이지 헤더 + 세그먼트 유지. 본문을 `ListSkeleton` 로 치환.
- **Error**: 페이지 헤더 + 세그먼트 유지. 본문 중앙 에러 텍스트 + `Button`("다시 시도").
- **Empty**: 안내 블록 (중앙 정렬 텍스트) — 헤더의 `+ 새 할 일` 로 유도. 중복 CTA 생략.

**위험/전제 / 신규 요청**:

- **위험**: `data-display.md` §3 은 "정형 스키마 CRUD → 표". 컴팩트 List 는 "콘텐츠 중심 소~중량" 범주라 카테고리 이탈 — Brief 개정 필요.
- **위험**: 편집/삭제 액션의 hover 노출은 **터치 기기에서 발견성 저하** — 접근성 리스크. 모바일에서는 액션이 항상 노출되도록 별도 분기 필요.
- **위험**: 상태 배지가 배제돼 완료/진행 인식이 "체크박스 + 제목 취소선 + 마감일 색" 에만 의존. 색각이상 사용자 고려 필요.
- 신규 primitive 없음 (합성 `TodoRowItem` 은 앱 코드).
- 신규 토큰 없음.

---

## TodoFormPage

Route:
- `/todos/new` — 생성 모드
- `/todos/:id/edit` — 편집 모드

역할: 단일 할 일의 제목과 마감일을 생성하거나 편집. 편집 모드는 `completed` 필드도 함께 수정.

### Variant A — "세로 스택 1열" (권장)

**시안 HTML**: [todo-form-a.html](./todo-variants/todo-form-a.html)

**의도**: Brief 가 명시한 "단일 필드 중심 폼" 을 있는 그대로 실현. `Input` (text, 한글 IME) + `Input` (date) + (편집 모드) `Checkbox` 를 세로 스택으로 배치. 하단 액션 바에 Primary "저장" + Ghost "취소". Primary CTA 1개 원칙 준수.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 페이지 헤더 | Tailwind utility + `Button` (ghost "취소") | 기존 | 제목은 모드별 ("새 할 일" / "할 일 편집") |
| 폼 컨테이너 | Tailwind utility (form-stack) | 기존 | gap=padding-24 |
| 제목 입력 | `Input` (type=text) | 기존 | 필수, 최대 200자, 공백만 금지, **한글 IME** (composition* 이벤트 처리) |
| 제목 입력 카운터 | Tailwind utility (현재/최대 표시) | 기존 | 200자 제한 가시화 |
| 마감일 입력 | `Input` (type=date) | 기존 | 선택 필드. 비우면 payload `dueDate: null`. **전용 `DatePicker` primitive 는 현재 미존재** — `Input type="date"` 로 대체 |
| (편집 모드) 완료 체크박스 | `Checkbox` | 기존 | PUT payload 의 `completed` 필드. PATCH toggle 과는 별개 |
| 필드 에러 문구 | Tailwind utility (`--input-color-text-error` = `--font-color-danger` 계열) | 기존 | 한국어 문구만 |
| 폼 하단 액션 바 | `Button` (primary "저장") + `Button` (ghost "취소") | 기존 | 우측 정렬, 상단 divider |
| 로딩 플레이스홀더 | `Skeleton` (편집 모드 초기 fetch) | 기존 | 헤더는 유지, 폼 블록만 치환 |

**상태 대응**:

- **Loading (편집 모드 초기 fetch)**: 헤더 유지. 폼 블록 자리를 `Skeleton` 로 치환.
- **Error (편집 모드 초기 fetch 실패)**: 헤더 유지. 본문에 에러 텍스트 + `Button`("다시 시도").
- **저장 중**: Primary `Button` disabled + 스피너. 필드 disabled.
- **성공 (201/200)**: `/todos` 로 라우팅.
- **유효성 에러**: 필드 helper 를 `--input-color-text-error` 로 전환. 저장 버튼은 유효해질 때까지 동작 불가.

**위험/전제 / 신규 요청**:

- PRD / Brief 일치. 위험 없음.
- 신규 primitive 없음 (`DatePicker` 는 향후 UI팀 별건 요청 고려 — V1 범위에서는 native date input 으로 충분).
- 신규 토큰 없음.

---

### Variant B — "날짜 퀵픽 Chip" (대안 A)

**시안 HTML**: [todo-form-b.html](./todo-variants/todo-form-b.html)

**의도**: `dueDate` 입력을 "오늘 / 내일 / 다음 주 / 날짜 선택 / 없음" 5개 `Chip` 단일 선택 toggle 로 확장. "날짜 선택" 선택 시 실제 date input 노출, 프리셋 선택 시 클라이언트에서 ISO date 계산 후 payload 에 반영.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 페이지 헤더 | Tailwind utility + `Button` (ghost) | 기존 | — |
| 위험/전제 배너 | `Alert` (variant=warning) | 기존 | Brief 이탈 고지 |
| 제목 입력 | `Input` (type=text) | 기존 | A 와 동일 |
| 퀵픽 그룹 | `Chip` × 5 (단일 선택 toggle) 또는 `RadioGroup` (chip 스타일) | 기존 | `Chip` primitive 가 단일 선택 toggle 그룹을 노출하지 않으면 `RadioGroup` 으로 대체 (UI팀 확인 필요) |
| 날짜 입력 reveal | `Input` (type=date) | 기존 | "날짜 선택" 선택 시만 노출 |
| 완료 체크박스 | `Checkbox` | 기존 | A 와 동일 |
| 폼 하단 액션 바 | `Button` (primary) + `Button` (ghost) | 기존 | — |

**상태 대응**: A 와 동일 (헤더·폼 블록 분기 규칙 동일).

**위험/전제 / 신규 요청**:

- **위험**: Brief "날짜 선택 입력" 범주만 명시. 퀵픽 프리셋 도입 시 Brief 개정 필요.
- **위험**: "다음 주" 의 요일 기준(월요일 기준? 7일 후?) 등 프리셋 의미 고정이 추가 스펙. 국제화·다국어 시 추가 작업.
- **전제**: `Chip` primitive 의 single-select toggle 그룹 지원 여부 — 미지원 시 `RadioGroup` 으로 대체 (UI팀 확인).
- 신규 primitive 없음 (기존 `Chip` 또는 `RadioGroup` 조합).
- 신규 토큰 없음.

---

### Variant C — "모달 in-place" (대안 B)

**시안 HTML**: [todo-form-c.html](./todo-variants/todo-form-c.html)

**의도**: 별도 라우트 (`/todos/new`, `/todos/:id/edit`) 대신 `/todos` 목록 위에서 `Modal` primitive 로 즉시 생성/편집. 목록 컨텍스트 유지 → 연속 입력 UX. 낙관적 업데이트와 궁합. 편집 모드는 title/dueDate/completed 3필드를 모달 바디에 세로 스택.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 배경 페이지 | `Table` + Tailwind utility | 기존 | A/List 의 목록 재사용 |
| 오버레이 | `Modal` | 기존 | z-index-modal (1300) |
| 모달 헤더 | `ModalHeader` + `IconButton` (닫기) | 기존 | 제목은 모드별 |
| 모달 본문 | `Input` (text) + `Input` (date) + `Checkbox` | 기존 | 편집 모드 3필드 |
| 모달 푸터 | `Button` (primary "저장") + `Button` (ghost "취소") | 기존 | innerframe 배경 |
| 위험/전제 배너 | `Alert` (variant=warning, fixed) | 기존 | Route 충돌 고지 |

**상태 대응**:

- **Loading (편집 모드 초기 fetch)**: 모달 유지. 폼 자리 `Skeleton`.
- **저장 중**: 모달 유지. Primary disabled + 스피너.
- **성공**: 모달 닫기 + 목록 refetch.
- **유효성 실패**: 모달 유지. 해당 필드 error 상태.
- **ESC / 오버레이 클릭**: 닫기 (구현 단계 결정).

**위험/전제 / 신규 요청**:

- **위험**: PRD "관련 화면" 은 `todo-list.md` / `todo-form.md` 2개 라우트를 명시. 모달 채택 시 `/todos/new`·`/todos/:id/edit` 풀페이지 Route 가 사라지거나 이원화 필요.
- **위험**: Brief "페이지 헤더 (뒤로가기/취소 보조 액션)" 전제가 모달 헤더로 치환됨.
- **위험**: 편집 모드 URL 공유(딥링크) 가 어려워짐 — 지원 시 추가 라우팅 필요 (예: `/todos?edit=:id` 쿼리로 모달 열기).
- **전제**: 채택 시 PRD "관련 화면"·Brief "페이지 리스트" 를 함께 개정.
- 신규 primitive 없음.
- 신규 토큰 없음.

---

## 선택 가이드

| 시안 | 강점 | 약점 | 신규 primitive | 신규 토큰 |
|---|---|---|---|---|
| TodoList / A (표 + 세그먼트) | `data-display.md` 매트릭스 + Brief "표" 카테고리 정직 반영. 현 레포 `Table` + `Checkbox` + `Badge` + `Button` + `RadioGroup` 만으로 구현. 위험 0. | 상태 배지 · 체크박스 · 편집 · 삭제가 한 행에 몰려 시각 밀도 높음. | 없음 | 없음 |
| TodoList / B (칸반) | "진행 중 / 완료" 가 시각적으로 즉시 구분. 상태 전환을 드래그 은유로 떠올리기 쉬움. | 매트릭스 §6 엣지 케이스(칸반 primitive 부재). Out-of-scope "드래그앤드롭" 기대 유발. "분류" UI 범주와 혼동. | 없음 (앱 코드 `TodoCard.tsx` 합성) | 없음 |
| TodoList / C (컴팩트 List) | 스캔성 극대화. 많은 할 일 빠르게 훑기 적합. | 매트릭스 "표" 카테고리와 충돌. hover 액션 노출은 터치 발견성 저하. 상태 배지 생략으로 색각이상 리스크. | 없음 (앱 코드 `TodoRowItem.tsx` 합성) | 없음 |
| TodoForm / A (세로 스택) | Brief "단일 필드 중심 폼" 정직 반영. Primary CTA 1개 원칙 준수. 위험 0. | 시각적으로 평범함. | 없음 | 없음 |
| TodoForm / B (퀵픽 Chip) | 마감일 입력 UX 개선 (자주 쓰는 선택지 단축). | Brief 이탈. "다음 주" 등 프리셋 의미 고정이 추가 스펙. `Chip` single-select 지원 여부 확인 필요. | 없음 (`Chip` 또는 `RadioGroup` 조합) | 없음 |
| TodoForm / C (모달 in-place) | 이동 없이 연속 생성/편집. 목록 컨텍스트 유지. | PRD "관련 화면"·Brief "페이지 리스트" 이탈. Route 충돌. 딥링크 추가 작업. | 없음 | 없음 |

### 권장 조합

**TodoList A + TodoForm A** — 두 시안 모두 PRD/Brief 범위 내에서 "가장 규약 정직" 한 변주. 현 레포의 `Table` / `Checkbox` / `Badge` / `Button` / `RadioGroup` / `Input` primitive 만으로 구현 가능해 신규 요청·개정이 0. `data-display.md` §3 매트릭스, `global-states.md` 헤더 유지 원칙, `global-palette.md` Primary CTA 1개 원칙 모두 즉시 적용된다.

대안 조합은 모두 PRD/Brief 개정을 수반하므로, 실제 필요가 확인된 뒤 (예: 칸반 전환이 UX 요구로 명시 / 퀵픽이 실측 사용성 향상 확인) 재검토.

---

## 승격 절차 (메인용)

사용자가 각 페이지의 Variant 를 지명하면 메인이 수동 대행:

1. 선택된 Variant 의 "의도 / 컴포넌트 매핑 / 상태 대응" 을 재료로 `docs/screens/todo-list.md`, `docs/screens/todo-form.md` 작성.
2. `docs/screens/README.md` "필수 섹션" 100% 준수:
   - `## 기본 정보` / `## 목적` / `## 레이아웃` / `## 컴포넌트` / `## 인터랙션` / `## 데이터 바인딩` / `## 상태 (State)`
3. **컴포넌트 표는 UI 카테고리 용어로 환원** — 위 매핑 표의 primitive 이름은 이 문서(디자인 노트) 범위에서만 허용. screens 에서는 환원 필수:
   - `Table` → "표 (정형 스키마)"
   - `Button` (primary) → "주요 액션 버튼 (Primary)"
   - `Button` (ghost) → "보조/텍스트 버튼"
   - `Button` (destructive) → "파괴형(Destructive) 보조 버튼"
   - `Input` (text) → "단일행 텍스트 입력"
   - `Input` (date) → "날짜 선택 입력"
   - `Checkbox` → "체크박스 (행 내 토글용 / 폼 완료 여부)"
   - `Badge` → "상태 배지 또는 칩"
   - `RadioGroup` (segmented) → "상태 필터 세그먼트 컨트롤 (또는 언더라인 라디오 그룹)"
   - `Modal` → "오버레이 컨테이너 (모달 유형)"
4. 본 `todo-variants.md` "상태" 필드를 `선택 완료: TodoListPage: Variant <X> / TodoFormPage: Variant <Y>` 로 갱신 (design-lead 후속 커밋).
5. screens 파일 커밋은 메인이 직접 (`chore(screens): todo 화면정의서 승격`).
6. 선택되지 않은 Variant 는 보존 (향후 재검토 여지).
