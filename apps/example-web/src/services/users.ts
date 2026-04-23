import { api } from "./api";

/**
 * User 도메인 서비스 레이어.
 *
 * 역할: axios 호출과 DTO 타입만 담당 (`docs/tech-stack/frontend.md §2.1`).
 * 쿼리 키 / 캐시 / invalidate 는 `queries/users.ts` 의 TanStack Query 훅이 담당.
 *
 * 경로 규칙: axios baseURL = "/api" → Vite dev 프록시가 `/api` 제거 후
 *          `http://localhost:8080` 으로 전달 (`apps/example-web/vite.config.ts`).
 *          따라서 여기서는 `/users` 로 시작하는 path 만 쓴다.
 */

export interface User {
  id: number;
  email: string;
  name: string;
  /** ISO 8601 문자열 (Jackson LocalDateTime 직렬화 결과) */
  createdAt: string;
  /** ISO 8601 문자열 */
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
}

/** GET /users — 전체 리스트 조회 (createdAt DESC 정렬은 서버 책임) */
export const getUsers = async (): Promise<User[]> => {
  const res = await api.get<User[]>("/users");
  return res.data;
};

/** GET /users/{id} — 단건 조회 (404 → axios reject) */
export const getUser = async (id: number): Promise<User> => {
  const res = await api.get<User>(`/users/${id}`);
  return res.data;
};

/** POST /users — 생성. 201 성공 / 409 이메일 중복 / 400 유효성 실패 */
export const createUser = async (body: CreateUserRequest): Promise<User> => {
  const res = await api.post<User>("/users", body);
  return res.data;
};

/** DELETE /users/{id} — hard delete. 204 성공 / 404 없음 */
export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/users/${id}`);
};
