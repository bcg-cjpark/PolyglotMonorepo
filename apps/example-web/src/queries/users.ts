import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createUser,
  deleteUser,
  getUsers,
  type CreateUserRequest,
  type User,
} from "../services/users";

/**
 * User 도메인 TanStack Query 훅.
 *
 * 쿼리 키 규약: `['users']` — 전체 리스트.
 * mutation 성공 시 `['users']` invalidate 로 자동 refetch.
 * staleTime / gcTime / retry 는 QueryClient 기본값 유지 (`docs/tech-stack/frontend.md §2.1`).
 */

export const userQueryKeys = {
  all: ["users"] as const,
};

export function useUsersQuery(): UseQueryResult<User[], Error> {
  return useQuery<User[], Error>({
    queryKey: userQueryKeys.all,
    queryFn: getUsers,
  });
}

export function useCreateUserMutation(): UseMutationResult<
  User,
  Error,
  CreateUserRequest
> {
  const queryClient = useQueryClient();
  return useMutation<User, Error, CreateUserRequest>({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
    },
  });
}

export function useDeleteUserMutation(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
    },
  });
}
