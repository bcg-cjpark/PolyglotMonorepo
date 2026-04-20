import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Checkbox, RadioGroup } from "@monorepo/ui";
import { Todo, TodoApi, TodoStatus } from "../services/todos";

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

  const isOverdue = (dueDate: string | null, completed: boolean): boolean => {
    if (!dueDate || completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  };

  if (loading) return <p className="p-6">Loading…</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;

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

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left w-10"></th>
            <th className="p-2 text-left">Title</th>
            <th className="p-2 text-left">Due Date</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {todos.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="p-2">
                <Checkbox
                  checked={t.completed}
                  onChange={() => handleToggle(t.id)}
                />
              </td>
              <td className="p-2">
                <span
                  className={
                    t.completed ? "line-through text-gray-400" : undefined
                  }
                >
                  {t.title}
                </span>
              </td>
              <td
                className={`p-2 ${
                  isOverdue(t.dueDate, t.completed) ? "text-red-500" : ""
                }`}
              >
                {t.dueDate ?? ""}
              </td>
              <td className="p-2">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outlined"
                    size="sm"
                    label="Edit"
                    onClick={() => navigate(`/todos/${t.id}/edit`)}
                  />
                  <Button
                    variant="outlined"
                    color="red"
                    size="sm"
                    label="Delete"
                    onClick={() => handleDelete(t.id)}
                  />
                </div>
              </td>
            </tr>
          ))}
          {todos.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-gray-500">
                No todos yet. Click "+ New" to add one.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TodoListPage;
