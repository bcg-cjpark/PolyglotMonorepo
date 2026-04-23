-- Todo 피처 (dogfooding V1 두 번째 피처)
-- docs/prd/todo.md, docs/tech-stack/backend.md §2.1 타입 매핑 준수.

CREATE TABLE todos (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    completed   BOOLEAN      NOT NULL DEFAULT FALSE,
    due_date    DATE         NULL,
    created_at  DATETIME(6)  NOT NULL,
    updated_at  DATETIME(6)  NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- createdAt DESC 정렬이 목록 조회의 고정 정렬이므로 인덱스 추가.
CREATE INDEX idx_todos_created_at ON todos (created_at DESC);

-- status=active|completed 필터링을 위한 인덱스.
CREATE INDEX idx_todos_completed ON todos (completed);
