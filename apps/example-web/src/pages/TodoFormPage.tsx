import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Input } from "@monorepo/ui";
import { TodoApi } from "../services/todos";

function TodoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const todo = await TodoApi.get(Number(id));
        setTitle(todo.title);
        setDescription(todo.description ?? "");
        setDueDate(todo.dueDate ?? "");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (title.trim() === "") return;
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await TodoApi.update(Number(id), {
          title,
          description: description || undefined,
          dueDate: dueDate || undefined,
        });
      } else {
        await TodoApi.create({
          title,
          description: description || undefined,
          dueDate: dueDate || undefined,
        });
      }
      navigate("/todos");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-6">Loading…</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;

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
          <textarea
            value={description}
            placeholder="Optional details"
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={(e) => setDescription(e.target.value)}
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
