package com.example.template.domain.todo

import java.time.LocalDate
import java.time.LocalDateTime

object TodoFixture {
    fun create(
        id: Long = 1L,
        title: String = "Sample todo",
        completed: Boolean = false,
        dueDate: LocalDate? = null,
        createdAt: LocalDateTime = LocalDateTime.of(2026, 4, 23, 10, 0),
        updatedAt: LocalDateTime = LocalDateTime.of(2026, 4, 23, 10, 0),
    ): Todo {
        val todo = Todo(title = title, completed = completed, dueDate = dueDate)
        todo.id = id
        todo.createdAt = createdAt
        todo.updatedAt = updatedAt
        return todo
    }
}
