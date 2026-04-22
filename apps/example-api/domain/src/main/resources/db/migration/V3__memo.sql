CREATE TABLE memos (
    id         CHAR(36)      NOT NULL PRIMARY KEY,
    title      VARCHAR(100)  NOT NULL,
    content    VARCHAR(5000),
    created_at DATETIME(6)   NOT NULL,
    updated_at DATETIME(6)   NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_memos_created_at_desc ON memos(created_at DESC);
