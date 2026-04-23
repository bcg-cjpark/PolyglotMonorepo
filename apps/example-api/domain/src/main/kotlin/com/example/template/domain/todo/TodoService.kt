package com.example.template.domain.todo

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional(readOnly = true)
class TodoService(
    private val todoRepository: TodoRepository,
) {
    fun findAll(status: String = "all"): List<Todo> =
        when (status) {
            "all" -> todoRepository.findAllByOrderByCreatedAtDesc()
            "active" -> todoRepository.findAllByCompletedFalseOrderByCreatedAtDesc()
            "completed" -> todoRepository.findAllByCompletedTrueOrderByCreatedAtDesc()
            else -> throw IllegalArgumentException("Invalid status: $status")
        }

    fun findById(id: Long): Todo =
        todoRepository.findById(id).orElseThrow {
            TodoNotFoundException(id)
        }

    @Transactional
    fun create(
        title: String,
        dueDate: LocalDate?,
    ): Todo =
        todoRepository.save(
            Todo(title = title, completed = false, dueDate = dueDate),
        )

    @Transactional
    fun update(
        id: Long,
        title: String,
        completed: Boolean,
        dueDate: LocalDate?,
    ): Todo {
        val todo = findById(id)
        todo.update(title = title, completed = completed, dueDate = dueDate)
        return todo
    }

    @Transactional
    fun toggle(id: Long): Todo {
        val todo = findById(id)
        todo.toggle()
        return todo
    }

    @Transactional
    fun delete(id: Long) {
        val todo = findById(id)
        todoRepository.delete(todo)
    }
}

class TodoNotFoundException(id: Long) : RuntimeException("Todo not found: id=$id")
