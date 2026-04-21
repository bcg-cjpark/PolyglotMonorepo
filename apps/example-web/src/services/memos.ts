import { api } from "./api";

// NOTE: 실제 배포 시에는 @monorepo/api-types 에서 생성된 타입을 사용.
// 템플릿은 codegen 전에도 동작하도록 로컬 타입 유지.
export interface Memo {
  id: string;
  title: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoRequest {
  title: string;
  content?: string | null;
}

export interface UpdateMemoRequest {
  title: string;
  content: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export const MemoApi = {
  list: (page = 0, size = 20) =>
    api
      .get<PageResponse<Memo>>("/memos", { params: { page, size } })
      .then((r) => r.data),
  get: (id: string) => api.get<Memo>(`/memos/${id}`).then((r) => r.data),
  create: (body: CreateMemoRequest) =>
    api.post<Memo>("/memos", body).then((r) => r.data),
  update: (id: string, body: UpdateMemoRequest) =>
    api.put<Memo>(`/memos/${id}`, body).then((r) => r.data),
  delete: (id: string) => api.delete(`/memos/${id}`),
};
