CREATE TABLE todos (
    id          BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200)  NOT NULL,
    description VARCHAR(2000),
    completed   BOOLEAN       NOT NULL DEFAULT FALSE,
    due_date    DATE,
    created_at  DATETIME(6)   NOT NULL,
    updated_at  DATETIME(6)   NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_due_date  ON todos(due_date);
