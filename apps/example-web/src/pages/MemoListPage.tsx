import { Button, CardSkeleton, Modal } from "@monorepo/ui";
import { useCallback, useMemo, useState } from "react";
import { MemoCard } from "../components/MemoCard";
import { MemoDetailDialog } from "../components/MemoDetailDialog";
import {
  MemoFormDialog,
  type MemoFormValues,
} from "../components/MemoFormDialog";
import {
  useCreateMemoMutation,
  useDeleteMemoMutation,
  useMemosQuery,
  useUpdateMemoMutation,
} from "../queries/memos";
import type { Memo } from "../services/memos";

/**
 * MemoListPage — `docs/screens/memo-list.md` + `docs/screens/memo-dialog.md`.
 *
 * 레이아웃 (시안 Variant A 리스트 + 합성 카드):
 *   - 페이지 헤더: 제목 "메모" + Primary "+ 새 메모".
 *   - 본문: `MemoCard` 세로 스택 (data-display.md §3 "콘텐츠 중심 목록").
 *   - 페이지네이션: 하단 중앙 "이전 / 다음" + 현재/총 인디케이터.
 *
 * 헤더는 Loading/Error/Empty 에서 유지 (`global-states.md §2`).
 * 본문(`renderBody()`) 만 상태별 치환.
 *
 * 데이터:
 *   - GET /memos?page=&size=20 : useMemosQuery.
 *   - POST /memos              : useCreateMemoMutation.
 *   - PUT /memos/{id}          : useUpdateMemoMutation.
 *   - DELETE /memos/{id}       : useDeleteMemoMutation.
 *   - 생성/편집/삭제 후 `['memos']` invalidate → 자동 refetch.
 *
 * 3 모드 오버레이 (screens/memo-dialog.md): `dialogState` 판별 유니언으로 관리.
 *   - `{ kind: "detail", memo }` : MemoDetailDialog.
 *   - `{ kind: "create" }`       : MemoFormDialog (빈 폼).
 *   - `{ kind: "edit", memo }`   : MemoFormDialog (기존 값 주입).
 *   - `{ kind: "confirmDelete", memo }` : Modal variant="confirm".
 *
 * 에러 문구는 한국어 고정. 서버 원문/스택 노출 금지 (`global-states.md §3.2`).
 */

const PAGE_SIZE = 20;

type DialogState =
  | { kind: "none" }
  | { kind: "detail"; memo: Memo }
  | { kind: "create" }
  | { kind: "edit"; memo: Memo }
  | { kind: "confirmDelete"; memo: Memo };

function MemoListPage() {
  const [page, setPage] = useState(0);
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });

  const memosQuery = useMemosQuery(page, PAGE_SIZE);
  const createMutation = useCreateMemoMutation();
  const updateMutation = useUpdateMemoMutation();
  const deleteMutation = useDeleteMemoMutation();

  const data = memosQuery.data;
  const memos = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const closeDialog = useCallback(() => setDialog({ kind: "none" }), []);

  const openCreate = useCallback(() => setDialog({ kind: "create" }), []);

  const openDetail = useCallback((memo: Memo) => {
    setDialog({ kind: "detail", memo });
  }, []);

  const openEditFromDetail = useCallback((memo: Memo) => {
    setDialog({ kind: "edit", memo });
  }, []);

  const openConfirmDeleteFromDetail = useCallback((memo: Memo) => {
    setDialog({ kind: "confirmDelete", memo });
  }, []);

  const handleCreate = useCallback(
    async (values: MemoFormValues) => {
      await createMutation.mutateAsync({
        title: values.title,
        content: values.content,
      });
      // 새 메모가 최신이므로 첫 페이지로 이동.
      setPage(0);
      setDialog({ kind: "none" });
    },
    [createMutation],
  );

  const handleUpdate = useCallback(
    async (id: string, values: MemoFormValues) => {
      await updateMutation.mutateAsync({
        id,
        body: {
          title: values.title,
          content: values.content,
        },
      });
      setDialog({ kind: "none" });
    },
    [updateMutation],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
      // 마지막 페이지의 마지막 항목을 삭제했다면 page 를 한 칸 뒤로.
      // totalElements 는 삭제 전 값이므로 "1 짜리 현재 페이지" 기준으로 판단.
      if (memos.length === 1 && page > 0) {
        setPage(page - 1);
      }
      setDialog({ kind: "none" });
    },
    [deleteMutation, memos.length, page],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (dialog.kind !== "confirmDelete") return;
    const target = dialog.memo;
    try {
      await handleDelete(target.id);
    } catch {
      // Modal 이 닫히지 않도록 재전파. 추가 안내는 네트워크 레이어에 맡기고
      // 여기서는 상태만 유지 (한국어 고정 안내는 상위 토스트/배너 도입 시점에).
      throw new Error("delete_failed");
    }
  }, [dialog, handleDelete]);

  const showPagination = totalPages > 1;

  const renderBody = () => {
    if (memosQuery.isLoading) {
      // 헤더 유지, 본문만 카드 스켈레톤으로 치환.
      // showImage / showActions 는 Memo 카드 레이아웃에 맞지 않으므로 off.
      return (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton
              key={i}
              showImage={false}
              showActions={false}
            />
          ))}
        </div>
      );
    }

    if (memosQuery.isError) {
      return (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-red-red900">목록을 불러오지 못했습니다.</p>
          <Button
            variant="outlined"
            size="sm"
            label="다시 시도"
            onClick={() => {
              void memosQuery.refetch();
            }}
          />
        </div>
      );
    }

    if (memos.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted">
          <p>아직 메모가 없어요.</p>
          <p className="text-xs">상단의 “+ 새 메모” 버튼으로 시작해 보세요.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        {memos.map((memo) => (
          <MemoCard key={memo.id} memo={memo} onClick={openDetail} />
        ))}
      </div>
    );
  };

  const isFirstPage = page <= 0;
  const isLastPage = totalPages === 0 || page >= totalPages - 1;

  const detailMemo = dialog.kind === "detail" ? dialog.memo : null;
  const formMode = dialog.kind === "edit" ? "edit" : "create";
  const formInitial = dialog.kind === "edit" ? dialog.memo : null;
  const isFormOpen = dialog.kind === "create" || dialog.kind === "edit";
  const confirmTargetTitle =
    dialog.kind === "confirmDelete" ? dialog.memo.title : "";

  const handleFormSubmit = useMemo(() => {
    if (dialog.kind === "edit") {
      const id = dialog.memo.id;
      return (values: MemoFormValues) => handleUpdate(id, values);
    }
    return (values: MemoFormValues) => handleCreate(values);
  }, [dialog, handleCreate, handleUpdate]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">메모</h1>
        <Button
          variant="contained"
          color="primary"
          label="+ 새 메모"
          onClick={openCreate}
        />
      </header>

      {renderBody()}

      {showPagination && (
        <nav
          className="flex items-center justify-center gap-3 pt-3"
          aria-label="페이지 이동"
        >
          <Button
            variant="outlined"
            color="grey"
            size="sm"
            label="← 이전"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={isFirstPage}
          />
          <span
            className="min-w-14 text-center text-sm text-muted tabular-nums"
            aria-live="polite"
          >
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outlined"
            color="grey"
            size="sm"
            label="다음 →"
            onClick={() =>
              setPage((p) => (totalPages > 0 ? Math.min(totalPages - 1, p + 1) : p))
            }
            disabled={isLastPage}
          />
        </nav>
      )}

      {totalElements > 0 && (
        <p className="text-center text-xs text-muted">
          총 {totalElements}개 · 최신순
        </p>
      )}

      <MemoDetailDialog
        isOpen={dialog.kind === "detail"}
        memo={detailMemo}
        onClose={closeDialog}
        onEdit={openEditFromDetail}
        onDelete={openConfirmDeleteFromDetail}
      />

      <MemoFormDialog
        isOpen={isFormOpen}
        mode={formMode}
        initial={formInitial}
        onClose={closeDialog}
        onSubmit={handleFormSubmit}
      />

      <Modal
        isOpen={dialog.kind === "confirmDelete"}
        title="메모 삭제"
        variant="confirm"
        size="sm"
        confirmText={deleteMutation.isPending ? "삭제 중…" : "삭제"}
        cancelText="취소"
        onClose={closeDialog}
        onCancel={() => {
          // 삭제 확인 "취소" 버튼 → 상세 모드로 양보 복귀 (screens/memo-dialog.md §2.c).
          // Modal.tsx 의 handleCancel 은 onCancel 이 throw/reject 하면 handleClose 를
          // 호출하지 않음(commit e14a388). 이를 이용해 오버레이를 닫지 않고
          // dialog state 만 "detail" 로 교체한다. 다음 렌더에서 confirmDelete Modal
          // isOpen=false + detail Modal isOpen=true 로 자연스럽게 전환.
          // ESC/배경 클릭은 onClose 경로이므로 이 양보 로직과 무관(완전 닫힘 유지).
          if (dialog.kind === "confirmDelete") {
            setDialog({ kind: "detail", memo: dialog.memo });
            throw new Error("yield-to-detail");
          }
        }}
        onConfirm={handleConfirmDelete}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed">
            아래 메모를 삭제하시겠습니까?
          </p>
          <div
            className="overflow-hidden text-ellipsis whitespace-nowrap rounded-sm border border-solid border-border px-3 py-2 text-sm font-semibold"
            style={{ backgroundColor: "var(--background-bg-innerframe)" }}
          >
            {confirmTargetTitle}
          </div>
          <p className="text-xs text-red-red900">
            삭제한 메모는 복구할 수 없습니다.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default MemoListPage;
