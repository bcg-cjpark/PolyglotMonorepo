import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { CreateUserRequest, User, UserApi } from "../services/users";

// 쿼리 키 규약: 배열 + 파라미터 객체 (docs/tech-stack/frontend.md §2.1).
const usersKey = ["users"] as const;

export function useUsersQuery() {
  return useQuery<User[]>({
    queryKey: usersKey,
    queryFn: () => UserApi.list(),
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserRequest) => UserApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKey });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => UserApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKey });
    },
  });
}
