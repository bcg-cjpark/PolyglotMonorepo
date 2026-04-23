# 화면 시안 프로세스 가이드

**역할**: 파이프라인 [2b] "시안 프로세스" 경로의 작성·검토·승격 규약.
**소비자**:
- `screen-concepter` 에이전트 (시안 카탈로그 생성)
- 메인 (시안 선택 결과를 `docs/screens/<page>.md` 로 승격)
- 사용자 (시안 선택 의사결정)

---

## 1. 목적

외부 UX 툴(Stitch / Figma AI / Galileo 등) 없이 팀 내부에서 PRD 기반으로 화면 시안을 빠르게 2~4개 뽑아 비교·선택한다. **`@monorepo/ui` primitive 제약이 강제**되므로 선택된 시안이 곧바로 구현 가능한 상태로 떨어진다.

- Stitch 경로와 동등한 `docs/screens/<page>.md` 를 산출하되, 중간 단계가 "시안 카탈로그 → 사용자 선택" 으로 대체됨.
- 외부 시각 툴에서 나온 디자인이 `libs/ui` 와 어긋나 재작업되는 낭비를 방지.

---

## 2. 언제 [2b] 를 고르나

- 외부 Stitch/Figma AI 접근 어려움
- 여러 레이아웃 대안을 **명시적으로** 비교하고 싶음
- 팀 내부 `libs/ui` primitive 제약을 강제하고 싶음
- 기존 화면정의서의 대안 레이아웃을 빠르게 스케치하고 싶음

**[2a] Stitch 경로가 더 나은 경우**:
- 픽셀 정밀 비주얼/모션 검토가 필요 (이미지/프로토타입 수준)
- 외부 이해관계자(클라이언트/PM) 가 시각 데모를 원함
- 마케팅성 페이지 / 랜딩 (앱 내부 UI 가 아닌 것)

---

## 3. 시안 카탈로그 포맷

파일 경로: `docs/design-notes/<feature>-variants.md`
소유: 디자인팀 (커밋은 `design-lead`).

```markdown
# 화면 시안 카탈로그: <feature>

**원본 PRD**: ../prd/<feature>.md
**원본 Brief**: ../stitch-brief/<feature>.md
**작성일**: YYYY-MM-DD
**상태**: 선택 대기 | 선택 완료

## 공통 제약
- @monorepo/ui primitive + libs/tokens CSS 변수만
- 디자인 노트 global-palette / global-states / data-display 준수
- Light/Dark 자동 대응

## <Page 이름>

### Variant A — "<한 단어 컨셉>"
**의도**: <1~2문장>
**와이어프레임**: ASCII 고정폭
**컴포넌트 매핑**: 역할 / primitive / 기존·신규 / 비고
**상태 대응**: Loading / Error / Empty
**위험/전제**: (있다면)

### Variant B — "..."
### (선택) Variant C — "..."

## 선택 가이드
| 시안 | 강점 | 약점 | 신규 primitive |

## 승격 절차 (메인용)
```

세부 규약은 `.claude/agents/frontend/design/screen-concepter.md` 의 출력 스펙 참조.

---

## 4. 시안 수 가이드

- **2개 (최소)**: 단순 폼, 단일 리스트
- **3개 (권장)**: 대부분의 페이지
- **4개 (최대)**: 대시보드·구성 선택지가 넓은 페이지
- **5개 이상 금지**: 선택 피로 증가

페이지가 여러 개면 전체 시안 개수는 자연스럽게 커짐 (예: 2 페이지 × 3 variant = 6 시안). 한 페이지만 있는 기능도 **최소 2개** 시안을 제공 — "하나뿐" 상황은 Stitch 경로가 맞음.

---

## 5. 선택 방법

사용자가 각 페이지마다 Variant 를 지정:
- 예: "UserList → B, UserForm → A"
- 페이지마다 다른 시안 작성자(에이전트) 가 만든 것은 아니지만, Variant 선택은 페이지별 독립.

선택 시 고려 사항:
1. **PRD V1 범위 준수** — "위험/전제" 에 라벨 붙은 시안은 PRD 개정이 선행돼야 함.
2. **신규 primitive 비용** — "신규 (UI팀 요청)" 로 마킹된 primitive 가 여럿이면 구현 기간이 늘어남. 기존 primitive 조합으로 유사 의도를 달성한 시안을 우선.
3. **디자인 노트 정합** — 선택된 시안이 `global-states.md` 헤더 유지 원칙 / `data-display.md` Table vs List 선택 매트릭스와 일관해야 함.

---

## 6. 승격 (variants.md → screens/*.md)

**주체**: 메인 (프로젝트 전체 팀장) 이 수동 대행. 이유 — Stitch 경로의 "사용자 수동 투입" 에 대응하는 역할을 메인이 받음.

**절차**:
1. 사용자가 페이지별 Variant 지명 받기.
2. 선택된 Variant 의 "의도 / 와이어프레임 / 컴포넌트 매핑 / 상태 대응" 을 기반으로 `docs/screens/<page>.md` 작성.
3. 포맷은 `docs/screens/README.md` "필수 섹션" 100% 준수:
   - `## 기본 정보` (Route / 파일 위치 / 관련 PRD)
   - `## 목적`
   - `## 레이아웃`
   - `## 컴포넌트` (UI 카테고리 표 — 구현체 이름 금지 유지)
   - `## 인터랙션`
   - `## 데이터 바인딩`
   - `## 상태 (State)`
4. `variants.md` 의 "상태" 필드를 `선택 완료: <page>: Variant <X>` 로 갱신 (design-lead 후속 커밋).
5. screens 파일 커밋은 메인이 직접 (`chore(screens): <feature> 화면정의서 승격`).

**승격 시 주의**:
- **variants.md 의 "primitive 이름"(Table, Modal 등 `@monorepo/ui` export) 은 허용** 되지만 `docs/screens/**` 로 승격할 때는 `docs/screens/README.md` 원칙에 따라 **UI 카테고리 용어로 환원** 해야 함. 예: "Table" → "표 (정형 스키마)", "Modal" → "오버레이 컨테이너 (모달 유형)".
- 사용자가 선택하지 않은 다른 Variant 는 **variants.md 에 보존** (재검토 여지).
- screens 의 "인터랙션" 섹션은 Playwright e2e 시나리오가 되므로 번호 매긴 스텝으로 세분화.

---

## 7. primitive 부재 처리

`screen-concepter` 가 생성한 시안에 `@monorepo/ui` 에 없는 primitive 가 쓰였다면 "신규 (UI팀 요청)" 로 마킹됨. 선택된 시안이 이 플래그를 가지면:

1. 메인이 `docs/screens/<page>.md` 를 먼저 승격 (UI 카테고리 용어로 환원된 상태).
2. [4] 단계 UI팀 라인 (`ui-composer → curator → tester → ui-lead`) 가 신규 primitive 먼저 구현.
3. 그 다음 [5] 프론트 라인이 해당 primitive 를 사용해 페이지 구현.

---

## 8. 변경 이력에서 제외할 것

- 사용자가 선택하지 않은 시안의 삭제 (보존이 원칙)
- variants.md 의 상태 필드 갱신 (단순 상태 전이, 의사결정 변경 아님)

승격·선택의 의사결정이 바뀌면 **새 variants 파일** 을 만들지 말고 기존 파일에 Variant 추가 + 선택 기록 갱신.

---

## 9. Out of Scope

- 비주얼 정밀 프로토타입 (Stitch 경로의 영역)
- 외부 디자인 시스템 레퍼런스 수집 (`design-trend-scout` 의 영역)
- 토큰 변경 의사결정 (디자인팀 의도 + UI팀 실행)
- 구현체 수정 감사 (`design-consistency-auditor`)
