package com.example.template.todo

import com.example.template.domain.todo.Todo
import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.time.LocalDateTime

data class TodoResponse(
    val id: Long,
    val title: String,
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
    val dueDate: LocalDate?,
)

data class UpdateTodoRequest(
    @field:NotBlank
    @field:Size(max = 200)
    @field:JsonProperty(required = true)
    val title: String,
    @field:JsonProperty(required = true)
    val completed: Boolean,
    @field:JsonProperty(required = true)
    val dueDate: LocalDate?,
)
