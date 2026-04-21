import { useEffect, useState } from "react";
import { Button, Modal } from "@monorepo/ui";
import { Memo, MemoApi } from "../services/memos";
import MemoCard from "../components/MemoCard";
import MemoDetailDialog from "../components/MemoDetailDialog";
import MemoFormDialog from "../components/MemoFormDialog";

const PAGE_SIZE = 20;

type DialogState =
  | { kind: "none" }
  | { kind: "detail"; memo: Memo }
  | { kind: "create" }
  | { kind: "edit"; memo: Memo }
  | { kind: "confirmDelete"; memo: Memo };

function MemoListPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });

  const load = async (targetPage: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await MemoApi.list(targetPage, PAGE_SIZE);
      setMemos(res.content);
      setPage(res.page);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async ({
    title,
    content,
  }: {
    title: string;
    content: string;
  }) => {
    await MemoApi.create({ title, content: content || null });
    setDialog({ kind: "none" });
    await load(0); // 새 메모는 첫 페이지 맨 위에 오므로 0 페이지 리로드
  };

  const handleUpdate = async (
    id: string,
    { title, content }: { title: string; content: string },
  ) => {
    // PUT 전체 교체 — title, content 모두 필수
    const updated = await MemoApi.update(id, { title, content });
    setDialog({ kind: "none" });
    await load(page);
    // 상세 모달을 다시 띄워주진 않음 (편집 완료 후엔 리스트로 복귀)
    void updated;
  };

  const handleDelete = async (id: string) => {
    await MemoApi.delete(id);
    setDialog({ kind: "none" });
    // 마지막 페이지에서 마지막 항목을 지운 경우 한 페이지 앞으로 이동
    const nextPage =
      memos.length === 1 && page > 0 ? page - 1 : page;
    await load(nextPage);
  };

  const renderList = () => {
    if (loading) return <p className="p-6">Loading…</p>;
    if (error) return <p className="p-6 text-red-red600">Error: {error}</p>;
    if (memos.length === 0) {
      return (
        <p className="py-12 text-center text-neutral-neutral500">
          아직 메모가 없습니다. "+ 새 메모" 버튼으로 첫 메모를 작성해 보세요.
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-3">
        {memos.map((m) => (
          <MemoCard
            key={m.id}
            memo={m}
            onClick={() => setDialog({ kind: "detail", memo: m })}
          />
        ))}
      </div>
    );
  };

  const showPagination = totalPages > 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Memos</h1>
        <Button
          variant="contained"
          color="primary"
          size="md"
          label="+ 새 메모"
          onClick={() => setDialog({ kind: "create" })}
        />
      </div>

      {renderList()}

      {showPagination && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="outlined"
            color="grey"
            size="sm"
            label="이전"
            disabled={page <= 0 || loading}
            onClick={() => load(page - 1)}
          />
          <span className="text-sm text-neutral-neutral600">
            {page + 1} / {totalPages} (총 {totalElements}개)
          </span>
          <Button
            variant="outlined"
            color="grey"
            size="sm"
            label="다음"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => load(page + 1)}
          />
        </div>
      )}

      {/* 상세 모달 */}
      <MemoDetailDialog
        isOpen={dialog.kind === "detail"}
        memo={dialog.kind === "detail" ? dialog.memo : null}
        onClose={() => setDialog({ kind: "none" })}
        onEdit={() => {
          if (dialog.kind === "detail") {
            setDialog({ kind: "edit", memo: dialog.memo });
          }
        }}
        onDelete={() => {
          if (dialog.kind === "detail") {
            setDialog({ kind: "confirmDelete", memo: dialog.memo });
          }
        }}
      />

      {/* 생성 모달 */}
      <MemoFormDialog
        isOpen={dialog.kind === "create"}
        mode="create"
        initial={null}
        onClose={() => setDialog({ kind: "none" })}
        onSubmit={handleCreate}
      />

      {/* 편집 모달 */}
      <MemoFormDialog
        isOpen={dialog.kind === "edit"}
        mode="edit"
        initial={dialog.kind === "edit" ? dialog.memo : null}
        onClose={() => setDialog({ kind: "none" })}
        onSubmit={(v) => {
          if (dialog.kind !== "edit") return Promise.resolve();
          return handleUpdate(dialog.memo.id, v);
        }}
      />

      {/* 삭제 확인 다이얼로그 */}
      <Modal
        isOpen={dialog.kind === "confirmDelete"}
        variant="confirm"
        title="메모 삭제"
        size="sm"
        confirmText="삭제"
        cancelText="취소"
        onClose={() => setDialog({ kind: "none" })}
        onCancel={() => setDialog({ kind: "none" })}
        onConfirm={() => {
          if (dialog.kind === "confirmDelete") {
            void handleDelete(dialog.memo.id);
          }
        }}
      >
        <p className="text-sm">
          이 메모를 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.
        </p>
      </Modal>
    </div>
  );
}

export default MemoListPage;
