import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CreateTodoRequest,
  Todo,
  TodoApi,
  TodoStatus,
  UpdateTodoRequest,
} from "../services/todos";

// 쿼리 키 규약: 배열 + 파라미터 객체 (docs/tech-stack/frontend.md §2.1).
const todosKey = (status: TodoStatus) => ["todos", { status }] as const;
const todosPrefix = ["todos"] as const;
const todoDetailKey = (id: number) => ["todo", id] as const;

export function useTodosQuery(status: TodoStatus) {
  return useQuery<Todo[]>({
    queryKey: todosKey(status),
    queryFn: () => TodoApi.list(status),
  });
}

export function useTodoQuery(id: number | undefined) {
  return useQuery<Todo>({
    queryKey: todoDetailKey(id ?? -1),
    queryFn: () => TodoApi.get(id as number),
    enabled: id != null,
  });
}

export function useCreateTodoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTodoRequest) => TodoApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todosPrefix });
    },
  });
}

export function useUpdateTodoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateTodoRequest }) =>
      TodoApi.update(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: todosPrefix });
      queryClient.invalidateQueries({ queryKey: todoDetailKey(variables.id) });
    },
  });
}

export function useToggleTodoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => TodoApi.toggle(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: todosPrefix });
      queryClient.invalidateQueries({ queryKey: todoDetailKey(id) });
    },
  });
}

export function useDeleteTodoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => TodoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todosPrefix });
    },
  });
}
