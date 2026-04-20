import { api } from "./api";

// NOTE: 실제 배포 시에는 @monorepo/api-types 에서 생성된 타입을 사용.
// 템플릿은 codegen 전에도 동작하도록 로컬 타입 유지.
export interface User {
  id: number;
  email: string;
  name: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
}

export const UserApi = {
  list: () => api.get<User[]>("/users").then((r) => r.data),
  get: (id: number) => api.get<User>(`/users/${id}`).then((r) => r.data),
  create: (body: CreateUserRequest) =>
    api.post<User>("/users", body).then((r) => r.data),
  delete: (id: number) => api.delete(`/users/${id}`),
};
