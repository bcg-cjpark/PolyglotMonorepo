import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CreateMemoRequest,
  Memo,
  MemoApi,
  PageResponse,
  UpdateMemoRequest,
} from "../services/memos";

// 쿼리 키 규약: 배열 + 파라미터 객체 (docs/tech-stack/frontend.md §2.1).
// prefix 만으로 `invalidateQueries` 를 호출하면 모든 페이지 쿼리가 무효화된다.
const memosKey = (page: number, size: number) =>
  ["memos", { page, size }] as const;
const memosPrefix = ["memos"] as const;
const memoDetailKey = (id: string) => ["memo", id] as const;

export function useMemosQuery(page: number, size: number) {
  return useQuery<PageResponse<Memo>>({
    queryKey: memosKey(page, size),
    queryFn: () => MemoApi.list(page, size),
  });
}

export function useCreateMemoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMemoRequest) => MemoApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memosPrefix });
    },
  });
}

export function useUpdateMemoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateMemoRequest }) =>
      MemoApi.update(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: memosPrefix });
      queryClient.invalidateQueries({ queryKey: memoDetailKey(variables.id) });
    },
  });
}

export function useDeleteMemoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => MemoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memosPrefix });
    },
  });
}
