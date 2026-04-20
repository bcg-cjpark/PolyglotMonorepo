import { api } from "./api";

// NOTE: 실제 배포 시에는 @monorepo/api-types 에서 생성된 타입을 사용.
// 템플릿은 codegen 전에도 동작하도록 로컬 타입 유지.
export type TodoStatus = "all" | "active" | "completed";

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  dueDate?: string;
}

export const TodoApi = {
  list: (status: TodoStatus = "all") =>
    api
      .get<Todo[]>("/todos", { params: { status } })
      .then((r) => r.data),
  get: (id: number) => api.get<Todo>(`/todos/${id}`).then((r) => r.data),
  create: (body: CreateTodoRequest) =>
    api.post<Todo>("/todos", body).then((r) => r.data),
  update: (id: number, body: UpdateTodoRequest) =>
    api.patch<Todo>(`/todos/${id}`, body).then((r) => r.data),
  toggle: (id: number) =>
    api.patch<Todo>(`/todos/${id}/toggle`).then((r) => r.data),
  delete: (id: number) => api.delete(`/todos/${id}`),
};
