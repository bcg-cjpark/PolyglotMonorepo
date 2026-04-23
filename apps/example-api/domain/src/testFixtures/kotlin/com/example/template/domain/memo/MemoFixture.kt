package com.example.template.domain.memo

import java.time.LocalDateTime
import java.util.UUID

object MemoFixture {
    val DEFAULT_ID: UUID = UUID.fromString("11111111-1111-1111-1111-111111111111")

    fun create(
        id: UUID = DEFAULT_ID,
        title: String = "Sample memo",
        content: String? = "Sample content",
        createdAt: LocalDateTime = LocalDateTime.of(2026, 4, 23, 10, 0),
        updatedAt: LocalDateTime = LocalDateTime.of(2026, 4, 23, 10, 0),
    ): Memo {
        val memo = Memo(title = title, content = content)
        memo.id = id
        memo.createdAt = createdAt
        memo.updatedAt = updatedAt
        return memo
    }
}
