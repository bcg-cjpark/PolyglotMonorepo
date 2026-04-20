package com.example.template.domain.todo

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional(readOnly = true)
class TodoService(
    private val todoRepository: TodoRepository,
) {
    fun list(status: TodoStatus): List<Todo> =
        when (status) {
            TodoStatus.ALL -> todoRepository.findAll()
            TodoStatus.ACTIVE -> todoRepository.findAllByCompleted(false)
            TodoStatus.COMPLETED -> todoRepository.findAllByCompleted(true)
        }

    fun findById(id: Long): Todo =
        todoRepository.findById(id).orElseThrow {
            TodoNotFoundException(id)
        }

    @Transactional
    fun create(
        title: String,
        description: String?,
        dueDate: LocalDate?,
    ): Todo {
        require(title.trim().isNotBlank()) { "title must not be blank" }
        return todoRepository.save(
            Todo(
                title = title,
                description = description,
                dueDate = dueDate,
            ),
        )
    }

    @Transactional
    fun update(
        id: Long,
        title: String?,
        description: String?,
        dueDate: LocalDate?,
    ): Todo {
        if (title != null) {
            require(title.trim().isNotBlank()) { "title must not be blank" }
        }
        val todo = findById(id)
        todo.update(title = title, description = description, dueDate = dueDate)
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

class TodoNotFoundException(id: Long) : RuntimeException("Todo not found: $id")
