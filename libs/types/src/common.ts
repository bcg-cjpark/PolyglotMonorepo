/** null 허용 타입 */
export type Nullable<T> = T | null;

/**
 * 브랜드 타입 — 같은 원시값이라도 의미를 구분한다.
 * @example type UserId = Brand<string, 'UserId'>
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/**
 * Omit의 키 안전 버전 — 존재하지 않는 키를 지정하면 컴파일 에러 발생.
 */
export type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
