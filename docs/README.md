# docs/ — 프로젝트 명세 문서

이 디렉토리는 **AI 에이전트가 읽을 입력**입니다.  
기획서/화면정의서를 여기에 배치하면, 에이전트 체인(분석 → 개발 → 검증 → 테스트)이 이를 근거로 프로젝트를 구축합니다.

## 구조

```
docs/
├── prd/              # 기획서 (Product Requirements Documents)
│   ├── README.md     # 포맷 가이드 (에이전트가 파싱할 섹션 규약)
│   └── *.md          # 기능별 PRD
└── screens/          # 화면정의서 (Screen Specifications)
    ├── README.md     # 포맷 가이드
    └── *.md          # 화면별 명세
```

## 작성 원칙 (AI 파싱 친화)

1. **마크다운**만 사용. Word/Figma 같은 바이너리 불가.
2. **고정된 섹션 제목**을 사용. `README.md`에 정의된 헤딩을 유지해야 에이전트가 섹션을 신뢰성 있게 추출.
3. **표/리스트**를 적극 사용. 자유서술은 의도 모호화.
4. 모든 도메인 엔티티는 `prd/` 에 정의하고, 화면에서 참조.
5. 1 기능 = 1 `prd/*.md`, 1 화면 = 1 `screens/*.md` 로 분리.

## 워크플로 (미래 목표)

```
사용자: docs/prd/billing.md 추가 + docs/screens/billing-* 추가
 → PRD-analyzer 에이전트: 엔티티/엔드포인트/화면 추출
 → developer 에이전트: 추출물 기반 백/프론트 코드 생성 (libs/ui + 제너레이터 활용)
 → spec-verifier 에이전트: 구현이 문서와 일치하는지 검증
 → test-runner 에이전트: Playwright e2e + 백엔드 테스트
```

현재는 UI 라이브러리/제너레이터/verifier 단계까지 세팅 완료.
분석/개발/검증/테스트 에이전트 체인은 추후 추가 예정.

## 예시

`prd/user-management.md` 와 `screens/user-list.md`, `screens/user-form.md` 는 **이 레포의 `example-api` + `example-web` 이 실제로 구현하고 있는 기능**의 문서.  
포맷 참고용. 실제 프로젝트에서 `example-*` 앱은 삭제하고 새 기능 문서로 대체.
