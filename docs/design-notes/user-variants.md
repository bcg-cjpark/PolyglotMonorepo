# 화면 시안 카탈로그: user

**원본 PRD**: [../prd/user.md](../prd/user.md)
**원본 Brief**: [../stitch-brief/user.md](../stitch-brief/user.md)
**작성일**: 2026-04-23
**상태**: 선택 대기

---

## 공통 제약

- 모든 시안은 `@monorepo/ui` primitive + `libs/tokens` CSS 변수로만 구성.
- 디자인 노트 준수:
  - [`global-palette.md`](./global-palette.md) — Indigo Primary + Amber Secondary, 11단계 scale 사용 규칙, Primary CTA 1개 원칙.
  - [`global-states.md`](./global-states.md) — Loading / Error / Empty 에서 페이지 헤더(제목 + 주요 액션) 유지. 본문만 상태별 뷰로 치환.
  - [`data-display.md`](./data-display.md) — 정형 스키마 CRUD 는 `Table` primitive. native `<table>` 금지. 행 hover 배경은 `--background-bg-innerframe`.
- HTML 시안은 **시각 근사** — 실제 렌더는 구현 단계에서 `@monorepo/ui` primitive 로. 매핑 표가 진실 소스.
- Light/Dark 자동 대응 (primitive 기반). HTML 시안은 Light 만 제공.
- 한국어 기본, 한글 IME 필드(`name`) 포함.

---

## UserListPage

Route: `/users`
역할: 등록된 사용자 목록을 최신 생성순으로 조회하고, 신규 생성 진입점과 행 단위 삭제 액션을 제공.

### Variant A — "표 중심" (권장)

**시안 HTML**: [user-list-a.html](./user-variants/user-list-a.html)

**의도**: `data-display.md` §3 매트릭스의 "정형 스키마 · 중·소량 · 관리자 CRUD" 정의에 가장 정직하게 대응. 페이지 헤더(제목 + Primary CTA) + `Table` primitive + 행 내 `Button`(destructive) 로 구성. 현재 레포의 `UserListPage` 구현 방향과 일치.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 페이지 컨테이너·헤더 레이아웃 | Tailwind utility (page-container / page-header) | 기존 | primitive 불필요 — 공용 레이아웃 토큰만 사용 |
| 제목 옆 주요 액션 | `Button` (variant=primary) | 기존 | 라벨: `+ 새 사용자`. 클릭 시 `/users/new` 라우팅 |
| 표 본체 | `Table` | 기존 | columns 4개 (이름 / 이메일 / 생성일 / 액션). 빈 상태는 `emptyMessage` 위임 |
| 행 내 삭제 액션 | `Button` (destructive variant) 또는 `IconButton` | 기존 | `Table.render` 콜백에 주입 |
| 로딩 플레이스홀더 | `ListSkeleton` (또는 `Skeleton` n행) | 기존 | 본문 치환 전용. 헤더는 유지 |

**상태 대응**:

- **Loading**: 페이지 헤더 유지. `Table` 본문 자리에 `ListSkeleton` 렌더.
- **Error**: 페이지 헤더 유지. 본문에 한국어 에러 문구 + `Button`("다시 시도"). 스택 트레이스 노출 금지.
- **Empty**: 페이지 헤더 유지. `Table.emptyMessage="등록된 사용자가 없습니다."` 로 본문 빈 행 자리에 문구. 1차 복구는 헤더의 `+ 새 사용자` 버튼.

**위험/전제 / 신규 요청**:

- PRD V1 범위 준수. 위험 없음.
- 신규 primitive 없음.
- 신규 토큰 없음.

---

### Variant B — "카드 리스트" (대안)

**시안 HTML**: [user-list-b.html](./user-variants/user-list-b.html)

**의도**: `List` + 페이지 전용 합성 카드(`UserCard`) 조합으로 시각 풍부도를 올린 대안. 아바타 이니셜 + 이름·이메일 2줄, 우측에 생성일 + 삭제. 스캔성보다 카드성 인상.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 페이지 헤더 | Tailwind utility + `Button` (primary) | 기존 | — |
| 위험/전제 배너 | `Alert` (variant=warning) | 기존 | PRD 카테고리 이탈 고지 |
| 목록 컨테이너 | `List` | 기존 | 세로 스택, gap 12px |
| 행 합성 카드 | `apps/example-web/src/components/UserCard.tsx` (신규 페이지 전용 합성) | 신규 (**앱 코드 내부**, 프론트 개발팀 소관) | primitive 아님. `libs/ui` 로 승격 금지 |
| 아바타 | `ListItemAvatar` 또는 Tailwind utility 로 이니셜 circle | 기존 | primary100 배경 + deep 텍스트 |
| 행 내 삭제 | `Button` (destructive) 또는 `IconButton` | 기존 | — |

**상태 대응**:

- **Loading**: 페이지 헤더 유지. `CardSkeleton` n개로 본문 치환.
- **Error**: 페이지 헤더 유지. 본문 중앙에 에러 텍스트 + `Button`("다시 시도").
- **Empty**: 페이지 헤더 유지. 안내 블록 (중앙 정렬 텍스트) — 헤더의 `+ 새 사용자` 로 유도. 본문 중복 CTA 생략.

**위험/전제 / 신규 요청**:

- **위험**: `data-display.md` §3 매트릭스는 "정형 스키마 CRUD → 표" 로 이미 결정됨. 카드 리스트는 "콘텐츠 중심" 범주 (예: MemoListPage) 에 해당 — User 는 email/name 2필드 정형 스키마라 이 범주가 어색.
- **전제**: 채택 시 Brief 의 "표 (정형 스키마)" 를 "목록 (카드 리스트)" 로 개정해야 함.
- 신규 primitive 없음 (페이지 전용 `UserCard` 는 앱 코드 합성 — `libs/ui` 추가 아님).
- 신규 토큰 없음.

---

### Variant C — "표 + 요약 Badge"

**시안 HTML**: [user-list-c.html](./user-variants/user-list-c.html)

**의도**: A 의 `Table` 을 유지하되, 상단에 `Badge` primitive 기반 요약 strip (전체 N명 / 이번 주 신규 / 도메인 분포) 추가. 관리자 도구에서 "한 눈 파악" 을 원할 때 유효.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 페이지 헤더 | Tailwind utility + `Button` (primary) | 기존 | — |
| 위험/전제 배너 | `Alert` (variant=warning) | 기존 | 요약 지표 스펙 부재 고지 |
| 요약 strip | `Badge` × 3 (neutral / brand / success) | 기존 | chips-status-* 토큰 재사용 |
| 표 본체 | `Table` | 기존 | A 와 동일 |
| 행 내 삭제 | `Button` (destructive) | 기존 | — |

**상태 대응**:

- **Loading**: 페이지 헤더 + (선택) Badge 자리 skeleton. 본문 `ListSkeleton`.
- **Error**: 페이지 헤더 유지. Badge 숨김 (데이터 의존). 본문 에러 + 재시도.
- **Empty**: 페이지 헤더 유지. Badge 는 0 값 표시. 표 `emptyMessage`.

**위험/전제 / 신규 요청**:

- **위험**: PRD "도메인 모델" / "API 엔드포인트" 에 집계 지표(주간 신규 / 도메인 분포) 정의 없음. Badge 값 계산 규칙을 추가 스펙 필요.
- **전제**: "이번 주 신규" 는 클라이언트에서 `createdAt` 으로 계산 가능 (추가 API 불필요). "도메인 분포" 도 마찬가지. 별도 백엔드 요구 없음.
- 신규 primitive 없음.
- 신규 토큰 없음.

---

## UserFormPage

Route: `/users/new`
역할: email 과 name 을 입력해 신규 사용자를 생성.

### Variant A — "세로 스택 1열" (권장)

**시안 HTML**: [user-form-a.html](./user-variants/user-form-a.html)

**의도**: Brief 가 명시한 "폼 (세로 스택)" 을 있는 그대로 실현. `Input` 2개 + 필드 헬퍼 텍스트 + 하단 액션 바(Primary "저장" / 보조 "취소"). Primary CTA 1개 원칙 준수.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 페이지 헤더 | Tailwind utility + `Button` (ghost/outline "취소") | 기존 | 보조 액션만 |
| 폼 컨테이너 | Tailwind utility (form-stack) | 기존 | gap=padding-24 |
| 이메일 입력 | `Input` (type=email) | 기존 | 에러 상태 helper 지원 |
| 이름 입력 | `Input` (type=text, IME 허용) | 기존 | 한글 placeholder 허용 |
| 폼 하단 액션 바 | `Button` (primary "저장") + `Button` (ghost "취소") | 기존 | 우측 정렬 |

**상태 대응**:

- **저장 중**: `Button` (primary) disabled + 로딩 표현. 나머지 필드 disabled.
- **성공 (201)**: `/users` 로 라우팅.
- **409 이메일 중복**: email 필드를 error 상태로 전환 + helper 에 "이미 사용 중인 이메일입니다".
- **유효성 에러**: 필드별 helper 에 한국어 에러 문구. 스택 트레이스 노출 금지.

**위험/전제 / 신규 요청**:

- PRD / Brief 와 일치. 위험 없음.
- 신규 primitive 없음.
- 신규 토큰 없음.

---

### Variant B — "2열 그리드"

**시안 HTML**: [user-form-b.html](./user-variants/user-form-b.html)

**의도**: email 과 name 을 가로 2열로 배치해 수직 공간 축소.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 페이지 헤더 | Tailwind utility + `Button` (ghost) | 기존 | — |
| 위험/전제 배너 | `Alert` (variant=warning) | 기존 | Brief 이탈 고지 |
| 폼 컨테이너 | Tailwind utility (form-stack + form-grid-2col) | 기존 | `grid-template-columns: 1fr 1fr` |
| 이메일 입력 | `Input` (type=email) | 기존 | — |
| 이름 입력 | `Input` (type=text) | 기존 | — |
| 폼 하단 액션 바 | `Button` (primary) + `Button` (ghost) | 기존 | — |

**상태 대응**: A 와 동일.

**위험/전제 / 신규 요청**:

- **위험**: Brief 는 "폼 (세로 스택)" 을 명시. 2열 그리드는 Brief 개정 필요.
- **전제**: 필드 2개뿐이라 2열 배치의 실효 공간 절감이 미미. 모바일에서 1열로 접혀 시각 일관성 저하.
- 신규 primitive 없음.
- 신규 토큰 없음.

---

### Variant C — "모달형 (오버레이)"

**시안 HTML**: [user-form-c.html](./user-variants/user-form-c.html)

**의도**: 별도 라우트 대신 `/users` 목록 위에서 `Modal` primitive 로 즉시 생성. 이동 없이 "목록 + 생성" 을 연속적으로 처리.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 배경 페이지 | `Table` + Tailwind utility | 기존 | A 의 목록 재사용 |
| 오버레이 | `Modal` | 기존 | z-index-modal (1300) |
| 모달 헤더 | `ModalHeader` | 기존 | 제목 + 닫기 `IconButton` |
| 모달 본문 | `Input` × 2 | 기존 | email / name |
| 모달 푸터 | `Button` (primary "저장") + `Button` (ghost "취소") | 기존 | innerframe 배경 |
| 위험/전제 배너 | `Alert` (variant=warning, fixed) | 기존 | Route 충돌 고지 |

**상태 대응**:

- **저장 중**: 모달 유지. primary disabled.
- **성공**: 모달 닫기 + 목록 refetch.
- **409 중복**: 모달 유지. email 필드 error.
- **ESC / 오버레이 클릭**: 닫기.

**위험/전제 / 신규 요청**:

- **위험**: PRD "관련 화면" 은 `user-list.md` / `user-form.md` 2개를 명시. 모달 채택 시 `/users/new` 풀페이지 Route 가 사라지거나 이원화 필요 — Brief 의 "페이지 헤더 (뒤로가기/취소)" 도 모달 헤더로 치환.
- **전제**: 채택하려면 PRD 의 "관련 화면" 과 Brief 의 "페이지 리스트" 를 함께 개정.
- 신규 primitive 없음.
- 신규 토큰 없음.

---

## 선택 가이드

| 시안 | 강점 | 약점 | 신규 primitive | 신규 토큰 |
|---|---|---|---|---|
| UserList / A | `data-display.md` 매트릭스 정직 반영. 현재 구현 방향과 일치. 위험 0. | 시각 풍부도 낮음 (단조로운 표) | 없음 | 없음 |
| UserList / B | 카드 UX 로 시각 풍부. 아바타로 빠른 인지. | PRD 의 "표" 카테고리와 충돌. 스캔성·페이지당 정보 밀도 저하. | 없음 (앱 코드 `UserCard.tsx` 합성만) | 없음 |
| UserList / C | 한 눈 요약 제공. A 기반이라 위험 낮음. | 요약 지표 스펙 부재 → 추가 스펙 필요. | 없음 | 없음 |
| UserForm / A | Brief "세로 스택" 정직 반영. Primary CTA 1개 원칙 준수. 위험 0. | 시각적 평범함. | 없음 | 없음 |
| UserForm / B | 수직 공간 축소. | Brief 이탈. 모바일에서 1열로 접혀 시각 일관성 저하. 필드 2개로 절감 효과 미미. | 없음 | 없음 |
| UserForm / C | 이동 없이 연속 생성 가능. 목록 컨텍스트 유지. | PRD "관련 화면" 과 Brief "페이지 리스트" 이탈. Route 충돌. | 없음 | 없음 |

### 권장 조합

**UserList A + UserForm A** — 두 시안 모두 PRD/Brief 범위 내에서 "가장 규약 정직" 한 변주이고, 현 레포의 `Table` / `Input` / `Button` primitive 만으로 구현 가능해 신규 요청·개정이 0 이다. `data-display.md` §3 매트릭스와 `global-states.md` 헤더 유지 원칙도 즉시 적용된다.

대안 조합은 PRD/Brief 개정을 수반하므로, 실제 필요가 확인된 뒤(예: 요약 지표가 UX 요구로 명시) 재검토.

---

## 승격 절차 (메인용)

사용자가 각 페이지의 Variant 를 지명하면 메인이 수동 대행:

1. 선택된 Variant 의 "의도 / 컴포넌트 매핑 / 상태 대응" 을 재료로 `docs/screens/user-list.md`, `docs/screens/user-form.md` 작성.
2. `docs/screens/README.md` "필수 섹션" 100% 준수:
   - `## 기본 정보` / `## 목적` / `## 레이아웃` / `## 컴포넌트` / `## 인터랙션` / `## 데이터 바인딩` / `## 상태 (State)`
3. **컴포넌트 표는 UI 카테고리 용어로 환원** — 위 매핑 표의 primitive 이름은 이 문서(디자인 노트) 범위에서만 허용. screens 에서는 환원 필수:
   - `Table` → "표 (정형 스키마)"
   - `Button` (primary) → "주요 액션 버튼 (Primary)"
   - `Button` (destructive) → "파괴형(Destructive) 보조 버튼"
   - `Input` → "단일행 텍스트 입력"
   - `Badge` → "상태/요약 배지"
   - `Modal` → "오버레이 컨테이너 (모달 유형)"
4. 본 `user-variants.md` "상태" 필드를 `선택 완료: UserListPage: Variant <X> / UserFormPage: Variant <Y>` 로 갱신 (design-lead 후속 커밋).
5. screens 파일 커밋은 메인이 직접 (`chore(screens): user 화면정의서 승격`).
6. 선택되지 않은 Variant 는 보존 (향후 재검토 여지).
