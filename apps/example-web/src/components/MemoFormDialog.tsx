import { Input, Modal, Textarea } from "@monorepo/ui";
import { memo, useCallback, useEffect, useState } from "react";
import type { Memo } from "../services/memos";

/**
 * MemoFormDialog — MemoListPage 전용 합성 오버레이 (편집/신규 모드 공용).
 *
 * 역할: 제목 + 본문 폼. 로컬 검증 + 카운터. 저장 시 상위 페이지의 mutation 을
 *       `onSubmit(values)` 로 위임. Modal 의 `onConfirm` 이 Promise 를
 *       await 하고 throw 시 모달을 닫지 않는 패턴(commit 7b46f11) 그대로 활용.
 *
 * 모드 (screens/memo-dialog.md §2.b):
 *   - create : 빈 폼, 헤더 "새 메모"
 *   - edit   : initial 값 주입, 헤더 "메모 편집"
 *
 * 검증 (PRD memo.md):
 *   - title: 필수 (공백만 금지), 1~100자.
 *   - content: 선택 (빈 문자열 허용), 0~5000자.
 *
 * 시안: docs/design-notes/memo-variants/memo-dialog-a.html §편집 모드.
 */

const TITLE_MAX = 100;
const CONTENT_MAX = 5000;

export type MemoFormMode = "create" | "edit";

export interface MemoFormValues {
  title: string;
  content: string | null;
}

export interface MemoFormDialogProps {
  isOpen: boolean;
  mode: MemoFormMode;
  /** 편집 모드 초기값. create 모드에서는 무시되고 빈 폼으로 시작. */
  initial: Memo | null;
  onClose: () => void;
  /**
   * 제출 핸들러. Promise 를 반환. 실패 시 throw → Modal 이 열린 채로 유지.
   * 성공 시 Modal 이 resolve 후 자동으로 close 호출.
   */
  onSubmit: (values: MemoFormValues) => Promise<void>;
}

interface FormErrors {
  title?: string;
  content?: string;
  submit?: string;
}

function MemoFormDialogImpl({
  isOpen,
  mode,
  initial,
  onClose,
  onSubmit,
}: MemoFormDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  // 모달이 열릴 때 / 모드·초기값이 바뀔 때 폼 상태를 (재)주입.
  // 모달이 닫힐 때는 errors 만 초기화 (다음 열림에서 initial seed 가 다시 돌도록).
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initial) {
        setTitle(initial.title);
        setContent(initial.content ?? "");
      } else {
        setTitle("");
        setContent("");
      }
      setErrors({});
    } else {
      setErrors({});
    }
  }, [isOpen, mode, initial]);

  const handleTitleChange = useCallback((next: string) => {
    setTitle(next);
    setErrors((prev) =>
      prev.title || prev.submit ? { ...prev, title: undefined, submit: undefined } : prev,
    );
  }, []);

  const handleContentChange = useCallback((next: string) => {
    setContent(next);
    setErrors((prev) =>
      prev.content || prev.submit
        ? { ...prev, content: undefined, submit: undefined }
        : prev,
    );
  }, []);

  const handleConfirm = useCallback(async () => {
    const nextErrors: FormErrors = {};
    const trimmedTitle = title.trim();

    if (trimmedTitle.length === 0) {
      nextErrors.title = "제목을 입력하세요.";
    } else if (title.length > TITLE_MAX) {
      nextErrors.title = `제목은 최대 ${TITLE_MAX}자까지 입력할 수 있습니다.`;
    }

    if (content.length > CONTENT_MAX) {
      nextErrors.content = `본문은 최대 ${CONTENT_MAX}자까지 입력할 수 있습니다.`;
    }

    if (nextErrors.title || nextErrors.content) {
      setErrors(nextErrors);
      // Modal 의 onConfirm 이 throw 하면 닫히지 않는다 (commit 7b46f11 패턴).
      throw new Error("validation");
    }

    try {
      await onSubmit({
        title: trimmedTitle,
        content: content.length === 0 ? null : content,
      });
      setErrors({});
      // 성공 — Modal 이 onConfirm resolve 후 자동 close 호출.
    } catch (err) {
      setErrors({
        submit: "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      });
      // Modal 이 닫히지 않도록 re-throw.
      throw err;
    }
  }, [title, content, onSubmit]);

  const modalTitle = mode === "edit" ? "메모 편집" : "새 메모";

  return (
    <Modal
      isOpen={isOpen}
      title={modalTitle}
      size="md"
      confirmText="저장"
      cancelText="취소"
      onClose={onClose}
      onCancel={onClose}
      onConfirm={handleConfirm}
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">
            제목<span className="ml-0.5 text-red-red900">*</span>
          </span>
          <Input
            value={title}
            onChange={handleTitleChange}
            placeholder="예: 오늘 할 일"
            allowSpaces
            maxLength={TITLE_MAX}
            error={!!errors.title}
            errorMessage={errors.title}
            full
          />
          <span className="self-end text-xs text-muted tabular-nums">
            {title.length} / {TITLE_MAX}
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">본문</span>
          <Textarea
            value={content}
            onChange={handleContentChange}
            placeholder="본문은 비워둘 수 있습니다. 마크다운은 적용되지 않고 입력 그대로 표시됩니다."
            rows={8}
            maxLength={CONTENT_MAX}
            error={!!errors.content}
            errorMessage={errors.content}
            full
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted">
              줄바꿈은 유지되며, 마크다운/HTML 은 적용되지 않습니다.
            </span>
            <span className="text-xs text-muted tabular-nums">
              {content.length} / {CONTENT_MAX}
            </span>
          </div>
        </label>

        {errors.submit && (
          <p className="text-sm text-red-red900">{errors.submit}</p>
        )}
      </div>
    </Modal>
  );
}

export const MemoFormDialog = memo(MemoFormDialogImpl);
