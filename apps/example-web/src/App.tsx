import { Routes, Route, Link, Navigate } from "react-router-dom";
import UserListPage from "./pages/UserListPage";
import UserFormPage from "./pages/UserFormPage";

function App() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <nav className="mb-6">
        <Link to="/users" className="text-sm font-medium hover:underline">
          Users
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/users" replace />} />
        <Route path="/users" element={<UserListPage />} />
        <Route path="/users/new" element={<UserFormPage />} />
      </Routes>
    </div>
  );
}

export default App;
