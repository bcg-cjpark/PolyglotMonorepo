# Spec Audit: memo

**PRD**: `docs/prd/memo.md` (커밋 `7cc6412 docs(plan): memo 기획 통합`)
**구현 커밋**: `d914c37`, `562a82f`, `946f848`, `a36e2ad`, `0dc58d6`
**감사일**: 2026-04-22
**감사자**: spec-auditor

## Summary

- **Overall**: PARTIAL
- **일치 (PASS)**: 23건
- **불일치**: 3건 (High 2, Medium 0, Low 1)
- **Out of Scope 침범**: 0건
- **Skip 합의**: 1건 (Stitch 화면정의서 — 사용자 명시)

High 2건은 runner/tester 단계에서 이미 식별됨. 별도 backend-developer 재위임 라운드로 처리.

## Domain Model

| 항목 | PRD | 구현 | 상태 |
|---|---|---|---|
| Entity `Memo` 존재 | O | O | PASS |
| `id: UUID`, PK, not null | O | `@Id val id: UUID = UUID.randomUUID()` | PASS |
| `title: String`, not null, 100자 | O | `@Column(nullable=false, length=100)` | PASS |
| `content: String?`, nullable, 5000자 | O | `@Column(nullable=true, length=5000)` | PASS |
| `createdAt: LocalDateTime`, auditing | O | `BaseEntity.createdAt` + `@CreatedDate` + `@EnableJpaAuditing` | PASS |
| `updatedAt: LocalDateTime`, auditing | O | `BaseEntity.updatedAt` + `@LastModifiedDate` | PASS |
| `createdAt` DESC 인덱스 | O | `idx_memos_created_at_desc` | PASS |
| V3 마이그레이션 분리 (V1 불변) | 암묵 | V3 추가, V1/V2 미수정 | PASS |

## API Endpoints

| PRD | 구현 | 상태 |
|---|---|---|
| `GET /api/memos?page&size` → `PageResponse<MemoResponse>` | `@GetMapping` defaults `page=0, size=20` | PASS (경로 prefix — Low 이슈 #3 참조) |
| `GET /api/memos/{id}` → `MemoResponse` | `@GetMapping("/{id}")` | PASS |
| `POST /api/memos` → 201 + `MemoResponse` | `@PostMapping` + `@ResponseStatus(CREATED)` | PASS |
| `PUT /api/memos/{id}` → 200 + `MemoResponse` (전체 교체) | `@PutMapping("/{id}")` | PARTIAL — High #2 |
| `DELETE /api/memos/{id}` → 204 | `@DeleteMapping("/{id}")` + `ResponseEntity.noContent()` | PASS |
| 404 on missing id | `@ExceptionHandler(MemoNotFoundException)` → 404 | PASS |

## DTO Schema

| PRD | 구현 | 상태 |
|---|---|---|
| `MemoResponse { id, title, content, createdAt, updatedAt }` | 동일 5필드 | PASS |
| `CreateMemoRequest { title, content? }`; title `@NotBlank`, 1-100; content 0-5000 | `@NotBlank @Size(min=1,max=100)` / `@Size(max=5000)` nullable | PASS |
| `UpdateMemoRequest { title, content }` — 두 필드 모두 필수 (전체 교체) | `content: String?` (nullable, 생략 허용) | **FAIL — High #2** |
| `PageResponse<T> { content, totalElements, totalPages, page, size }` | 동일 5필드 | PASS |

## Business Rules

| # | PRD 규칙 | 구현 | 상태 |
|---|---|---|---|
| 1 | 정렬 `createdAt` DESC 고정 | `findAllByOrderByCreatedAtDesc(Pageable)` | PASS |
| 2 | 기본 페이징 `page=0, size=20` | `@RequestParam(defaultValue)` | PASS |
| 3 | V1 단일 사용자 (userId 컬럼 없음) | 테이블/엔티티 userId 없음 | PASS |
| 4 | hard delete | `memoRepository.delete(memo)` | PASS |
| 5 | PUT 전체 교체 (title/content 둘 다 새 값) | title 필수 OK, content 생략 가능 | **FAIL — High #2** |
| 6 | title `@NotBlank` + 1-100 | `@NotBlank @Size(min=1,max=100)` + 서비스 `require(title.trim().isNotBlank())` | PASS |
| 7 | 없는 ID → 404 | `MemoNotFoundException` → `@ExceptionHandler` | PASS |
| 8 | 마크다운/HTML 렌더 안 함 | `whitespace-pre-wrap` + 텍스트 노드, `dangerouslySetInnerHTML` 미사용 | PASS |
| 9 | Bean Validation 실패 → 400 (표준 REST) | 현재 403 (SecurityConfig `/error` 누락) | **FAIL — High #1** |

## UI Screens

### 리스트 화면

| 요건 | 구현 | 상태 |
|---|---|---|
| 최신순 카드 리스트 | 서버 정렬 → `MemoCard × N` | PASS |
| 제목 + 본문 미리보기 3-4줄 말줄임 + 생성 시각 | `<h3>` / `line-clamp-3 whitespace-pre-wrap` / `text-xs` | PASS |
| 항목 선택 → 전체 열람 | `onClick` → 상세 모달 | PASS |
| 신규 작성 진입 지점 | 상단 "+ 새 메모" primary Button | PASS |
| 빈 상태 텍스트만 | `<p>` 만, 일러스트 없음 | PASS |
| 페이지네이션 컨트롤 | 이전/다음 + `X / Y (총 Z개)` | PASS |

### 상세 화면

| 요건 | 구현 | 상태 |
|---|---|---|
| 제목 + 본문 전체 표시 | Modal title=memo.title + 본문 `<p>` | PASS |
| 생성/수정 시각 표시 | 생성 항상, 수정은 다를 때만 | PASS |
| 편집 액션 | contained primary | PASS |
| 삭제 액션 | outlined red | PASS |
| 삭제 확인 다이얼로그 | `Modal variant="confirm"` + "복구할 수 없습니다" | PASS |

### 작성/편집 폼

| 요건 | 구현 | 상태 |
|---|---|---|
| 모달 폼, 생성/편집 공용 | `MemoFormDialog mode: "create" \| "edit"` | PASS |
| 단일행 제목 (1-100, 필수) | `<Input>` + maxLength=100 + 검증 | PASS |
| 다중행 본문 (0-5000, 선택) | `<Textarea>` + maxLength=5000 | PASS |
| 확인/취소 버튼 | Modal 기본 footer | PASS |
| 편집 시 기존 값 프리필 | `useEffect` on `isOpen` | PASS |
| 유효성 실패 시 필드 하단 오류 | `Input errorMessage` prop | PASS |

### Routes

| PRD | 구현 | 상태 |
|---|---|---|
| `/memos` 단일 라우트 | `<Route path="/memos" element={<MemoListPage/>}/>` | PASS |
| 상세/폼 별도 라우트 없음 (모달 통합) | 라우트 1개 + 모달 통합 | PASS |

### UI 라이브러리 우선 준수

- `@monorepo/ui` `Button` / `Modal` / `Input` / `Textarea` 일관 사용 확인
- native `<button>` 1건 (`MemoCard.tsx:17`) — 카드 전체 클릭 컨테이너, label 버튼 아님. 합성 컴포넌트 내부 정당 사용 — PASS

## Error Handling

| 항목 | PRD | 구현 | 상태 |
|---|---|---|---|
| 404 응답 바디 | 명시 없음 | `{ "message": "Memo not found: {id}" }` | PASS |
| Bean Validation 실패 → 400 | 명시 없지만 표준 REST | 현재 403 | **FAIL — High #1** |

## Out of Scope 준수 (PRD)

| 항목 | 침범 여부 |
|---|---|
| 멀티 유저 / 인증 / userId | PASS (없음) |
| 공유/협업/권한 | PASS |
| 카테고리/태그 | PASS |
| 검색 | PASS |
| Soft delete / 휴지통 | PASS (hard delete 만) |
| 마크다운 / rich text | PASS |
| 빈 상태 일러스트 | PASS |
| PATCH 엔드포인트 | PASS |
| 정렬 옵션 확장 | PASS (createdAt DESC 고정) |
| 첨부파일/이미지 | PASS |

**Out of Scope 침범: 0건.**

## Unresolved Gaps (재위임 필요)

| # | 심각도 | 위치 | PRD 명세 | 구현 | 재위임 |
|---|---|---|---|---|---|
| 1 | **High** | `apps/example-api/security/.../SecurityConfig.kt:16-23` | Bean Validation 실패 = 400 (REST 표준) | Spring `/error` forward → `/error` permit 누락 → 403 | **backend-developer**: `/error` permitAll 또는 `@RestControllerAdvice` 로 `MethodArgumentNotValidException` → 400 직접 매핑 |
| 2 | **High** | `apps/example-api/app/.../memo/MemoDto.kt:42` | `UpdateMemoRequest { title, content }` — 두 필드 모두 필수 (전체 교체) | `content: String?` nullable — 클라이언트가 content 키 생략 시 null 로 덮어쓰기 (integration T4 는 빈문자열만 검증, missing key 케이스 공백) | **backend-developer**: `content` non-null + `@field:NotNull @field:Size(max=5000)` (빈 문자열 허용, `@NotBlank` 금지) |
| 3 | Low | PRD L27-31 경로 표기 vs 실제 매핑 | `GET /api/memos` 등 `/api` prefix | 컨트롤러 `/memos` + Vite dev proxy rewrite + 프론트 axios baseURL `/api` | 런타임 동작 PASS. 문서 명확화 (외부 노출 경로 vs 컨트롤러 매핑 주석) 또는 `@RequestMapping("/api/memos")` 로 내재화. **doc-consolidator 또는 backend-developer 선택** |

## Skip 합의 사항

- **Stitch 화면정의서 부재** (`docs/screens/memo-*.md`): 사용자 명시 스킵. PRD `## 관련 화면` 에 스킵 사유 기재. 본 감사에서 화면정의서 diff 미수행.

## 테스트 커버리지 (참고)

- **e2e** (`memo.spec.ts` 8): 화면 로드, 생성, 상세, 편집, 삭제, 페이지네이션, 한글 IME, 공백 제목 유효성
- **integration** (`memo.spec.ts` 9): CRUD flow, DESC 정렬, 페이징 경계/기본, PUT 교체, 404, 유효성 (non-2xx), 한글 IME, hard delete
- Gap #2 (content 키 누락 케이스) 미커버 — backend 수정 후 회귀 테스트 추가 권장
- Gap #1 (403 vs 400) 은 integration T6 이 `>=400 && <500` 로 방어적 통과 — 수정 후 `.toBe(400)` 로 타이트닝 권장

## 다음 단계 제안

1. **backend-developer 재위임 (High 2건)**:
   - Gap #1: SecurityConfig `/error` permitAll 또는 `@RestControllerAdvice` 글로벌 핸들러
   - Gap #2: `UpdateMemoRequest.content` non-null + `@field:NotNull`
2. **backend-lead 재검증**: `:lint` + `:build` + integration T4/T6 확장
3. **integration-e2e-runner 재실행**: 400 확정, content 누락 400 확정
4. (Gap #3 Low) 별도 이터레이션에서 처리 — 급하지 않음

## 감사 메타

- **읽기 전용 수행** (본문 작성은 spec-auditor, 파일 저장은 메인)
- **파일 저장**: 본 리포트
- **Overall 판정**: **PARTIAL** — High 2건 잔존으로 PASS 불가. 다만 UI/UX/도메인 모델/대부분 API 규약 PASS 로 **구현 품질 높음**. 백엔드 검증 실패 응답 레이어 1건 + PUT 시맨틱 엄격화 1건만 후속 처리하면 **FULL PASS 도달 예정**.
