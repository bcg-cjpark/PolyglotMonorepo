/**
 * 판별 유니온 ValidationResult — Toss 예측 가능성 원칙 적용.
 * 폼 검증이나 비즈니스 규칙 검증 결과를 표현한다.
 */
export type ValidationResult =
  | { readonly isValid: true }
  | { readonly isValid: false; readonly message: string };
