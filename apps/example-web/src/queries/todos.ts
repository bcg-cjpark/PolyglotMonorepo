import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createTodo,
  deleteTodo,
  getTodo,
  getTodos,
  toggleTodo,
  updateTodo,
  type CreateTodoRequest,
  type Todo,
  type TodoStatus,
  type UpdateTodoRequest,
} from "../services/todos";

/**
 * Todo 도메인 TanStack Query 훅.
 *
 * 쿼리 키 규약 (`docs/tech-stack/frontend.md §2.1`):
 *   - `['todos', { status }]` — 상태별 리스트.
 *   - `['todo', id]` — 단건 (편집 폼 초기 fetch).
 *
 * 뮤테이션 성공 시 모든 `['todos', ...]` 를 invalidate → 현재 선택된
 * status 탭에 맞는 리스트만 refetch 되어 네트워크 비용 최소화.
 *
 * `useToggleTodoMutation` 은 낙관적 업데이트 (`onMutate` 에서 현재
 * 캐시된 status 리스트들의 해당 행 `completed` 를 미리 반전,
 * 실패 시 `onError` 에서 롤백). 화면정의서 인터랙션 6 요구사항.
 */

export const todoQueryKeys = {
  all: ["todos"] as const,
  list: (status: TodoStatus) => ["todos", { status }] as const,
  detail: (id: number) => ["todo", id] as const,
};

export function useTodosQuery(
  status: TodoStatus,
): UseQueryResult<Todo[], Error> {
  return useQuery<Todo[], Error>({
    queryKey: todoQueryKeys.list(status),
    queryFn: () => getTodos(status),
  });
}

/**
 * 편집 모드 초기 fetch 용. `enabled` 로 생성 모드 (id 미정) 일 때는 비활성.
 */
export function useTodoQuery(
  id: number | null,
): UseQueryResult<Todo, Error> {
  return useQuery<Todo, Error>({
    queryKey: id != null ? todoQueryKeys.detail(id) : ["todo", "__noop__"],
    queryFn: () => {
      if (id == null) throw new Error("id is required");
      return getTodo(id);
    },
    enabled: id != null,
  });
}

export function useCreateTodoMutation(): UseMutationResult<
  Todo,
  Error,
  CreateTodoRequest
> {
  const queryClient = useQueryClient();
  return useMutation<Todo, Error, CreateTodoRequest>({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.all });
    },
  });
}

export function useUpdateTodoMutation(): UseMutationResult<
  Todo,
  Error,
  { id: number; body: UpdateTodoRequest }
> {
  const queryClient = useQueryClient();
  return useMutation<Todo, Error, { id: number; body: UpdateTodoRequest }>({
    mutationFn: ({ id, body }) => updateTodo(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: todoQueryKeys.detail(variables.id),
      });
    },
  });
}

/**
 * 토글 뮤테이션 — 낙관적 업데이트.
 *
 * 캐시된 모든 `['todos', { status }]` 엔트리를 순회해 해당 id 행의
 * `completed` 를 반전. 실패 시 snapshot 으로 롤백.
 * 성공/실패 모두 `onSettled` 에서 서버 상태로 재동기화.
 */
export function useToggleTodoMutation(): UseMutationResult<
  Todo,
  Error,
  number,
  { previous: Array<[readonly unknown[], Todo[] | undefined]> }
> {
  const queryClient = useQueryClient();
  return useMutation<
    Todo,
    Error,
    number,
    { previous: Array<[readonly unknown[], Todo[] | undefined]> }
  >({
    mutationFn: toggleTodo,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todoQueryKeys.all });
      const previous = queryClient.getQueriesData<Todo[]>({
        queryKey: todoQueryKeys.all,
      });
      previous.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData<Todo[]>(
          key,
          data.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t,
          ),
        );
      });
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      ctx?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.all });
    },
  });
}

export function useDeleteTodoMutation(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.all });
    },
  });
}
