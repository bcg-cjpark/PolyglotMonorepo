CREATE TABLE todos (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(200)  NOT NULL,
    description VARCHAR(2000),
    completed   BOOLEAN       NOT NULL DEFAULT FALSE,
    due_date    DATE,
    created_at  TIMESTAMP     NOT NULL,
    updated_at  TIMESTAMP     NOT NULL
);

CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_due_date  ON todos(due_date);
