import { Routes, Route, Link, Navigate } from "react-router-dom";
import UserListPage from "./pages/UserListPage";
import UserFormPage from "./pages/UserFormPage";
import TodoListPage from "./pages/TodoListPage";
import TodoFormPage from "./pages/TodoFormPage";
import MemoListPage from "./pages/MemoListPage";

function App() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <nav className="mb-6 flex gap-4">
        <Link to="/users" className="text-sm font-medium hover:underline">
          Users
        </Link>
        <Link to="/todos" className="text-sm font-medium hover:underline">
          Todos
        </Link>
        <Link to="/memos" className="text-sm font-medium hover:underline">
          Memos
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/users" replace />} />
        <Route path="/users" element={<UserListPage />} />
        <Route path="/users/new" element={<UserFormPage />} />
        <Route path="/todos" element={<TodoListPage />} />
        <Route path="/todos/new" element={<TodoFormPage />} />
        <Route path="/todos/:id/edit" element={<TodoFormPage />} />
        <Route path="/memos" element={<MemoListPage />} />
      </Routes>
    </div>
  );
}

export default App;
