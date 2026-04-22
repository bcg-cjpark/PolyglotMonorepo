import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Checkbox, DataGrid, RadioGroup } from "@monorepo/ui";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
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

  const { data, isLoading, isError, error } = useTodosQuery(filter);
  const toggleTodo = useToggleTodoMutation();
  const deleteTodo = useDeleteTodoMutation();

  const todos = data ?? [];

  const handleToggle = (id: number) => {
    toggleTodo.mutate(id);
  };

  const handleDelete = (id: number) => {
    deleteTodo.mutate(id);
  };

  const columnDefs = useMemo<ColDef<Todo>[]>(
    () => [
      {
        headerName: "",
        colId: "completed",
        maxWidth: 56,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<Todo>) => {
          const row = params.data;
          if (!row) return null;
          return (
            <Checkbox
              checked={row.completed}
              onChange={() => handleToggle(row.id)}
            />
          );
        },
      },
      {
        field: "title",
        headerName: "Title",
        cellRenderer: (params: ICellRendererParams<Todo>) => {
          const row = params.data;
          if (!row) return null;
          return (
            <span className={row.completed ? "line-through text-neutral-neutral400" : undefined}>
              {row.title}
            </span>
          );
        },
      },
      {
        field: "dueDate",
        headerName: "Due Date",
        maxWidth: 160,
        cellRenderer: (params: ICellRendererParams<Todo>) => {
          const row = params.data;
          if (!row) return null;
          const text = row.dueDate ?? "";
          const overdue = isOverdue(row.dueDate, row.completed);
          return <span className={overdue ? "text-red-red500" : undefined}>{text}</span>;
        },
      },
      {
        headerName: "",
        colId: "action",
        maxWidth: 180,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<Todo>) => {
          const row = params.data;
          if (!row) return null;
          return (
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
          );
        },
      },
    ],
    // 토글/삭제는 뮤테이션 훅을 통해 호출되며, 결과는 쿼리 무효화로 자동 반영.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (isLoading) return <p className="p-6">Loading…</p>;
  if (isError)
    return (
      <p className="p-6 text-red-red600">
        Error: {(error as Error).message}
      </p>
    );

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

      <DataGrid
        columnDefs={columnDefs}
        rowData={todos}
        height="calc(100vh - 260px)"
        noRowsToShow={'No todos yet. Click "+ New" to add one.'}
        disableRowSelection
      />
    </div>
  );
}

export default TodoListPage;
