import { Routes } from "react-router-dom";

/**
 * 템플릿 기본 shell.
 * 피처가 추가되면 `docs/prd/<feature>.md` → `docs/screens/*.md` → 구현 파이프라인을
 * 거쳐서 여기 `<Routes>` 안에 Route 를 등록한다.
 *
 * 아직 아무 도메인도 구현되지 않은 제로 베이스 상태.
 */
function App() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">PolyglotMonorepo Template</h1>
      <p className="text-muted">
        도메인 기능이 아직 없습니다. CLAUDE.md 파이프라인 (기획 → 구현 → 테스트 → 감사) 으로
        피처를 추가하면 이 위치에 라우트가 등록됩니다.
      </p>
      <Routes>
        {/* 피처 Route 등록 위치 */}
      </Routes>
    </div>
  );
}

export default App;
