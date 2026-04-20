package com.example.template.domain.user

object UserFixture {
    fun create(
        email: String = "user@example.com",
        name: String = "Test User",
    ): User = User(email = email, name = name)
}
