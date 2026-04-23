import { Link, Navigate, Route, Routes } from "react-router-dom";
import UserListPage from "./pages/UserListPage";

/**
 * 앱 셸.
 *
 * 현재 구현된 도메인: User (목록 + 생성 모달 + 삭제).
 * 추가 피처 (Todo, Memo 등) 는 `docs/prd/<feature>.md` → `docs/screens/*.md` →
 * 구현 파이프라인을 거쳐서 이 위치에 라우트가 등록된다.
 */
function App() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <nav className="mb-6 flex items-center gap-4 text-sm">
        <Link to="/users" className="font-semibold hover:underline">
          사용자
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/users" replace />} />
        <Route path="/users" element={<UserListPage />} />
      </Routes>
    </div>
  );
}

export default App;
