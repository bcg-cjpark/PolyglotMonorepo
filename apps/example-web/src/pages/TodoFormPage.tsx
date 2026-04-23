import { Button, Checkbox, Input } from "@monorepo/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateTodoMutation,
  useTodoQuery,
  useUpdateTodoMutation,
} from "../queries/todos";

/**
 * TodoFormPage — `docs/screens/todo-form.md`.
 *
 * Routes:
 *   - `/todos/new`       : 생성 모드 (빈 폼).
 *   - `/todos/:id/edit`  : 편집 모드 (GET /todos/{id} 로 초기값 fetch).
 *
 * 시안: Variant A 세로 스택 1열.
 *   - 제목 (필수, 최대 200자, 공백만 금지, 한글 IME).
 *   - 마감일 (선택, null 허용 — 비우면 기한 없음).
 *   - 완료 체크박스 (편집 모드만).
 *
 * Loading/Error(편집 fetch) 시에도 헤더 유지. 본문만 치환 (`global-states.md §2`).
 *
 * 에러 문구는 한국어 고정. 서버 원문/스택 노출 금지.
 *
 * 마감일 입력은 `libs/ui` 의 `DatePicker` primitive 부재로 native
 * `<input type="date">` 사용 (시안 주석에 명시적으로 대체 허용).
 */

const TITLE_MAX = 200;

function TodoFormPage() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const parsedId = params.id != null ? Number(params.id) : null;
  const isEdit = parsedId != null && !Number.isNaN(parsedId);

  const initialQuery = useTodoQuery(isEdit ? parsedId : null);
  const createMutation = useCreateTodoMutation();
  const updateMutation = useUpdateTodoMutation();

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [completed, setCompleted] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasSeeded, setHasSeeded] = useState(false);

  // 편집 모드 초기 fetch 성공 시 폼 상태 주입. 한 번만.
  useEffect(() => {
    if (!isEdit || hasSeeded) return;
    if (initialQuery.data) {
      setTitle(initialQuery.data.title);
      setDueDate(initialQuery.data.dueDate ?? "");
      setCompleted(initialQuery.data.completed);
      setHasSeeded(true);
    }
  }, [isEdit, hasSeeded, initialQuery.data]);

  const trimmedTitle = title.trim();
  const canSubmit = useMemo(() => {
    if (trimmedTitle.length === 0) return false;
    if (title.length > TITLE_MAX) return false;
    return true;
  }, [trimmedTitle, title]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleTitleChange = useCallback(
    (next: string) => {
      setTitle(next);
      if (titleError) setTitleError(null);
      if (submitError) setSubmitError(null);
    },
    [titleError, submitError],
  );

  const handleCancel = useCallback(() => {
    navigate("/todos");
  }, [navigate]);

  const handleSubmit = useCallback(async () => {
    // 로컬 검증 — 시안/PRD 메시지 문구 고정.
    if (trimmedTitle.length === 0) {
      setTitleError("공백만 입력할 수 없습니다.");
      return;
    }
    if (title.length > TITLE_MAX) {
      setTitleError(`제목은 최대 ${TITLE_MAX}자까지 입력할 수 있습니다.`);
      return;
    }

    const normalizedDueDate = dueDate.trim() === "" ? null : dueDate;

    try {
      if (isEdit && parsedId != null) {
        await updateMutation.mutateAsync({
          id: parsedId,
          body: {
            title: trimmedTitle,
            completed,
            dueDate: normalizedDueDate,
          },
        });
      } else {
        await createMutation.mutateAsync({
          title: trimmedTitle,
          dueDate: normalizedDueDate,
        });
      }
      navigate("/todos");
    } catch {
      // 서버 원문 미노출. 한국어 고정 문구.
      setSubmitError("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }, [
    trimmedTitle,
    title,
    dueDate,
    isEdit,
    parsedId,
    completed,
    updateMutation,
    createMutation,
    navigate,
  ]);

  const renderBody = () => {
    if (isEdit && initialQuery.isLoading && !hasSeeded) {
      return (
        <div className="py-12 text-center text-muted">불러오는 중…</div>
      );
    }

    if (isEdit && initialQuery.isError && !hasSeeded) {
      return (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-red-red900">항목을 불러오지 못했습니다.</p>
          <Button
            variant="outlined"
            size="sm"
            label="다시 시도"
            onClick={() => {
              void initialQuery.refetch();
            }}
          />
        </div>
      );
    }

    return (
      <div
        className="flex flex-col gap-6 rounded-lg border p-6"
        style={{
          borderColor: "var(--background-divider)",
          backgroundColor: "var(--background-bg-default)",
        }}
      >
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">
            제목<span className="text-red-red900 ml-0.5">*</span>
          </span>
          <Input
            value={title}
            onChange={handleTitleChange}
            placeholder="예: 디자인 시안 리뷰 노트 정리"
            allowSpaces
            maxLength={TITLE_MAX}
            error={!!titleError}
            errorMessage={titleError ?? undefined}
            full
          />
          <span className="text-xs text-muted self-end tabular-nums">
            {title.length} / {TITLE_MAX}
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">
            마감일
            <span className="text-muted ml-2 text-xs font-medium">
              선택 · 비우면 기한 없음
            </span>
          </span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-10 w-full rounded-md border px-3 text-base focus:outline-none"
            style={{
              backgroundColor: "var(--input-color-surface)",
              borderColor: "var(--input-color-border-static)",
              color: "var(--input-color-text-static)",
            }}
          />
        </label>

        {isEdit && (
          <div
            className="flex items-center gap-3 rounded-lg border p-3"
            style={{
              borderColor: "var(--background-divider)",
              backgroundColor: "var(--background-bg-innerframe)",
            }}
          >
            <Checkbox
              checked={completed}
              onChange={(next) => setCompleted(next)}
            >
              <span className="text-sm font-semibold">완료 처리</span>
            </Checkbox>
          </div>
        )}

        {submitError && (
          <p className="text-sm text-red-red900">{submitError}</p>
        )}

        <div
          className="flex justify-end gap-2 border-t pt-4"
          style={{ borderColor: "var(--background-divider)" }}
        >
          <Button
            variant="outlined"
            label="취소"
            onClick={handleCancel}
            disabled={isSubmitting}
          />
          <Button
            variant="contained"
            color="primary"
            label={isSubmitting ? "저장 중…" : "저장"}
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? "할 일 편집" : "새 할 일"}
        </h1>
        <Button
          variant="outlined"
          label="취소"
          onClick={handleCancel}
          disabled={isSubmitting}
        />
      </header>

      {renderBody()}
    </div>
  );
}

export default TodoFormPage;
