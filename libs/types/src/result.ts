/**
 * 판별 유니온 Result 타입 — Toss 예측 가능성 원칙 적용.
 * fetch 함수는 T 반환 + throw 패턴을 사용하므로,
 * Result는 비동기 흐름 밖에서 성공/실패를 명시적으로 전달할 때 사용한다.
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
