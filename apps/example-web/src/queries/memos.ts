import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createMemo,
  deleteMemo,
  getMemo,
  getMemos,
  updateMemo,
  type CreateMemoRequest,
  type Memo,
  type MemoPage,
  type UpdateMemoRequest,
} from "../services/memos";

/**
 * Memo 도메인 TanStack Query 훅.
 *
 * 쿼리 키 규약 (`docs/tech-stack/frontend.md §2.1`):
 *   - `['memos', { page, size }]` — 페이지별 리스트.
 *   - `['memo', id]` — 단건 (상세 모드 재조회).
 *
 * 뮤테이션 성공 시 모든 `['memos', ...]` 를 invalidate → 현재 열람 중인
 * 페이지만 refetch 되어 네트워크 비용 최소화.
 */

export const memoQueryKeys = {
  all: ["memos"] as const,
  list: (page: number, size: number) => ["memos", { page, size }] as const,
  detail: (id: string) => ["memo", id] as const,
};

export function useMemosQuery(
  page: number,
  size: number,
): UseQueryResult<MemoPage, Error> {
  return useQuery<MemoPage, Error>({
    queryKey: memoQueryKeys.list(page, size),
    queryFn: () => getMemos(page, size),
  });
}

/**
 * 상세 모드 재조회용. `enabled` 로 id 없을 때는 비활성.
 */
export function useMemoQuery(
  id: string | null,
): UseQueryResult<Memo, Error> {
  return useQuery<Memo, Error>({
    queryKey: id != null ? memoQueryKeys.detail(id) : ["memo", "__noop__"],
    queryFn: () => {
      if (id == null) throw new Error("id is required");
      return getMemo(id);
    },
    enabled: id != null,
  });
}

export function useCreateMemoMutation(): UseMutationResult<
  Memo,
  Error,
  CreateMemoRequest
> {
  const queryClient = useQueryClient();
  return useMutation<Memo, Error, CreateMemoRequest>({
    mutationFn: createMemo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoQueryKeys.all });
    },
  });
}

export function useUpdateMemoMutation(): UseMutationResult<
  Memo,
  Error,
  { id: string; body: UpdateMemoRequest }
> {
  const queryClient = useQueryClient();
  return useMutation<Memo, Error, { id: string; body: UpdateMemoRequest }>({
    mutationFn: ({ id, body }) => updateMemo(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: memoQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: memoQueryKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteMemoMutation(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteMemo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoQueryKeys.all });
    },
  });
}
