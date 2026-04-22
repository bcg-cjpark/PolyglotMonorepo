import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Checkbox, DataGrid, RadioGroup } from "@monorepo/ui";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Todo, TodoApi, TodoStatus } from "../services/todos";

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
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<TodoStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (status: TodoStatus) => {
    try {
      setLoading(true);
      setTodos(await TodoApi.list(status));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  const handleToggle = async (id: number) => {
    await TodoApi.toggle(id);
    await load(filter);
  };

  const handleDelete = async (id: number) => {
    await TodoApi.delete(id);
    await load(filter);
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
    // navigate/handleToggle/handleDelete 는 클로저로 filter 를 참조하지만
    // load(filter) 재호출만 하므로 의존성에 포함하지 않아도 최신 filter 에 도달.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter],
  );

  if (loading) return <p className="p-6">Loading…</p>;
  if (error) return <p className="p-6 text-red-red600">Error: {error}</p>;

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
