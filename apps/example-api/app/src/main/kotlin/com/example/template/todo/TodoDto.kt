package com.example.template.todo

import com.example.template.domain.todo.Todo
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.time.LocalDateTime

data class TodoResponse(
    val id: Long,
    val title: String,
    val description: String?,
    val completed: Boolean,
    val dueDate: LocalDate?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
) {
    companion object {
        fun from(todo: Todo): TodoResponse =
            TodoResponse(
                id = todo.id,
                title = todo.title,
                description = todo.description,
                completed = todo.completed,
                dueDate = todo.dueDate,
                createdAt = todo.createdAt,
                updatedAt = todo.updatedAt,
            )
    }
}

data class CreateTodoRequest(
    @field:NotBlank
    @field:Size(max = 200)
    val title: String,
    @field:Size(max = 2000)
    val description: String? = null,
    val dueDate: LocalDate? = null,
)

data class UpdateTodoRequest(
    @field:Size(min = 1, max = 200)
    val title: String? = null,
    @field:Size(max = 2000)
    val description: String? = null,
    val dueDate: LocalDate? = null,
)
