CREATE TABLE memos (
    id         UUID          PRIMARY KEY,
    title      VARCHAR(100)  NOT NULL,
    content    VARCHAR(5000),
    created_at TIMESTAMP     NOT NULL,
    updated_at TIMESTAMP     NOT NULL
);

CREATE INDEX idx_memos_created_at_desc ON memos(created_at DESC);
