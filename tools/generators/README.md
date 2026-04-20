# @monorepo/generators

Nx 커스텀 제너레이터로 `example-api` / `example-web` 을 템플릿 삼아 새 앱을 scaffold 합니다.

## 사용법

```bash
# Kotlin 멀티모듈 API 앱 생성
nx g @monorepo/generators:api-app billing-api --packageName=com.example.billing

# React 웹 앱 생성
nx g @monorepo/generators:web-app admin-web
```

## 동작

1. `apps/example-api` (또는 `example-web`)의 파일 트리를 복사
2. 파일 내용의 토큰(`com.example.template`, `example-api` 등)을 입력값으로 치환
3. 디렉토리 경로의 Java 패키지 경로(`com/example/template`)도 치환
4. Nx `project.json`을 새 앱 디렉토리에 등록

## 추후 개선 아이디어

- `files/` 디렉토리 + `@nx/devkit`의 `generateFiles()` + EJS 템플릿으로 전환 — 더 정교한 치환 가능
- 모듈 단위 제너레이터 (`api-module`) 추가 — 기존 앱에 새 Kotlin 모듈 삽입
- 페이지/컴포넌트 제너레이터 (`web-page`) 추가
