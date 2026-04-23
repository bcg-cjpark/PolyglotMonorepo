import { Link, Navigate, Route, Routes } from "react-router-dom";
import UserListPage from "./pages/UserListPage";
import TodoListPage from "./pages/TodoListPage";
import TodoFormPage from "./pages/TodoFormPage";
import MemoListPage from "./pages/MemoListPage";

/**
 * 앱 셸.
 *
 * 현재 구현된 도메인:
 *   - User: 목록 + 생성 모달 + 삭제 (`docs/prd/user-crud.md`).
 *   - Todo: 목록 + 생성/편집 페이지 + 토글/삭제 (`docs/prd/todo.md`).
 *   - Memo: 목록 + 3 모드 오버레이 (상세/편집/삭제 확인) (`docs/prd/memo.md`).
 *
 * 추가 피처는 `docs/prd/<feature>.md` → `docs/screens/*.md` →
 * 구현 파이프라인을 거쳐서 이 위치에 라우트가 등록된다.
 */
function App() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <nav className="mb-6 flex items-center gap-4 text-sm">
        <Link to="/users" className="font-semibold hover:underline">
          사용자
        </Link>
        <Link to="/todos" className="font-semibold hover:underline">
          할 일
        </Link>
        <Link to="/memos" className="font-semibold hover:underline">
          메모
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/users" replace />} />
        <Route path="/users" element={<UserListPage />} />
        <Route path="/todos" element={<TodoListPage />} />
        <Route path="/todos/new" element={<TodoFormPage />} />
        <Route path="/todos/:id/edit" element={<TodoFormPage />} />
        <Route path="/memos" element={<MemoListPage />} />
      </Routes>
    </div>
  );
}

export default App;
