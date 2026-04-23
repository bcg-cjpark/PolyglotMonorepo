import { api } from "./api";

/**
 * Todo 도메인 서비스 레이어.
 *
 * 역할: axios 호출과 DTO 타입만 담당 (`docs/tech-stack/frontend.md §2.1`).
 * 쿼리 키 / 캐시 / invalidate 는 `queries/todos.ts` 의 TanStack Query 훅이 담당.
 *
 * 경로 규칙: axios baseURL = "/api" → Vite dev 프록시가 `/api` 제거 후
 *          `http://localhost:8080` 으로 전달 (`apps/example-web/vite.config.ts`).
 *          따라서 여기서는 `/todos` 로 시작하는 path 만 쓴다.
 *
 * PRD: docs/prd/todo.md §API 엔드포인트
 */

/** 상태 필터 쿼리 파라미터 값. 허용 값 외는 백엔드 400. */
export type TodoStatus = "all" | "active" | "completed";

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  /** LocalDate → "YYYY-MM-DD" 직렬화. null 허용 (기한 없음). */
  dueDate: string | null;
  /** ISO 8601 문자열 (Jackson LocalDateTime 직렬화 결과) */
  createdAt: string;
  /** ISO 8601 문자열 */
  updatedAt: string;
}

/** POST /todos payload. `title` 필수 + 최대 200자, `dueDate` 선택. */
export interface CreateTodoRequest {
  title: string;
  dueDate?: string | null;
}

/**
 * PUT /todos/{id} payload — 전체 교체 시맨틱.
 * `dueDate` 를 `null` 로 명시하면 기한 제거.
 */
export interface UpdateTodoRequest {
  title: string;
  completed: boolean;
  dueDate: string | null;
}

/** GET /todos?status=... — createdAt DESC 정렬은 서버 책임 */
export const getTodos = async (status: TodoStatus): Promise<Todo[]> => {
  const res = await api.get<Todo[]>("/todos", {
    params: { status },
  });
  return res.data;
};

/** GET /todos/{id} — 편집 폼 초기 fetch용. 404 → axios reject */
export const getTodo = async (id: number): Promise<Todo> => {
  const res = await api.get<Todo>(`/todos/${id}`);
  return res.data;
};

/** POST /todos — 생성. 201 / 400 유효성 실패 */
export const createTodo = async (body: CreateTodoRequest): Promise<Todo> => {
  const res = await api.post<Todo>("/todos", body);
  return res.data;
};

/** PUT /todos/{id} — 전체 교체. 200 / 400 / 404 */
export const updateTodo = async (
  id: number,
  body: UpdateTodoRequest,
): Promise<Todo> => {
  const res = await api.put<Todo>(`/todos/${id}`, body);
  return res.data;
};

/** PATCH /todos/{id}/toggle — completed 반전. 200 / 404 */
export const toggleTodo = async (id: number): Promise<Todo> => {
  const res = await api.patch<Todo>(`/todos/${id}/toggle`);
  return res.data;
};

/** DELETE /todos/{id} — hard delete. 204 / 404 */
export const deleteTodo = async (id: number): Promise<void> => {
  await api.delete(`/todos/${id}`);
};
