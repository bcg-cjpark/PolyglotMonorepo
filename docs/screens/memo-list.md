# MemoListPage

## 기본 정보

- **Route**: `/memos`
- **파일 위치**: `apps/example-web/src/pages/MemoListPage.tsx`
- **관련 PRD**: [prd/memo.md](../prd/memo.md)
- **관련 화면**: [memo-dialog.md](./memo-dialog.md) (3 모드 오버레이 컨테이너)
- **시안 선택**: MemoList Variant A (List + 합성 카드) — [design-notes/memo-variants.md](../design-notes/memo-variants.md)

## 목적

메모를 최신순(`createdAt DESC`) 카드 리스트로 보여주고, 신규 작성/상세 열람/편집/삭제 흐름의 진입점 역할. 독립 편집 라우트 없음 — 상세/편집/삭제 확인은 [memo-dialog.md](./memo-dialog.md) 오버레이에서 처리.

## 레이아웃

위에서 아래로:

- 페이지 헤더 — 왼쪽 제목 "메모", 오른쪽 Primary "+ 새 메모".
- 본문 — 목록(세로 스택) + 합성 카드 (제목 1줄 / 본문 스니펫 2~3줄 plain text / 작성일·수정일 메타).
- 페이지네이션 내비게이션 — 하단 중앙 "이전 / 다음" 버튼 + `현재/총` 인디케이터 (size=20).

헤더는 Loading/Error/Empty 모두 유지. 본문만 상태 뷰로 치환.

## 컴포넌트

| 역할 | UI 종류 | 비고 |
|---|---|---|
| 페이지 헤더 | 제목 + 주요 액션 영역 | 페이지 탑 레벨 |
| 주요 액션 | Primary 버튼 | 라벨 "+ 새 메모" |
| 본문 목록 | 목록 (세로 스택) | `List` 카테고리 |
| 카드 (행) | 앱 전용 합성 카드 | `apps/example-web/src/components/MemoCard.tsx`. `libs/ui` 에 두지 않음 |
| 카드 내부: 제목 | 단일 라인 텍스트 (말줄임) | 길면 ellipsis |
| 카드 내부: 본문 스니펫 | 2~3 줄 plain text (말줄임) | 마크다운/HTML 렌더 금지 |
| 카드 내부: 메타 | 보조 톤 텍스트 | 작성일 / 수정일 |
| 페이지네이션 | 방향 버튼 × 2 + 페이지 인디케이터 | 첫/마지막 페이지에서 해당 방향 비활성 |
| Loading | 카드 스켈레톤 × size | `CardSkeleton` 반복 |
| Error | 중앙 정렬 한국어 에러 + 보조 "다시 시도" | 스택 비노출 |
| Empty | 중앙 정렬 안내 텍스트 | 본문 CTA 선택 (헤더 "+ 새 메모" 가 1차 경로) |

## 인터랙션

1. 화면 진입 시 `GET /memos?page=0&size=20` 호출 → 카드 리스트 렌더.
2. **Loading**: 헤더 유지, 카드 스켈레톤 반복.
3. **Error**: 헤더 유지, 본문에 한국어 에러 + "다시 시도".
4. **Empty**: 헤더 유지, 본문에 안내 텍스트.
5. "+ 새 메모" 클릭 → [memo-dialog.md](./memo-dialog.md) 의 **편집/신규 모드** 오픈 (빈 폼).
6. 카드 클릭 → [memo-dialog.md](./memo-dialog.md) 의 **상세 모드** 오픈 (읽기 전용).
7. 하단 "이전" / "다음" → `page` 증감 후 재호출. 첫/마지막 페이지는 해당 방향 비활성.

## 데이터 바인딩

- `GET /memos?page=<n>&size=20` — 페이징 리스트 (`createdAt DESC` 고정).
- 모달에서 이루어지는 CRUD 는 [memo-dialog.md](./memo-dialog.md) 가 담당. 모달 성공 후 목록 쿼리 무효화로 자동 재조회.

## 상태 (State)

| 상태명 | 타입 | 초기값 | 업데이트 트리거 |
|---|---|---|---|
| page | number | 0 | 이전/다음 클릭 |
| memos | Memo[] | [] | GET 응답 `.content` |
| totalPages | number | 0 | GET 응답 `.totalPages` |
| totalElements | number | 0 | GET 응답 `.totalElements` |
| isLoading | boolean | true | 쿼리 로딩 |
| isError | boolean | false | 쿼리 실패 |
| dialogState | "none" \| { kind: "detail", memo } \| { kind: "create" } \| { kind: "edit", memo } \| { kind: "confirmDelete", memo } | "none" | 카드 클릭 / "+ 새 메모" / 모달 내 버튼 / 닫기 |

`dialogState` 가 none 이 아니면 [memo-dialog.md](./memo-dialog.md) 의 해당 모드 렌더.
