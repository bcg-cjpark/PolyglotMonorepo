import { Button, Modal } from "@monorepo/ui";
import { memo } from "react";
import type { Memo } from "../services/memos";

/**
 * MemoDetailDialog — MemoListPage 전용 합성 오버레이 (상세 모드).
 *
 * 역할: 메모 1건을 읽기 전용 plain text 로 렌더. 푸터에 "삭제" / "편집"
 *       액션을 커스텀으로 주입해 모드 전환 트리거를 상위 페이지에 넘긴다.
 *
 * 합성 위치: `apps/example-web/src/components/` — 페이지 전용 합성이므로
 *          `libs/ui` 에 두지 않는다.
 *
 * 렌더 규칙 (PRD memo.md §비즈니스 규칙):
 *   - 본문은 plain text 만. 마크다운/HTML 렌더 금지.
 *   - 줄바꿈은 `whitespace-pre-wrap` 로 유지. 긴 본문은 세로 스크롤.
 *
 * 모드 전환 (screens/memo-dialog.md §2.a):
 *   - "편집" → onEdit(memo). 상위에서 dialogState 를 `edit` 으로 전환.
 *   - "삭제" → onDelete(memo). 상위에서 dialogState 를 `confirmDelete` 로 전환.
 *
 * 시안: docs/design-notes/memo-variants/memo-dialog-a.html §상세 모드.
 */

export interface MemoDetailDialogProps {
  isOpen: boolean;
  /** `isOpen=true` 일 때는 non-null 이어야 한다 (상위 페이지가 보증). */
  memo: Memo | null;
  onClose: () => void;
  onEdit: (memo: Memo) => void;
  onDelete: (memo: Memo) => void;
}

function formatMetaDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MemoDetailDialogImpl({
  isOpen,
  memo,
  onClose,
  onEdit,
  onDelete,
}: MemoDetailDialogProps) {
  // memo 가 null 이면 렌더 자체를 스킵 (상위 dialogState 가 'detail' 이 아닐 때)
  if (!isOpen || !memo) {
    return (
      <Modal
        isOpen={false}
        onClose={onClose}
        showDefaultFooter={false}
      />
    );
  }

  const content = memo.content ?? "";
  const hasContent = content.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      title={memo.title}
      size="md"
      onClose={onClose}
      showDefaultFooter={false}
      renderFooter={
        <div className="flex w-full justify-end gap-2">
          <Button
            variant="outlined"
            color="red"
            label="삭제"
            onClick={() => onDelete(memo)}
          />
          <Button
            variant="contained"
            color="primary"
            label="편집"
            onClick={() => onEdit(memo)}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {hasContent ? (
          <div
            className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-sm border border-solid border-border px-4 py-3 text-sm leading-relaxed text-default"
            style={{
              backgroundColor: "var(--background-bg-innerframe)",
            }}
          >
            {content}
          </div>
        ) : (
          <div
            className="rounded-sm border border-solid border-border px-4 py-3 text-sm italic text-muted"
            style={{
              backgroundColor: "var(--background-bg-innerframe)",
            }}
          >
            (본문 없음)
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>작성 {formatMetaDateTime(memo.createdAt)}</span>
          <span aria-hidden="true" className="text-neutral-neutral300">
            ·
          </span>
          <span>수정 {formatMetaDateTime(memo.updatedAt)}</span>
        </div>
      </div>
    </Modal>
  );
}

export const MemoDetailDialog = memo(MemoDetailDialogImpl);
