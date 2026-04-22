import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Input, Textarea } from "@monorepo/ui";
import {
  useCreateTodoMutation,
  useTodoQuery,
  useUpdateTodoMutation,
} from "../queries/todos";

function TodoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const numericId = isEdit && id ? Number(id) : undefined;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const todoQuery = useTodoQuery(numericId);
  const createTodo = useCreateTodoMutation();
  const updateTodo = useUpdateTodoMutation();

  // 수정 모드: 서버에서 로드한 데이터를 폼 상태로 한 번 주입.
  useEffect(() => {
    if (!isEdit) return;
    const todo = todoQuery.data;
    if (!todo) return;
    setTitle(todo.title);
    setDescription(todo.description ?? "");
    setDueDate(todo.dueDate ?? "");
  }, [isEdit, todoQuery.data]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (title.trim() === "") return;
    try {
      if (isEdit && numericId != null) {
        await updateTodo.mutateAsync({
          id: numericId,
          body: {
            title,
            description: description || undefined,
            dueDate: dueDate || undefined,
          },
        });
      } else {
        await createTodo.mutateAsync({
          title,
          description: description || undefined,
          dueDate: dueDate || undefined,
        });
      }
      navigate("/todos");
    } catch {
      // 에러는 뮤테이션 상태로 노출 가능. 현 화면은 이전 동작 유지.
    }
  };

  const submitting = createTodo.isPending || updateTodo.isPending;

  if (isEdit && todoQuery.isLoading) return <p className="p-6">Loading…</p>;
  if (isEdit && todoQuery.isError)
    return (
      <p className="p-6 text-red-600">
        Error: {(todoQuery.error as Error).message}
      </p>
    );

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        {isEdit ? "Edit Todo" : "New Todo"}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Title</span>
          <Input
            value={title}
            placeholder="What needs to be done?"
            full
            allowSpaces
            onChange={(v) => setTitle(v)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Description</span>
          <Textarea
            value={description}
            placeholder="Optional details"
            rows={4}
            full
            onChange={(v) => setDescription(v)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Due Date</span>
          <input
            type="date"
            value={dueDate}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>
        <div className="flex gap-2">
          <Button
            buttonType="submit"
            variant="contained"
            color="primary"
            label={submitting ? "Saving…" : isEdit ? "Update" : "Create"}
            disabled={submitting || title.trim() === ""}
          />
          <Button
            buttonType="button"
            variant="outlined"
            color="grey"
            label="Cancel"
            onClick={() => navigate("/todos")}
          />
        </div>
      </form>
    </div>
  );
}

export default TodoFormPage;
