import { useEffect, useState } from "react";
import { Input, Modal, Textarea } from "@monorepo/ui";
import { Memo } from "../services/memos";

interface MemoFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initial?: Memo | null;
  onClose: () => void;
  onSubmit: (values: { title: string; content: string }) => Promise<void>;
}

const TITLE_MAX = 100;
const CONTENT_MAX = 5000;

/**
 * 생성/편집 공용 모달 폼 다이얼로그.
 * - 제목: 단일 행 Input (1~100자, 필수, 공백만 불가)
 * - 본문: 다중 행 Textarea (0~5000자, 선택)
 */
function MemoFormDialog({
  isOpen,
  mode,
  initial,
  onClose,
  onSubmit,
}: MemoFormDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);

  // 열릴 때마다 초기값 세팅
  useEffect(() => {
    if (!isOpen) return;
    setTitle(initial?.title ?? "");
    setContent(initial?.content ?? "");
    setTitleError(null);
    setSubmitting(false);
  }, [isOpen, initial]);

  const titleTrimmed = title.trim();
  const titleValid =
    titleTrimmed.length >= 1 && titleTrimmed.length <= TITLE_MAX;
  const contentValid = content.length <= CONTENT_MAX;
  const canSubmit = titleValid && contentValid && !submitting;

  const handleConfirm = async () => {
    if (!titleValid) {
      setTitleError(
        titleTrimmed.length === 0
          ? "제목은 필수입니다."
          : `제목은 최대 ${TITLE_MAX}자까지 가능합니다.`,
      );
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ title: titleTrimmed, content });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={mode === "create" ? "새 메모" : "메모 편집"}
      size="md"
      confirmText={submitting ? "저장 중…" : "저장"}
      cancelText="취소"
      onClose={onClose}
      onCancel={onClose}
      onConfirm={canSubmit ? handleConfirm : () => undefined}
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">제목</span>
          <Input
            value={title}
            placeholder="메모 제목"
            full
            allowSpaces
            maxLength={TITLE_MAX}
            error={!!titleError}
            errorMessage={titleError ?? undefined}
            onChange={(v) => {
              setTitle(v);
              if (titleError) setTitleError(null);
            }}
          />
          <span className="text-xs text-neutral-neutral600 text-right">
            {titleTrimmed.length}/{TITLE_MAX}
          </span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">본문</span>
          <Textarea
            value={content}
            placeholder="본문을 입력하세요 (선택)"
            rows={8}
            maxLength={CONTENT_MAX}
            full
            onChange={(v) => setContent(v)}
          />
          <span className="text-xs text-neutral-neutral600 text-right">
            {content.length}/{CONTENT_MAX}
          </span>
        </label>
      </div>
    </Modal>
  );
}

export default MemoFormDialog;
