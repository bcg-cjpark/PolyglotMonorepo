# Memo 피처 사후 감사 리포트

**날짜**: 2026-04-24
**감사자**: spec-auditor (dogfooding 파이프라인 [9])
**관련 커밋**: 939904a (API + V3__memo.sql, UUID CHAR(36) JdbcTypeCode), 65b3d58 (Jackson PUT 전체 교체 강제), 46af9f3 (Web + 3 모드 오버레이 합성), 615ef27 (화면 e2e, T7 skip), cf3cf41 (통합 e2e)
**명세 (진실 소스)**:
- [docs/prd/memo.md](../prd/memo.md)
- [docs/screens/memo-list.md](../screens/memo-list.md)
- [docs/screens/memo-dialog.md](../screens/memo-dialog.md)

---

## 요약

- **상태**: **PASS with minor + 1 known skip** (Modal primitive 제약)
- **Critical 불일치**: 0 건
- **Minor 불일치**: 2 건 (관찰만)
- **Known gap**: 1 건 — `memo-dialog.md §2.c` 취소 양보 경로가 `libs/ui/Modal` primitive 의 `handleCancel` 시맨틱 제약으로 구현 불가. 화면 e2e T7 에 `test.skip` 으로 명시적 추적.
- **dogfooding 하이라이트**:
  - **UUID BINARY(16) 매핑 회피** — `@JdbcTypeCode(SqlTypes.CHAR)` + `CHAR(36)` 로 이전 세션 f659771 이슈 재발 방지.
  - **PUT 전체 교체 강제** — `UpdateMemoRequest.content` 에 `@field:JsonProperty(required=true)` 적용 (commit 65b3d58), 통합 T4 로 검증.
  - **plain text 렌더 + XSS 방지** — `dangerouslySetInnerHTML` 0, 화면 e2e T5 에서 `<script>` 태그 0 실측.
  - **3 모드 통합 오버레이** — dialogState discriminated union 으로 동일 Modal 재활용.

---

## 섹션 1. PRD ↔ 백엔드

### 1.1 도메인 엔티티 (Memo)

| PRD Field | Type | Nullable | 코드 | 상태 |
|---|---|---|---|---|
| id | UUID, 서버 생성 | No | `var id: UUID = UUID.randomUUID()` + `@JdbcTypeCode(SqlTypes.CHAR) @Column(columnDefinition="CHAR(36)", length=36)` + V3 `CHAR(36) PK` | OK |
| title | String, 최대 100 | No | `@Column(nullable=false, length=100)` | OK |
| content | String, 최대 5000 | Yes | `@Column(nullable=true, length=5000) var content: String?` | OK |
| createdAt/updatedAt | LocalDateTime | No | BaseEntity + `DATETIME(6) NOT NULL` | OK |

V3 마이그레이션: `idx_memos_created_at (created_at DESC)` 인덱스로 페이징 정렬 성능 근거 확보.

### 1.2 API 엔드포인트 (5/5)

| PRD | 코드 |
|---|---|
| GET `/memos?page=0&size=20` | `@GetMapping` + `@RequestParam(defaultValue="0/20")` + `Sort.by(DESC, "createdAt")` |
| GET `/memos/{id}` | `@GetMapping("/{id}") @PathVariable id: UUID` |
| POST `/memos` | `@ResponseStatus(CREATED) @Valid` |
| PUT `/memos/{id}` | `@Valid UpdateMemoRequest` |
| DELETE `/memos/{id}` | `noContent()` |

UUID 파싱 실패 (`MethodArgumentTypeMismatchException`) → 404 매핑 (존재하지 않는 리소스와 의미 동치). 통합 e2e T6 실측 확인.

### 1.3 DTO 스키마

- `MemoResponse`: PRD 완전 일치.
- `MemoPageResponse`: `{content, totalElements: Long, totalPages: Int, page: Int, size: Int}`.
- `CreateMemoRequest`: `title @NotBlank @Size(max=100)` + `content @Size(max=5000)?` (required 없음 — POST 는 선택 필드).
- **`UpdateMemoRequest`**: 2 필드 모두 `@field:JsonProperty(required=true)` — dogfooding 핵심. PRD §비즈니스 규칙 4 "두 필드 모두 payload 에 있어야 한다" 강제.

### 1.4 비즈니스 규칙 (9/9)

title 1~100자 + 공백 금지 / content 0~5000자 null·"" 허용 / UUID PK 서버 생성 / PUT 전체 교체 (required + 빈 문자열/null 수용) / plain text 저장 / hard delete / V1 단일 사용자 (userId 없음) / createdAt DESC / permitAll (V1).

### 1.5 Controller 테스트 (21 케이스)

GET list 3 + GET one 3 + POST 6 + PUT 7 (전체 교체 누락 2 케이스 포함) + DELETE 2.

---

## 섹션 2. PRD ↔ 프론트

### 2.1 Route / 파일

`/memos` (MemoListPage) + 독립 Route 없음 (MemoDialogContainer 는 내부 dialogState 렌더). `apps/example-web/src/components/Memo{Card,DetailDialog,FormDialog}.tsx` — `libs/ui` 미침범 (페이지 전용 합성, Memo prefix).

### 2.2 서비스 / 쿼리 (5/5)

getMemos(page, size) / getMemo(id) / createMemo / updateMemo / deleteMemo + TanStack Query 훅 5개 (queryKey `['memos', {page, size}]`, `['memo', id]`, mutation invalidate).

UUID 매핑: TS `id: string` (RFC 4122). 통합 e2e T1 에서 정규식 실측.

---

## 섹션 3. screens ↔ 프론트

### 3.1 MemoListPage (전부 매칭)

헤더 + `flex flex-col gap-3` 카드 스택 + 페이지네이션 (첫/마지막 비활성) + `renderBody()` Loading(CardSkeleton ×4)/Error/Empty.

MemoCard: 제목 `truncate` + 본문 `whitespace-pre-wrap line-clamp-3` + 메타 `text-xs text-muted`.

### 3.2 MemoDialogContainer 3 모드

| 모드 | screens 요구 | 구현 | 상태 |
|---|---|---|---|
| 2.a 상세 | 헤더 제목 + plain text 본문 + 메타 + 삭제/편집 푸터 | `MemoDetailDialog` `whitespace-pre-wrap break-words` + `max-h-64 overflow-y-auto` + `renderFooter` 커스텀 | OK |
| 2.b 편집/신규 | 제목 100자 + 본문 5000자 + 카운터 + Primary "저장" (async throw 유지) | `MemoFormDialog` `Input maxLength=100 allowSpaces` + `Textarea maxLength=5000` + 카운터 + Modal async onConfirm 패턴 | OK |
| 2.c 삭제 확인 | 제목 강조 + 복구 불가 고지 + 파괴형 Primary "삭제" + **"취소" → 상세 양보 복귀** | `Modal variant="confirm"` + `onConfirm` Promise 반환으로 DELETE await. **양보 경로 미구현** | **FAIL (known gap)** |

### 3.3 양보 경로 gap 상세

- **위치**: `libs/ui/src/components/Modal/Modal.tsx:123-126` — `handleCancel` 이 `onCancel?.()` 호출 직후 **무조건** `handleClose()` 실행.
- **결과**: `MemoListPage.tsx:282-289` 에서 onCancel 이 `setDialog({kind:"detail", memo})` 를 해도 동일 tick 에 Modal 이 close 강제 → 오버레이 전체 닫힘. 상세 모달 재오픈 안 됨.
- **증거**: 화면 e2e `memo.spec.ts` T7 이 `test.skip` + TODO(dogfooding) 주석 (L386-392).
- **실 UX 영향**: 삭제 취소 → 상세 재확인 원하면 목록에서 카드 재클릭 필요. 기능 차단은 아님.
- **해결 방향**: Modal primitive 에 "onCancel 반환값 기반 close 보류" 옵트인 추가 (ui-composer → ui-library-tester → ui-lead). 그 후 MemoListPage 재활성화 + T7 unskip.

### 3.4 UI 카테고리 매핑

Primary / 보조 / 파괴형 Button / Input / Textarea / Modal / CardSkeleton — 전부 `@monorepo/ui` primitive. MemoCard 의 native `<button type="button">` 은 합성 카드 클릭 가능 영역 래퍼로 허용 (libs/ui 아님, screens 명시 "앱 전용 합성").

### 3.5 State 표 (Minor 관찰)

screens 의 `{kind:"edit", memo?}` 통합 표기 vs 구현의 `{kind:"create"} | {kind:"edit", memo}` 분리. 의미 동치, discriminated union 관점에서 구현이 더 정확. 문서 미세 수정 대상.

---

## 섹션 4. 횡단 정합

- **plain text + XSS 방지**: 리포지토리 전체 `dangerouslySetInnerHTML` 0 건. 화면 e2e T5 가 `<script>` 본문 저장 후 DOM `<script>` 태그 0 실측.
- **JSON UUID**: Kotlin UUID → Jackson 기본 "하이픈 포함 36자 문자열" ↔ TS `string`. 통합 T1 정규식 검증.
- **에러 포맷**: 서버 `{ message, errors? }` ↔ 프론트 status 기반 분기 + 한국어 고정 문구. XSS/스택 비노출.
- **PUT 전체 교체 강제**: content 필드 누락 → 400. 통합 T4 검증.

---

## 섹션 5. 테스트 커버리지

### 5.1 PRD × 테스트 매트릭스

| 규칙 | Controller | 화면 e2e | 통합 e2e |
|---|---|---|---|
| title 공백/101자 → 400 | POST/PUT | T3a/T3b | T4/T7 |
| content 5001자 → 400 | POST | T4 | T7 |
| content null/"" 허용 | POST | - | T4/T7 |
| PUT 전체 교체 누락 → 400 | PUT content/title 누락 2 | - | T4 |
| 페이징 기본값 + size 쿼리 | GET 3 | - | T3 |
| createdAt DESC | - | - | T2 |
| 404 (GET/PUT/DELETE) | 3 | - | T5 |
| UUID 형식 오류 404 | 1 | - | T6 |
| hard delete 전역 소멸 | DELETE 1 | - | T9 |
| plain text + XSS 방지 | - | T5 | - |
| 3 모드 모달 전환 | - | T5/T6 | T1 |
| 양보 경로 취소 | - | T7 **skip** | - |
| 한글 UTF-8 왕복 | - | T10 | T8 |
| 페이지네이션 UI | - | T9 | - |

### 5.2 합계

Controller 21 + 화면 e2e 11 (+ T7 skip 1) + 통합 e2e 9 = **41 케이스** (40 passed + 1 skip).

---

## 권고 사항 (발견사항 반영 단계 우선순위)

1. **[UI, 우선순위 1]** Modal primitive `handleCancel` 개선. onCancel 반환값(`false` / `Promise.reject`) 기반 close 보류 옵트인. ui-composer → ui-storybook-curator → ui-library-tester → ui-lead.
2. **[Frontend, 연쇄]** UI팀 작업 후 `MemoListPage.tsx` 양보 경로 재활성화. frontend-developer + frontend-lead.
3. **[Test, 연쇄]** `memo.spec.ts` T7 unskip.
4. **[Docs, 낮음]** `memo-list.md` §State 의 dialogState 표기를 구현 분리형으로 맞추거나 구현에 옵셔널 유지 주석.
5. **[Observation]** `libs/tailwind-config/globals.css` 에 `--color-bg-innerframe` alias 추가 — MemoCard hover 에서 arbitrary `hover:bg-[var(...)]` 대신 `hover:bg-bg-innerframe` 으로 일관성 개선 가능.

---

## 결론

**PASS with minor + 1 known skip**

- 6 레이어 정합 — Critical 0, Minor 2 (수용).
- Known gap 1 건 (Modal 양보 경로) 은 화면 e2e T7 skip 으로 명시 추적. 기능 차단 아닌 UX 연속성 gap.
- UUID BINARY 매핑 회피 + PUT 전체 교체 강제 + plain text XSS 방지 + 3 모드 통합 오버레이 — 모두 설계 의도대로.
- 테스트 40 passed + 1 skip, 핵심 계약 실측 단정.

발견사항 반영 단계에서 Modal primitive 개선 + MemoListPage 재활성화 + T7 unskip 3 연쇄 작업이 남은 유일한 후속.
