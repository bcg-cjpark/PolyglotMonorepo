import { Button, Modal } from "@monorepo/ui";
import { Memo } from "../services/memos";

interface MemoDetailDialogProps {
  isOpen: boolean;
  memo: Memo | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * 메모 상세/열람 모달.
 * - 제목 + 본문 전체 + 생성/수정 시각 표시
 * - 편집/삭제 액션 푸터 (ModalAction 이 color 를 지원하지 않아 renderFooter 사용)
 */
function MemoDetailDialog({
  isOpen,
  memo,
  onClose,
  onEdit,
  onDelete,
}: MemoDetailDialogProps) {
  if (!memo) return null;

  const createdAt = new Date(memo.createdAt).toLocaleString();
  const updatedAt = new Date(memo.updatedAt).toLocaleString();

  return (
    <Modal
      isOpen={isOpen}
      title={memo.title}
      size="md"
      showDefaultFooter={false}
      renderFooter={
        <div className="flex justify-end gap-2 p-4">
          <Button
            variant="outlined"
            color="red"
            size="md"
            label="삭제"
            onClick={onDelete}
          />
          <Button
            variant="contained"
            color="primary"
            size="md"
            label="편집"
            onClick={onEdit}
          />
        </div>
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        {memo.content ? (
          <p className="text-sm whitespace-pre-wrap text-neutral-neutral700">
            {memo.content}
          </p>
        ) : (
          <p className="text-sm text-neutral-neutral500 italic">본문 없음</p>
        )}
        <div className="text-xs text-neutral-neutral500 border-t border-neutral-neutral200 pt-2">
          <div>생성: {createdAt}</div>
          {updatedAt !== createdAt && <div>수정: {updatedAt}</div>}
        </div>
      </div>
    </Modal>
  );
}

export default MemoDetailDialog;
