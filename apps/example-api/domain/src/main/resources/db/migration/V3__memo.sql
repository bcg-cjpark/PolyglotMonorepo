-- Memo 피처 (dogfooding V1 세 번째 피처)
-- docs/prd/memo.md, docs/tech-stack/backend.md §2.1 타입 매핑 준수.
-- PK 는 UUID (CHAR(36)) — 애플리케이션이 java.util.UUID 를 문자열로 바인딩.

CREATE TABLE memos (
    id          CHAR(36)       NOT NULL PRIMARY KEY,
    title       VARCHAR(100)   NOT NULL,
    content     VARCHAR(5000)  NULL,
    created_at  DATETIME(6)    NOT NULL,
    updated_at  DATETIME(6)    NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- createdAt DESC 정렬이 목록 조회의 고정 정렬이므로 인덱스 추가.
CREATE INDEX idx_memos_created_at ON memos (created_at DESC);
