# 프론트 기술 스택 (`apps/example-web`)

이 문서는 `apps/example-web` 이 사용하는 프론트엔드 기술 스택을 **결정 기록(decision record)** 형태로 남긴다.
프론트 개발팀(`frontend-developer`) 이 새 코드를 쓰거나 기존 코드를 고칠 때 이 문서의 규약을 따른다.

관련 규약:
- `@monorepo/ui` 우선 규칙 → `CLAUDE.md` "UI 라이브러리 우선 규칙"
- 여러 행 표시 primitive 선택 → `docs/design-notes/data-display.md`

## 1. 결정 요약 (2026-04-22)

| 영역 | 선택 | 패키지 | 상태 |
|---|---|---|---|
| 서버 상태 / 데이터 패칭 / 캐시 | **TanStack Query v5** | `@tanstack/react-query` | 도입 결정, 마이그레이션 대기 |
| 클라이언트 전역 상태 | **Zustand** | `zustand` | 도입 결정, 필요 시점에 스토어 생성 |
| 폼 | **현 방식(`useState`) 유지** | — | 규모 임계치 도달 시 재검토 |
| 스키마 검증 / 런타임 파싱 | **Zod** | `zod` | 도입 결정, 점진 확산 |
| 날짜 처리 | **date-fns** | `date-fns` | 도입 결정, 반복 지점부터 교체 |
| HTTP 클라이언트 | axios (기존 유지) | `axios` | 변경 없음 |
| 라우팅 | React Router v6 (기존 유지) | `react-router-dom` | 변경 없음 |
| UI primitive | `@monorepo/ui` (기존 유지) | workspace | 변경 없음 |
| 스타일 | Tailwind v4 + 토큰 (기존 유지) | `tailwindcss`, `@monorepo/tokens` | 변경 없음 |

## 2. 결정 배경 및 사용 규칙

### 2.1 TanStack Query (서버 상태)

**문제**
현재 모든 페이지(`MemoListPage`, `UserListPage`, `TodoListPage`, `*FormPage`) 가 `useState + useEffect + axios` 로 `loading` / `error` / `page` / `totalPages` 를 손으로 관리한다. 캐시 없음, 중복 요청 제어 없음, 수동 리페치.

**대안 검토**
- SWR — 유사하나 기능/생태계 면에서 TanStack Query 우위.
- RTK Query — Redux 전제. 우리는 클라이언트 상태가 적어 과잉.

**선택**: TanStack Query v5.

**규칙**
- 모든 HTTP 요청은 `useQuery` / `useMutation` 경유. 페이지에서 axios 직접 호출 금지.
- 서비스 레이어(`apps/example-web/src/services/*.ts`) 는 그대로 유지 — axios 호출만 담당. 쿼리/뮤테이션 훅은 `apps/example-web/src/queries/<domain>.ts` 에 둔다.
- 쿼리 키는 배열 + 파라미터 객체 패턴: `['memos', { page, size }]`, `['todos', { status }]`, `['users']`, `['memo', id]`.
- 뮤테이션 성공 후 `queryClient.invalidateQueries({ queryKey: ['memos'] })` 로 관련 쿼리 무효화. 수동 `load()` 재호출 패턴 제거.
- `QueryClientProvider` 는 `apps/example-web/src/main.tsx` 최상위에 한 번. `staleTime` / `gcTime` 기본값은 초기엔 라이브러리 기본 유지, 페이지별 조정 필요 시 `useQuery` 옵션으로.
- 낙관적 업데이트(optimistic update) 는 명시적으로 필요한 케이스(체크박스 토글 등) 에서만 사용.

### 2.2 Zustand (클라이언트 전역 상태)

**문제**
현재 전역 상태가 없다. 인증 사용자 정보 / 테마 / 토스트 큐 / 모바일 드로어 개폐 같은 공유 UI 상태가 생기면 Context 중첩으로 가기 쉽다.

**대안 검토**
- Context API — 간단하지만 셀렉터 기반 재렌더 제어 약함.
- Jotai — atomic 모델, 학습 비용 조금 더.
- Redux Toolkit — boilerplate 과함.

**선택**: Zustand — 최소 표면, 훅 기반, `persist` / `subscribeWithSelector` 미들웨어.

**규칙**
- 스토어 위치: `apps/example-web/src/stores/<name>Store.ts`. 파일당 `createStore` 하나.
- 훅 이름 규약: `useAuthStore`, `useToastStore` 등 `use<Name>Store`.
- **서버 데이터는 Zustand 에 저장하지 않는다** — 서버 상태는 TanStack Query 캐시가 유일한 소스. (예: 로그인 "사용자 프로필" 객체 자체는 TanStack Query, "현재 로그인된 userId" 같은 식별자나 토큰만 Zustand.)
- 전역이 아닌 단일 페이지 UI 상태는 페이지 로컬 `useState` / `useReducer` 로. Zustand 는 **둘 이상의 컴포넌트가 공유** 할 때만.
- `persist` 가 필요하면 저장 키에 버전(`version`) 명시.

### 2.3 폼 — 현 방식(`useState`) 유지

**배경**
현재 `UserFormPage`, `TodoFormPage`, `MemoFormDialog` 등은 controlled `useState` 패턴. 필드 3~5 개, 조건부 필드/단계형 없음. 도입 비용 > 편익.

**재검토 트리거** (아래 중 하나라도 충족되면 다시 논의)
- 한 폼에 필드 10 개 이상
- 조건부 필드 / 필드 간 의존
- 단계형(wizard) 폼
- 동적 배열 필드 (`useFieldArray` 필요 수준)

**재검토 시 후보**: `react-hook-form` (생태계 성숙). TanStack Form 은 시점 재평가.

### 2.4 Zod (스키마 검증)

**문제**
TypeScript 타입은 **컴파일 타임**만 보장. API 응답과 폼 입력은 런타임에서 쓰레기 값이 올 수 있다.

**대안 검토**: valibot(번들 작음, 생태계 작음), Yup(TS 통합 약함).

**선택**: Zod.

**규칙**
- 폼 검증: 스키마를 페이지 파일 상단에 두거나, 재사용 되면 `apps/example-web/src/schemas/<name>.ts`.
- API 응답 런타임 파싱: `@monorepo/api-types` 의 타입과 별개로, **개발 모드(`import.meta.env.DEV`)** 에서만 `schema.parse(data)` 로 검증해 스키마 드리프트 조기 발견. 프로덕션 번들 비용 회피.
- 장기적으로는 백엔드 OpenAPI 스키마 → `@monorepo/api-types` → Zod 생성까지 자동화 고려. 지금은 수동.

### 2.5 date-fns (날짜 처리)

**대안 검토**: dayjs(작고 API 간결하나 TS 추론 약함), Luxon(시간대 강력, 번들 큼), Temporal API(브라우저 지원 부족).

**선택**: date-fns — 순수 함수, tree-shakeable, TS 친화.

**규칙**
- `new Date()` 계산이나 포맷팅이 두 군데 이상 반복되면 date-fns 유틸로 교체 (DRY 기준).
- 시간대가 본격적으로 중요해지면 `date-fns-tz` 보조 도입 검토.
- 포맷 문자열은 페이지 로컬이 아닌 공용 유틸(`apps/example-web/src/utils/date.ts`) 로 모아간다.

## 3. 금지 사항

- 서버 상태를 Zustand / Context / localStorage 에 직접 캐시하지 않는다 — 서버 상태는 TanStack Query 전담.
- `moment.js` 도입 금지 (deprecated + bundle size).
- 추가 HTTP 클라이언트 도입 금지 — axios 유지.
- 추가 상태 관리 라이브러리(Redux, Jotai, Recoil 등) 병행 도입 금지.
- 폼 라이브러리 단독 도입 금지 — 재검토 트리거(§2.3) 를 만족해 이 문서에 반영된 뒤에만.

## 4. 현재 마이그레이션 상태

이 문서는 **결정 기록**이다. 2026-04-22 기준, 아래 라이브러리는 `apps/example-web/package.json` 에 아직 미설치:

- `@tanstack/react-query`
- `zustand`
- `zod`
- `date-fns`

실제 코드 마이그레이션은 별도 파이프라인으로 진행한다. 예상 순서:

1. 의존성 설치 + `QueryClientProvider` 를 `main.tsx` 에 연결 (프론트 개발팀)
2. 기존 3 리스트 페이지(Memo / User / Todo) 를 TanStack Query 기반으로 리팩터 (프론트 개발팀 → 프론트 테스트팀 e2e 확인)
3. Form 페이지는 현 방식 유지, 추후 Zod 검증만 선택적 적용
4. Zustand 스토어는 실제 공유 상태가 등장하는 시점에 첫 스토어 생성 (예: 인증 도입)

## 5. 변경 절차

- 이 문서(`docs/tech-stack/frontend.md`) 편집 권한은 **메인(프로젝트 전체 팀장)** 에 있다.
- 새 라이브러리 도입 / 교체 / 제거는 사용자와 합의 후 **먼저 이 문서에 반영**하고 그다음 코드 변경. 순서 역전 금지.
- 버전 업그레이드는 이 문서 편집 없이 진행 가능 (메이저 버전이면 영향 검토 후 기록).
