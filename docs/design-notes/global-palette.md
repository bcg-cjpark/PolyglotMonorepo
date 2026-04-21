# Design Notes: Global Palette (템플릿 기본 팔레트)

**역할**: 이 레포(PolyglotMonorepo 템플릿)의 **기본 색상 시스템 의도 문서**.
**작성일**: 2026-04-21
**소비자**:
- `/bootstrap` 스킬의 색상 기본값 (사용자 미입력 시 여기 HEX 가 `scripts/apply-theme-colors.mjs` 로 전달됨)
- UI팀 / 디자인팀 후속 작업 기준 (11단계 scale 사용 규칙, 네이밍 정책)

---

## 템플릿 기본 팔레트 (BOOTSTRAP_DEFAULTS)

| 역할      | HEX       | HSL (근사)       | 선택 근거 (한 줄) |
|-----------|-----------|-------------------|---|
| Primary   | `#4f46e5` | `hsl(244, 76%, 58%)` | 채도 중상 인디고. SaaS/개발자 도구 템플릿에서 가장 범용적(Linear/Stripe/Vercel 계열), 특정 산업 편향 없음. |
| Secondary | `#f59e0b` | `hsl(38, 92%, 50%)`  | Warm amber. Primary indigo 의 보완축(270° 대비), CTA 보조·강조에 안정적. |

> **`/bootstrap` 스킬 동작**: 사용자가 `--primary` / `--secondary` 를 미입력하면 위 HEX 를 그대로
> `node scripts/apply-theme-colors.mjs --primary=#4f46e5 --secondary=#f59e0b` 에 전달한다.
> 사용자가 값을 입력하면 그 값이 우선.

### 왜 기존 `#ffc300` (노란색) 에서 변경했나

- `#ffc300` 은 금융/에너지/건설 업종 느낌이 강함 → 범용 템플릿 기본값으로 부적절.
- HSL 의 L=50, S=100 이라 `apply-theme-colors.mjs` 의 050~deep 스케일이 탁한 pastel 로 퍼지는 경향.
- Indigo 600 은 Tailwind/shadcn 생태계에서 가장 많이 검증된 "기본 브랜드 색" — 사용자가 그대로 둬도 완성도 있는 UI.

### 왜 Secondary 를 추가했나

- 기존 템플릿은 Secondary 미지정 → 버튼·칩의 "보조 accent" 구간이 Neutral/Blue 로 대체되고 있었음.
- Primary 단색만으로는 강조·보조·경고의 3단 위계를 표현하기 어려움.
- Amber 는 Red(에러) / Green(성공) / Blue(정보) 와 겹치지 않는 유일한 warm 슬롯.

---

## 프로덕트 톤 (의도)

**"중립적이고 기술 지향적, 현대적 SaaS 시작점."** 특정 산업(금융/헬스케어/커머스)에 치우치지 않도록
채도는 중간, 밝기는 중간-밝은 쪽으로 배치. Primary 는 신뢰·집중을 주는 차가운 인디고,
Secondary 는 액션 환기용 따뜻한 amber. 템플릿 사용자가 자기 브랜드 색으로 교체하기 전
기본 상태에서도 "빈 template 같지 않은" 완성도를 유지하는 것이 목표.

---

## 레퍼런스 (템플릿 기준색 선정에 참고한 사례)

| # | 이름 | URL | 차용 포인트 |
|---|---|---|---|
| 1 | Linear Brand & Product | https://linear.app | 채도 중상 인디고 Primary, 고대비 Neutral 스케일, 미니멀 surface |
| 2 | Vercel Dashboard | https://vercel.com | 큰 Neutral 계조 위에 Primary 포인트만 쓰는 규율, dark-first 대응 |
| 3 | Stripe Dashboard | https://stripe.com | indigo + warm accent 2축으로 action 위계 표현 |
| 4 | Tailwind CSS color palette | https://tailwindcss.com/docs/colors | indigo-600 / amber-500 이 "기본" 으로 선택된 생태계 관례 |
| 5 | shadcn/ui default theme | https://ui.shadcn.com/themes | Tailwind 변수 체계 위에 semantic 토큰(`--color-primary`, `--color-foreground`) 매핑 |

---

## 팔레트 의도

- **Primary (`#4f46e5` indigo)**: 기본 CTA, 활성 상태, 선택/포커스 링. "신뢰·집중". 페이지당 등장 횟수를 의도적으로 제한.
- **Secondary (`#f59e0b` amber)**: Primary 보조 CTA, 강조 배지, 프로모·알림 pill. "환기·주목". Primary 와 같은 화면에 나와도 충돌하지 않는 색상환 위치.
- **Neutral** (고정, 재생성 대상 아님): 배경/테두리/muted 텍스트 위계. 11단계 (`000 ~ 800` + `050/150/250/550/750`) 로 surface 밀도 표현.
- **Red** (고정): 파괴(delete)/에러/유효성 경고 전용. Primary 로 대체 금지.
- **Green** (고정): 성공/긍정/상승(가격). "저장됨" 토스트 등.
- **Blue** (고정): 정보 링크, 보조 액션, "자세히 보기" 계열. Primary 가 indigo 라 Blue 와 혼동 주의 → Blue 는 항상 `blue500+` 진한 쪽으로만 사용.
- **Purple** (고정): 특수 지시 / 프리미엄 배지 / AI 기능 마크. 일반 CTA 에 사용 금지.

---

## Alert Semantic Tokens

Modal / Toast / Alert 계열에서 쓰는 상태 표시 색상. 배경(`--alert-<v>-bg`, 기존 SCSS 하드참조 → 토큰화 대상)과
아이콘(`--alert-<v>-icon-color`, **신규 필수**) 을 별도 semantic 토큰으로 관리해
컴포넌트가 양 테마에서 일관된 시맨틱을 갖도록 한다.

**배경**: 소프트 tint (`050` / `100` 계열) — 본문 맥락을 덮지 않는 "살짝 물든" surface.
**아이콘**: 그 위에 올라가는 **고대비 anchor** (`800` / `900` / `-deep`) — AA 통과가 목적.

### Variant → 토큰 매핑 (권장)

| Variant | 배경 Light | 배경 Dark | 아이콘 Light | 아이콘 Dark | 시맨틱 근거 |
|---|---|---|---|---|---|
| success | `--base-colors-green-green050` (기존) | `--base-colors-green-green100` | `--base-colors-green-green800` | `--base-colors-green-green700` | 녹색 = 완료·저장·긍정. Light anchor(800, #00a22f) 가 050 위에서 명확, Dark 에서 800 은 #08b63a 로 밝아 dark-tint 위 대비 확보. |
| info    | `--base-colors-blue-blue050` (기존) | `--base-colors-blue-blue100` | `--base-colors-blue-blue800-deep` | `--base-colors-blue-blue800-deep` | Blue 는 "정보·링크" 전용 슬롯. Primary(indigo) 와 혼동 방지 위해 `blue800-deep` 고정 — Light(#0067ef)·Dark(#318aff) 모두 순수 blue anchor. |
| warning | `--base-colors-secondary-secondary100` | `--base-colors-secondary-secondary100` | `--base-colors-secondary-secondary-deep` | `--base-colors-secondary-secondary-deep` | **(A) 이관 결정** — 현재 primary050(indigo) 은 "주의·경계" 시맨틱과 정반대. Secondary(amber) 로 이관해야 사용자가 "warning" 을 즉시 인지. Light 에서 secondary-deep(#ac6f07) = 진한 amber, Dark 에서 secondary-deep(#f8bb54) = 밝은 amber 로 자동 반전됨. |
| error   | `--base-colors-red-red050` (기존) | `--base-colors-red-red100` | `--base-colors-red-red900` | `--base-colors-red-red900` | Red 900 은 양 테마 모두 "파괴·에러" 의 가장 진한 톤. Light(#ed2d32)·Dark(#ff464a) 둘 다 각 테마 tint 배경에서 AA 통과. |

> **배경 Dark 단계 조정 근거**: 다크 테마에서 각 color `050` 은 실제 값이 `100` 과 동일하게 재정의돼 있음(예: `green050=green100=#122317`). 명확한 단계 표기를 위해 Dark 에서는 `100` 으로 통일 표기. 값은 동일해도 semantic 의도가 더 선명.

### UI팀 실행 요청 (token keys 추가)

`__tokens-light.css` / `__tokens-dark.css` 양쪽에 다음 4개 semantic 토큰 신규 추가:

```css
/* light */
--alert-success-icon-color: var(--base-colors-green-green800);
--alert-info-icon-color: var(--base-colors-blue-blue800-deep);
--alert-warning-icon-color: var(--base-colors-secondary-secondary-deep);
--alert-error-icon-color: var(--base-colors-red-red900);

/* dark */
--alert-success-icon-color: var(--base-colors-green-green700);
--alert-info-icon-color: var(--base-colors-blue-blue800-deep);
--alert-warning-icon-color: var(--base-colors-secondary-secondary-deep);
--alert-error-icon-color: var(--base-colors-red-red900);
```

(선택·병행) **`ModalContent.scss` 의 warning 배경 재매핑** — 현재 하드참조 `--base-colors-primary-primary050` 을 `--base-colors-secondary-secondary100` 으로 교체. 같은 커밋에서 처리 권장 (아이콘만 바꾸고 배경은 indigo 로 두면 "파란 배경에 amber 아이콘" 같은 조합 불일치 발생).

또한 `.alert-icon-container.alert-*` 의 `color:` 도 위 신규 토큰으로 통일하면 `<Icon color=...>` prop 없이 SCSS 단에서 일관 처리 가능 — 이건 ui-composer 재량.

### WCAG 대비 개산 (icon vs bg)

- success Light: `#00a22f` on `#f1f9f3` → 약 3.8:1 (AA Large ok, 본문 4.5 미달 가능 — 아이콘만 쓰므로 AA Non-text 3:1 기준 통과).
- success Dark: `#08b63a` on `#122317` → 약 7:1 이상, 충분.
- info Light: `#0067ef` on `#e8f0fa` → 약 6:1, AA 통과.
- info Dark: `#318aff` on `#121c28` → 약 6.5:1, 통과.
- warning Light: `#ac6f07` on `#fcefd9`(secondary100) → 약 4.8:1, AA 통과.
- warning Dark: `#f8bb54` on `#38290f`(secondary100 Dark) → 약 7:1, 충분.
- error Light: `#ed2d32` on `#fff1f2` → 약 4.5:1, AA 경계 통과.
- error Dark: `#ff464a` on `#281616` → 약 6:1, 통과.

(정확한 수치 계산은 후속 ui-library-tester 가 `color-contrast()` 또는 `axe` 로 자동 검증. 여기선 육안·근사 HSL 기반 추정.)

### Warning semantic 결정: (A) 채택

**결론**: `alert-warning` 배경을 `primary050` → `secondary100` 으로 **완전 이관**. 아이콘은 `secondary-deep`.

**근거**:
1. Primary(indigo) 는 "신뢰·집중·기본 CTA" — 사용자를 **멈춰 세우는 경고** 시맨틱과 정면 충돌.
2. Secondary(amber) 는 이미 팔레트 의도에 "환기·주목·프로모·알림" 으로 정의돼 있어 warning 과 완전 일치.
3. `tailwind-bridge.css` 에 secondary scale alias 가 아직 없지만 base token 값은 존재(`--base-colors-secondary-secondary100/-deep`) → 직접 참조 가능, 브릿지 추가는 후속 감사(네이밍 교정 제안 3번) 에서 일괄 처리.

**반대 의견 검토 (B: 배경 primary 유지, 아이콘만 amber)**: 이 조합은 "색 혼합 경고" 를 만들어 오히려 혼란. A 의 일관성이 우월.
**반대 의견 검토 (C: warning variant 제거)**: Modal/Toast UX 에서 warning 은 흔한 4단(success/info/warning/error) 중 하나라 제거 비현실적.

---

## 11단계 Scale 사용 가이드 (`050 → 900 + deep`)

`apply-theme-colors.mjs` 는 입력 HEX 를 `800` 에 고정하고 HSL 로 나머지 10단계를 생성한다.
`800` = 브랜드 앵커, `900` = 살짝 더 어두운 hover/pressed, `deep` = 가장 높은 대비용.

| 단계 | Light 의도 (L≈)   | Dark 의도 (L≈)   | 대표 용례 |
|-----|--------------------|--------------------|---|
| 050 | ~96 (거의 흰색)     | ~12 (거의 검정)     | subtle hover bg, 선택된 행 bg, tag bg |
| 100 | ~92                 | ~14                 | card bg, section surface, disabled bg |
| 200 | ~85                 | ~20                 | divider·soft border, chip bg |
| 300 | ~78                 | ~28                 | border default, progress track |
| 400 | ~70                 | ~36                 | secondary icon, tertiary text |
| 500 | ~62 (중간)          | ~44 (중간)          | 중성 surface (tailwind-bridge 의 `--color-primary` alias 기본) |
| 600 | ~54                 | ~52                 | 보조 액션 fill, chart accent |
| 700 | ~anchor-5           | ~anchor-8           | hover 전 기본 icon·text on light bg |
| **800** | **입력 HEX 그대로** | **입력 HEX 그대로** | **primary CTA fill, focus ring** |
| 900 | 800보다 약간 어둠    | 800보다 약간 어둠    | CTA hover/pressed |
| deep | 가장 진함 (anchor-15) | 가장 밝음 (anchor+15) | 링크 텍스트, 강조 헤딩, 대비가 필요한 on-light-bg 텍스트 |

### 사용 규칙

1. **Fill (배경)** 에는 `800` 사용, hover 는 `900`.
2. **Text on colored fill** 은 `--font-color-white` (or 후술 `--font-color-inverse`) 사용 — scale 에서 직접 뽑지 말 것.
3. **Text on neutral bg** 에서 brand 색 텍스트가 필요하면 `deep` 사용 (WCAG AA 통과 목적).
4. **Soft surface** (hover·selected bg) 에는 `050`/`100` 만 사용 — `200+` 은 UI 밀도가 과해짐.
5. **500** 을 `--color-primary` alias 기본으로 쓰고 있는 것(`tailwind-bridge.css:18`)은 의도적: 채도 중간 지점이 다크/라이트 어느 쪽에서도 무너지지 않음.

---

## Light/Dark 대응 원칙

- 모든 시맨틱 토큰(`--button-*`, `--input-*`, `--font-color-*`, `--background-*`) 은 **양쪽 테마 모두 정의**.
- Light 와 Dark 에서 **semantic 역할이 동일해야 함**. 예: `--font-color-default` 는 양쪽 모두 "본문 읽기 좋은 텍스트 색". 참조하는 scale 단계만 달라짐 (light → neutral800, dark → neutral000 근처).
- Dark 배경 위 primary 의 **가독성 보정**: dark 테마에서는 `800` 을 그대로 두되 text 는 `neutral000`/`white` 고정. primary-on-dark 필요 시 `deep` (더 밝은 쪽) 참조.
- **`color-mix()` / `color(from ...)` 권장**, 하드코딩 `rgba(#000, 0.5)` 지양 — 다크 모드에서 대비가 깨짐.
- 새 semantic 토큰을 `__tokens-light.css` 에 추가했다면 **반드시 `__tokens-dark.css` 에도 대응 항목 추가**. ui-library-tester 가 양쪽 diff 검사 예정.

---

## 네이밍 교정 제안 (후속 UI팀 커밋용)

ui-library-tester 가 플래그한 이슈 및 현 토큰 스캔 결과 기반. **실행은 UI팀 후속 커밋**, 여기서는 의도만 기록.

### 1. `--font-color-white` 리네임 (우선순위: 높음)

**현상** (`__tokens-dark.css:200`):

```css
--font-color-white: var(--base-colors-neutral-neutral700);  /* 회색! */
```

라이트 테마에서는 `neutral000` (#ffffff) 로 실제 흰색이지만, 다크 테마에서는 `neutral700` (회색) 으로 해석.
이름 그대로라면 하얀색이어야 하는데 실제 의미는 **"컬러 surface (primary/red/blue fill) 위에 올라가는 텍스트 색"**.
즉 semantic 역할은 "inverse" 또는 "on-colored".

**제안**:
- 신규 이름: `--font-color-on-solid` (추천) 또는 `--font-color-inverse`
- 마이그레이션: 기존 `--font-color-white` 는 deprecated alias 로 한 릴리스 유지 후 제거.
- 영향 범위: `button-red-solid-text`, `button-trade-red-text`, `button-trade-blue-text` 등 7개 컴포넌트 토큰.

### 2. `--font-color-default` vs `--font-color-default-muted` 구분 기준 문서화 (우선순위: 중)

**현상**: 둘 다 쓰이지만 사용처 가이드 없음.

**제안** (`libs/ui/README.md` 또는 `libs/tokens/README.md` 에 기록):

| 토큰 | 역할 | 대표 용례 |
|---|---|---|
| `--font-color-default` | 본문 primary text. 가장 읽기 좋은 기본 색. | 문단, 리스트 아이템, 라벨 |
| `--font-color-default-muted` | 보조 text. 대비 약간 낮춤. | placeholder, caption, helper text, disabled label |
| `--font-color-default-muted-dark` | muted 중 더 진한 쪽. | hover 시 회색 → 덜 회색 전환 |
| `--font-color-default-muted-light` | muted 중 더 연한 쪽. | timestamp, 부가 메타 |

### 3. 컴포넌트 도메인 토큰 Tailwind 브릿지 감사 (우선순위: 중)

**현상**: `--button-*`, `--input-*`, `--popup-*` 등 컴포넌트 도메인 토큰이 `__tokens-light.css` 에 60+ 개 정의되어 있으나,
`tailwind-bridge.css:12` 의 `@theme inline` 에 노출된 것은 `--input-*` 10개 뿐. `button-*` 는 하나도 노출 안 됨.

**결과**: Button primitive 는 SCSS 에서 직접 `var(--button-*)` 참조 → Tailwind `@apply` 로 쓸 수 없음 → 새 합성 컴포넌트에서 재사용 시 SCSS 새로 만들어야 함.

**제안**: ui-composer 에게 **"`tailwind-bridge.css` 미노출 컴포넌트 토큰 목록 주기 감사"** 작업 요청. 새 primitive 추가 시 `--color-<domain>-<variant>` alias 를 함께 추가하는 체크리스트 정의.

### 4. `--base-colors-common-*` 의 의도 불명 (우선순위: 낮음)

`--base-colors-common-bg-surface-dark`, `--base-colors-common-light-gray-ca` 등 하드코딩된 gray 값이 별도 네임스페이스에 존재. neutral scale 과의 관계 불명.

**제안**: 디자인팀 후속 세션에서 "neutral scale 로 흡수 가능한 것" / "레거시 보존 필요" 구분 후 UI팀에 마이그레이션 요청.

---

## 구현 제약 (UI팀 / 프론트 개발팀 전달)

- **하드코딩 `#hex` 금지** — SCSS/TSX 어디서도 brand 색 리터럴 금지. Tailwind `@apply` 로 `bg-primary-primary800` / `text-on-solid` 같은 토큰 유틸만 사용.
- **Light/Dark 양쪽 대응 필수** — 단일 테마에서만 렌더 확인 후 커밋 금지. 최소한 Storybook `data-theme` 토글로 양쪽 시각 확인.
- **`libs/tokens/styles/__tokens-*.css` 직접 편집 금지** — `/* Do not edit directly */` 헤더. Primary/Secondary 변경은 반드시 `scripts/apply-theme-colors.mjs` 경유.
- **새 semantic 토큰 추가 시 동시 업데이트** — `__tokens-light.css` + `__tokens-dark.css` + `tailwind-bridge.css` (필요 시 `--color-*` alias 추가). 3 파일 중 하나라도 누락되면 ui-library-tester FAIL.
- **Scale 단계 점프 금지** — `300 → 700` 같은 큰 점프는 대비 붕괴 위험. 인접 단계(`300 → 400`)로 전환.
- **Primary 과다 사용 금지** — 한 화면에 Primary fill CTA 는 1개 원칙. 2개 이상 필요하면 Secondary 로 위계 분리.

---

## Out of Scope

- Neutral / Red / Green / Blue / Purple scale **재생성** — 이번 노트 범위 아님. 기존 고정 값 유지.
- 폰트 시스템 — 별도 `docs/design-notes/global-typography.md` 예정 (font-family 폴백, 스케일, 한글 대응).
- 모션 시스템 — 별도 `docs/design-notes/global-motion.md` 예정 (duration, easing, stagger).
- 레이아웃 그리드 / 간격 리듬 — 별도 노트 예정.
- 마케팅 랜딩/외부 브랜드 가이드 — 템플릿은 앱 내부 UI 팔레트만 다룸.

---

## UI팀 실행 요청 요약 (후속 커밋 단위)

1. **`feat(ui): 템플릿 기본 팔레트 재설정 (indigo + amber)`**
   - `node scripts/apply-theme-colors.mjs --primary=#4f46e5 --secondary=#f59e0b`
   - `tailwind-bridge.css` 가 `--color-secondary` alias 자동 추가되는지 확인.
2. **`refactor(ui): --font-color-white → --font-color-on-solid 리네임`**
   - deprecated alias 한 릴리스 유지.
3. **`docs(ui): font-color semantic 토큰 사용 가이드`**
   - `libs/ui/README.md` 또는 `libs/tokens/README.md` 에 표 추가.
4. **`chore(ui): tailwind-bridge 미노출 컴포넌트 토큰 감사 루틴`** (별도 티켓화)
5. **`feat(ui): alert semantic 토큰 추가 + warning 배경 secondary 이관`** (이번 라운드 즉시 처리)
   - `__tokens-{light,dark}.css` 양쪽에 `--alert-success-icon-color` / `--alert-info-icon-color` / `--alert-warning-icon-color` / `--alert-error-icon-color` 4개 추가 (위 "Variant → 토큰 매핑" 표 참조).
   - `ModalContent.scss:41` 의 `.alert-warning` 배경을 `--base-colors-primary-primary050` → `--base-colors-secondary-secondary100` 교체, `color:` 는 신규 `--alert-warning-icon-color` 로 정렬.
   - 나머지 3개 variant 도 `.alert-icon-container.alert-*` 의 `color:` 를 하드참조에서 신규 `--alert-*-icon-color` 토큰 참조로 통일 권장.
   - ui-library-tester: 4개 variant 모두 Light/Dark 각 1회씩 렌더 스냅샷 + 아이콘 실제 색 resolve 확인 (undefined var fallback 금지).
