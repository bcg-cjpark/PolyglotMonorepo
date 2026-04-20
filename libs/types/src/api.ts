/** API 에러 공통 타입. openapi-fetch의 error 응답을 정규화할 때 사용. */
export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly status?: number;
}

/** 페이지네이션 응답 공통 타입 */
export interface PaginatedResponse<T> {
  readonly items: T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasMore: boolean;
}
