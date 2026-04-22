# 백엔드 기술 스택 (`apps/example-api`)

이 문서는 `apps/example-api` 가 사용하는 백엔드 기술 스택을 **결정 기록(decision record)** 형태로 남긴다.
백엔드팀(`backend-developer`) 이 새 코드를 쓰거나 기존 코드를 고칠 때 이 문서의 규약을 따른다.

관련 규약:
- 멀티모듈 경계 / 예제 패턴 → `CLAUDE.md` "파일 편집 소유권" 및 `.claude/agents/backend/`
- Flyway 버전 관리 → `CLAUDE.md` "금지사항"

## 1. 결정 요약 (2026-04-22)

| 영역 | 선택 | 모듈 / 패키지 | 상태 |
|---|---|---|---|
| 언어 / 빌드 | **Kotlin 1.9 + Gradle (Kotlin DSL)** | — | 변경 없음 |
| 프레임워크 | **Spring Boot 3.3** | `spring-boot-starter-*` | 변경 없음 |
| ORM | **Spring Data JPA + Hibernate** | `spring-boot-starter-data-jpa` | 변경 없음 |
| 마이그레이션 | **Flyway** | `flyway-core`, `flyway-mysql` | MySQL 전용으로 전환 |
| **운영 / 개발 DB** | **MySQL 8.4 (LTS)** | `mysql-connector-j` | **2026-04-22 PostgreSQL → MySQL 8.4 LTS 전환** |
| 로컬(인메모리) DB | **H2 (MySQL 모드)** | `com.h2database:h2` | 프로필: `local` |
| API 문서 | **springdoc-openapi** | `springdoc-openapi-starter-webmvc-ui` | 변경 없음 |
| 인증 | **Spring Security + JJWT** | `spring-security`, `jjwt-*` | 변경 없음 |
| 검증 | **Jakarta Bean Validation** | `spring-boot-starter-validation` | 변경 없음 |
| 테스트 | **JUnit 5 + Kotest + Spring MockK + Fixture Monkey** | `kotest-*`, `springmockk`, `fixture-monkey-*` | 변경 없음 |

## 2. 결정 배경 및 사용 규칙

### 2.1 DB: MySQL 8.4 LTS (2026-04-22 전환)

**배경**
템플릿 레포 초기값은 PostgreSQL 이었으나, 실제 사내 표준 RDBMS 가 MySQL 이므로 템플릿의 기본을 MySQL 로 맞춘다. 실 운영 DB 와 동일한 엔진에서 로컬/개발 환경을 돌려 문법/기능 차이로 인한 이슈를 제거한다.

**결정**: MySQL **8.4 LTS** (Long-Term Support 트랙).

**이유**
- 8.0+ 에서 `CHAR(36)` 에 저장한 UUID 인덱스, 내림차순 인덱스(`INDEX ... DESC`), `DEFAULT (UUID())` 등 현재 스키마가 의존하는 기능이 모두 지원.
- **8.4 LTS 를 특정한 이유**: Oracle 의 MySQL 은 2024 년부터 Innovation 트랙(9.x) 과 LTS 트랙(8.4) 으로 분리됨. Innovation 은 기능 실험용 단명 릴리스라 운영에 부적합하고, Flyway/JPA/각종 드라이버의 공식 지원 범위도 보수적이라 innovation 버전(9.x) 에서는 "support has not been tested" 경고가 뜬다. 사내 표준이 MySQL 이라 운영 DBA / 인프라 지원을 그대로 받을 수 있는 것도 LTS 전제.

**금지**
- **MySQL `latest` 태그 / innovation 트랙(9.x) 사용 금지**. 도커 이미지는 반드시 구체적인 LTS 태그(`mysql:8.4.4` 또는 `mysql:8.4.4.x`) 로 고정한다.
- 8.0.x 도 허용되지만 신규 환경은 8.4 LTS 권장 (2032 년까지 LTS 지원).

**전환 범위**
- `libs.versions.toml`: `postgresql` → `mysql-connector-j`, `flyway-postgresql` → `flyway-mysql`, `testcontainers-postgresql` → `testcontainers-mysql`.
- `domain/build.gradle.kts`: 런타임/Flyway 의존성 교체.
- `application.yml`: `dev` / `prod` 프로필의 `datasource.url` / `driver-class-name` / 기본값을 MySQL 로 교체. `local` 프로필은 H2 인메모리 유지 (단 `MODE=PostgreSQL` → `MODE=MySQL` 로).
- Flyway 마이그레이션 `V1__init.sql` / `V2__todo.sql` / `V3__memo.sql` 을 MySQL 문법으로 **재작성**. 운영 이력이 없는 템플릿 단계이므로 히스토리 리셋이 가능. 이후 시점부터는 V1~V3 를 **수정 금지 대상**으로 고정.

**타입 매핑 규약**
PostgreSQL 로 작성된 기존 스키마를 MySQL 로 옮길 때 이 매핑을 기본으로 따른다.

| PostgreSQL | MySQL 8.x | 비고 |
|---|---|---|
| `BIGSERIAL PRIMARY KEY` | `BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY` | |
| `UUID` | `CHAR(36)` | 애플리케이션이 `java.util.UUID` 를 문자열로 바인딩. `BINARY(16)` 은 가독성/디버깅 비용이 커서 기본 아님. |
| `TIMESTAMP` (타임존 없음) | `DATETIME(6)` | MySQL `TIMESTAMP` 는 2038 한계와 자동 업데이트 사이드이펙트가 있어 피한다. `(6)` 은 마이크로초 정밀도. |
| `BOOLEAN` | `BOOLEAN` | 내부적으로 `TINYINT(1)`. 그대로 사용. |
| `VARCHAR(n)` | `VARCHAR(n)` | 동일. |
| `DATE` | `DATE` | 동일. |
| `CREATE INDEX ... (col DESC)` | `CREATE INDEX ... (col DESC)` | MySQL 8.0+ 에서 실제 내림차순 인덱스로 동작. |

**테이블 옵션 규약**
- 모든 테이블은 `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci` 를 명시한다. (한글/이모지 안전, 사내 표준)
- 예약어와의 충돌을 피하기 위해 백틱(`\``) 은 **충돌하는 식별자에만** 사용. 일반 식별자에는 사용하지 않음 (가독성).

**금지**
- MySQL 고유 기능 중 **스토리지 엔진 의존 기능**(MyISAM 전제, `MATCH ... AGAINST` 등) 도입 금지. 표준 SQL 로 표현 가능한 방식을 우선.
- 방언 혼재 금지 — PostgreSQL 전용 구문(`::`, `BIGSERIAL`, `RETURNING` 등) 재등장 금지.
- Flyway `V1__init.sql` 은 이 커밋 이후 **수정 금지**. 스키마 변경은 `V<N+1>__<name>.sql` 로 추가.

### 2.2 프로필 전략

| 프로필 | 용도 | DB |
|---|---|---|
| `local` | 단위 테스트 / 로컬 빠른 기동 | H2 (MySQL 모드, 인메모리) |
| `dev` | 로컬 통합 / 개발 서버 | MySQL (도커 컨테이너 또는 개발 서버) |
| `prod` | 운영 | MySQL (환경변수로 주입) |

- `local` 은 Flyway `enabled: false` + `ddl-auto: create-drop` 으로 JPA 가 스키마 생성.
- `dev` / `prod` 는 Flyway `enabled: true` + `ddl-auto: validate`.
- DB 접속 정보는 **환경변수**로만. 예: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`. 코드/설정 파일에 실제 시크릿 하드코딩 금지.
- **DB 이름 규약**: 이 템플릿의 기본 DB 이름은 `polyglot_example`. 여러 프로젝트가 같은 MySQL 인스턴스를 공유할 때 충돌을 피하기 위해 레포 + 앱 이름 기반의 구체적인 이름을 사용한다. `app` 같은 제네릭 이름은 금지. `application.yml` 의 `${DB_NAME:polyglot_example}` 기본값과 `.env.example` 의 `DB_NAME=polyglot_example` 이 이 규약을 반영한다.

### 2.3 개발 환경 준비 (도커)

로컬에서 `dev` 프로필로 돌릴 때 MySQL 도커 컨테이너 예시:

```bash
docker run -d --name mysql-local \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=... \
  -e MYSQL_DATABASE=polyglot_example \
  mysql:8.4
```

이미 돌고 있는 컨테이너에 DB 만 새로 만들고 싶다면:

```bash
docker exec -it <container> mysql -uroot -p -e \
  "CREATE DATABASE IF NOT EXISTS polyglot_example CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
```

- 포트/자격증명은 개발자별로 다르며 **이 문서에 기록하지 않는다**. 팀 위키나 개인 메모로.
- `docker-compose` 는 이 레포에 포함하지 않는다 (사내 표준 배포 파이프라인과 별개라 불필요).

### 2.4 개발 기동 가이드

도커 컨테이너가 돌고 있고 `polyglot_example` DB 가 생성된 상태에서, 레포 루트의 `.env.example` 을 `.env` 로 복사해 로컬 값(특히 `DB_PASSWORD`) 만 채우면:

```bash
pnpm nx run example-api:serve
```

명령 한 줄로 끝난다.

**환경변수 로드 메커니즘 (실측 확인)**
- **Nx** 가 태스크 실행 시 레포 루트의 `.env` 를 자동 로드해서 프로세스 환경변수에 주입한다.
- `pnpm nx run example-api:serve` → `./gradlew :app:bootRun` 을 spawn 하면서 상속, Gradle `JavaExec` 의 기본 동작상 자식 JVM 이 `System.getenv()` 를 그대로 받는다.
- 따라서 `.env` 에 있는 `SPRING_PROFILES_ACTIVE`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `API_PORT` 는 별도 쉘 `export` 없이 Spring Boot 까지 도달한다.
- 커맨드라인에서 `DB_PASSWORD=xxx pnpm nx run example-api:serve` 처럼 붙이면 해당 변수만 `.env` 값을 **override** 한다 (상위 우선).

**흔한 함정: `.env` 가 template 시절 값으로 남아 있을 때**
- `.env.example` 이 갱신되더라도 이미 만든 `.env` 는 자동으로 바뀌지 않는다. PostgreSQL 시절 값(예: `DB_PORT=5432`, `DB_NAME=app`) 이 남아 있으면 MySQL 기동이 `Communications link failure` 로 떨어진다.
- 기동 전에 `.env` 의 `DB_*` 가 `.env.example` 과 일치하는지 한 번 확인한다.

## 3. 금지 사항

- PostgreSQL 의존성(`org.postgresql:postgresql`, `flyway-database-postgresql`) 재도입 금지.
- MyBatis / Exposed 등 추가 ORM 병행 도입 금지 — JPA 유지.
- Flyway 외의 마이그레이션 도구(Liquibase 등) 도입 금지.
- H2 를 `local` 이외 프로필에서 사용 금지.
- `application.yml` 에 실제 DB 자격증명 기본값 하드코딩 금지 — 환경변수 + 빈 기본값 또는 개발용 더미.

## 4. 변경 절차

- 이 문서(`docs/tech-stack/backend.md`) 편집 권한은 **메인(프로젝트 전체 팀장)** 에 있다.
- DB 엔진 / ORM / 마이그레이션 도구 교체는 사용자와 합의 후 **먼저 이 문서에 반영**하고 그다음 코드 변경. 순서 역전 금지.
- 라이브러리 마이너/패치 업그레이드는 이 문서 편집 없이 진행 가능. 메이저 업그레이드는 영향 검토 후 기록.
