# Stitch Brief: user

**원본 PRD**: `docs/prd/user.md`
**디자인 노트**:
- `docs/design-notes/global-palette.md` (Indigo Primary + Amber Secondary 기조)
- `docs/design-notes/global-states.md` (Loading/Error/Empty 에서 헤더 유지 원칙)
- `docs/design-notes/data-display.md` (정형 CRUD → 표 primitive 규약)

## 프로덕트 컨텍스트

관리자 내부 도구. 시스템 사용자(email, name) 의 기본 정보를 등록/수정/삭제하는 CRUD. 특정 산업 편향 없는 차분하고 데이터 지향적인 톤. Primary 는 Indigo(신뢰·집중), Secondary 는 Amber(환기·강조). Primary CTA 는 한 화면에 1개 원칙을 지킨다. V1 은 단일 사용자 모델이며 권한/인증 UI 는 포함하지 않는다.

## 전체 페이지 리스트

### UserListPage

- **페이지 이름**: UserListPage
- **Route**: `/users`
- **목적**: 등록된 사용자 목록을 최신 생성순으로 조회하고, 신규 생성 진입점과 행 단위 삭제 액션을 제공한다.
- **필요 UI 카테고리** (구현체 언급 금지):
  - 페이지 헤더 (제목 "사용자" + 주요 액션 Primary 버튼 "+ 새 사용자")
  - 표 (정형 스키마) — 컬럼: 이름 / 이메일 / 생성일 / 행 단위 삭제 액션
  - 행 단위 파괴형(Destructive) 보조 버튼 (삭제)
  - 상태 뷰 — Loading 플레이스홀더 / Error 안내 텍스트 + 재시도 버튼 / Empty 안내 문구 (표 primitive 의 빈 상태 자리 활용)
- **주요 인터랙션**:
  - 페이지 헤더의 "+ 새 사용자" 버튼 클릭 → `/users/new` 로 이동.
  - 행 우측의 "삭제" 버튼 클릭 → 확인 프롬프트 후 해당 사용자 제거, 목록 갱신.
  - Loading/Error/Empty 상태에서도 페이지 헤더(제목 + "+ 새 사용자") 는 항상 유지. 본문 영역만 상태별 뷰로 치환.
- **데이터 바인딩 대상 API**:
  - `GET /users` — 목록 조회 (createdAt DESC 정렬)
  - `DELETE /users/{id}` — 행 단위 삭제 (204; 404 시 에러 처리)

### UserFormPage

- **페이지 이름**: UserFormPage
- **Route**: `/users/new`
- **목적**: email 과 name 을 입력해 신규 사용자를 생성한다.
- **필요 UI 카테고리** (구현체 언급 금지):
  - 페이지 헤더 (제목 "새 사용자" + 뒤로가기/취소 보조 액션)
  - 폼 (세로 스택)
  - 단일행 텍스트 입력 2개 — email / name
  - 필드 라벨 및 헬퍼/에러 텍스트
  - 폼 하단 액션 바 — Primary 버튼 "저장", 보조 버튼 "취소"
- **주요 인터랙션**:
  - email 필드 입력 → 이메일 형식(`email@domain.tld`) 위반 시 필드 하단 에러 텍스트 표시.
  - name 필드 입력 → 공백만으로 구성된 값일 때 필드 하단 에러 텍스트 표시. (한글 IME 입력 지원 필드)
  - "저장" 클릭 → `POST /users` 호출, 성공 시 목록 페이지로 이동. 이메일 중복(409) 시 email 필드 하단 에러 텍스트("이미 사용 중인 이메일입니다" 계열) 표시.
  - "취소" 클릭 → 목록 페이지로 복귀.
- **데이터 바인딩 대상 API**:
  - `POST /users` — 생성 요청 `{ email, name }` (201 성공 / 409 이메일 중복)

## 디자인 제약

- **토큰 기반** — `libs/tokens` 의 CSS 변수만 사용. 하드코딩 `#hex` / 하드코딩 간격(px 리터럴) 금지.
- **Light/Dark 양쪽 대응 필수** — 단일 테마만 확인 후 확정 금지.
- **팔레트 기조**: Primary = Indigo (기본 CTA, focus ring), Secondary = Amber (보조 강조 — 이 피처에서는 사용처 드묾). 파괴형 삭제 액션은 Red 계열 시맨틱.
- **Primary CTA 1개 원칙** — 한 화면에 Primary fill 버튼은 1개 (목록 페이지의 "+ 새 사용자", 폼 페이지의 "저장"). 나머지는 보조 버튼 variant.
- **헤더 유지 원칙 (`global-states.md`)** — Loading/Error/Empty 상태에서도 페이지 제목 + 주요 액션 버튼은 항상 렌더. 본문만 상태별 뷰로 치환. `"Loading…"` 한 줄로 페이지 전체를 대체하지 않음.
- **표 primitive 규약 (`data-display.md`)** — 정형 스키마 CRUD 는 표(정형 스키마) 카테고리. 하드코딩된 `<table>` 형태 생성 금지. Empty 상태는 표의 빈 상태 문구 자리에 위임.
- **한글 IME 필드**: `name` 필드는 한글 입력을 전제로 한다 (placeholder 및 샘플 데이터에 한글 반영 가능).
- **에러 메시지 노출 규칙** — 사용자에게 보여질 문구는 한국어 기본, 스택 트레이스/내부 메시지 원문 노출 금지.

## 비포함 (Out of scope)

아래 항목은 PRD 에 없으므로 Stitch 출력에 **포함하지 말 것**:

- 비밀번호 / 로그인 / 로그아웃 / 인증 / 세션 UI.
- 역할·권한 분리 (role/permission) UI.
- 사용자 상세 조회 전용 페이지 — 목록에서 모든 필수 정보 노출로 충분.
- 페이지네이션 UI — V1 은 전체 리스트 반환 (PRD 비기능 요구사항 명시).
- 검색 / 정렬 / 필터 컨트롤.
- 프로필 사진 / 아바타 / 이미지 업로드.
- 일괄 삭제 / 행 다중 선택 체크박스.
- 수정(PUT) 전용 페이지 — PRD 의 V1 관련 화면 목록에는 목록/생성 2종만 명시됨. (API 는 존재하나 화면은 후속 피처)

## 사용자 수동 투입 가이드

1. Stitch (또는 Figma AI / Galileo 등 대체 툴) 에 이 파일 전체를 시스템 프롬프트로 투입.
2. 페이지별로 Stitch 가 뽑는 HTML/이미지/프레임을 수작업으로 `docs/screens/user-list.md`, `docs/screens/user-form.md` 로 변환.
3. `docs/screens/README.md` 의 "UI 카테고리만 명시, 구현체 언급 금지" 원칙 준수 — Stitch 결과물이 특정 라이브러리 이름(Input/Button/MUI 등) 을 출력하더라도 화면 스펙 변환 과정에서 UI 카테고리 용어로 치환한다.
4. 상태 분기(Loading/Error/Empty) 는 screens 문서에서도 헤더 유지 원칙을 명시할 것.
