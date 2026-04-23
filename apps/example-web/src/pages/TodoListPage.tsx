import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Checkbox, RadioGroup, Table, type TableColumn } from "@monorepo/ui";
import { Todo, TodoStatus } from "../services/todos";
import {
  useDeleteTodoMutation,
  useTodosQuery,
  useToggleTodoMutation,
} from "../queries/todos";

const isOverdue = (dueDate: string | null, completed: boolean): boolean => {
  if (!dueDate || completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
};

function TodoListPage() {
  const navigate = useNavigate();
  // filter 는 클라이언트 UI 상태 — TanStack Query 는 서버 상태 전담.
  const [filter, setFilter] = useState<TodoStatus>("all");

  // error 객체는 의도적으로 구독하지 않음 — 사용자에게는 일반 한국어 메시지만 노출.
  const { data, isLoading, isError } = useTodosQuery(filter);
  const toggleTodo = useToggleTodoMutation();
  const deleteTodo = useDeleteTodoMutation();

  const todos = data ?? [];

  const handleToggle = (id: number) => {
    toggleTodo.mutate(id);
  };

  const handleDelete = (id: number) => {
    deleteTodo.mutate(id);
  };

  const columns = useMemo<TableColumn<Todo>[]>(
    () => [
      {
        key: "completed",
        header: "",
        // 프로젝트 스페이싱 스케일(8·12·16·24·32·48·64) 정합 — 체크박스엔 48px 이 적정.
        width: "48px",
        render: (row) => (
          <Checkbox
            checked={row.completed}
            onChange={() => handleToggle(row.id)}
          />
        ),
      },
      {
        key: "title",
        header: "Title",
        // 완료 항목은 의미 토큰 text-muted (--font-color-default-muted) 로 약화.
        render: (row) => (
          <span className={row.completed ? "line-through text-muted" : undefined}>
            {row.title}
          </span>
        ),
      },
      {
        key: "dueDate",
        header: "Due Date",
        width: "160px",
        render: (row) => {
          const text = row.dueDate ?? "";
          const overdue = isOverdue(row.dueDate, row.completed);
          return <span className={overdue ? "text-red-red500" : undefined}>{text}</span>;
        },
      },
      {
        key: "action",
        header: "",
        align: "right",
        width: "180px",
        render: (row) => (
          <div className="flex gap-2 justify-end">
            <Button
              variant="outlined"
              size="sm"
              label="Edit"
              onClick={() => navigate(`/todos/${row.id}/edit`)}
            />
            <Button
              variant="outlined"
              color="red"
              size="sm"
              label="Delete"
              onClick={() => handleDelete(row.id)}
            />
          </div>
        ),
      },
    ],
    // 토글/삭제는 뮤테이션 훅을 통해 호출되며, 결과는 쿼리 무효화로 자동 반영.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // 헤더(제목 + "+ New") 와 필터 RadioGroup 은 Loading/Error 중에도 유지.
  // 필터는 클라이언트 UI 상태라 서버 상태와 독립적으로 동작해야 함.
  // 디자인 노트: docs/design-notes/global-states.md §2, §4
  const renderBody = () => {
    if (isLoading) {
      return <p className="py-12 text-center text-muted">불러오는 중…</p>;
    }
    if (isError) {
      // 스택 트레이스 노출 금지 — raw error.message 대신 한국어 일반 메시지.
      return (
        <p className="py-12 text-center text-red-red600">
          목록을 불러오지 못했습니다.
        </p>
      );
    }
    return (
      <Table
        columns={columns}
        rows={todos}
        getRowKey={(row) => row.id}
        emptyMessage={'No todos yet. Click "+ New" to add one.'}
      />
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Todos</h1>
        <Button
          variant="contained"
          color="primary"
          size="md"
          label="+ New"
          onClick={() => navigate("/todos/new")}
        />
      </div>

      <div className="mb-4">
        <RadioGroup
          variant="underline"
          value={filter}
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "completed", label: "Completed" },
          ]}
          onChange={(value) => setFilter(value as TodoStatus)}
        />
      </div>

      {renderBody()}
    </div>
  );
}

export default TodoListPage;
