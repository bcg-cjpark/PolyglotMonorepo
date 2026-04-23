import { api } from "./api";

/**
 * Memo 도메인 서비스 레이어.
 *
 * 역할: axios 호출과 DTO 타입만 담당 (`docs/tech-stack/frontend.md §2.1`).
 * 쿼리 키 / 캐시 / invalidate 는 `queries/memos.ts` 의 TanStack Query 훅이 담당.
 *
 * 경로 규칙: axios baseURL = "/api" → Vite dev 프록시가 `/api` 제거 후
 *          `http://localhost:8080` 으로 전달 (`apps/example-web/vite.config.ts`).
 *          따라서 여기서는 `/memos` 로 시작하는 path 만 쓴다.
 *
 * PRD: docs/prd/memo.md §API 엔드포인트
 */

export interface Memo {
  /** UUID 문자열 (RFC 4122) — 서버 생성 PK */
  id: string;
  title: string;
  /** 본문은 선택 필드. null / 빈 문자열 모두 "본문 없는 메모" 의미. */
  content: string | null;
  /** ISO 8601 문자열 (Jackson LocalDateTime 직렬화 결과) */
  createdAt: string;
  /** ISO 8601 문자열 */
  updatedAt: string;
}

/**
 * GET /memos?page=&size= 페이징 응답.
 * `page` 는 0-base, `size` 기본 20.
 */
export interface MemoPage {
  content: Memo[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/** POST /memos payload. `title` 필수 + 최대 100자, `content` 선택. */
export interface CreateMemoRequest {
  title: string;
  content?: string | null;
}

/**
 * PUT /memos/{id} payload — 전체 교체 시맨틱.
 * title, content 두 필드 모두 payload 에 포함. content 를 `null` 또는 `""` 로 비울 수 있음.
 */
export interface UpdateMemoRequest {
  title: string;
  content: string | null;
}

/** GET /memos?page=&size= — createdAt DESC 정렬은 서버 책임 */
export const getMemos = async (
  page: number,
  size: number,
): Promise<MemoPage> => {
  const res = await api.get<MemoPage>("/memos", {
    params: { page, size },
  });
  return res.data;
};

/** GET /memos/{id} — 단건 조회 (404 → axios reject) */
export const getMemo = async (id: string): Promise<Memo> => {
  const res = await api.get<Memo>(`/memos/${id}`);
  return res.data;
};

/** POST /memos — 생성. 201 / 400 유효성 실패 */
export const createMemo = async (
  body: CreateMemoRequest,
): Promise<Memo> => {
  const res = await api.post<Memo>("/memos", body);
  return res.data;
};

/** PUT /memos/{id} — 전체 교체. 200 / 400 / 404 */
export const updateMemo = async (
  id: string,
  body: UpdateMemoRequest,
): Promise<Memo> => {
  const res = await api.put<Memo>(`/memos/${id}`, body);
  return res.data;
};

/** DELETE /memos/{id} — hard delete. 204 / 404 */
export const deleteMemo = async (id: string): Promise<void> => {
  await api.delete(`/memos/${id}`);
};
