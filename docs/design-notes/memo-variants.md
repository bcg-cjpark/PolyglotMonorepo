# 화면 시안 카탈로그: memo

**원본 PRD**: [../prd/memo.md](../prd/memo.md)
**원본 Brief**: [../stitch-brief/memo.md](../stitch-brief/memo.md)
**작성일**: 2026-04-23
**상태**: 선택 대기

**한 눈 비교**: [index.html](./memo-variants/index.html) — 모든 variant 를 한 페이지에서 Light/Dark 토글하며 비교.

---

## 공통 제약

- 모든 시안은 `@monorepo/ui` primitive + `libs/tokens` CSS 변수로만 구성.
- 디자인 노트 준수:
  - [`global-palette.md`](./global-palette.md) — Indigo Primary + Amber Secondary, 11단계 scale 사용 규칙, Primary CTA 1개 원칙.
  - [`global-states.md`](./global-states.md) — Loading / Error / Empty 에서 페이지 헤더(제목 + "+ 새 메모") 유지. 본문만 상태별 뷰로 치환.
  - [`data-display.md`](./data-display.md) §3 매트릭스 — "콘텐츠 중심 목록" = List + 합성 카드 (Table 아님). Memo 는 이 범주.
- Memo 특유 제약:
  - `id` 는 UUID (CHAR(36) — 백엔드 레이어). 프론트는 `string` 으로 수신.
  - `title` 1~100자, 공백만 불가, 필수. `content` 0~5000자, null/빈 문자열 허용.
  - 본문 렌더는 **plain text** — 마크다운/HTML 렌더 금지. 줄바꿈 유지는 `white-space: pre-wrap` 로, 포매팅 문자는 이스케이프.
  - `PUT /memos/{id}` 는 전체 교체 (PATCH 아님).
  - `DELETE /memos/{id}` 는 hard delete — 삭제 확인 모달이 3 모드 흐름의 마지막.
  - `title`, `content` 두 필드 모두 한글 IME composition 대응.
  - 페이지네이션 기본 size=20, `createdAt DESC` 고정. 목록 하단 "이전 / 다음" + `현재/총` 인디케이터.
  - 모달 3 단계 흐름 (상세 → 편집 → 삭제 확인) 은 **하나의 오버레이 컨테이너** 재활용. 전환 애니메이션은 절제.
- HTML 시안은 **시각 근사** — 실제 렌더는 구현 단계에서 `@monorepo/ui` primitive 로. 매핑 표가 진실 소스.
- Light/Dark 자동 대응 (primitive 기반). HTML 시안은 한 파일에 양쪽 토큰을 인라인해 우상단 토글로 즉시 스위칭.
- 한국어 기본, 한글 IME 필드(title / content) 포함.

---

## MemoListPage

Route: `/memos`
역할: 메모 목록을 최신순 카드 리스트로 보여주고, 신규 작성 / 상세 열람 / 편집 / 삭제 흐름의 진입점. 페이지네이션 (`size=20`, `createdAt DESC`).

### Variant A — "목록 + 합성 카드" (권장)

**시안 HTML**: [memo-list-a.html](./memo-variants/memo-list-a.html)

**의도**: `data-display.md` §3 매트릭스의 "콘텐츠 중심 목록" 범주를 그대로 실현. `List` + 페이지 전용 합성 카드 (`MemoCard`) 조합으로 제목 / 본문 스니펫 2줄 / 메타(작성·수정일) 를 혼합 레이아웃으로 배치. Brief 가 지시한 "편안한 개인 노트 · 카드 단위로 숨을 쉬는 여백" 톤과 정합. 페이지 하단에 "이전 / 다음 + 2 / 8" 형태 페이지네이션.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 페이지 컨테이너·헤더 레이아웃 | Tailwind utility (page-container / page-header) | 기존 | primitive 불필요 — 공용 레이아웃 토큰만 사용 |
| 제목 옆 주요 액션 | `Button` (variant=primary) | 기존 | 라벨: `+ 새 메모`. 클릭 시 `MemoFormDialog` (신규 모드) 오픈 |
| 목록 컨테이너 | `List` | 기존 | 세로 스택. gap=padding-12 |
| 행 합성 카드 | `apps/example-web/src/components/MemoCard.tsx` (신규 페이지 전용 합성) | 신규 (**앱 코드 내부**, 프론트 개발팀 소관) | primitive 아님. `libs/ui` 로 승격 금지. 내부는 `@monorepo/ui` primitive + Tailwind 토큰 유틸만 사용 |
| 로딩 플레이스홀더 | `CardSkeleton` × page-size | 기존 | 페이지 헤더 유지. ul 자리만 치환 |
| 페이지네이션 내비 | `Button` (ghost) × 2 + 인디케이터 텍스트 | 기존 | 첫/마지막 페이지에서 aria-disabled |

**상태 대응**:

- **Loading**: 페이지 헤더 유지. `List` 자리에 `CardSkeleton` 반복 렌더.
- **Error**: 페이지 헤더 유지. 본문 중앙에 에러 문구 (한국어, 스택 트레이스 금지) + `Button`("다시 시도"). "+ 새 메모" 는 살려둠 (복구 경로).
- **Empty**: 페이지 헤더 유지. 본문 중앙에 안내 텍스트 ("아직 메모가 없어요" 류). 본문 내 중복 CTA 없음 — 헤더의 "+ 새 메모" 가 1차 경로 (`global-states.md` §3.3).

**위험/전제 / 신규 요청**:

- PRD / Brief V1 범위 준수. 위험 없음.
- 신규 primitive 없음 (`MemoCard` 는 앱 코드 합성).
- 신규 토큰 없음.

---

### Variant B — "밀도 축소 · 1줄 스니펫"

**시안 HTML**: [memo-list-b.html](./memo-variants/memo-list-b.html)

**의도**: A 와 동일 범주(List + 합성 카드) 지만, 카드 내부 레이아웃을 2행 grid (제목 / 1줄 스니펫) 로 줄여 한 페이지당 더 많은 카드를 표시. 메모 수가 많아졌을 때 스캔성 우선. 합성 카드 변형 (`MemoCardCompact`) 만 다르고 나머지 구조는 A 와 동일.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 페이지 헤더 | Tailwind utility + `Button` (primary) | 기존 | — |
| 위험/전제 배너 | `Alert` (variant=warning) | 기존 | Brief 스니펫 규격 이탈 고지 |
| 목록 컨테이너 | `List` | 기존 | gap 축소 (padding-8) |
| 행 합성 카드 | `apps/example-web/src/components/MemoCardCompact.tsx` | 신규 (**앱 코드 내부**) | A 와 다른 밀도 변형. `libs/ui` 승격 금지 |
| 페이지네이션 내비 | `Button` (ghost) × 2 + 인디케이터 | 기존 | A 와 동일 |

**상태 대응**: A 와 동일.

**위험/전제 / 신규 요청**:

- **전제**: Brief 의 "본문 스니펫 2~3줄" 규격을 1줄 ellipsis 로 축약 — 채택 시 `docs/stitch-brief/memo.md` 의 목록 스니펫 규격 개정 필요. 위험은 낮음 (동일 UI 범주 내 레이아웃 변형).
- **전제**: Brief "편안한 개인 노트 톤 · 숨을 쉬는 여백" 인상이 다소 약화. 카드가 많이 보이는 대신 각 카드의 정서적 무게는 줄어듦.
- 신규 primitive 없음.
- 신규 토큰 없음.

---

### Variant C — "표 형태"

**시안 HTML**: [memo-list-c.html](./memo-variants/memo-list-c.html)

**의도**: Table primitive 로 제목 / 본문 / 작성일 / 수정일 / 액션을 컬럼화. 관리자 CRUD 뷰 수준의 스캔성 극대화.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 페이지 헤더 | Tailwind utility + `Button` (primary) | 기존 | — |
| 위험 배너 | `Alert` (variant=warning) | 기존 | data-display.md §3 매트릭스 이탈 고지 |
| 표 본체 | `Table` | 기존 | 5 컬럼 (제목 / 본문 / 작성일 / 수정일 / 액션). `emptyMessage="아직 메모가 없습니다."` |
| 행 내 삭제 | `Button` (destructive) | 기존 | `Table.render` 콜백 안 |
| 페이지네이션 내비 | `Button` (ghost) × 2 + 인디케이터 | 기존 | — |

**상태 대응**:

- **Loading**: tbody 자리를 `ListSkeleton` 으로 치환, 페이지 헤더 유지.
- **Error**: tbody 자리를 에러 안내 + "다시 시도" `Button` 으로 치환.
- **Empty**: `Table.emptyMessage` 에 위임.

**위험/전제 / 신규 요청**:

- **위험 (높음)**: `data-display.md` §3 매트릭스는 "콘텐츠 중심 목록" = List + 합성 카드 범주로 결정. Memo 는 정형 스키마 CRUD 가 아닌 콘텐츠(제목+본문) 중심이므로 Table 범주가 어색. 채택 시 `data-display.md` §3 매트릭스 개정 필요.
- **위험**: Brief "편안한 개인 노트 · 카드 단위 여백" 톤과 시각적으로 충돌. Brief 톤 섹션 개정 필요.
- **위험**: 본문 스니펫을 고정 컬럼 폭에 구겨 넣게 되어 plain text 의 줄바꿈·인용 등 의도가 사실상 손실됨.
- **위험**: 행 내 "삭제" 버튼이 상세 모달을 거치지 않고 바로 삭제 확인 모달로 점프하는 동선이 자연스러워져 PRD 의 "3 단계 흐름 (상세 → 편집 → 삭제 확인)" 축약 가능성. 흐름 의도 이탈 가능.
- 신규 primitive 없음.
- 신규 토큰 없음.

---

## MemoDialogContainer (모달 3 단계 흐름)

Route: 없음 (MemoListPage 위 오버레이)
역할: 메모의 상세 / 편집·신규 / 삭제 확인 3 모드를 호스팅하는 오버레이 컨테이너. **한 개 오버레이 위에서 모드 전환** 이 Brief 의 설계 의도.

### Dialog variant 시안 설계 노트

세 variant 모두 **한 HTML 안에 3 모드를 세로로 나란히 렌더** — 실제 런타임에는 한 개 인스턴스가 모드 state 에 따라 내용을 교체하지만, HTML 시안 파일에서 한 모드만 그리면 "동일 컨테이너 재활용" 이라는 핵심 설계 의도가 드러나지 않는다. 세 모드를 한 페이지에 나란히 두면 각 variant 가 "3 모드를 어떻게 호스팅하는지" 가 한 눈에 보인다. Brief 의 "전환 애니메이션 절제" 의도는 HTML 로 표현 제한이므로 섹션 주석으로만 명시.

### Variant A — "중앙 모달 × 3 모드 통합" (권장)

**시안 HTML**: [memo-dialog-a.html](./memo-variants/memo-dialog-a.html)

**의도**: Brief 가 요구한 "화면 중앙 배치 · 단일 오버레이 컨테이너 · 모드 전환" 을 그대로 실현. 하나의 `Modal` primitive 인스턴스가 `mode` state (`'detail' | 'form' | 'confirmDelete'`) 에 따라 header · body · footer 를 교체한다. ESC / 배경 클릭 / 닫기 아이콘은 어느 모드에서든 오버레이 전체 닫기. 삭제 확인 "취소" 는 상세 모드로 복귀 (양보 경로).

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 오버레이 컨테이너 | `Modal` | 기존 | 한 인스턴스가 3 모드 공용. z-index-modal=1300 |
| 모달 헤더 | `ModalHeader` | 기존 | 모드별 제목 + 우측 닫기 `IconButton` |
| 모달 본문 컨테이너 | `ModalContent` | 기존 | 모드별 내용 스왑 |
| 모달 푸터 | `ModalFooter` | 기존 | 모드별 액션 버튼 묶음 (우측 정렬) |
| 상세 본문 | native `<div>` (`white-space: pre-wrap`) | 기존 | plain text 렌더만 — 마크다운/HTML 렌더 없음. 긴 본문 스크롤 가능 |
| 편집/신규 제목 입력 | `Input` (type=text, maxLength=100, 한글 IME) | 기존 | 필수 · 공백만 거부 · 인라인 helper |
| 편집/신규 본문 입력 | `Textarea` (maxLength=5000, 한글 IME) | 기존 | 다중행, 빈 값 허용. 글자수 카운터는 선택 |
| 상세 모드 액션 | `Button` (destructive) + `Button` (primary) | 기존 | "삭제" (2.c 로 전환) / "편집" (2.b 로 전환) |
| 편집 모드 액션 | `Button` (ghost) + `Button` (primary) | 기존 | "취소" / "저장" |
| 삭제 확인 모드 액션 | `Button` (ghost) + `Button` (destructive solid) | 기존 | "취소" (상세 모드로 복귀) / "삭제" (DELETE) |

**상태 대응** (모드별 하위 상태):

- **상세 모드**: `GET /memos/{id}` 로드 중이면 본문 자리 `Skeleton` (헤더 유지). 실패 시 본문 에러 텍스트 + "다시 시도" — 모달 전체 닫기 금지 (컨텍스트 유지).
- **편집/신규 모드**:
  - 저장 중: Primary 버튼 loading/비활성, 입력 필드 disabled, 닫기/ESC 는 허용.
  - 유효성 실패: 필드 하단 인라인 helper 에 한국어 문구. 서버 호출 미발생.
  - 서버 실패: 폼 상단 배너 또는 인라인 에러 (스택 트레이스 금지).
  - 저장 성공: 오버레이 닫기 + 목록 refetch (상세로 복귀하지 않음 — Brief 의 "저장 후 목록으로" 의도).
- **삭제 확인 모드**:
  - 삭제 중: destructive solid 버튼 loading, 취소 버튼 disabled.
  - 성공: 오버레이 닫기 + 목록 refetch.
  - 실패: 모달 내부 에러 영역에 한국어 문구.

**위험/전제 / 신규 요청**:

- PRD / Brief V1 범위 준수. 위험 없음.
- 신규 primitive 없음 (`Modal` / `ModalHeader` / `ModalFooter` / `Input` / `Textarea` / `Button` 모두 기존).
- 신규 토큰 없음.

---

### Variant B — "풀페이지 라우트 분리"

**시안 HTML**: [memo-dialog-b.html](./memo-variants/memo-dialog-b.html)

**의도**: 상세(`/memos/:id`) 와 편집(`/memos/:id/edit`, `/memos/new`) 을 풀페이지 라우트로 분리. 삭제 확인만 중앙 모달로 유지. 긴 본문 메모의 읽기·쓰기 공간을 크게 확보하는 대안.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 상세 페이지 | 페이지 컨테이너 + `Button` × 3 (취소/삭제/편집) | 기존 | `/memos/:id` Route 신설 |
| 상세 본문 | native `<div>` (`white-space: pre-wrap`) | 기존 | plain text 렌더만 |
| 편집 페이지 | 페이지 컨테이너 + `Input` + `Textarea` + `Button` × 2 | 기존 | `/memos/:id/edit`, `/memos/new` Route 신설 |
| 삭제 확인 | `Modal` + `ModalHeader` + `ModalContent` + `ModalFooter` + `Button` × 2 | 기존 | 상세 페이지 위 오버레이 |
| 위험/전제 배너 | `Alert` (variant=warning) | 기존 | PRD 비포함 항목 개정 고지 |

**상태 대응**: A 의 모드별 상태에 Route 전환이 추가. 저장 성공 시 `/memos` 로 라우팅. 삭제 성공 시 `/memos` 로 라우팅.

**위험/전제 / 신규 요청**:

- **위험 (높음)**: PRD 의 "비포함" 항목에 **"독립 라우트 형태의 편집 화면 (`/memos/new`, `/memos/:id/edit`) — 모달 오버레이가 유일 경로"** 가 명시됨. 채택 시 `docs/prd/memo.md` 의 해당 비포함 항목을 "포함" 으로 개정 필요.
- **위험**: Brief "3 단계 흐름 = 하나의 오버레이 모드 전환" 설계 의도와 충돌.
- **위험**: Route 신설로 프론트 개발·e2e 작성 비용 증가 (라우팅, 뒤로가기 동작, 변경사항 경고 등).
- **전제**: "긴 본문 편집 UX" 가 필요해 Modal 내부 영역이 충분치 않다고 판단될 때 재고려 가치가 있음 — 단, 현 PRD 는 content 5000자 상한이 있어 Modal 내부 `Textarea` 로도 충분.
- 신규 primitive 없음.
- 신규 토큰 없음.

---

### Variant C — "우측 사이드 패널 (Drawer)"

**시안 HTML**: [memo-dialog-c.html](./memo-variants/memo-dialog-c.html)

**의도**: 우측에서 슬라이드 인하는 Drawer 컨테이너가 "상세 ↔ 편집" 을 탭 전환으로 호스팅. 삭제 확인은 Drawer 위에 중앙 모달. 목록 컨텍스트(왼쪽 카드 리스트) 를 시야에서 놓치지 않는 장점.

**컴포넌트 매핑**:

| 역할 | `@monorepo/ui` primitive | 기존/신규 | 비고 |
|---|---|---|---|
| 우측 Drawer | `MobileDrawer` (anchor=right) **또는 신규 `Drawer`** | **신규 (UI팀 요청)** 가능성 높음 | 현 `MobileDrawer` 는 모바일 전용 — 데스크톱 사이드 패널 primitive 는 부재. 필요하면 UI팀 `ui-composer` 경로로 신규 primitive 요청 |
| Drawer 내부 모드 탭 | `Tabs` | 기존 | "상세 / 편집" 2 탭. 삭제는 탭 아님 (중앙 모달로 분기) |
| Drawer 본문 (상세) | native `<div>` (`white-space: pre-wrap`) | 기존 | plain text |
| Drawer 본문 (편집) | `Input` + `Textarea` | 기존 | A 와 동일 |
| Drawer 푸터 | `Button` × 2 (ghost + primary/destructive) | 기존 | 탭 모드에 따라 라벨 변화 |
| 삭제 확인 | `Modal` + `ModalHeader` + `ModalContent` + `ModalFooter` + `Button` × 2 | 기존 | Drawer 위 중앙 오버레이 |
| 위험 배너 | `Alert` (variant=warning) | 기존 | Brief 중앙 배치 이탈 고지 |

**상태 대응**: A 의 모드별 상태를 Drawer 탭 전환 + 삭제 확인 모달 오픈/클로즈 구조로 재해석.

**위험/전제 / 신규 요청**:

- **위험 (높음)**: Brief 는 오버레이 컨테이너의 "화면 중앙 배치" 를 명시. 사이드 패널은 이 제약 이탈 → Brief 개정 필요.
- **위험**: "하나의 오버레이 컨테이너 위 모드 전환" 설계 의도에 대해, 이 시안은 Drawer(상세·편집) + 중앙 모달(삭제 확인) 두 컨테이너로 분리 — 부분 이탈.
- **위험**: 데스크톱 전용 가정이 강해짐. 좁은 화면에서 Drawer 가 목록을 완전히 덮어 "목록 컨텍스트 유지" 장점이 사라짐.
- **신규 primitive 요청**: `@monorepo/ui` 의 `MobileDrawer` 는 모바일 전용이고 데스크톱 사이드 패널 전용 primitive 는 부재. 채택 시 `ui-composer → ui-storybook-curator → ui-library-tester → ui-lead` 라인에 신규 `Drawer` (또는 `Modal` 의 side variant) 요청.
- 신규 토큰 없음.

---

## 선택 가이드

| 시안 | 강점 | 약점 | 신규 primitive | 신규 토큰 |
|---|---|---|---|---|
| MemoList / A | `data-display.md` §3 매트릭스 정직 반영. Brief "편안한 톤" 정합. 페이지네이션 규격 준수. 위험 0. | 메모가 수백 개 이상 쌓이면 스크롤 증가 | 없음 (앱 `MemoCard.tsx` 합성만) | 없음 |
| MemoList / B | 페이지당 정보 밀도 ↑ — 메모 수가 많을 때 스캔성. 위험 낮음. | Brief "본문 스니펫 2~3줄" 규격 개정 필요. "숨을 쉬는 여백" 톤 약화. | 없음 (앱 `MemoCardCompact.tsx` 합성만) | 없음 |
| MemoList / C | 컬럼별 정렬된 정보 스캔 최상. | `data-display.md` §3 매트릭스 이탈. Brief 톤 이탈. plain text 줄바꿈 의도 손실. 행 내 삭제 버튼으로 3 단계 흐름 축약 가능성. | 없음 | 없음 |
| MemoDialog / A | Brief "중앙 배치 · 단일 컨테이너 모드 전환" 정직 반영. 기존 primitive 로 100% 커버. 위험 0. | 긴 본문 편집 공간은 Modal 내부 `Textarea` 에 제한됨 (5000자 상한이라 실질 부담 적음) | 없음 | 없음 |
| MemoDialog / B | 긴 본문 편집 공간 최대 확보. | PRD 비포함 항목 개정 필요. Brief "단일 오버레이 컨테이너" 의도 이탈. Route·e2e 비용 증가. | 없음 | 없음 |
| MemoDialog / C | 목록 컨텍스트 유지하며 상세/편집. "하던 작업 흐름" 차단이 약함. | Brief "중앙 배치" 이탈. 단일 컨테이너 재활용 의도 부분 이탈. 좁은 뷰포트에서 장점 소실. **데스크톱 Drawer primitive 부재 → UI팀 신규 요청**. | **있음 (UI팀 요청)** — `Drawer` 또는 `Modal` side variant | 없음 |

### 권장 조합

**MemoList A + MemoDialog A** — 두 시안 모두 PRD / Brief / `data-display.md` §3 / `global-states.md` 범위 안에서 "가장 규약 정직" 한 변주. 기존 `Modal`, `Input`, `Textarea`, `Button`, `List`, `CardSkeleton` primitive 만으로 구현 가능하며 신규 요청·개정 0. Memo 피처의 "편안한 개인 노트 · 모달 3 단계 흐름" 의도를 그대로 실현.

대안 조합은 PRD / Brief / 디자인 노트 개정을 수반하므로, 실제 필요가 확인된 뒤 재검토:
- 메모가 수백 개 이상 쌓여 스캔성이 실제 문제가 된 시점 → List B 재검토 (Brief 스니펫 규격 개정 수반).
- 메모 본문이 5000자 상한을 늘려야 할 만큼 길어질 필요가 생긴 시점 → Dialog B 재검토 (PRD 비포함 항목 개정 수반).
- 목록과 상세를 동시에 보는 "양측 작업" UX 요구가 명시된 시점 → Dialog C 재검토 (Brief 중앙 배치 개정 + UI팀 신규 Drawer primitive 요청 수반).

---

## 승격 절차 (메인용)

사용자가 각 페이지의 Variant 를 지명하면 메인이 수동 대행:

1. 선택된 Variant 의 "의도 / 컴포넌트 매핑 / 상태 대응" 을 재료로 `docs/screens/memo-list.md`, `docs/screens/memo-form.md` 작성. (PRD "관련 화면" 이 두 파일을 명시. `MemoDialogContainer` 의 3 모드는 두 screens 문서에 분산 — 상세/삭제 확인은 `memo-list.md` 의 "인터랙션" 섹션에서 이어지고, 편집/신규 폼은 `memo-form.md` 전체에 해당.)
2. `docs/screens/README.md` "필수 섹션" 100% 준수:
   - `## 기본 정보` / `## 목적` / `## 레이아웃` / `## 컴포넌트` / `## 인터랙션` / `## 데이터 바인딩` / `## 상태 (State)`
3. **컴포넌트 표는 UI 카테고리 용어로 환원** — 위 매핑 표의 primitive 이름은 이 문서(디자인 노트) 범위에서만 허용. screens 에서는 환원 필수:
   - `List` → "목록"
   - `Modal` / `ModalHeader` / `ModalContent` / `ModalFooter` → "오버레이 컨테이너 (모달 유형)"
   - `Button` (primary) → "주요 액션 버튼 (Primary)"
   - `Button` (destructive) → "파괴형(Destructive) 보조 버튼"
   - `Button` (destructive solid) → "파괴형(Destructive) 확정 버튼"
   - `Input` → "단일행 텍스트 입력"
   - `Textarea` → "다중행 텍스트 입력"
   - `CardSkeleton` → "카드형 로딩 플레이스홀더"
   - `Alert` → "상태 배너"
4. 본 `memo-variants.md` "상태" 필드를 `선택 완료: MemoListPage: Variant <X> / MemoDialogContainer: Variant <Y>` 로 갱신 (design-lead 후속 커밋).
5. screens 파일 커밋은 메인이 직접 (`chore(screens): memo 화면정의서 승격`).
6. 선택되지 않은 Variant 는 보존 (향후 재검토 여지).
