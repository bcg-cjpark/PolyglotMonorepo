package com.example.template.domain.user

import java.time.LocalDateTime

object UserFixture {
    fun create(
        id: Long = 1L,
        email: String = "user@example.com",
        name: String = "Test User",
        createdAt: LocalDateTime = LocalDateTime.of(2026, 4, 23, 10, 0),
        updatedAt: LocalDateTime = LocalDateTime.of(2026, 4, 23, 10, 0),
    ): User {
        val user = User(email = email, name = name)
        user.id = id
        user.createdAt = createdAt
        user.updatedAt = updatedAt
        return user
    }
}
