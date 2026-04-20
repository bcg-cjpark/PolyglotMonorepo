package com.example.template.domain.todo

import java.time.LocalDate
import java.time.LocalDateTime

object TodoFixture {
    fun create(
        title: String = "Sample todo",
        description: String? = "Sample description",
        completed: Boolean = false,
        dueDate: LocalDate? = null,
    ): Todo =
        Todo(
            title = title,
            description = description,
            completed = completed,
            dueDate = dueDate,
        ).apply {
            createdAt = LocalDateTime.now()
            updatedAt = LocalDateTime.now()
        }
}
