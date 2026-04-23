# User 피처 사후 감사 리포트

**날짜**: 2026-04-23
**감사자**: spec-auditor (dogfooding 파이프라인 [9])
**관련 커밋**: 81a68cd (API), 4316aa9 (Web), a2307de (e2e), 766f764 (integration)
**명세 (진실 소스)**:
- [docs/prd/user.md](../prd/user.md)
- [docs/screens/user-list.md](../screens/user-list.md)

---

## 요약

- **상태**: PASS with minor
- **Critical 불일치**: 0 건
- **Minor 불일치**: 3 건 (관찰만, 재작업 강제 아님)
- **수용 가능 스킵**: 1 건 (Loading/Error 화면 e2e — 빠른 응답으로 재현 어려움)
- **전체 정합**: PRD 도메인 모델 / 엔드포인트 5 개 / 비즈니스 규칙 / 화면 레이아웃 / 인터랙션 1~8 / 상태 표가 구현과 일대일로 매칭됨.

---

## 섹션 1. PRD ↔ 백엔드

### 1.1 도메인 모델 (User 엔티티)

| PRD Field | Type | Nullable | 제약 | 코드 | 상태 |
|---|---|---|---|---|---|
| id | Long | No | PK, auto-increment | `User.kt:20-21` + `V1__user.sql:5` `BIGINT AUTO_INCREMENT PRIMARY KEY` | OK |
| email | String | No | 유니크, 최대 255자, 이메일 형식 | `User.kt:14-15` + `V1__user.sql:10` `uk_users_email UNIQUE` | OK |
| name | String | No | 최대 100자, 공백만 불가 | `User.kt:16-17` | OK |
| createdAt | LocalDateTime | No | 생성 시각 (BaseEntity 상속) | `BaseEntity.kt:14-16` + `V1__user.sql:8` `DATETIME(6) NOT NULL` | OK |
| updatedAt | LocalDateTime | No | 수정 시각 (BaseEntity 상속) | `BaseEntity.kt:18-19` + `V1__user.sql:9` `DATETIME(6) NOT NULL` | OK |

### 1.2 API 엔드포인트 (5/5 완전 구현)

| PRD Method | PRD Path | 코드 | 상태 |
|---|---|---|---|
| GET | `/users` | `UserController.kt:26-27` → `findAllByOrderByCreatedAtDesc` | OK |
| GET | `/users/{id}` | `UserController.kt:29-32` → `findById` orElseThrow | OK |
| POST | `/users` | `UserController.kt:34-38` `@ResponseStatus(CREATED) @Valid` | OK |
| PUT | `/users/{id}` | `UserController.kt:40-47` `@Valid UpdateUserRequest` | OK |
| DELETE | `/users/{id}` | `UserController.kt:49-55` `noContent()` | OK |

### 1.3 HTTP 상태 코드 매핑 (5/5)

| 상태 | 조건 | 코드 |
|---|---|---|
| 201 | POST 성공 | `@ResponseStatus(CREATED)` |
| 204 | DELETE 성공 | `ResponseEntity.noContent()` |
| 404 | NotFound | `@ExceptionHandler(UserNotFoundException)` |
| 409 | EmailDuplicated | `@ExceptionHandler(UserEmailDuplicatedException)` |
| 400 | Validation | `@ExceptionHandler(MethodArgumentNotValidException)` |

### 1.4 DTO 스키마

- `UserResponse`: PRD 도메인 모델과 완전 일치.
- `CreateUserRequest` / `UpdateUserRequest`: `email @NotBlank @Email @Size(max=255)` / `name @NotBlank @Size(max=100)` — PRD 규칙 완전 매핑.

### 1.5 비즈니스 규칙 (9/9 구현)

| 규칙 | 코드 위치 |
|---|---|
| 이메일 유니크 (DB) | `V1__user.sql:10` `uk_users_email UNIQUE` |
| 이메일 유니크 (앱 pre-check) | `UserService.kt:23-25` `existsByEmail` throw |
| 이메일 유니크 (PUT 자기 제외) | `UserService.kt:36-38` `existsByEmailAndIdNot` |
| 이메일 형식 | `UserDto.kt:30, 40` `@field:Email` |
| 이름 공백만 불가 | `UserDto.kt:33, 43` `@field:NotBlank` |
| PUT 전체 교체 | `UpdateUserRequest.email/name` 둘 다 `@NotBlank` |
| hard delete | `UserService.kt:43-47` JPA `delete(user)` |
| createdAt DESC 정렬 | `UserRepository.kt:6` `findAllByOrderByCreatedAtDesc` |
| permitAll (V1 한시) | `SecurityConfig.kt:21` `/users/**` permitAll |

---

## 섹션 2. PRD ↔ 프론트 (계약 레벨)

### 2.1 서비스 레이어

| PRD 엔드포인트 | `services/users.ts` | 상태 |
|---|---|---|
| GET `/users` | `getUsers` | OK |
| GET `/users/{id}` | `getUser` (현 UI 미사용, 계약상 존재) | OK |
| POST `/users` | `createUser` | OK |
| DELETE `/users/{id}` | `deleteUser` | OK |
| PUT `/users/{id}` | **없음** | **Minor** — V1 화면에 수정 UI 없어 함수 미포함. 통합 e2e T6 에서 계약은 검증됨. 수용. |

### 2.2 TypeScript DTO

모든 필드 (id/email/name/createdAt/updatedAt) TS 타입과 일치. `Long → number`, `LocalDateTime → string (ISO 8601)`.

### 2.3 에러 분기 문구 (4/4 완전 일치)

| 시나리오 | 문구 |
|---|---|
| 409 UI | "이미 사용 중인 이메일입니다." |
| 409 서버 message | "이미 사용 중인 이메일입니다." |
| 로컬 이메일 형식 | "이메일 형식이 올바르지 않습니다." |
| 로컬 이름 공백 | "이름을 입력하세요." |

---

## 섹션 3. screens ↔ 프론트 (UI 인터랙션)

### 3.1 레이아웃 (전부 매칭)

- Route `/users`, 파일 `apps/example-web/src/pages/UserListPage.tsx`.
- 헤더 (제목 "사용자" + Primary "+ 새 사용자"), 표 4 컬럼, 오버레이 컨테이너 (모달).
- 헤더는 Loading/Error/Empty 3 상태에서 유지, 본문만 치환 (`renderBody()` 패턴, `global-states.md §2` 준수).

### 3.2 컴포넌트 표 → primitive 매핑 (11/11)

전부 `@monorepo/ui` primitive (`Button` / `Table` / `Modal` / `Input` / `ListSkeleton`) 로 커버. 앱 내부 ad-hoc primitive 생성 0.

### 3.3 인터랙션 1~8 커버리지

| # | 인터랙션 | 구현 | e2e | 상태 |
|---|---|---|---|---|
| 1 | 진입 GET /users | `useUsersQuery` | T1 | OK |
| 2 | Loading 헤더 유지 + 스켈레톤 | `renderBody` isLoading | (스킵) | **수용** |
| 3 | Error 헤더 유지 + 재시도 | `renderBody` isError | (스킵) | **수용** |
| 4 | Empty "등록된 사용자가 없습니다." | Table emptyMessage | T1 간접 | OK |
| 5 | "+ 새 사용자" → 모달 오픈 | `openModal` | T2 | OK |
| 6 | 저장: 201/409/로컬검증/저장중 | `handleConfirm` | T3/T4/T5/T6 | OK |
| 7 | 닫기: 취소/ESC/오버레이 | Modal primitive | T7a/b/c | OK |
| 8 | 삭제 confirm → DELETE 204 | `handleDelete` | T8 | OK |

**수용 스킵**: Loading/Error 화면 e2e — 실 API 빠른 응답으로 재현 어려움. 코드 분기는 존재. MSW 도입 시 복구 검토.

### 3.4 State 표 (8/8 필드 커버)

`users`, `isLoading`, `isError`, `isModalOpen`, `formEmail`, `formName`, `formErrors`, `isSubmitting` — TanStack Query 파생 포함 전부 커버.

**Minor**: `isSubmitting` 이 별도 useState 가 아니라 `createMutation.isPending` 로 파생. 기능 동등, TanStack Query 권장 패턴. 수용.

---

## 섹션 4. 횡단 정합

### 4.1 JSON 필드명

백엔드 Jackson camelCase ↔ 프론트 `createdAt` / `updatedAt`. 완전 일치.

### 4.2 POST body 포맷

프론트 `{ email, name }` ↔ 백엔드 `CreateUserRequest(email, name)`. 완전 일치.

### 4.3 에러 포맷 `{ message, errors? }`

- 백엔드: 404/409/400 세 경로 모두 `{ message, errors? }` 반환.
- 프론트: status 코드만 분기에 사용, 문구는 UI 고정. screens §6 의 "스택 원문 미노출" 원칙 준수.
- 통합 e2e T7 에서 `body.message` 필드 존재 검증.

**Minor**: 프론트가 400 을 "저장에 실패" 로 싸잡아 처리. 로컬 정규식이 느슨 (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) 해 서버 `@Email` 과 의미 차이 가능성 낮음. 수용.

---

## 섹션 5. 테스트 커버리지 매트릭스

### 5.1 PRD 비즈니스 규칙 × 테스트

| 비즈니스 규칙 | Controller Test | 화면 e2e | 통합 e2e |
|---|---|---|---|
| 이메일 유니크 POST 409 | ✓ | T6 | T5 |
| 이메일 유니크 PUT 409 | ✓ | - | T6 |
| 이메일 형식 400 | ✓ | T4 | T8 |
| 이름 공백 400 | ✓ | T5 | T8 |
| PUT 전체 교체 (필드 누락 400) | - | - | T6 |
| hard delete 204 | ✓ | T8 | T1/T2 |
| 정렬 createdAt DESC | - | - | T3 |
| 404 (GET/PUT/DELETE) | ✓ | - | T7 |
| name 최대 100자 | - | - | T8 |
| email 최대 255자 | - | - | T8 |
| 한글 UTF-8 왕복 | - | T9 | T4 |
| 모달 닫기 3 경로 | - | T7a/b/c | - |

### 5.2 피라미드 건강성

- Controller Test (mock 기반 13) → 화면 e2e (UI 9) → 통합 e2e (실 DB 왕복 8) 3 층 피라미드.
- 의도된 중복 (409/400/204/404 등 핵심 경로는 3 층 모두).
- 누락 없음.

---

## 권고 사항 (V2 백로그)

재작업 지시 없음. 아래는 관찰 사항만.

1. **[Backend, 낮음]** `getUser` 서비스 함수는 현 UI 미소비. 상세 페이지 스펙 추가 시 활성화.
2. **[Frontend, 낮음]** `updateUser` 는 PUT 수정 UI 추가 시 구현. 통합 e2e T6 가 계약 검증.
3. **[Docs, 미세]** `docs/screens/user-list.md §Error` 의 고정 문구를 screens 에 명시적으로 기록하면 일관성 개선 (현 구현: "목록을 불러오지 못했습니다."). 강제 아님.
4. **[Test, 낮음]** Loading/Error 화면 e2e 는 MSW 도입 시점에 복구.
5. **[Observation]** `SecurityConfig.kt:21` `/users/**` permitAll 은 한시. 인증 피처 PRD 진입 시 재평가 필수.

---

## 결론

**PASS with minor (재작업 지시 없음)**

- 6 레이어 (PRD / screens / 백엔드 / 프론트 / 화면 e2e / 통합 e2e) 모두 정합.
- 도메인 5/5, 엔드포인트 5/5, 상태 코드 5/5, 비즈니스 규칙 9/9, UI 매핑 11/11, 인터랙션 1~8 중 6 직접 + 2 수용 스킵, State 8/8.
- 테스트 30 케이스 (Controller 13 + 화면 e2e 9 + 통합 e2e 8) 가 핵심 규칙 전부 커버.
- Critical 0, Minor 3 (전부 수용 가능).

dogfooding 파이프라인 [9] **통과**.
